# Инструкция по запуску Video Menu Platform

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
```bash
cp env.example .env.local
```

Отредактируйте `.env.local`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
```

### 3. Инициализация базы данных
```bash
npx prisma generate
npx prisma db push
npm run db:init
```

### 4. Запуск приложения
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 🔑 Учетные данные

После инициализации базы данных будут созданы следующие аккаунты:

### Суперадмин
- **Email**: admin@videomenu.com
- **Пароль**: admin123
- **Роль**: superadmin

### Демо ресторан
- **Email**: owner@demo.com
- **Пароль**: demo123
- **Роль**: owner
- **URL меню**: http://localhost:3000/menu/demo-restaurant

## 📱 Тестирование PWA

1. Откройте http://localhost:3000/menu/demo-restaurant
2. В Chrome/Edge нажмите на иконку "Установить" в адресной строке
3. Или используйте DevTools → Application → Manifest → "Add to homescreen"

## 🎥 Тестирование видео-плеера

1. Войдите в админку: http://localhost:3000/login
2. Используйте учетные данные демо ресторана
3. Перейдите в раздел "Блюда"
4. Добавьте видео к любому блюду
5. Просмотрите меню гостя для тестирования плеера

## 📊 Аналитика

1. Войдите в админку
2. Перейдите в раздел "Аналитика"
3. Просматривайте статистику по просмотрам и взаимодействиям

## 🛠 Разработка

### Полезные команды
```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
npm start

# Линтинг
npm run lint

# Проверка типов
npm run type-check

# Работа с базой данных
npx prisma studio
npx prisma db push
npx prisma generate
```

### Структура проекта
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API маршруты
│   ├── admin/          # Админ-панель
│   ├── menu/           # PWA для гостей
│   └── page.tsx        # Главная страница
├── components/         # React компоненты
├── lib/               # Утилиты и конфигурация
└── types/             # TypeScript типы
```

## 🔧 Настройка медиа

### Загрузка файлов
- Максимальный размер: 50MB
- Поддерживаемые форматы:
  - Видео: MP4, WebM, MOV
  - Аудио: MP3, WAV, AAC
  - Изображения: JPEG, PNG, WebP

### Хранение
- Файлы сохраняются в папке `uploads/`
- Структура: `uploads/{tenantId}/{filename}`
- Доступ через API: `/api/media/{tenantId}/{filename}`

## 🚀 Развертывание

### Локальный продакшн
```bash
npm run build
npm start
```

### Docker (планируется)
```bash
docker build -t video-menu-platform .
docker run -p 3000:3000 video-menu-platform
```

## 🐛 Решение проблем

### База данных не создается
```bash
rm -f dev.db
npx prisma db push
npm run db:init
```

### Ошибки TypeScript
```bash
npm run type-check
```

### Проблемы с PWA
1. Убедитесь, что приложение запущено по HTTPS (или localhost)
2. Проверьте манифест в DevTools → Application → Manifest
3. Очистите кэш браузера

### Медиа файлы не загружаются
1. Проверьте права доступа к папке `uploads/`
2. Убедитесь, что папка существует
3. Проверьте логи сервера

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли браузера
2. Проверьте логи сервера в терминале
3. Убедитесь, что все зависимости установлены
4. Проверьте настройки окружения

## 🎯 Следующие шаги

После успешного запуска:
1. Создайте свой ресторан через регистрацию
2. Добавьте меню и блюда
3. Загрузите видео и аудио файлы
4. Сгенерируйте QR код
5. Протестируйте PWA на мобильном устройстве

---

**Удачной разработки! 🚀**
