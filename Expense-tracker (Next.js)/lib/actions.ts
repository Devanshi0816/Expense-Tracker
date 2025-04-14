"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "./prisma"
import type { Transaction, Budget } from "./types"
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns"

// ========== TRANSACTION ACTIONS ==========

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const transactions = await prisma.transaction.findMany({ orderBy: { date: "desc" } })
    return transactions.map(t => ({
      ...t,
      type: t.type as "income" | "expense",
      frequency: t.frequency as "daily" | "weekly" | "monthly" | "yearly" | null
    }))
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch transactions")
  }
}

export async function getTransactionsByDate(date: Date): Promise<Transaction[]> {
  try {
    const start = startOfDay(date)
    const end = endOfDay(date)
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    })
    return transactions.map(t => ({
      ...t,
      type: t.type as "income" | "expense",
      frequency: t.frequency as "daily" | "weekly" | "monthly" | "yearly" | null
    }))
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch transactions by date")
  }
}

export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
    })
    return transactions.map(t => ({
      ...t,
      type: t.type as "income" | "expense",
      frequency: t.frequency as "daily" | "weekly" | "monthly" | "yearly" | null
    }))
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch transactions by date range")
  }
}

export async function getTransactionsByPeriod(period: "week" | "month" | "year"): Promise<Transaction[]> {
  try {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case "week":
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case "month":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "year":
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    return getTransactionsByDateRange(startDate, endDate)
  } catch (error) {
    console.error("Database error:", error)
    throw new Error(`Failed to fetch transactions for ${period}`)
  }
}

export async function createTransaction(data: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        type: data.type as "income" | "expense",
        frequency: data.frequency as "daily" | "weekly" | "monthly" | "yearly" | null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    })

    revalidatePath("/")
    return {
      ...transaction,
      type: transaction.type as "income" | "expense",
      frequency: transaction.frequency as Transaction["frequency"]
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create transaction")
  }
}

export async function updateTransaction(data: Partial<Omit<Transaction, "id" | "createdAt">> & { id: string }): Promise<Transaction> {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: data.id },
      data: {
        ...data,
        type: data.type as "income" | "expense",
        frequency: data.frequency as Transaction["frequency"]
      },
    })

    revalidatePath("/")
    return {
      ...transaction,
      type: transaction.type as "income" | "expense",
      frequency: transaction.frequency as Transaction["frequency"]
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update transaction")
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await prisma.transaction.delete({ where: { id } })
    revalidatePath("/")
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete transaction")
  }
}

// ========== BUDGET ACTIONS ==========

export async function getBudgets(): Promise<Budget[]> {
  try {
    const budgets = await prisma.budget.findMany({
      orderBy: { category: "asc" },
    })
    return budgets.map(b => ({
      ...b,
      period: b.period as Budget["period"]
    }))
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch budgets")
  }
}

export async function getBudgetByCategory(category: string): Promise<Budget | null> {
  try {
    const budget = await prisma.budget.findFirst({ where: { category } })
    return budget
      ? { ...budget, period: budget.period as Budget["period"] }
      : null
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch budget")
  }
}

export async function createBudget(data: Omit<Budget, "id" | "createdAt" | "updatedAt">): Promise<Budget> {
  try {
    const existing = await prisma.budget.findFirst({ where: { category: data.category } })
    if (existing) {
      throw new Error(`Budget for category ${data.category} already exists`)
    }

    const budget = await prisma.budget.create({
      data: {
        ...data,
        period: data.period as Budget["period"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    revalidatePath("/")
    return {
      ...budget,
      period: budget.period as Budget["period"]
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create budget")
  }
}

export async function updateBudget(data: Budget): Promise<Budget> {
  try {
    const budget = await prisma.budget.update({
      where: { id: data.id },
      data: {
        ...data,
        period: data.period as Budget["period"]
      },
    })

    revalidatePath("/")
    return {
      ...budget,
      period: budget.period as Budget["period"]
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update budget")
  }
}

export async function deleteBudget(id: string): Promise<void> {
  try {
    await prisma.budget.delete({ where: { id } })
    revalidatePath("/")
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete budget")
  }
}

// ========== ANALYTICS ACTION ==========

export async function getCategorySpending(period: "week" | "month" | "year" = "month"): Promise<{
  category: string
  amount: number
  budgetAmount: number
  percentage: number
}[]> {
  try {
    const transactions = await getTransactionsByPeriod(period)
    const budgets = await getBudgets()

    const expenses = transactions.filter(t => t.type === "expense")

    const categoryMap = new Map<string, number>()

    for (const expense of expenses) {
      const currentAmount = categoryMap.get(expense.category) || 0
      categoryMap.set(expense.category, currentAmount + expense.amount)
    }

    const result = Array.from(categoryMap.entries()).map(([category, amount]) => {
      const budget = budgets.find(b => b.category === category)
      return {
        category,
        amount,
        budgetAmount: budget?.amount || 0,
        percentage: budget?.amount ? (amount / budget.amount) * 100 : 0,
      }
    })

    return result
  } catch (error) {
    console.error("Analytics error:", error)
    throw new Error("Failed to get category spending")
  }
}
