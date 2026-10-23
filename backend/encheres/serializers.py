import re
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from .models import Categorie, ArticleEnchere, Enchere, Favori


# ------------------------------------------------------------------
# UTILISATEURS / AUTHENTIFICATION
# ------------------------------------------------------------------
class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate_email(self, value):
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', value):
            raise serializers.ValidationError("Adresse email invalide.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cette adresse email est déjà utilisée.")
        return value.lower()

    def validate_username(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Le nom d'utilisateur doit contenir au moins 3 caractères.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': "Les deux mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ------------------------------------------------------------------
# CATÉGORIES
# ------------------------------------------------------------------
class CategorieSerializer(serializers.ModelSerializer):
    nombre_articles = serializers.SerializerMethodField()

    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'description', 'icone', 'couleur', 'nombre_articles', 'date_creation']

    def get_nombre_articles(self, obj):
        return getattr(obj, 'nb', obj.articles.count())

    def validate_nom(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Le nom de la catégorie est trop court.")
        return value.strip()


# ------------------------------------------------------------------
# ENCHÈRES (OFFRES)
# ------------------------------------------------------------------
class EnchereSerializer(serializers.ModelSerializer):
    encherisseur_nom = serializers.CharField(source='encherisseur.username', read_only=True, default='')

    class Meta:
        model = Enchere
        # Ajout du champ 'statut' afin qu'il soit transmis à React
        fields = ['id', 'article', 'encherisseur', 'encherisseur_nom', 'montant', 'statut', 'date_enchere']
        read_only_fields = ['id', 'encherisseur', 'date_enchere']

    def validate(self, attrs):
        article = attrs.get('article')
        montant = attrs.get('montant')
        request = self.context.get('request')

        if montant is not None and montant <= 0:
            raise serializers.ValidationError({'montant': "Le montant doit être supérieur à zéro."})
        if article:
            if article.statut != ArticleEnchere.Statut.ACTIVE:
                raise serializers.ValidationError("Cet article n'est pas actuellement en vente active.")
            if montant is not None and montant <= article.prix_actuel:
                raise serializers.ValidationError(
                    {'montant': f"Votre offre doit être strictement supérieure au prix actuel ({article.prix_actuel})."}
                )
            if request and article.vendeur_id == request.user.id:
                raise serializers.ValidationError("Vous ne pouvez pas enchérir sur votre propre article.")
        return attrs

    def create(self, validated_data):
        validated_data['encherisseur'] = self.context['request'].user
        return super().create(validated_data)


# ------------------------------------------------------------------
# ARTICLES / LOTS AUX ENCHÈRES
# ------------------------------------------------------------------
class ArticleEnchereListSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True, default='')
    categorie_couleur = serializers.CharField(source='categorie.couleur', read_only=True, default='')
    vendeur_nom = serializers.CharField(source='vendeur.username', read_only=True, default='')
    nombre_encheres = serializers.SerializerMethodField()
    temps_restant_secondes = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ArticleEnchere
        fields = [
            'id', 'titre', 'prix_depart', 'prix_actuel', 'image', 'image_url',
            'categorie', 'categorie_nom', 'categorie_couleur', 'vendeur_nom',
            'date_debut', 'date_fin', 'statut', 'nombre_encheres', 'temps_restant_secondes',
        ]

    def to_representation(self, instance):
        instance.actualiser_statut()
        return super().to_representation(instance)

    def get_nombre_encheres(self, obj):
        return getattr(obj, 'nb_encheres_count', getattr(obj, 'nombre_encheres', obj.encheres.count()))

    def get_temps_restant_secondes(self, obj):
        if not obj.date_fin:
            return 0
        delta = obj.date_fin - timezone.now()
        return max(int(delta.total_seconds()), 0)

    def get_image_url(self, obj):
        if obj.image:
            try:
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                return None
        return None


class ArticleEnchereDetailSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True, default='')
    vendeur_nom = serializers.CharField(source='vendeur.username', read_only=True, default='')
    encheres = EnchereSerializer(many=True, read_only=True)
    nombre_encheres = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ArticleEnchere
        fields = [
            'id', 'titre', 'description', 'prix_depart', 'prix_actuel', 'image', 'image_url',
            'categorie', 'categorie_nom', 'vendeur', 'vendeur_nom', 'date_debut', 'date_fin',
            'statut', 'nombre_encheres', 'encheres', 'date_creation', 'date_maj',
        ]
        read_only_fields = ['id', 'prix_actuel', 'vendeur', 'date_creation', 'date_maj']

    def to_representation(self, instance):
        instance.actualiser_statut()
        return super().to_representation(instance)

    def get_nombre_encheres(self, obj):
        return getattr(obj, 'nb_encheres_count', getattr(obj, 'nombre_encheres', obj.encheres.count()))

    def get_image_url(self, obj):
        if obj.image:
            try:
                request = self.context.get('request')
                if request is not None:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                return None
        return None

    def validate_titre(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Le titre doit contenir au moins 3 caractères.")
        return value.strip()

    def validate_prix_depart(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le prix de départ doit être strictly supérieur à zéro.")
        return value

    def validate(self, attrs):
        date_debut = attrs.get('date_debut', getattr(self.instance, 'date_debut', None))
        date_fin = attrs.get('date_fin', getattr(self.instance, 'date_fin', None))
        if date_debut and date_fin and date_fin <= date_debut:
            raise serializers.ValidationError(
                {'date_fin': "La date de fin doit être postérieure à la date de début."}
            )
        return attrs

    def create(self, validated_data):
        validated_data['vendeur'] = self.context['request'].user
        if 'prix_actuel' not in validated_data and 'prix_depart' in validated_data:
            validated_data['prix_actuel'] = validated_data['prix_depart']
        article = super().create(validated_data)
        article.actualiser_statut()
        return article


# ------------------------------------------------------------------
# FAVORIS
# ------------------------------------------------------------------
class FavoriSerializer(serializers.ModelSerializer):
    article_detail = ArticleEnchereListSerializer(source='article', read_only=True)

    class Meta:
        model = Favori
        fields = ['id', 'article', 'article_detail', 'date_ajout']
        read_only_fields = ['id', 'date_ajout']

    def create(self, validated_data):
        validated_data['utilisateur'] = self.context['request'].user
        return super().create(validated_data)