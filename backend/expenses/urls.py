from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'incomes', views.IncomeViewSet, basename='income')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'recurring', views.RecurringExpenseViewSet, basename='recurring')
router.register(r'budgets', views.BudgetViewSet, basename='budget')

urlpatterns = [
    path('', include(router.urls)),
]
