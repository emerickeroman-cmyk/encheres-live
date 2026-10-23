from django.contrib import admin
from .models import Categorie, ArticleEnchere, Enchere, Favori


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('nom', 'icone', 'couleur', 'date_creation')
    search_fields = ('nom',)


@admin.register(ArticleEnchere)
class ArticleEnchereAdmin(admin.ModelAdmin):
    list_display = ('titre', 'categorie', 'vendeur', 'prix_depart', 'prix_actuel', 'statut', 'date_fin')
    list_filter = ('statut', 'categorie')
    search_fields = ('titre', 'description')
    autocomplete_fields = ('vendeur',)


@admin.register(Enchere)
class EnchereAdmin(admin.ModelAdmin):
    list_display = ('article', 'encherisseur', 'montant', 'date_enchere')
    list_filter = ('date_enchere',)


@admin.register(Favori)
class FavoriAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'article', 'date_ajout')
