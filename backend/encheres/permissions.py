from rest_framework import permissions


class EstProprietaireOuLectureSeule(permissions.BasePermission):
    """
    Autorise la lecture à tout le monde, mais réserve la modification/suppression
    au propriétaire (vendeur) de l'article ou à un administrateur.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        proprietaire = getattr(obj, 'vendeur', None) or getattr(obj, 'utilisateur', None)
        return request.user and (request.user.is_staff or proprietaire == request.user)
