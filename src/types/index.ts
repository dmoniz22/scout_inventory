export interface Category {
  id: string
  name: string
  description?: string
  color: string
  itemCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: string
  name: string
  description?: string
  serialNumber?: string
  category: Category
  categoryId: string
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  qrCode: string
  imageUrl?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Member {
  id: string
  email?: string
  name: string
  phone?: string
  role: 'ADMIN' | 'LEADER' | 'MEMBER'
  isActive: boolean
  checkoutCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Checkout {
  id: string
  item: Item
  itemId: string
  member: Member
  memberId: string
  checkedOutAt: Date
  expectedReturn: Date
  checkedInAt?: Date
  checkoutNotes?: string
  checkinNotes?: string
  conditionOut: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  conditionIn?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  checkedOutBy: string
  checkedInBy?: string
  emailSent: boolean
  isOverdue?: boolean
}

export interface DashboardStats {
  totalItems: number
  availableItems: number
  checkedOutItems: number
  overdueItems: number
  totalMembers: number
  recentCheckouts: Checkout[]
}
