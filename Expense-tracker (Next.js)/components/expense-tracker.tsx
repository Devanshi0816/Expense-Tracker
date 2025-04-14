"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TransactionForm from "./transaction-form"
import TransactionList from "./transaction-list"
import ExportTransactions from "./export-transactions"
import { getTransactions, deleteTransaction } from "@/lib/actions"
import type { Transaction } from "@/lib/types"

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      try {
        const data = await getTransactions()
        setTransactions(data)
      } catch (error) {
        console.error("Failed to load transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const handleAddTransaction = (newTransaction: Transaction) => {
    setTransactions((prev) => [...prev, newTransaction])
  }

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)))
    setEditingTransaction(null)
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  // Calculate totals and prepare chart data
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const chartData = [
    { name: "Income", value: totalIncome, color: "#10b981" },
    { name: "Expenses", value: totalExpense, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
            <CardDescription>Record your income or expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              editingTransaction={editingTransaction}
            />
          </CardContent>
        </Card>

        <div className="mt-6">
          <ExportTransactions />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View and manage your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading transactions...</div>
            ) : (
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Your financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-green-600 font-medium">Income</p>
                <p className="text-base font-bold text-green-600">${totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-sm text-red-600 font-medium">Expenses</p>
                <p className="text-base font-bold text-red-600">${totalExpense.toFixed(2)}</p>
              </div>
              <div className={`${balance >= 0 ? "bg-blue-50" : "bg-amber-50"} p-3 rounded-lg text-center`}>
                <p className={`text-sm ${balance >= 0 ? "text-blue-600" : "text-amber-600"} font-medium`}>Balance</p>
                <p className={`text-base font-bold ${balance >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                  ${Math.abs(balance).toFixed(2)}
                </p>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[300px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: string | number) => {
                        const num = typeof value === 'number' ? value : parseFloat(value)
                        return `$${num.toFixed(2)}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No transaction data to display</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
