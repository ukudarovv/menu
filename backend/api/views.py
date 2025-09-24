from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, Tenant, Location, Menu, Category, Item, Price, 
    MediaAsset, ItemMedia, AnalyticsEvent, QRCode
)
from .serializers import (
    TenantSerializer, LocationSerializer, MenuSerializer, CategorySerializer,
    ItemSerializer, UserSerializer, AnalyticsEventSerializer, QRCodeSerializer,
    DashboardStatsSerializer
)


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Location.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Menu.objects.filter(tenant=self.request.user.tenant)
        # Фильтрация по локации если указана
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Category.objects.filter(tenant=self.request.user.tenant)
        # Фильтрация по меню если указано
        menu_id = self.request.query_params.get('menu')
        if menu_id:
            queryset = queryset.filter(menu_id=menu_id)
        # Фильтрация по локации через меню
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(menu__location_id=location_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Item.objects.filter(tenant=self.request.user.tenant)
        # Фильтрация по категории если указана
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        # Фильтрация по меню через категорию
        menu_id = self.request.query_params.get('menu')
        if menu_id:
            queryset = queryset.filter(category__menu_id=menu_id)
        # Фильтрация по локации через меню и категорию
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(category__menu__location_id=location_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class QRCodeViewSet(viewsets.ModelViewSet):
    queryset = QRCode.objects.all()
    serializer_class = QRCodeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return QRCode.objects.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        # Генерируем QR код URL (пока просто используем Google Charts API)
        url = serializer.validated_data.get('url', '')
        qr_code_url = f"https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl={url}"
        serializer.save(tenant=self.request.user.tenant, qr_code_url=qr_code_url)


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Получение статистики для дашборда"""
        tenant = request.user.tenant
        period = request.query_params.get('period', '7d')
        
        # Вычисляем дату начала периода
        now = timezone.now()
        if period == '7d':
            start_date = now - timedelta(days=7)
        elif period == '30d':
            start_date = now - timedelta(days=30)
        elif period == '90d':
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=7)
        
        # Получаем статистику
        total_menus = Menu.objects.filter(tenant=tenant).count()
        total_categories = Category.objects.filter(tenant=tenant).count()
        total_items = Item.objects.filter(tenant=tenant).count()
        
        total_views = AnalyticsEvent.objects.filter(
            tenant=tenant,
            type__in=['view_category', 'open_item'],
            timestamp__gte=start_date
        ).count()
        
        total_plays = AnalyticsEvent.objects.filter(
            tenant=tenant,
            type__in=['play_preview', 'play_full'],
            timestamp__gte=start_date
        ).count()
        
        unique_users = AnalyticsEvent.objects.filter(
            tenant=tenant,
            timestamp__gte=start_date
        ).values('session_id').distinct().count()
        
        # Последняя активность
        recent_activity = AnalyticsEvent.objects.filter(
            tenant=tenant,
            timestamp__gte=start_date
        ).order_by('-timestamp')[:10]
        
        # Топ блюда
        top_items = Item.objects.filter(
            tenant=tenant,
            analytics_events__type__in=['open_item', 'play_preview', 'play_full'],
            analytics_events__timestamp__gte=start_date
        ).annotate(
            interactions_count=Count('analytics_events')
        ).order_by('-interactions_count')[:5]
        
        stats_data = {
            'total_menus': total_menus,
            'total_categories': total_categories,
            'total_items': total_items,
            'total_views': total_views,
            'total_plays': total_plays,
            'unique_users': unique_users,
            'recent_activity': recent_activity,
            'top_items': top_items,
        }
        
        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def track(self, request):
        """Отслеживание события аналитики"""
        tenant = request.user.tenant
        data = request.data
        
        event = AnalyticsEvent.objects.create(
            tenant=tenant,
            session_id=data.get('session_id', ''),
            type=data.get('type', ''),
            category_id=data.get('category_id'),
            item_id=data.get('item_id'),
            metadata_json=data.get('metadata', {}),
        )
        
        return Response({'success': True, 'event_id': event.id})


# Аутентификация
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Обновляем время последнего входа
        user.last_login_at = timezone.now()
        user.save()
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'accessToken': token.key,
            },
            'message': 'Вход выполнен успешно'
        })


# Публичный API для гостевого меню
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def public_menu_view(request, tenant_slug):
    """Публичный API для получения меню по slug тенанта"""
    try:
        # Получаем тенанта по slug
        tenant = Tenant.objects.get(slug=tenant_slug, status='active')
        
        # Получаем все активные меню тенанта с категориями и блюдами
        menus = Menu.objects.filter(
            tenant=tenant,
            active=True
        ).prefetch_related(
            'categories__items__prices',
            'categories__items__item_media__media'
        ).select_related('location')
        
        # Формируем данные для ответа
        menu_data = {
            'tenant': {
                'name': tenant.name,
                'slug': tenant.slug,
                'theme': {
                    'palette_json': tenant.theme_json or '{}',
                    'logo_url': tenant.logo_url or '',
                }
            },
            'menus': []
        }
        
        for menu in menus:
            menu_dict = {
                'id': str(menu.id),
                'name': menu.name,
                'categories': []
            }
            
            for category in menu.categories.all():
                category_dict = {
                    'id': str(category.id),
                    'name': category.name,
                    'items': []
                }
                
                for item in category.items.all():
                    item_dict = {
                        'id': str(item.id),
                        'name': item.name,
                        'description': item.description or '',
                        'tags': item.tags or [],
                        'allergens': item.allergens or [],
                        'weight_g': item.weight_g,
                        'kcal': item.kcal,
                        'prices': [],
                        'item_media': []
                    }
                    
                    # Добавляем цены
                    for price in item.prices.all():
                        item_dict['prices'].append({
                            'amount_minor': price.amount_minor,
                            'currency': price.currency,
                        })
                    
                    # Добавляем медиа
                    for item_media in item.item_media.all():
                        media_dict = {
                            'kind': item_media.kind,
                            'media': {
                                'type': item_media.media.type,
                                'original_url': item_media.media.original_url or '',
                                'hls_url': item_media.media.hls_url or '',
                                'poster_url': item_media.media.poster_url or '',
                                'duration_ms': item_media.media.duration_seconds * 1000 if item_media.media.duration_seconds else None,
                            }
                        }
                        item_dict['item_media'].append(media_dict)
                    
                    category_dict['items'].append(item_dict)
                
                menu_dict['categories'].append(category_dict)
            
            menu_data['menus'].append(menu_dict)
        
        return Response({
            'success': True,
            'data': menu_data
        })
        
    except Tenant.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Ресторан не найден'
        }, status=404)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Внутренняя ошибка сервера'
        }, status=500)