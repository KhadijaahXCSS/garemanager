from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Seul l'administrateur peut accéder"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsAdminOrGestionnaire(permissions.BasePermission):
    """Permission pour admin et gestionnaire"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'GESTIONNAIRE']

class IsAdminOrSelf(permissions.BasePermission):
    """Permission pour admin ou l'utilisateur lui-même"""
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (
            request.user.role == 'ADMIN' or obj == request.user
        )

class IsGestionnaireGare(permissions.BasePermission):
    """Permission pour le gestionnaire de la gare spécifique"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        elif request.user.role == 'GESTIONNAIRE':
            # Vérifie si l'utilisateur est le gestionnaire de cette gare
            return hasattr(obj, 'gestionnaire') and obj.gestionnaire == request.user
        return False

class IsChauffeurOrReadOnly(permissions.BasePermission):
    """Permission pour chauffeur (écriture) ou lecture seule"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'CHAUFFEUR'

class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission pour le propriétaire ou l'admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        # Vérifie si l'utilisateur est propriétaire de l'objet
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'chauffeur'):
            return obj.chauffeur == request.user
        return False