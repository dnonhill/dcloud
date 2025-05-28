from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    name = 'cloudform.reviews'
    
    def ready(self):
        import cloudform.reviews.signals # noqa: F401
