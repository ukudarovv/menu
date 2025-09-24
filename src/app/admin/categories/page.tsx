'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Plus, Edit, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

interface Category {
  id: string
  name: string
  sort_order: number // Django API использует sort_order
  menu: string // Django API возвращает ID меню
  menu_name?: string // Для отображения названия
  items_count: number
  created_at: string
}

interface Menu {
  id: string
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    menuId: '',
    sort: 0,
  })

  useEffect(() => {
    fetchCategories()
    fetchMenus()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await apiClient.getCategories()
      console.log('Categories data:', data)
      setCategories(data.results.sort((a: Category, b: Category) => a.sort_order - b.sort_order))
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      alert(`Ошибка загрузки категорий: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenus = async () => {
    try {
      const data = await apiClient.getMenus()
      console.log('Menus data:', data)
      setMenus(data.results)
    } catch (error: any) {
      console.error('Error fetching menus:', error)
      alert(`Ошибка загрузки меню: ${error.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        menu: formData.menuId, // Django API ожидает поле menu
        sort_order: formData.sort, // Django API использует sort_order
      }
      delete data.menuId // Удаляем старое поле
      delete data.sort // Удаляем старое поле

      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, data)
      } else {
        await apiClient.createCategory(data)
      }

      await fetchCategories()
      setIsModalOpen(false)
      setEditingCategory(null)
      setFormData({
        name: '',
        menuId: '',
        sort: 0,
      })
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(error.message || 'Ошибка сохранения категории')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      menuId: category.menu, // category.menu теперь строка (ID)
      sort: category.sort_order, // используем sort_order
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return

    try {
      await apiClient.deleteCategory(categoryId)
      await fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      alert(error.message || 'Ошибка удаления категории')
    }
  }

  const handleSortChange = async (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId)
    if (categoryIndex === -1) return

    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    const newCategories = [...categories]
    const [movedCategory] = newCategories.splice(categoryIndex, 1)
    newCategories.splice(newIndex, 0, movedCategory)

    // Обновляем порядок
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sort: index
    }))

    setCategories(updatedCategories)

    // Сохраняем изменения на сервере
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sort: newIndex }),
      })
    } catch (error) {
      console.error('Error updating sort order:', error)
      // Восстанавливаем исходный порядок при ошибке
      await fetchCategories()
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      menuId: menus[0]?.id || '',
      sort: categories.length,
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить категорию
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                У вас пока нет категорий
              </h3>
              <p className="text-gray-500 mb-4">
                Создайте первую категорию для вашего меню
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить категорию
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    {/* Порядок */}
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleSortChange(category.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-gray-500 text-center">
                        {category.sort + 1}
                      </span>
                      <button
                        onClick={() => handleSortChange(category.id, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {menus.find(menu => menu.id === category.menu)?.name || 'Неизвестное меню'} • {category.items_count} блюд
                      </p>
                      <p className="text-xs text-gray-400">
                        Создано: {new Date(category.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link href={`/admin/items?categoryId=${category.id}`}>
                      <Button variant="ghost" size="sm" title="Просмотреть блюда">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={category.items_count > 0}
                      title={category.items_count > 0 ? 'Нельзя удалить категорию с блюдами' : 'Удалить категорию'}
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
        title={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название категории"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Закуски"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Меню
            </label>
            <select
              value={formData.menuId}
              onChange={(e) => setFormData(prev => ({ ...prev, menuId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Выберите меню</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Порядок сортировки"
            type="number"
            value={formData.sort}
            onChange={(e) => setFormData(prev => ({ ...prev, sort: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit">
              {editingCategory ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
