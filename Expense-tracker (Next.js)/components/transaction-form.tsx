"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { createTransaction, updateTransaction } from "@/lib/actions"
import type { Transaction } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  type: z.enum(["income", "expense"], {
    required_error: "Please select a transaction type.",
  }),
  category: z.string().min(1, { message: "Please select a category." }),
  date: z.date({ required_error: "Please select a date." }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
})

const incomeCategories = ["Salary", "Freelance", "Investments", "Gifts", "Other Income"]

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

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void
  onUpdateTransaction: (transaction: Transaction) => void
  editingTransaction: Transaction | null
}

export default function TransactionForm({
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
}: TransactionFormProps) {
  const [categories, setCategories] = useState<string[]>(expenseCategories)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: undefined,
      type: "expense",
      category: "",
      date: new Date(),
      description: "",
      isRecurring: false,
      frequency: null,
    },
  })

  // Update form when editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      form.reset({
        title: editingTransaction.title,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        date: new Date(editingTransaction.date),
        description: editingTransaction.description || "",
        isRecurring: editingTransaction.isRecurring || false,
        frequency: editingTransaction.frequency || null,
      })

      // Update categories based on transaction type
      if (editingTransaction.type === "income") {
        setCategories(incomeCategories)
      } else {
        setCategories(expenseCategories)
      }
    }
  }, [editingTransaction, form])

  // Handle transaction type change to update categories
  const handleTypeChange = (value: string) => {
    form.setValue("type", value as "income" | "expense")
    form.setValue("category", "") // Reset category when type changes

    if (value === "income") {
      setCategories(incomeCategories)
    } else {
      setCategories(expenseCategories)
    }
  }

  // Watch isRecurring to conditionally show frequency field
  const isRecurring = form.watch("isRecurring")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const updatedTransaction = await updateTransaction({
          id: editingTransaction.id,
          ...values,
        })
        onUpdateTransaction(updatedTransaction)
      } else {
        // Create new transaction
        const newTransaction = await createTransaction(values)
        onAddTransaction(newTransaction)
        form.reset({
          title: "",
          amount: undefined,
          type: form.getValues("type"), // Keep the current type
          category: "",
          date: new Date(),
          description: "",
          isRecurring: false,
          frequency: null,
        })
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Transaction title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={handleTypeChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
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
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Transaction</FormLabel>
                  <p className="text-sm text-muted-foreground">This transaction repeats on a regular basis</p>
                </div>
              </FormItem>
            )}
          />

          {isRecurring && (
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add more details about this transaction" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {editingTransaction && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                onUpdateTransaction(editingTransaction) // This will clear the editing state
              }}
            >
              Cancel
            </Button>
          )}
          <Button type="submit">{editingTransaction ? "Update" : "Add"} Transaction</Button>
        </div>
      </form>
    </Form>
  )
}
