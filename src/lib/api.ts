const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Аутентификация
  async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean
      data: {
        user: any
        accessToken: string
      }
      message: string
    }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    })

    if (response.success) {
      this.token = response.data.accessToken
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.data.accessToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
    }

    return response
  }

  logout() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')
    }
  }

  // Локации
  async getLocations() {
    return this.request<{ results: any[] }>('/locations/')
  }

  async createLocation(data: any) {
    return this.request('/locations/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLocation(id: string, data: any) {
    return this.request(`/locations/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLocation(id: string) {
    return this.request(`/locations/${id}/`, {
      method: 'DELETE',
    })
  }

  // Меню
  async getMenus(locationId?: string) {
    const url = locationId ? `/menus/?location=${locationId}` : '/menus/'
    return this.request<{ results: any[] }>(url)
  }

  async createMenu(data: any) {
    return this.request('/menus/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMenu(id: string, data: any) {
    return this.request(`/menus/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMenu(id: string) {
    return this.request(`/menus/${id}/`, {
      method: 'DELETE',
    })
  }

  // Категории
  async getCategories(menuId?: string, locationId?: string) {
    let url = '/categories/'
    const params = new URLSearchParams()
    if (menuId) params.append('menu', menuId)
    if (locationId) params.append('location', locationId)
    if (params.toString()) url += `?${params.toString()}`
    return this.request<{ results: any[] }>(url)
  }

  async createCategory(data: any) {
    return this.request('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: any) {
    return this.request(`/categories/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}/`, {
      method: 'DELETE',
    })
  }

  // Блюда
  async getItems(categoryId?: string, menuId?: string, locationId?: string) {
    let url = '/items/'
    const params = new URLSearchParams()
    if (categoryId) params.append('category', categoryId)
    if (menuId) params.append('menu', menuId)
    if (locationId) params.append('location', locationId)
    if (params.toString()) url += `?${params.toString()}`
    return this.request<{ results: any[] }>(url)
  }

  async createItem(data: any) {
    return this.request('/items/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateItem(id: string, data: any) {
    return this.request(`/items/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteItem(id: string) {
    return this.request(`/items/${id}/`, {
      method: 'DELETE',
    })
  }

  // Пользователи
  async getUsers() {
    return this.request<{ results: any[] }>('/users/')
  }

  async createUser(data: any) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}/`, {
      method: 'DELETE',
    })
  }

  // QR коды
  async getQRCodes() {
    return this.request<{ results: any[] }>('/qr-codes/')
  }

  async createQRCode(data: any) {
    return this.request('/qr-codes/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateQRCode(id: string, data: any) {
    return this.request(`/qr-codes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteQRCode(id: string) {
    return this.request(`/qr-codes/${id}/`, {
      method: 'DELETE',
    })
  }

  // Аналитика
  async getStats(period: string = '7d') {
    return this.request(`/analytics/stats/?period=${period}`)
  }

  async trackEvent(data: any) {
    return this.request('/analytics/track/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
