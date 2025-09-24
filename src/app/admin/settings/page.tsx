'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Save, Upload, Palette, Globe, Phone, Mail, MapPin } from 'lucide-react'

interface Settings {
  id: string
  name: string
  description?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  timezone: string
  currency: string
  language: string
  theme: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
  }
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    language: 'ru',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      logoUrl: '',
    }
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          website: data.data.website || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          address: data.data.address || '',
          timezone: data.data.timezone || 'Europe/Moscow',
          currency: data.data.currency || 'RUB',
          language: data.data.language || 'ru',
          theme: {
            primaryColor: data.data.theme?.primaryColor || '#3B82F6',
            secondaryColor: data.data.theme?.secondaryColor || '#1E40AF',
            logoUrl: data.data.theme?.logoUrl || '',
          }
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        alert('Настройки сохранены успешно!')
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка сохранения настроек')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const token = localStorage.getItem('accessToken')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'image')

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          theme: {
            ...prev.theme,
            logoUrl: data.data.url
          }
        }))
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Настройки ресторана</h1>
        <Button onClick={handleSubmit} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Основная информация
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Название ресторана"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Название вашего ресторана"
                required
              />
              
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@restaurant.com"
              />
              
              <Input
                label="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
              />
              
              <Input
                label="Веб-сайт"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://restaurant.com"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Описание"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание вашего ресторана"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Адрес"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Полный адрес ресторана"
              />
            </div>
          </div>
        </div>

        {/* Локализация */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Локализация
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Часовой пояс
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Europe/Moscow">Москва (UTC+3)</option>
                  <option value="Europe/Kiev">Киев (UTC+2)</option>
                  <option value="Europe/Minsk">Минск (UTC+3)</option>
                  <option value="America/New_York">Нью-Йорк (UTC-5)</option>
                  <option value="Europe/London">Лондон (UTC+0)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="RUB">₽ RUB</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="UAH">₴ UAH</option>
                  <option value="BYN">Br BYN</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Язык
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uk">Українська</option>
                  <option value="be">Беларуская</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Дизайн */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Дизайн и брендинг
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логотип
                </label>
                <div className="flex items-center space-x-4">
                  {formData.theme.logoUrl && (
                    <img
                      src={formData.theme.logoUrl}
                      alt="Логотип"
                      className="w-16 h-16 object-contain border border-gray-300 rounded"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Рекомендуемый размер: 200x200px
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Основной цвет
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.theme.primaryColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: e.target.value }
                      }))}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.theme.primaryColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        theme: { ...prev.theme, primaryColor: e.target.value }
                      }))}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дополнительный цвет
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.theme.secondaryColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        theme: { ...prev.theme, secondaryColor: e.target.value }
                      }))}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.theme.secondaryColor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        theme: { ...prev.theme, secondaryColor: e.target.value }
                      }))}
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
