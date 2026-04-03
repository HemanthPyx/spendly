from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('reports/', views.ReportView.as_view(), name='reports'),
    path('reports/export/', views.ExportReportView.as_view(), name='export-report'),
    path('reports/ai-analysis/', views.AIAnalysisView.as_view(), name='ai-analysis'),
    path('budget-alerts/', views.BudgetAlertView.as_view(), name='budget-alerts'),
]
