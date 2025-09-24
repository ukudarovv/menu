import os
import django
from django.conf import settings

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videomenu.settings')
django.setup()

from api.models import Item, MediaAsset, ItemMedia

def add_video_to_items():
    print("Добавление видео к блюдам...")
    
    # Демо видео URL (можно использовать любые видео с YouTube или других источников)
    demo_videos = {
        'Брускетта с томатами': {
            'preview': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            'full': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            'poster': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop'
        },
        'Стейк из говядины': {
            'preview': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
            'full': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
            'poster': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop'
        },
        'Тирамису': {
            'preview': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            'full': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
            'poster': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop'
        },
        'Свежевыжатый апельсиновый сок': {
            'preview': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            'full': 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            'poster': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&h=600&fit=crop'
        }
    }
    
    for item_name, video_data in demo_videos.items():
        try:
            item = Item.objects.get(name=item_name)
            print(f"Обрабатываем блюдо: {item.name}")
            
            # Удаляем существующие медиа для этого блюда
            ItemMedia.objects.filter(item=item).delete()
            
            # Создаем медиа ассет
            media_asset = MediaAsset.objects.create(
                tenant=item.tenant,  # Добавляем tenant
                type='video',
                original_url=video_data['full'],
                poster_url=video_data['poster'],
                duration_seconds=30,  # 30 секунд
            )
            print(f"Создан медиа ассет: {media_asset.id}")
            
            # Создаем превью видео
            preview_media = ItemMedia.objects.create(
                item=item,
                media=media_asset,
                kind='preview'
            )
            print(f"Создано превью видео для {item.name}")
            
            # Создаем полное видео
            full_media = ItemMedia.objects.create(
                item=item,
                media=media_asset,
                kind='full'
            )
            print(f"Создано полное видео для {item.name}")
            
        except Item.DoesNotExist:
            print(f"Блюдо {item_name} не найдено")
        except Exception as e:
            print(f"Ошибка при обработке {item_name}: {e}")
    
    print("Видео добавлены успешно!")

if __name__ == '__main__':
    add_video_to_items()
