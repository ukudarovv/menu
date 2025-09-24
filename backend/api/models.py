from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """Пользователь системы"""
    ROLE_CHOICES = [
        ('owner', 'Владелец'),
        ('manager', 'Менеджер'),
        ('staff', 'Сотрудник'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Активный'),
        ('inactive', 'Неактивный'),
        ('suspended', 'Заблокирован'),
    ]
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='users')
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class Tenant(models.Model):
    """Тенант (ресторан)"""
    STATUS_CHOICES = [
        ('active', 'Активный'),
        ('inactive', 'Неактивный'),
        ('suspended', 'Заблокирован'),
    ]
    
    PLAN_CHOICES = [
        ('free', 'Бесплатный'),
        ('basic', 'Базовый'),
        ('premium', 'Премиум'),
        ('enterprise', 'Корпоративный'),
    ]
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    timezone = models.CharField(max_length=50, default='Europe/Moscow')
    currency = models.CharField(max_length=3, default='RUB')
    language = models.CharField(max_length=5, default='ru')
    theme_json = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Location(models.Model):
    """Локация ресторана"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Menu(models.Model):
    """Меню"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='menus')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='menus')
    name = models.CharField(max_length=255)
    active = models.BooleanField(default=True)
    schedule_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Category(models.Model):
    """Категория блюд"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    sort = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort', 'name']


class Item(models.Model):
    """Блюдо"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='items')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    nutrition_values_json = models.JSONField(default=dict, blank=True)
    weight_g = models.PositiveIntegerField(null=True, blank=True)
    kcal = models.PositiveIntegerField(null=True, blank=True)
    sort = models.PositiveIntegerField(default=0)
    visibility_rule_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort', 'name']


class Price(models.Model):
    """Цена блюда"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='prices')
    amount_minor = models.PositiveIntegerField()  # Цена в копейках
    currency = models.CharField(max_length=3, default='RUB')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class MediaAsset(models.Model):
    """Медиа файл"""
    TYPE_CHOICES = [
        ('image', 'Изображение'),
        ('video', 'Видео'),
        ('audio', 'Аудио'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='media_assets')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    original_url = models.URLField()
    hls_url = models.URLField(blank=True)
    poster_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ItemMedia(models.Model):
    """Связь блюда с медиа"""
    KIND_CHOICES = [
        ('preview', 'Превью'),
        ('full', 'Полное видео'),
        ('sound', 'Аудио'),
    ]
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='item_media')
    media = models.ForeignKey(MediaAsset, on_delete=models.CASCADE, related_name='item_media')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    sort = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sort']


class AnalyticsEvent(models.Model):
    """Событие аналитики"""
    TYPE_CHOICES = [
        ('view_category', 'Просмотр категории'),
        ('open_item', 'Открытие блюда'),
        ('play_preview', 'Воспроизведение превью'),
        ('play_full', 'Полный просмотр'),
        ('unmute', 'Включение звука'),
        ('share', 'Поделиться'),
        ('favorite', 'В избранное'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='analytics_events')
    session_id = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True, blank=True)
    metadata_json = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)


class QRCode(models.Model):
    """QR код"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='qr_codes')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    url = models.URLField()
    qr_code_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)