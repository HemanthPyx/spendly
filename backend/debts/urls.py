from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'debts', views.DebtViewSet, basename='debt')
router.register(r'fcm-devices', views.FCMDeviceViewSet, basename='fcm-device')

urlpatterns = [
    path('', include(router.urls)),
]
