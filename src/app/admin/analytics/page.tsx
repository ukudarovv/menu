'use client'

import React, { useEffect, useState } from 'react'
import { BarChart3, Eye, Play, Heart, TrendingUp } from 'lucide-react'

interface AnalyticsData {
  summary: {
    totalViews: number
    totalPlays: number
    totalInteractions: number
    uniqueUsers: number
  }
  chartData: Array<{
    date: string
    views: number
    plays: number
    interactions: number
  }>
  topCategories: Array<{
    id: string
    name: string
    views: number
  }>
  topItems: Array<{
    id: string
    name: string
    category: string
    interactions: number
  }>
  eventTypeStats: Array<{
    type: string
    count: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/analytics?period=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Просмотры',
      value: analytics?.summary.totalViews || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Воспроизведения',
      value: analytics?.summary.totalPlays || 0,
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Взаимодействия',
      value: analytics?.summary.totalInteractions || 0,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Уникальные пользователи',
      value: analytics?.summary.uniqueUsers || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        </div>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="1d">Последний день</option>
            <option value="7d">Последние 7 дней</option>
            <option value="30d">Последние 30 дней</option>
            <option value="90d">Последние 90 дней</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Top Categories */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Популярные категории
          </h3>
          {analytics?.topCategories && analytics.topCategories.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCategories.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{category.views} просмотров</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет данных для отображения</p>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Популярные блюда
          </h3>
          {analytics?.topItems && analytics.topItems.length > 0 ? (
            <div className="space-y-3">
              {analytics.topItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{item.interactions} взаимодействий</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет данных для отображения</p>
          )}
        </div>
      </div>

      {/* Events by Type */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            События по типам
          </h3>
          {analytics?.eventTypeStats && analytics.eventTypeStats.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {analytics.eventTypeStats.map((stat) => (
                <div key={stat.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {stat.type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-primary-600">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет данных для отображения</p>
          )}
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Активность по дням
          </h3>
          {analytics?.chartData && analytics.chartData.length > 0 ? (
            <div className="space-y-2">
              {analytics.chartData.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('ru-RU')}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {day.views} просмотров
                    </span>
                    <span className="text-sm text-gray-500">
                      {day.plays} воспроизведений
                    </span>
                    <span className="text-sm text-gray-500">
                      {day.interactions} взаимодействий
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет данных для отображения</p>
          )}
        </div>
      </div>
    </div>
  )
}
