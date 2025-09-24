'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, Eye, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

interface Item {
  id: string
  name: string
  description?: string
  category: string // Django API возвращает ID категории
  category_name?: string // Для отображения названия
  tags: string[]
  allergens: string[]
  weight_g?: number // Django API использует weight_g
  kcal?: number
  prices: Array<{
    amount_minor: number // Django API использует amount_minor
    currency: string
  }>
  item_media: Array<{
    kind: string
    media: {
      type: string
      original_url?: string // Django API использует original_url
      poster_url?: string // Django API использует poster_url
    }
  }>
  created_at: string
}

interface Category {
  id: string
  name: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    sku: '',
    tags: [] as string[],
    allergens: [] as string[],
    weightG: '',
    kcal: '',
    price: '',
    currency: 'RUB',
  })
  const [uploadingMedia, setUploadingMedia] = useState(false)

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [])

  const fetchItems = async () => {
    try {
      const data = await apiClient.getItems()
      console.log('Items data:', data)
      setItems(data.results)
    } catch (error: any) {
      console.error('Error fetching items:', error)
      alert(`Ошибка загрузки блюд: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories()
      console.log('Categories data:', data)
      setCategories(data.results)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      alert(`Ошибка загрузки категорий: ${error.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        category: formData.categoryId, // Django API ожидает поле category
        weight_g: formData.weightG ? parseInt(formData.weightG) : undefined, // Django API использует weight_g
        kcal: formData.kcal ? parseInt(formData.kcal) : undefined,
        price: parseFloat(formData.price),
      }
      delete data.categoryId // Удаляем старое поле
      delete data.weightG // Удаляем старое поле

      if (editingItem) {
        await apiClient.updateItem(editingItem.id, data)
      } else {
        await apiClient.createItem(data)
      }

      await fetchItems()
      setIsModalOpen(false)
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        sku: '',
        tags: [],
        allergens: [],
        weightG: '',
        kcal: '',
        price: '',
        currency: 'RUB',
      })
    } catch (error: any) {
      console.error('Error saving item:', error)
      alert(error.message || 'Ошибка сохранения блюда')
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      categoryId: item.category, // item.category теперь строка (ID)
      sku: '',
      tags: item.tags,
      allergens: item.allergens,
      weightG: item.weight_g?.toString() || '', // используем weight_g
      kcal: item.kcal?.toString() || '',
      price: item.prices[0] ? (item.prices[0].amount_minor / 100).toString() : '', // используем amount_minor
      currency: item.prices[0]?.currency || 'RUB',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это блюдо?')) return

    try {
      await apiClient.deleteItem(itemId)
      await fetchItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      alert(error.message || 'Ошибка удаления блюда')
    }
  }

  const handleFileUpload = async (file: File, kind: string) => {
    setUploadingMedia(true)
    try {
      const token = localStorage.getItem('accessToken')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', file.type.startsWith('video/') ? 'video' : 'image')
      formData.append('kind', kind)
      if (editingItem) {
        formData.append('itemId', editingItem.id)
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        await fetchItems()
      }
    } catch (error) {
      console.error('Error uploading media:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      sku: '',
      tags: [],
      allergens: [],
      weightG: '',
      kcal: '',
      price: '',
      currency: 'RUB',
    })
    setIsModalOpen(true)
  }

  const formatPrice = (amount_minor: number, currency: string) => {
    const amount = amount_minor / 100
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Блюда</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Блюда</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить блюдо
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                У вас пока нет блюд
              </h3>
              <p className="text-gray-500 mb-4">
                Добавьте первое блюдо в ваше меню
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить блюдо
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Превью медиа */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.item_media && item.item_media.find(im => im.kind === 'preview') ? (
                          <img
                            src={item.item_media.find(im => im.kind === 'preview')?.media.poster_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Нет фото</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {categories.find(cat => cat.id === item.category)?.name || 'Неизвестная категория'}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          {item.weight_g && (
                            <span className="text-xs text-gray-500">
                              {item.weight_g}г
                            </span>
                          )}
                          {item.kcal && (
                            <span className="text-xs text-gray-500">
                              {item.kcal} ккал
                            </span>
                          )}
                          {item.prices[0] && (
                            <span className="text-sm font-medium text-gray-900">
                              {formatPrice(item.prices[0].amount_minor, item.prices[0].currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать блюдо' : 'Добавить блюдо'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Название блюда"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Название блюда"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Описание блюда"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Артикул"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="SKU"
            />
            
            <Input
              label="Вес (г)"
              type="number"
              value={formData.weightG}
              onChange={(e) => setFormData(prev => ({ ...prev, weightG: e.target.value }))}
              placeholder="250"
            />
            
            <Input
              label="Калории"
              type="number"
              value={formData.kcal}
              onChange={(e) => setFormData(prev => ({ ...prev, kcal: e.target.value }))}
              placeholder="320"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Цена"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="450.00"
              required
            />
            
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
              </select>
            </div>
          </div>

          {/* Загрузка медиа */}
          {editingItem && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Медиа файлы</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Превью видео
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'preview')
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    disabled={uploadingMedia}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Полное видео
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'full')
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    disabled={uploadingMedia}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Аудио
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'sound')
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    disabled={uploadingMedia}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" loading={uploadingMedia}>
              {editingItem ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
