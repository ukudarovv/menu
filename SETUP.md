# 🚀 Инструкция по установке Video Menu Platform

## 📋 Требования

- **Node.js** 18+ 
- **Python** 3.11+
- **Git**

## 🔧 Пошаговая установка

### 1. Клонирование репозитория
```bash
git clone https://github.com/ukudarovv/menu.git
cd menu
```

### 2. Установка Frontend зависимостей
```bash
npm install
```

### 3. Настройка Backend

#### 3.1 Переход в папку backend
```bash
cd backend
```

#### 3.2 Создание виртуального окружения (рекомендуется)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3.3 Установка Python зависимостей
```bash
pip install -r requirements.txt
```

#### 3.4 Применение миграций
```bash
python manage.py migrate
```

#### 3.5 Создание суперпользователя
```bash
python manage.py createsuperuser
# Введите email, пароль и данные для тенанта
```

### 4. Создание демо данных

#### 4.1 Создание базовых данных
```bash
python create_demo_data.py
```

#### 4.2 Добавление видео к блюдам
```bash
python add_video_to_items.py
```

### 5. Запуск приложения

#### 5.1 Запуск Django сервера (порт 8000)
```bash
# В папке backend
python manage.py runserver 8000
```

#### 5.2 Запуск Next.js сервера (порт 3000)
```bash
# В корневой папке проекта
npm run dev
```

## 🌐 Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Админ панель**: http://localhost:3000/admin
- **Демо меню**: http://localhost:3000/menu/demo-restaurant

## 🔐 Данные для входа

После создания суперпользователя используйте:
- **Email**: тот, который вы указали при создании
- **Пароль**: тот, который вы указали при создании

## 📱 Тестирование PWA

1. Откройте http://localhost:3000/menu/demo-restaurant
2. В Chrome нажмите на иконку "Установить" в адресной строке
3. Или через меню: "Установить Video Menu Platform"

## 🛠️ Разработка

### Структура проекта
```
menu/
├── src/                    # Next.js приложение
│   ├── app/               # App Router страницы
│   ├── components/        # React компоненты
│   └── lib/              # Утилиты и API клиент
├── backend/               # Django приложение
│   ├── api/              # API endpoints
│   └── videomenu/        # Django настройки
└── public/               # Статические файлы
```

### Полезные команды

#### Frontend
```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сборки
npm run lint         # Проверка кода
```

#### Backend
```bash
python manage.py runserver 8000    # Запуск сервера
python manage.py migrate           # Применение миграций
python manage.py makemigrations    # Создание миграций
python manage.py shell             # Django shell
python manage.py createsuperuser   # Создание суперпользователя
```

## 🐛 Решение проблем

### Ошибка "Cannot find module"
```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install
```

### Ошибка "No such file or directory" для manage.py
```bash
# Убедитесь, что вы в папке backend
cd backend
python manage.py runserver 8000
```

### Ошибка 500 в API
```bash
# Проверьте, что Django сервер запущен
# Проверьте логи в терминале Django
```

### Проблемы с миграциями
```bash
# Удалите базу данных и пересоздайте
rm db.sqlite3
python manage.py migrate
python create_demo_data.py
```

## 📊 Мониторинг

### Логи Django
Логи отображаются в терминале где запущен `python manage.py runserver`

### Логи Next.js
Логи отображаются в терминале где запущен `npm run dev`

## 🔄 Обновление

```bash
# Получить последние изменения
git pull origin master

# Обновить зависимости
npm install
cd backend
pip install -r requirements.txt

# Применить новые миграции
python manage.py migrate
```

## 📞 Поддержка

Если у вас возникли проблемы:
1. Проверьте раздел "Решение проблем"
2. Создайте issue в GitHub репозитории
3. Убедитесь, что все зависимости установлены правильно

---

**Удачной разработки! 🚀**