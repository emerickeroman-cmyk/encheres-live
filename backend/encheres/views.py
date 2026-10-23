from django.contrib.auth.models import User
from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend

from .models import Categorie, ArticleEnchere, Enchere, Favori
from .serializers import (
    CategorieSerializer, ArticleEnchereListSerializer, ArticleEnchereDetailSerializer,
    EnchereSerializer, FavoriSerializer, InscriptionSerializer, UtilisateurSerializer,
)
from .permissions import EstProprietaireOuLectureSeule


# ------------------------------------------------------------------
# AUTHENTIFICATION
# ------------------------------------------------------------------
class InscriptionView(generics.CreateAPIView):
    """POST /api/auth/inscription/ — création d'un compte utilisateur."""
    queryset = User.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UtilisateurSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ConnexionView(TokenObtainPairView):
    """POST /api/auth/connexion/ — connexion, renvoie access + refresh + infos utilisateur."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(username=request.data.get('username'))
                response.data['user'] = UtilisateurSerializer(user).data
            except User.DoesNotExist:
                pass
        return response


class ProfilView(APIView):
    """GET /api/auth/profil/ — informations sur l'utilisateur connecté."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def deconnexion(request):
    """POST /api/auth/deconnexion/ — blackliste le refresh token."""
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Déconnexion réussie.'}, status=status.HTTP_205_RESET_CONTENT)


# ------------------------------------------------------------------
# CATÉGORIES
# ------------------------------------------------------------------
class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all().annotate(nb=Count('articles'))
    serializer_class = CategorieSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'date_creation']


