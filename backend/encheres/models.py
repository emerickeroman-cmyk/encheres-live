from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Categorie(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)  # <-- Ajouté ici pour corriger l'erreur de base de données
    icone = models.CharField(max_length=50, blank=True, default='gavel')
    couleur = models.CharField(max_length=20, default='#3B82F6')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class ArticleEnchere(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        ACTIVE = 'ACTIVE', 'Active'
        TERMINEE = 'TERMINEE', 'Terminée'
        ANNULEE = 'ANNULEE', 'Annulée'

    titre = models.CharField(max_length=200)
    description = models.TextField()
    prix_depart = models.DecimalField(max_digits=15, decimal_places=2)
    prix_actuel = models.DecimalField(max_digits=15, decimal_places=2)
    image = models.ImageField(upload_to='articles/', blank=True, null=True)
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles'
    )
    vendeur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='articles_vendu'
    )
    date_debut = models.DateTimeField(default=timezone.now)
    date_fin = models.DateTimeField()
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.ACTIVE
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Article aux enchères"
        verbose_name_plural = "Articles aux enchères"
        ordering = ['-date_creation']

    def __str__(self):
        return self.titre

    @property
    def nombre_encheres(self):
        if hasattr(self, '_nombre_encheres'):
            return self._nombre_encheres
        if hasattr(self, 'nb_encheres_count'):
            return self.nb_encheres_count
        return self.encheres.count()

    @nombre_encheres.setter
    def nombre_encheres(self, value):
        self._nombre_encheres = value

    @property
    def est_active(self):
        now = timezone.now()
        return self.statut == self.Statut.ACTIVE and self.date_debut <= now <= self.date_fin

    def actualiser_statut(self):
        now = timezone.now()
        if self.statut == self.Statut.ACTIVE and now >= self.date_fin:
            self.statut = self.Statut.TERMINEE
            self.save(update_fields=['statut'])


class Enchere(models.Model):
    class StatutEnchere(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        VALIDEE = 'VALIDEE', 'Validée'
        REFUSEE = 'REFUSEE', 'Refusée'

    article = models.ForeignKey(
        ArticleEnchere,
        on_delete=models.CASCADE,
        related_name='encheres'
    )
    encherisseur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='encheres_passees'
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    statut = models.CharField(
        max_length=20,
        choices=StatutEnchere.choices,
        default=StatutEnchere.EN_ATTENTE
    )
    date_enchere = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Enchère"
        verbose_name_plural = "Enchères"
        ordering = ['-montant', '-date_enchere']

    def __str__(self):
        return f"{self.encherisseur.username} {self.montant} Ar sur {self.article.titre}"


class Favori(models.Model):
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favoris'
    )
    article = models.ForeignKey(
        ArticleEnchere,
        on_delete=models.CASCADE,
        related_name='favorise_par'
    )
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Favori"
        verbose_name_plural = "Favoris"
        unique_together = ('utilisateur', 'article')

    def __str__(self):
        return f"{self.utilisateur.username} -> {self.article.titre}"