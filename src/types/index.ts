export interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'deleted'
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: string
  tenantId: string
  name: string
  timezone: string
  currency: string
  locale: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  tenantId: string
  email: string
  role: 'superadmin' | 'owner' | 'editor' | 'waiter'
  status: 'active' | 'inactive' | 'suspended'
  mfaEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Menu {
  id: string
  tenantId: string
  locationId: string
  name: string
  active: boolean
  scheduleJson?: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  tenantId: string
  menuId: string
  name: string
  sort: number
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: string
  tenantId: string
  categoryId: string
  sku?: string
  name: string
  description?: string
  tags: string[]
  allergens: string[]
  nutritionValuesJson?: string
  weightG?: number
  kcal?: number
  sort: number
  visibilityRuleJson?: string
  createdAt: Date
  updatedAt: Date
}

export interface Price {
  id: string
  itemId: string
  currency: string
  amountMinor: number
  startAt?: Date
  endAt?: Date
  createdAt: Date
}

export interface MediaAsset {
  id: string
  tenantId: string
  type: 'video' | 'audio' | 'image'
  status: 'uploaded' | 'processing' | 'ready' | 'failed'
  originalUrl?: string
  hlsUrl?: string
  posterUrl?: string
  waveformUrl?: string
  durationMs?: number
  width?: number
  height?: number
  lufs?: number
  createdAt: Date
  updatedAt: Date
}

export interface ItemMedia {
  id: string
  itemId: string
  mediaId: string
  kind: 'preview' | 'full' | 'sound'
  sort: number
  createdAt: Date
}

export interface Theme {
  id: string
  tenantId: string
  paletteJson: string
  fonts?: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsEvent {
  id: string
  tenantId: string
  type: 'view_category' | 'open_item' | 'play_preview' | 'unmute' | 'play_full' | 'complete' | 'qr_scan'
  sessionId: string
  payloadJson: string
  timestamp: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  tenantName: string
  tenantSlug: string
  email: string
  password: string
  confirmPassword: string
}

export interface CreateItemForm {
  name: string
  description?: string
  categoryId: string
  sku?: string
  tags: string[]
  allergens: string[]
  weightG?: number
  kcal?: number
  price: number
  currency: string
}

// Player types
export interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export interface MediaUploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}
