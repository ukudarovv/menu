'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Eye, QrCode, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalMenus: number
  totalCategories: number
  totalItems: number
  totalViews: number
  totalPlays: number
  recentActivity: any[]
  topItems: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMenus: 0,
    totalCategories: 0,
    totalItems: 0,
    totalViews: 0,
    totalPlays: 0,
    recentActivity: [],
    topItems: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Создать меню',
      description: 'Добавить новое меню в ваш ресторан',
      href: '/admin/menu/new',
      icon: Plus,
      color: 'bg-blue-500',
    },
    {
      title: 'Добавить блюдо',
      description: 'Создать новое блюдо с видео и аудио',
      href: '/admin/items/new',
      icon: Plus,
      color: 'bg-green-500',
    },
    {
      title: 'Просмотреть меню',
      description: 'Посмотреть как выглядит ваше меню для гостей',
      href: '/menu',
      icon: Eye,
      color: 'bg-purple-500',
    },
    {
      title: 'QR код',
      description: 'Сгенерировать QR код для вашего меню',
      href: '/admin/qr',
      icon: QrCode,
      color: 'bg-orange-500',
    },
  ]

  const statCards = [
    {
      title: 'Меню',
      value: stats.totalMenus,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Категории',
      value: stats.totalCategories,
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Блюда',
      value: stats.totalItems,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Просмотры',
      value: stats.totalViews,
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Воспроизведения',
      value: stats.totalPlays,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Панель управления
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Добро пожаловать в админ-панель вашего ресторана
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                href={action.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div>
                  <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Последняя активность</h3>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-900">
                      {activity.type === 'view_category' && 'Просмотр категории'}
                      {activity.type === 'open_item' && 'Открытие блюда'}
                      {activity.type === 'play_preview' && 'Воспроизведение превью'}
                      {activity.type === 'play_full' && 'Полный просмотр'}
                      {activity.type === 'unmute' && 'Включение звука'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>Активность пока не зафиксирована</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Последние блюда</h3>
          {stats.topItems.length > 0 ? (
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <p>Блюда пока не добавлены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
