"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createBudget, updateBudget } from "@/lib/actions"
import type { Budget } from "@/lib/types"

const formSchema = z.object({
  category: z.string().min(1, { message: "Please select a category." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  period: z.enum(["weekly", "monthly", "yearly"], {
    required_error: "Please select a budget period.",
  }),
  startDate: z.date({ required_error: "Please select a start date." }),
  endDate: z.union([z.date(), z.null()]).optional(),
})

const expenseCategories = [
  "Food",
  "Housing",
  "Transportation",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Education",
  "Shopping",
  "Travel",
  "Other Expenses",
]

interface BudgetFormProps {
  onAddBudget: (budget: Budget) => void
  onUpdateBudget: (budget: Budget) => void
  editingBudget: Budget | null
  existingCategories: string[]
}

export default function BudgetForm({
  onAddBudget,
  onUpdateBudget,
  editingBudget,
  existingCategories,
}: BudgetFormProps) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editingBudget
      ? {
          category: editingBudget.category,
          amount: editingBudget.amount,
          period: editingBudget.period,
          startDate: new Date(editingBudget.startDate),
          endDate: editingBudget.endDate ? new Date(editingBudget.endDate) : null,
        }
      : {
          category: "",
          amount: undefined,
          period: "monthly",
          startDate: new Date(),
          endDate: null,
        },
  })

  const availableCategories = expenseCategories.filter(
    (category) =>
      !existingCategories.includes(category) ||
      (editingBudget && editingBudget.category === category),
  )

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null)

      const safeValues = {
        ...values,
        endDate: values.endDate ?? null,
      }

      if (editingBudget) {
        const updatedBudget = await updateBudget({
          id: editingBudget.id,
          ...safeValues,
          createdAt: editingBudget.createdAt,
          updatedAt: new Date(),
        })
      
        const finalBudget: Budget = {
          ...editingBudget,
          ...safeValues,
          updatedAt: new Date(),
        }
      
        onUpdateBudget(finalBudget)
    
      
      } else {
        const newBudget = await createBudget(safeValues)
        onAddBudget(newBudget)
        form.reset({
          category: "",
          amount: undefined,
          period: "monthly",
          startDate: new Date(),
          endDate: null,
        })
      }
    } catch (error: any) {
      console.error("Error saving budget:", error)
      setError(error.message || "Failed to save budget")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">{error}</div>
        )}

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Period</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                        {field.value ? format(field.value, "PPP") : <span>No end date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < form.getValues("startDate")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {editingBudget && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit">{editingBudget ? "Update" : "Add"} Budget</Button>
        </div>
      </form>
    </Form>
  )
}
