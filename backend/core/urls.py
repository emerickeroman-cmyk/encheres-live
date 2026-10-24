from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Panneau d'administration
    path('admin/', admin.site.urls),

    # Inclusion des URLs de votre application encheres sous le préfixe /api/
    path('api/', include('encheres.urls')),

    # Redirige toutes les autres requêtes vers l'application React (sauf static, media, admin et api)
    re_path(r'^(?!static/|media/|admin/|api/).*$', TemplateView.as_view(template_name='index.html')),
]

# PERMET À DJANGO DE SERVIR LES IMAGES STOCKÉES DANS LE DOSSIER MEDIA
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)