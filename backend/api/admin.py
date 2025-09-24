from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Tenant, Location, Menu, Category, Item, Price, 
    MediaAsset, ItemMedia, AnalyticsEvent, QRCode
)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'status', 'plan', 'created_at']
    list_filter = ['status', 'plan', 'created_at']
    search_fields = ['name', 'slug', 'email']


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'is_active', 'created_at']
    list_filter = ['is_active', 'tenant', 'created_at']
    search_fields = ['name', 'address']


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'active', 'created_at']
    list_filter = ['active', 'location__tenant', 'created_at']
    search_fields = ['name']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'menu', 'sort', 'created_at']
    list_filter = ['menu__tenant', 'created_at']
    search_fields = ['name']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'weight_g', 'kcal', 'created_at']
    list_filter = ['category__menu__tenant', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):
    list_display = ['item', 'amount_minor', 'currency', 'created_at']
    list_filter = ['currency', 'created_at']


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ['type', 'tenant', 'file_size', 'created_at']
    list_filter = ['type', 'tenant', 'created_at']


@admin.register(ItemMedia)
class ItemMediaAdmin(admin.ModelAdmin):
    list_display = ['item', 'media', 'kind', 'sort']
    list_filter = ['kind', 'created_at']


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ['type', 'tenant', 'session_id', 'timestamp']
    list_filter = ['type', 'tenant', 'timestamp']
    search_fields = ['session_id']


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'location', 'created_at']
    list_filter = ['tenant', 'created_at']
    search_fields = ['name']


class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'role', 'status', 'tenant', 'is_staff']
    list_filter = ['role', 'status', 'tenant', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {'fields': ('role', 'status', 'tenant', 'last_login_at')}),
    )


admin.site.register(User, CustomUserAdmin)