from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'savings/goals', views.SavingsGoalViewSet, basename='savings-goal')

urlpatterns = [
    path('', include(router.urls)),
    path('savings/monthly/', views.SavingsGoalViewSet.as_view({'get': 'monthly'}), name='savings-monthly'),
    path('savings/yearly/', views.SavingsGoalViewSet.as_view({'get': 'yearly'}), name='savings-yearly'),
]
