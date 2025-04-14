"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTransactionsByDate } from "@/lib/actions"

export default function ExportTransactions() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    if (!date) return

    try {
      setIsLoading(true)
      const transactions = await getTransactionsByDate(date)

      if (transactions.length === 0) {
        alert("No transactions found for the selected date.")
        setIsLoading(false)
        return
      }

      // Convert transactions to CSV
      const headers = ["Title", "Amount", "Type", "Category", "Date", "Description"]
      const csvContent = [
        headers.join(","),
        ...transactions.map((t) =>
          [
            `"${t.title}"`,
            t.amount,
            t.type,
            `"${t.category}"`,
            format(new Date(t.date), "yyyy-MM-dd"),
            `"${t.description || ""}"`,
          ].join(","),
        ),
      ].join("\n")

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `transactions-${format(date, "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting transactions:", error)
      alert("Failed to export transactions. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Transactions</CardTitle>
        <CardDescription>Download transactions for a specific date</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={handleExport} disabled={!date || isLoading} className="w-full sm:w-auto">
          {isLoading ? "Exporting..." : "Export"}
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
