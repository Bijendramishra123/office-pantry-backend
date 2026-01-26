// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date
export const formatDate = (date, format = 'dd-MM-yyyy') => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  switch (format) {
    case 'dd-MM-yyyy':
      return `${day}-${month}-${year}`
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`
    case 'full':
      return `${day}-${month}-${year} ${hours}:${minutes}`
    default:
      return d.toLocaleDateString()
  }
}

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Generate initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Calculate percentage
export const calculatePercentage = (part, whole) => {
  if (whole === 0) return 0
  return ((part / whole) * 100).toFixed(2)
}

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Calculate order totals
export const calculateOrderTotals = (items, taxRate = 0.05) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    taxRate: taxRate * 100
  }
}
