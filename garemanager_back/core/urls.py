from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import (
    UtilisateurViewSet,
    GareViewSet,
    VehiculeViewSet,
    FileAttenteViewSet,
    NotificationViewSet,
    StatistiqueViewSet,
    chauffeur_performance,
    mes_demandes_acces,
    mes_gares,  # AJOUTEZ CECI
    retirer_demande_acces,
    quitter_gare,
    AdminDashboardViewSet, AdminUtilisateurViewSet, ReclamationViewSet
)
from .views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()

router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'gares', GareViewSet, basename='gare')
router.register(r'vehicules', VehiculeViewSet, basename='vehicule')
router.register(r'files-attente', FileAttenteViewSet, basename='fileattente')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'statistiques', StatistiqueViewSet, basename='statistique')

#Urls Admin
router.register(r'admin/dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'admin/utilisateurs', AdminUtilisateurViewSet, basename='admin-utilisateurs')
router.register(r'reclamations', ReclamationViewSet, basename='reclamation')

urlpatterns = [
    path('', include(router.urls)), 
    
    # URLs JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # URLs chauffeur
    path('chauffeur/performance/', chauffeur_performance, name='chauffeur_performance'),
    path('chauffeur/mes-gares/', mes_gares, name='mes-gares'),  
    path('chauffeur/mes-demandes-acces/', mes_demandes_acces, name='mes-demandes-acces'),
    path('chauffeur/retirer-demande-acces/<uuid:gare_id>/', retirer_demande_acces, name='retirer-demande-acces'),
    path('gares/<uuid:gare_id>/quitter-gare/', quitter_gare, name='quitter-gare'),
]