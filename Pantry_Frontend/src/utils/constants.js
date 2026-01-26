export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee'
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const PAYMENT_METHODS = {
  WALLET: 'wallet',
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi'
}

export const INVENTORY_STATUS = {
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock',
  EXPIRED: 'expired'
}

export const ITEM_UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'cup', label: 'Cup' },
  { value: 'bowl', label: 'Bowl' }
]
