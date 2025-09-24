'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Users, Menu } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface Location {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  capacity?: number
  is_active: boolean // Django API использует is_active
  menus_count: number // From Django API
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    isActive: true,
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const data = await apiClient.getLocations()
      console.log('Locations data:', data)
      setLocations(data.results)
    } catch (error: any) {
      console.error('Error fetching locations:', error)
      alert(`Ошибка загрузки локаций: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        is_active: formData.isActive, // Преобразуем isActive в is_active для Django
      }
      delete data.isActive // Удаляем старое поле

      if (editingLocation) {
        await apiClient.updateLocation(editingLocation.id, data)
      } else {
        await apiClient.createLocation(data)
      }

      await fetchLocations()
      setIsModalOpen(false)
      setEditingLocation(null)
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        capacity: '',
        isActive: true,
      })
    } catch (error: any) {
      console.error('Error saving location:', error)
      alert(error.message || 'Ошибка сохранения локации')
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      description: location.description || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      capacity: location.capacity?.toString() || '',
      isActive: location.is_active,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту локацию?')) return

    try {
      await apiClient.deleteLocation(locationId)
      await fetchLocations()
    } catch (error: any) {
      console.error('Error deleting location:', error)
      alert(error.message || 'Ошибка удаления локации')
    }
  }

  const openCreateModal = () => {
    setEditingLocation(null)
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      capacity: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Локации</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Локации</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить локацию
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                У вас пока нет локаций
              </h3>
              <p className="text-gray-500 mb-4">
                Добавьте первую локацию для вашего ресторана
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить локацию
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {location.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {location.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(location.id)}
                        disabled={location.menus_count > 0}
                        title={location.menus_count > 0 ? 'Нельзя удалить локацию с меню' : 'Удалить локацию'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {location.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {location.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {location.address && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{location.address}</span>
                      </div>
                    )}
                    
                    {location.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{location.phone}</span>
                      </div>
                    )}
                    
                    {location.email && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{location.email}</span>
                      </div>
                    )}
                    
                    {location.capacity && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Вместимость: {location.capacity} человек</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Menu className="h-4 w-4 mr-2" />
                      <span>Меню: {location.menus_count}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                      Создано: {new Date(location.createdAt).toLocaleDateString('ru-RU')}
                    </div>
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
        title={editingLocation ? 'Редактировать локацию' : 'Добавить локацию'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название локации"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Основной зал"
            required
          />
          
          <Input
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Краткое описание локации"
          />
          
          <Input
            label="Адрес"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="ул. Примерная, д. 1"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Телефон"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+7 (999) 123-45-67"
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="location@restaurant.com"
            />
          </div>
          
          <Input
            label="Вместимость"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
            placeholder="50"
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Активная локация
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
              {editingLocation ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
