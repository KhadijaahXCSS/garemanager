
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, Gare, Vehicule, FileAttente, Notification, Statistique

# Register your models here.



class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'email', 'CIN', 'telephone', 'role', 'date_inscription', 'is_staff')
    list_filter = ('role', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informations personnelles', {'fields': ('email', 'CIN', 'telephone', 'role')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login',)}),  # Retirez `date_inscription`
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'CIN', 'telephone', 'role', 'password1', 'password2'),
        }),
    )
    search_fields = ('username', 'email', 'CIN')
    ordering = ('-date_inscription',)

class GareAdmin(admin.ModelAdmin):
    list_display = ('nom', 'localisation', 'capacite_max', 'gestionnaire')
    search_fields = ('nom', 'localisation')


class VehiculeAdmin(admin.ModelAdmin):
    list_display = ('immatricule', 'type', 'chauffeur', 'date_enregistrement')
    list_filter = ('type',)
    search_fields = ('immatricule', 'chauffeur__username')

class FileAttenteAdmin(admin.ModelAdmin):
    list_display = ('vehicule', 'gare', 'position', 'statut', 'heure_arrivee')
    list_filter = ('statut', 'gare')
    list_editable = ('position', 'statut')  # Permet d'éditer directement depuis la liste
    ordering = ('position',)

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'est_lue', 'date_envoi')
    list_filter = ('type', 'est_lue')
    actions = ['marquer_comme_lue']

    def marquer_comme_lue(self, request, queryset):
        queryset.update(est_lue=True)
    marquer_comme_lue.short_description = "Marquer les notifications sélectionnées comme lues"

class StatistiqueAdmin(admin.ModelAdmin):
    list_display = ('gare', 'date', 'nb_vehicules', 'nb_passagers', 'heure_pointe')
    list_filter = ('gare', 'date')

# 3. Enregistrement des modèles
admin.site.register(Utilisateur, UtilisateurAdmin)
admin.site.register(Gare, GareAdmin)
admin.site.register(Vehicule, VehiculeAdmin)
admin.site.register(FileAttente, FileAttenteAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(Statistique, StatistiqueAdmin)