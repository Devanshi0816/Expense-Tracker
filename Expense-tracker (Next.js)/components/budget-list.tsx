"use client"

import { Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Budget, CategorySpending } from "@/lib/types"

interface BudgetListProps {
  budgets: Budget[]
  categorySpending: CategorySpending[]
  onDelete: (id: string) => void
  onEdit: (budget: Budget) => void
}

export default function BudgetList({ budgets, categorySpending, onDelete, onEdit }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No budgets found. Add your first budget to start tracking your spending!
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => {
            const spending = categorySpending.find((cs) => cs.category === budget.category)
            const spentAmount = spending?.amount || 0
            const percentage = spending?.percentage || 0
            const isOverBudget = spentAmount > budget.amount

            return (
              <TableRow key={budget.id}>
                <TableCell className="font-medium">{budget.category}</TableCell>
                <TableCell>${budget.amount.toFixed(2)}</TableCell>
                <TableCell className="capitalize">{budget.period}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>${spentAmount.toFixed(2)} spent</span>
                      <span className={isOverBudget ? "text-red-500 font-medium" : ""}>
                        {isOverBudget ? "Over budget" : `${Math.round(percentage)}%`}
                      </span>
                    </div>
                    <Progress
                    value={Math.min(percentage, 100)}
                    className={isOverBudget ? "bg-red-100 [&>div]:bg-red-500" : ""}
                    />

                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(budget)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this budget.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(budget.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
