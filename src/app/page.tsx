import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Play, Smartphone, QrCode, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Video Menu Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Войти</Button>
              </Link>
              <Link href="/register">
                <Button>Регистрация</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Интерактивные
              <span className="text-primary-600"> видео-меню</span>
              <br />
              для ресторанов
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Создавайте привлекательные меню с видео и аудио для каждого блюда. 
              Увеличьте конверсию и улучшите опыт гостей с помощью современных технологий.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Начать бесплатно
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" />
                  Посмотреть демо
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Возможности платформы
            </h2>
            <p className="text-xl text-gray-600">
              Все необходимое для создания современного меню
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Видео и аудио
              </h3>
              <p className="text-gray-600">
                Добавляйте видео приготовления и звуки к каждому блюду для максимального воздействия
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PWA приложение
              </h3>
              <p className="text-gray-600">
                Гости могут установить ваше меню как приложение на свой телефон
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                QR коды
              </h3>
              <p className="text-gray-600">
                Генерируйте QR коды для быстрого доступа к меню с любого стола
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Аналитика
              </h3>
              <p className="text-gray-600">
                Отслеживайте популярность блюд и поведение гостей
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Мультиязычность
              </h3>
              <p className="text-gray-600">
                Поддержка нескольких языков и валют для международных гостей
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Киоск режим
              </h3>
              <p className="text-gray-600">
                Полноэкранный режим для планшетов и больших экранов
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Создайте свое первое интерактивное меню уже сегодня
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Создать аккаунт бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Video Menu Platform</h3>
            <p className="text-gray-400 mb-4">
              Современные интерактивные меню для ресторанов
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 Video Menu Platform. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
