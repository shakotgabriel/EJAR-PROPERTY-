from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.contrib import admin
from django.http import HttpResponseRedirect  # <-- add this

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/properties/', include('properties.urls')),
    path('api/users/', include('users.urls')),
    path('api/messages/', include('messages.urls')),
    path('api/notifications/', include('notifications.urls')),

    # Redirect root to React frontend
    path('', lambda request: HttpResponseRedirect('https://ejarproperties.netlify.app/')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
