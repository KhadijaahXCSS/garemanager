from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import (
    UtilisateurViewSet,
    GareViewSet,
    VehiculeViewSet,
    FileAttenteViewSet,
    NotificationViewSet,
    StatistiqueViewSet
)
from .views import CustomTokenObtainPairView

router = DefaultRouter()


router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'gares', GareViewSet, basename='gare')
router.register(r'vehicules', VehiculeViewSet, basename='vehicule')
router.register(r'files-attente', FileAttenteViewSet, basename='fileattente')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'statistiques', StatistiqueViewSet, basename='statistique')


urlpatterns = [
    path('', include(router.urls)), 
    
    #jwt
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]