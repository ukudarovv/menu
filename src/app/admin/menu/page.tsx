'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

interface Menu {
  id: string
  name: string
  active: boolean
  location: string // Django API возвращает ID локации
  location_name?: string // Для отображения названия
  categories_count: number
  created_at: string
}

interface Location {
  id: string
  name: string
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    locationId: '',
    active: true,
  })

  useEffect(() => {
    fetchMenus()
    fetchLocations()
  }, [])

  const fetchMenus = async (locationId?: string) => {
    try {
      const data = await apiClient.getMenus(locationId)
      console.log('Menus data:', data)
      setMenus(data.results)
    } catch (error: any) {
      console.error('Error fetching menus:', error)
      alert(`Ошибка загрузки меню: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const data = await apiClient.getLocations()
      console.log('Locations data:', data)
      setLocations(data.results)
    } catch (error: any) {
      console.error('Error fetching locations:', error)
      alert(`Ошибка загрузки локаций: ${error.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleLocationFilterChange = (locationId: string) => {
    setSelectedLocationId(locationId)
    setLoading(true)
    fetchMenus(locationId || undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        location: formData.locationId, // Django API ожидает поле location
      }
      delete data.locationId // Удаляем старое поле

      if (editingMenu) {
        await apiClient.updateMenu(editingMenu.id, data)
      } else {
        await apiClient.createMenu(data)
      }

      await fetchMenus()
      setIsModalOpen(false)
      setEditingMenu(null)
      setFormData({ name: '', locationId: '', active: true })
    } catch (error: any) {
      console.error('Error saving menu:', error)
      alert(error.message || 'Ошибка сохранения меню')
    }
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      locationId: menu.location, // menu.location теперь строка (ID)
      active: menu.active,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (menuId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это меню?')) return

    try {
      await apiClient.deleteMenu(menuId)
      await fetchMenus()
    } catch (error: any) {
      console.error('Error deleting menu:', error)
      alert(error.message || 'Ошибка удаления меню')
    }
  }

  const openCreateModal = () => {
    setEditingMenu(null)
    setFormData({ name: '', locationId: '', active: true })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Меню</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Меню</h1>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700">
              Фильтр по локации
            </label>
            <select
              id="locationFilter"
              value={selectedLocationId}
              onChange={(e) => handleLocationFilterChange(e.target.value)}
              className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">Все локации</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Создать меню
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {menus.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                У вас пока нет меню
              </h3>
              <p className="text-gray-500 mb-4">
                Создайте первое меню для вашего ресторана
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Создать меню
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {menu.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locations.find(loc => loc.id === menu.location)?.name || 'Неизвестная локация'} • {menu.categories_count} категорий
                    </p>
                    <p className="text-xs text-gray-400">
                      Создано: {new Date(menu.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      menu.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {menu.active ? 'Активно' : 'Неактивно'}
                    </span>
                    
                    <Link href={`/menu/demo-restaurant`} target="_blank">
                      <Button variant="ghost" size="sm" title="Просмотреть меню гостя">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(menu)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(menu.id)}
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
        title={editingMenu ? 'Редактировать меню' : 'Создать меню'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название меню"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Основное меню"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Локация
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Выберите локацию</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Активное меню
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit">
              {editingMenu ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
