from django.urls import path
from .views import HealthView, UploadPreviewView, TransformView, NL2RegexView,RegexRiskAnalyzer,DownloadTransformedView

urlpatterns = [ path("health/", HealthView.as_view()),
               path("upload/preview/",UploadPreviewView.as_view()),
               path("transform/",TransformView.as_view()),
               path("nl2regex/",NL2RegexView.as_view()),
               path("risk/",RegexRiskAnalyzer.as_view()) 
               ,path("download/",DownloadTransformedView.as_view(), name='download-transformed')
               ]


