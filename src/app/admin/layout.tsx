'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { 
  Menu, 
  Plus, 
  Settings, 
  BarChart3, 
  LogOut,
  Home,
  Utensils,
  Users,
  MapPin,
  QrCode,
  FolderOpen
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    
    console.log('Admin layout check:', { userData: !!userData, token: !!token })
    
    if (!userData || !token) {
      console.log('No user data or token, redirecting to login')
      router.push('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log('User parsed successfully:', parsedUser)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/login')
      return
    }
    
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navigation = [
    { name: 'Обзор', href: '/admin', icon: Home },
    { name: 'Локации', href: '/admin/locations', icon: MapPin },
    { name: 'Меню', href: '/admin/menu', icon: Menu },
    { name: 'Категории', href: '/admin/categories', icon: FolderOpen },
    { name: 'Блюда', href: '/admin/items', icon: Utensils },
    { name: 'QR коды', href: '/admin/qr', icon: QrCode },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Пользователи', href: '/admin/users', icon: Users },
    { name: 'Настройки', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              {user.tenant?.name || 'Video Menu'}
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
