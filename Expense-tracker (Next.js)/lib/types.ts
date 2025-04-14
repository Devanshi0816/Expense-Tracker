export type Transaction = {
  id: string
  title: string
  amount: number
  type: "income" | "expense"
  category: string
  date: Date | string
  description: string | null
  isRecurring: boolean
  frequency: "daily" | "weekly" | "monthly" | "yearly" | null
  createdAt: Date
  updatedAt: Date
}

export type Budget = {
  id: string
  category: string
  amount: number
  period: "weekly" | "monthly" | "yearly"
  startDate: Date | string
  endDate: Date | string | null
  createdAt: Date
  updatedAt: Date
}

export interface CategorySpending {
  category: string
  amount: number
  budgetAmount?: number
  percentage?: number
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "food":
      return "🍔"
    case "transportation":
      return "🚗"
    case "entertainment":
      return "🎬"
    case "utilities":
      return "💡"
    case "housing":
      return "🏠"
    case "healthcare":
      return "🏥"
    case "shopping":
      return "🛍️"
    case "income":
      return "💰"
    default:
      return "📝"
  }
}
