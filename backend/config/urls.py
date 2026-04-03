from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('expenses.urls')),
    path('api/', include('wishlist.urls')),
    path('api/', include('reports.urls')),
    path('api/', include('savings.urls')),
    path('api/', include('debts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
