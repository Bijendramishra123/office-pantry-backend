// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date
const formatDate = (date, format = 'dd-MM-yyyy') => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  switch (format) {
    case 'dd-MM-yyyy':
      return `${day}-${month}-${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'full':
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    default:
      return d.toISOString();
  }
};

// Calculate age from date
const calculateAge = (date) => {
  const birthDate = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Truncate text
const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate order number
const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'ORD';
  const timestamp = date.getFullYear().toString().substr(-2) + 
                    (date.getMonth() + 1).toString().padStart(2, '0') + 
                    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
};

// Calculate total with tax
const calculateTotalWithTax = (subtotal, taxRate = 0.05) => {
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  return {
    subtotal,
    tax,
    total,
    taxRate: taxRate * 100
  };
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Sleep function
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Group array by key
const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    const groupKey = currentValue[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentValue);
    return result;
  }, {});
};

// Calculate percentage
const calculatePercentage = (part, whole) => {
  if (whole === 0) return 0;
  return ((part / whole) * 100).toFixed(2);
};

module.exports = {
  formatCurrency,
  generateRandomString,
  formatDate,
  calculateAge,
  isValidEmail,
  isValidPhone,
  truncateText,
  generateOrderNumber,
  calculateTotalWithTax,
  debounce,
  deepClone,
  sleep,
  groupBy,
  calculatePercentage
};
