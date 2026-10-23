from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register('categories', views.CategorieViewSet, basename='categorie')
router.register('articles', views.ArticleEnchereViewSet, basename='article')
router.register('encheres', views.EnchereViewSet, basename='enchere')
router.register('favoris', views.FavoriViewSet, basename='favori')

urlpatterns = [
    # Redirection de la racine directe de cette app vers les routes du router
    path('', RedirectView.as_view(url='articles/', permanent=False)),

    # Authentification
    path('auth/inscription/', views.InscriptionView.as_view(), name='inscription'),
    path('auth/connexion/', views.ConnexionView.as_view(), name='connexion'),
    path('auth/deconnexion/', views.deconnexion, name='deconnexion'),
    path('auth/rafraichir/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profil/', views.ProfilView.as_view(), name='profil'),

    # Tableau de bord
    path('dashboard/', views.TableauDeBordView.as_view(), name='dashboard'),

    # CRUD (catégories, articles, encheres, favoris)
    path('', include(router.urls)),
]