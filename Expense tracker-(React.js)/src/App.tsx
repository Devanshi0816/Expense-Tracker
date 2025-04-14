import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, PencilLine, Wallet, TrendingUp, TrendingDown, Search, Calendar, Filter, Download } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  currency: string;
}

const categories = {
  expense: ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare', 'Other'],
  income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other']
};

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
  { code: 'CNY', symbol: '¥' },
];

// Exchange rates relative to USD (as of a specific date)
const exchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.45,
  INR: 82.83,
  CNY: 7.19
};

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Other');
  const [currency, setCurrency] = useState('USD');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(transactionData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'transactions', editingId), {
          description,
          amount: Number(amount),
          type,
          category,
          currency
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'transactions'), {
          description,
          amount: Number(amount),
          type,
          category,
          currency,
          date: new Date().toISOString(),
        });
      }

      setDescription('');
      setAmount('');
      setType('expense');
      setCategory('Other');
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  }; 

  

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setCategory(transaction.category);
    setCurrency(transaction.currency || 'USD');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    const amountInUSD = amount / exchangeRates[fromCurrency as keyof typeof exchangeRates];
    return amountInUSD * exchangeRates[toCurrency as keyof typeof exchangeRates];
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Expense Tracker Report', 20, 20);
    
    // Add summary
    doc.setFontSize(12);
    doc.text(`Total Balance: ${getCurrencySymbol(displayCurrency)}${balance.toFixed(2)}`, 20, 30);
    doc.text(`Total Income: ${getCurrencySymbol(displayCurrency)}${income.toFixed(2)}`, 20, 37);
    doc.text(`Total Expenses: ${getCurrencySymbol(displayCurrency)}${expenses.toFixed(2)}`, 20, 44);
    
    // Add transactions table
    const tableData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      `${getCurrencySymbol(t.currency)}${t.amount.toFixed(2)} (${getCurrencySymbol(displayCurrency)}${convertAmount(t.amount, t.currency, displayCurrency).toFixed(2)})`,
    ]);

    (doc as any).autoTable({
      startY: 55,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Save the PDF
    doc.save('expense-tracker-report.pdf');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    let matchesDate = true;
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    
    switch(dateFilter) {
      case 'today':
        matchesDate = transactionDate.toDateString() === today.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(today.setDate(today.getDate() - 7));
        matchesDate = transactionDate >= weekAgo;
        break;
      case 'month':
        matchesDate = transactionDate.getMonth() === today.getMonth() &&
                     transactionDate.getFullYear() === today.getFullYear();
        break;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || '$';
  };

  const calculateTotalInCurrency = (transactions: Transaction[], type: 'income' | 'expense' | 'all') => {
    return transactions
      .filter(t => type === 'all' ? true : t.type === type)
      .reduce((acc, curr) => {
        const convertedAmount = convertAmount(curr.amount, curr.currency, displayCurrency);
        return type === 'expense' ? acc - convertedAmount : acc + convertedAmount;
      }, 0);
  };

  const balance = calculateTotalInCurrency(transactions, 'all');
  const income = calculateTotalInCurrency(transactions, 'income');
  const expenses = Math.abs(calculateTotalInCurrency(transactions, 'expense'));

  const categoryTotals = transactions.reduce((acc, curr) => {
    const key = `${curr.type}-${curr.category}`;
    const convertedAmount = convertAmount(curr.amount, curr.currency, displayCurrency);
    acc[key] = (acc[key] || 0) + convertedAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Expense Tracker</h1>
            <p className="text-gray-600">Keep track of your income and expenses</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>
                   {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Download size={20} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {getCurrencySymbol(displayCurrency)}{balance.toFixed(2)}
                </p>
              </div>
              <Wallet className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {getCurrencySymbol(displayCurrency)}{income.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {getCurrencySymbol(displayCurrency)}{expenses.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        {/* Category Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Expenses by Category</h3>
              <div className="space-y-2">
                {categories.expense.map(cat => {
                  const amount = categoryTotals[`expense-${cat}`] || 0;
                  const percentage = expenses ? ((amount / expenses) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-gray-600">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
                          {getCurrencySymbol(displayCurrency)}{amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Income by Category</h3>
              <div className="space-y-2">
                {categories.income.map(cat => {
                  const amount = categoryTotals[`income-${cat}`] || 0;
                  const percentage = income ? ((amount / income) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-gray-600">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">
                          {getCurrencySymbol(displayCurrency)}{amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                     {getCurrencySymbol(displayCurrency)}
                    </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="income"
                    checked={type === 'income'}
                    onChange={(e) => {
                      setType(e.target.value as 'income' | 'expense');
                      setCategory('Other');
                    }}
                    className="mr-2"
                  />
                  Income
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="expense"
                    checked={type === 'expense'}
                    onChange={(e) => {
                      setType(e.target.value as 'income' | 'expense');
                      setCategory('Other');
                    }}
                    className="mr-2"
                  />
                  Expense
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories[type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <PlusCircle size={20} />
            {editingId ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Transaction History
            </h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {[...categories.income, ...categories.expense]
                    .filter((cat, index, self) => self.indexOf(cat) === index)
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>
          
          <div className="divide-y">
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500 p-6 text-center">No transactions found</p>
            ) : (
              filteredTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="p-6 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{transaction.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {getCurrencySymbol(transaction.currency)}
                      {transaction.amount.toFixed(2)}
                      <span className="text-sm text-gray-500 ml-1">
                        ({getCurrencySymbol(displayCurrency)}
                        {convertAmount(transaction.amount, transaction.currency, displayCurrency).toFixed(2)})
                      </span>
                    </span>
                    
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <PencilLine size={20} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;