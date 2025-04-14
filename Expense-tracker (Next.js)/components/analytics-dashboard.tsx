"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  getCategorySpending,
  getTransactionsByPeriod,
} from "@/lib/actions"
import type { CategorySpending, Transaction } from "@/lib/types"

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [spendingData, transactionsData] = await Promise.all([
          getCategorySpending(period),
          getTransactionsByPeriod(period),
        ])
        setCategorySpending(spendingData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Failed to load analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [period])

  const categoryChartData = categorySpending
    .sort((a, b) => b.amount - a.amount)
    .map((category) => ({
      name: category.category,
      amount: category.amount,
      budget: category.budgetAmount,
    }))

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const incomeVsExpenseData = [
    { name: "Income", value: totalIncome, color: "#10b981" },
    { name: "Expenses", value: totalExpense, color: "#ef4444" },
  ]

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Analytics</CardTitle>
        <CardDescription>
          Visualize your spending patterns and budget performance
        </CardDescription>
        <div className="flex justify-end mt-2">
          <TabsList>
          
            <TabsTrigger
              value="month"
              onClick={() => setPeriod("month")}
              className={period === "month" ? "bg-primary text-primary-foreground" : ""}
            >
              Monthly
            </TabsTrigger>
            
          </TabsList>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading analytics data...</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Income vs Expenses</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeVsExpenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {incomeVsExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `$${typeof value === "number" ? value.toFixed(2) : value}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Spending by Category</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) =>
                        `$${typeof value === "number" ? value.toFixed(2) : value}`
                      }
                    />
                    <Bar dataKey="amount" name="Actual" fill="#8884d8" />
                    <Bar dataKey="budget" name="Budget" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
