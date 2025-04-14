import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ExpenseTracker from "@/components/expense-tracker"
import BudgetManagement from "@/components/budget-management"
import AnalyticsDashboard from "@/components/analytics-dashboard"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Tracker</h1>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-6">
          <ExpenseTracker />
        </TabsContent>
        <TabsContent value="budgets" className="mt-6">
          <BudgetManagement />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </main>
  )
}
