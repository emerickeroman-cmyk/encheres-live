from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Redirige http://127.0.0.1:8000/ directement vers l'API
    path('', RedirectView.as_view(url='/api/', permanent=False)),

    # Panneau d'administration
    path('admin/', admin.site.urls),

    # Inclusion des URLs de votre application encheres sous le préfixe /api/
    path('api/', include('encheres.urls')),
]

# PERMET À DJANGO DE SERVIR LES IMAGES STOCKÉES DANS LE DOSSIER MEDIA
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)