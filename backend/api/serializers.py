from rest_framework import serializers
from .models import (
    User, Tenant, Location, Menu, Category, Item, Price, 
    MediaAsset, ItemMedia, AnalyticsEvent, QRCode
)


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    menus_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Location
        exclude = ['tenant']  # Исключаем tenant, так как он добавляется автоматически
    
    def get_menus_count(self, obj):
        return obj.menus.count()


class MenuSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    categories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Menu
        exclude = ['tenant']  # Исключаем tenant, так как он добавляется автоматически
    
    def get_categories_count(self, obj):
        return obj.categories.count()


class CategorySerializer(serializers.ModelSerializer):
    menu_name = serializers.CharField(source='menu.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        exclude = ['tenant']  # Исключаем tenant, так как он добавляется автоматически
    
    def get_items_count(self, obj):
        return obj.items.count()


class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = '__all__'


class MediaAssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaAsset
        fields = '__all__'


class ItemMediaSerializer(serializers.ModelSerializer):
    media = MediaAssetSerializer(read_only=True)
    
    class Meta:
        model = ItemMedia
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    prices = PriceSerializer(many=True, read_only=True)
    item_media = ItemMediaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Item
        exclude = ['tenant']  # Исключаем tenant, так как он добавляется автоматически


class UserSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'status', 'tenant', 'tenant_name', 'last_login_at', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = '__all__'


class QRCodeSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    
    class Meta:
        model = QRCode
        exclude = ['tenant']  # Исключаем tenant, так как он добавляется автоматически


# Статистика
class DashboardStatsSerializer(serializers.Serializer):
    total_menus = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_items = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_plays = serializers.IntegerField()
    unique_users = serializers.IntegerField()
    recent_activity = AnalyticsEventSerializer(many=True)
    top_items = ItemSerializer(many=True)