# ------------------------------------------------------------------
# ARTICLES AUX ENCHÈRES (CRUD PRINCIPAL)
# ------------------------------------------------------------------
class ArticleEnchereViewSet(viewsets.ModelViewSet):
    queryset = ArticleEnchere.objects.select_related('categorie', 'vendeur').annotate(
        nb_encheres_count=Count('encheres')
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, EstProprietaireOuLectureSeule]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'statut', 'vendeur']
    search_fields = ['titre', 'description']
    ordering_fields = ['date_creation', 'prix_actuel', 'date_fin']

    def get_serializer_class(self):
        if self.action in ('list', 'mes_articles'):
            return ArticleEnchereListSerializer
        return ArticleEnchereDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        expires = qs.filter(statut=ArticleEnchere.Statut.ACTIVE, date_fin__lt=timezone.now())
        for art in expires:
            art.actualiser_statut()
        return qs

    def perform_create(self, serializer):
        serializer.save(vendeur=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def encherir(self, request, pk=None):
        """POST /api/articles/{id}/encherir/ — placer une offre sur un article."""
        article = self.get_object()
        data = {'article': article.id, 'montant': request.data.get('montant')}
        serializer = EnchereSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        enchere = serializer.save()
        article.prix_actuel = enchere.montant
        article.save(update_fields=['prix_actuel'])

        return Response(
            ArticleEnchereDetailSerializer(article, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def historique(self, request, pk=None):
        """GET /api/articles/{id}/historique/ — historique des offres, triées par date."""
        article = self.get_object()
        encheres = article.encheres.order_by('-date_enchere')
        return Response(EnchereSerializer(encheres, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mes_articles(self, request):
        """GET /api/articles/mes_articles/ — articles publiés par l'utilisateur connecté, triés du plus récent au plus ancien."""
        qs = self.get_queryset().filter(vendeur=request.user).order_by('-date_creation')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ArticleEnchereListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ArticleEnchereListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def changer_statut(self, request, pk=None):
        """PATCH /api/articles/{id}/changer_statut/ — modifier le statut d'un article."""
        article = self.get_object()
        if article.vendeur != request.user:
            return Response({'detail': 'Action non autorisée sur cet article.'}, status=status.HTTP_403_FORBIDDEN)

        nouveau_statut = request.data.get('statut')
        if nouveau_statut in ArticleEnchere.Statut.values:
            article.statut = nouveau_statut
            article.save(update_fields=['statut'])
            return Response(ArticleEnchereDetailSerializer(article, context={'request': request}).data)
        
        return Response({'detail': 'Statut invalide.'}, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------------------------------------------
# ENCHÈRES (GESTION / VALIDATION / ANNULATION)
# ------------------------------------------------------------------
class EnchereViewSet(viewsets.ModelViewSet):
    queryset = Enchere.objects.select_related('article', 'encherisseur').all()
    serializer_class = EnchereSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            qs = qs.filter(
                Q(encherisseur=self.request.user) | Q(article__vendeur=self.request.user)
            )
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def valider(self, request, pk=None):
        """POST /api/encheres/{id}/valider/ — valider une offre et marquer l'article comme terminé."""
        enchere = self.get_object()
        if enchere.article.vendeur != request.user:
            return Response({'detail': 'Seul le vendeur peut valider cette offre.'}, status=status.HTTP_403_FORBIDDEN)

        enchere.statut = Enchere.StatutEnchere.VALIDEE
        enchere.save(update_fields=['statut'])

        # Marque également l'article comme terminé
        article = enchere.article
        article.statut = ArticleEnchere.Statut.TERMINEE
        article.save(update_fields=['statut'])

        return Response(EnchereSerializer(enchere, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def refuser(self, request, pk=None):
        """POST /api/encheres/{id}/refuser/ — refuser/annuler une offre."""
        enchere = self.get_object()
        if enchere.article.vendeur != request.user:
            return Response({'detail': 'Seul le vendeur peut refuser cette offre.'}, status=status.HTTP_403_FORBIDDEN)

        enchere.statut = Enchere.StatutEnchere.REFUSEE
        enchere.save(update_fields=['statut'])

        return Response(EnchereSerializer(enchere, context={'request': request}).data)


# ------------------------------------------------------------------
# FAVORIS
# ------------------------------------------------------------------
class FavoriViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favori.objects.filter(utilisateur=self.request.user).select_related('article')


# ------------------------------------------------------------------
# TABLEAU DE BORD / STATISTIQUES
# ------------------------------------------------------------------
class TableauDeBordView(APIView):
    """GET /api/dashboard/ — indicateurs agrégés filtrés par vendeur (ou globaux si admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Filtrage selon le rôle : l'admin voit tout, le vendeur ne voit que ses articles/offres
        if user.is_staff:
            articles = ArticleEnchere.objects.all()
            encheres = Enchere.objects.all()
        else:
            articles = ArticleEnchere.objects.filter(vendeur=user)
            encheres = Enchere.objects.filter(article__vendeur=user)

        total_articles = articles.count()
        actives = articles.filter(statut=ArticleEnchere.Statut.ACTIVE).count()
        terminees = articles.filter(statut=ArticleEnchere.Statut.TERMINEE).count()
        en_attente = articles.filter(statut=ArticleEnchere.Statut.EN_ATTENTE).count()
        annulees = articles.filter(statut=ArticleEnchere.Statut.ANNULEE).count()
        total_encheres = encheres.count()

        articles_avec_offres = articles.annotate(n=Count('encheres')).filter(n__gt=0).count()
        taux_conversion = round((articles_avec_offres / total_articles) * 100, 1) if total_articles else 0
        taux_actives = round((actives / total_articles) * 100, 1) if total_articles else 0

        # Répartition des catégories filtrée sur les articles concernés
        repartition_categories = list(
            Categorie.objects.filter(articles__in=articles)
            .annotate(nb=Count('articles', filter=Q(articles__in=articles)))
            .values('nom', 'couleur', 'nb')
            .filter(nb__gt=0)
        )

        aujourd_hui = timezone.now().date()
        evolution = []
        for i in range(13, -1, -1):
            jour = aujourd_hui - timezone.timedelta(days=i)
            nb = encheres.filter(date_enchere__date=jour).count()
            evolution.append({'date': jour.isoformat(), 'nombre_encheres': nb})

        top_articles = list(
            articles.annotate(nb=Count('encheres'))
            .order_by('-nb')[:5]
            .values('id', 'titre', 'prix_actuel', 'nb')
        )

        meilleure_vente = articles.aggregate(m=Max('prix_actuel'))['m'] or 0

        return Response({
            'total_articles': total_articles,
            'articles_actifs': actives,
            'articles_termines': terminees,
            'articles_en_attente': en_attente,
            'articles_annules': annulees,
            'total_encheres': total_encheres,
            'taux_conversion': taux_conversion,
            'taux_actives': taux_actives,
            'meilleure_vente': meilleure_vente,
            'repartition_categories': repartition_categories,
            'evolution_encheres': evolution,
            'top_articles': top_articles,
        })