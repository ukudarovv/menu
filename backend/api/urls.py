from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet, MenuViewSet, CategoryViewSet, ItemViewSet,
    UserViewSet, QRCodeViewSet, AnalyticsViewSet, CustomAuthToken,
    public_menu_view
)

router = DefaultRouter()
router.register(r'locations', LocationViewSet)
router.register(r'menus', MenuViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'users', UserViewSet)
router.register(r'qr-codes', QRCodeViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('public/menu/<str:tenant_slug>/', public_menu_view, name='public_menu'),
]
