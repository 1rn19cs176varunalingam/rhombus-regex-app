from django.urls import path
from .views import HealthView, UploadPreviewView

urlpatterns = [ path("health/", HealthView.as_view()),
               path("upload/preview/",UploadPreviewView.as_view())]
