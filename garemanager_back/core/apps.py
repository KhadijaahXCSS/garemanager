from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Importez les signaux pour les enregistrer
        from . import signals  # Créez un fichier signals.py si nécessaire