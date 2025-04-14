"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BudgetForm from "./budget-form"
import BudgetList from "./budget-list"
import { getBudgets, deleteBudget, getCategorySpending } from "@/lib/actions"
import type { Budget, CategorySpending } from "@/lib/types"

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("view")
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")

  useEffect(() => {
    async function loadData() {
      try {
        const [budgetsData, spendingData] = await Promise.all([getBudgets(), getCategorySpending(period)])
        setBudgets(budgetsData)
        setCategorySpending(spendingData)
      } catch (error) {
        console.error("Failed to load budget data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [period])

  const handleAddBudget = (newBudget: Budget) => {
    setBudgets((prev) => [...prev, newBudget])
    setActiveTab("view")
  }

  const handleUpdateBudget = (updatedBudget: Budget) => {
    if (editingBudget && editingBudget.id === updatedBudget.id) {
      setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)))
      setEditingBudget(null)
      setActiveTab("view")
    }
  }

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    } catch (error) {
      console.error("Failed to delete budget:", error)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setActiveTab("add")
  }

  const existingCategories = budgets.map((b) => b.category)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Management</CardTitle>
        <CardDescription>Set and track your spending limits by category</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View Budgets</TabsTrigger>
            <TabsTrigger value="add">{editingBudget ? "Edit Budget" : "Add Budget"}</TabsTrigger>
          </TabsList>
          <TabsContent value="view" className="space-y-4">
            <div className="flex justify-end space-x-2 my-4">
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

            {isLoading ? (
              <div className="text-center py-4">Loading budgets...</div>
            ) : (
              <BudgetList
                budgets={budgets}
                categorySpending={categorySpending}
                onDelete={handleDeleteBudget}
                onEdit={handleEditBudget}
              />
            )}
          </TabsContent>
          <TabsContent value="add">
            <BudgetForm
              onAddBudget={handleAddBudget}
              onUpdateBudget={handleUpdateBudget}
              editingBudget={editingBudget}
              existingCategories={existingCategories}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
