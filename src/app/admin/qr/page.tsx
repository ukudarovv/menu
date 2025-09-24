'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { QrCode, Download, Copy, Eye, Settings, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface QRCode {
  id: string
  name: string
  url: string
  qr_code_url: string // Django API использует qr_code_url
  location?: string // Django API возвращает ID локации
  location_name?: string // Для отображения названия
  created_at: string
}

export default function QRPage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    locationId: '',
  })
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchQRCodes()
    fetchLocations()
  }, [])

  const fetchQRCodes = async () => {
    try {
      const data = await apiClient.getQRCodes()
      console.log('QR Codes data:', data)
      setQrCodes(data.results)
    } catch (error: any) {
      console.error('Error fetching QR codes:', error)
      alert(`Ошибка загрузки QR кодов: ${error.message || 'Неизвестная ошибка'}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        location: formData.locationId, // Django API ожидает поле location
      }
      delete data.locationId // Удаляем старое поле

      await apiClient.createQRCode(data)
      await fetchQRCodes()
      setIsModalOpen(false)
      setFormData({
        name: '',
        url: '',
        locationId: '',
      })
    } catch (error: any) {
      console.error('Error creating QR code:', error)
      alert(error.message || 'Ошибка создания QR кода')
    }
  }

  const handleDelete = async (qrId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот QR код?')) return

    try {
      await apiClient.deleteQRCode(qrId)
      await fetchQRCodes()
    } catch (error: any) {
      console.error('Error deleting QR code:', error)
      alert(error.message || 'Ошибка удаления QR кода')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Скопировано в буфер обмена!')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const downloadQRCode = async (qr_code_url: string, name: string) => {
    try {
      const response = await fetch(qr_code_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}-qr-code.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    }
  }

  const openCreateModal = () => {
    setFormData({
      name: '',
      url: `${window.location.origin}/menu/demo-restaurant`,
      locationId: locations[0]?.id || '',
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">QR коды</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">QR коды</h1>
        <Button onClick={openCreateModal}>
          <QrCode className="h-4 w-4 mr-2" />
          Создать QR код
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {qrCodes.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                У вас пока нет QR кодов
              </h3>
              <p className="text-gray-500 mb-4">
                Создайте QR код для быстрого доступа к меню
              </p>
              <Button onClick={openCreateModal}>
                <QrCode className="h-4 w-4 mr-2" />
                Создать QR код
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {qr.name}
                    </h3>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="text-center mb-4">
                    <img
                      src={qr.qr_code_url}
                      alt={`QR код для ${qr.name}`}
                      className="w-32 h-32 mx-auto border border-gray-200 rounded"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">URL:</span>
                      <p className="text-gray-600 break-all">{qr.url}</p>
                    </div>
                    
                    {qr.location && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Локация:</span>
                        <p className="text-gray-600">{locations.find(loc => loc.id === qr.location)?.name || 'Неизвестная локация'}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Создан: {new Date(qr.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(qr.url)}
                      className="flex-1"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Копировать
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQRCode(qr.qr_code_url, qr.name)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Скачать
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(qr.url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Открыть
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Создать QR код
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Название QR кода"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Стол №1"
                  required
                />
                
                <Input
                  label="URL"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/menu"
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Локация (опционально)
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Без локации</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
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
                    Создать
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
