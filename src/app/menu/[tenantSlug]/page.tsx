'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Heart, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/lib/api'

interface MenuData {
  tenant: {
    name: string
    slug: string
    theme: {
      palette_json: string // Django API использует palette_json
      logo_url?: string // Django API использует logo_url
    }
  }
  menus: Array<{
    id: string
    name: string
    categories: Array<{
      id: string
      name: string
      items: Array<{
        id: string
        name: string
        description?: string
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
            hls_url?: string // Django API использует hls_url
            poster_url?: string // Django API использует poster_url
            duration_ms?: number // Django API использует duration_ms
          }
        }>
      }>
    }>
  }>
}

export default function MenuPage() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavorites, setShowFavorites] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [tenantSlug])

  const fetchMenuData = async () => {
    try {
      // Для публичного меню используем прямой запрос к Django API
      const response = await fetch(`http://localhost:8000/api/public/menu/${tenantSlug}/`)
      if (response.ok) {
        const data = await response.json()
        console.log('Menu data:', data)
        setMenuData(data.data)
      } else {
        console.error('Failed to fetch menu data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId)
    } else {
      newFavorites.add(itemId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)))
  }

  const filteredItems = menuData?.menus[0]?.categories.flatMap(category => 
    category.items.map(item => ({
      ...item,
      categoryName: category.name
    }))
  ).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const formatPrice = (amount_minor: number, currency: string) => {
    const amount = amount_minor / 100
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!menuData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Меню не найдено
          </h1>
          <p className="text-gray-600">
            Ресторан с таким адресом не существует или меню недоступно
          </p>
        </div>
      </div>
    )
  }

  const theme = JSON.parse(menuData.tenant.theme.palette_json || '{}')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              {menuData.tenant.theme.logo_url && (
                <img
                  src={menuData.tenant.theme.logo_url}
                  alt={menuData.tenant.name}
                  className="h-12 w-auto mr-4 rounded-lg shadow-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {menuData.tenant.name}
                </h1>
                <p className="text-white/70 text-sm">Интерактивное меню</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
                className="text-white border-white/30 hover:bg-white/10 hover:border-white/50 backdrop-blur-sm"
              >
                <Heart className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current text-red-400' : ''}`} />
                Избранное ({favorites.size})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
            <input
              type="text"
              placeholder="Поиск блюд..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {menuData.menus.map((menu) => (
          <div key={menu.id} className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">{menu.name}</h2>
            
            {menu.categories.map((category) => (
              <div key={category.id} className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6 relative">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {category.name}
                  </span>
                  <div className="absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items
                    .filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => {
                      const previewMedia = item.item_media && item.item_media.find(im => im.kind === 'preview')
                      const fullMedia = item.item_media && item.item_media.find(im => im.kind === 'full')
                      const soundMedia = item.item_media && item.item_media.find(im => im.kind === 'sound')
                      
                      return (
                        <div
                          key={item.id}
                          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 border border-white/20"
                        >
                          {/* Video Preview */}
                          {previewMedia && (
                            <div className="aspect-video">
                              <VideoPlayer
                                src={previewMedia.media.hls_url || previewMedia.media.original_url || ''}
                                poster={previewMedia.media.poster_url}
                                autoplay={true}
                                muted={true}
                                loop={true}
                                className="w-full h-full"
                                onPlay={() => {
                                  // Analytics: track preview play
                                  fetch('/api/analytics/events', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      type: 'play_preview',
                                      itemId: item.id,
                                      sessionId: 'guest-session',
                                    }),
                                  })
                                }}
                              />
                            </div>
                          )}

                          {/* Item Info */}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-xl font-bold text-white">
                                {item.name}
                              </h4>
                              <button
                                onClick={() => toggleFavorite(item.id)}
                                className={`p-2 rounded-full transition-all duration-200 ${
                                  favorites.has(item.id)
                                    ? 'text-red-400 bg-red-400/20'
                                    : 'text-white/60 hover:text-red-400 hover:bg-red-400/20'
                                }`}
                              >
                                <Heart className={`h-5 w-5 ${favorites.has(item.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>

                            {item.description && (
                              <p className="text-white/80 text-sm mb-4 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Tags */}
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-400/30"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Allergens */}
                            {item.allergens.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-white/60 mb-2">⚠️ Аллергены:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.allergens.map((allergen, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-400/30"
                                    >
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Nutrition Info */}
                            {(item.weight_g || item.kcal) && (
                              <div className="flex items-center gap-4 text-xs text-white/70 mb-4">
                                {item.weight_g && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    {item.weight_g}г
                                  </span>
                                )}
                                {item.kcal && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                    {item.kcal} ккал
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Price and Actions */}
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-white">
                                {item.prices[0] && formatPrice(item.prices[0].amount_minor, item.prices[0].currency)}
                              </div>
                              
                              <div className="flex space-x-3">
                                {soundMedia && (
                                  <button
                                    onClick={() => {
                                      // Play sound
                                      const audio = new Audio(soundMedia.media.original_url)
                                      audio.play()
                                      
                                      // Analytics
                                      fetch('/api/analytics/events', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          type: 'unmute',
                                          itemId: item.id,
                                          sessionId: 'guest-session',
                                        }),
                                      })
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all duration-200 text-white"
                                    title="Воспроизвести звук"
                                  >
                                    🔊
                                  </button>
                                )}
                                
                                {fullMedia && (
                                  <button
                                    onClick={() => setSelectedItem(item)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                                  >
                                    ▶️ Смотреть
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* Full Video Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-all duration-200 hover:bg-black/70"
            >
              ✕
            </button>
            
            {(() => {
              const fullMedia = selectedItem.item_media && selectedItem.item_media.find((im: any) => im.kind === 'full')
              return fullMedia ? (
                <VideoPlayer
                  src={fullMedia.media.hls_url || fullMedia.media.original_url || ''}
                  poster={fullMedia.media.poster_url}
                  autoplay={true}
                  muted={false}
                  loop={false}
                  className="w-full aspect-video"
                  onPlay={() => {
                    fetch('/api/analytics/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'play_full',
                        itemId: selectedItem.id,
                        sessionId: 'guest-session',
                      }),
                    })
                  }}
                  onEnded={() => {
                    fetch('/api/analytics/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'complete',
                        itemId: selectedItem.id,
                        sessionId: 'guest-session',
                      }),
                    })
                  }}
                />
              ) : null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
