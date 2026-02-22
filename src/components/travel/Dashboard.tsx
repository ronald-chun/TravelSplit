"use client";

import { useState } from "react";
import { useTravelStore } from "@/store/travel";
import { formatCurrency } from "@/lib/storage";
import { EXPENSE_CATEGORIES, type Expense } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { calculateExpensesByCategory } from "@/lib/settlement";
import { ExpenseDetail } from "./ExpenseDetail";

export function Dashboard() {
  const { currentTrip, totalExpenses, balances } = useTravelStore();
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  if (!currentTrip) return null;

  const expensesByCategory = calculateExpensesByCategory(currentTrip.expenses);
  const memberCount = currentTrip.members.length;
  const expenseCount = currentTrip.expenses.length;

  // 找出最大支出分類
  const maxCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="space-y-6">
      {/* 總覽卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-sky-500 to-sky-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sky-100 text-sm">總支出</span>
              <Receipt className="w-4 h-4 text-sky-200" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses, currentTrip.currency)}
            </div>
            <div className="text-sky-200 text-xs mt-1">
              {expenseCount} 筆費用
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">參與人數</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {memberCount}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {memberCount > 0 ? `${(totalExpenses / memberCount).toFixed(0)} ${currentTrip.currency}/人` : "尚未有成員"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 成員收支概覽 */}
      {balances.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              成員收支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balances.map((balance) => {
                const member = currentTrip.members.find(m => m.id === balance.memberId);
                const isPositive = balance.balance >= 0;

                return (
                  <div key={balance.memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8" style={{ backgroundColor: member?.color + "20" }}>
                        <AvatarFallback style={{ color: member?.color }}>
                          {member?.avatar || member?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{balance.memberName}</div>
                        <div className="text-xs text-gray-500">
                          已付 {formatCurrency(balance.totalPaid, currentTrip.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {formatCurrency(Math.abs(balance.balance), currentTrip.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isPositive ? "應收" : "應付"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分類支出 */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              支出分類
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXPENSE_CATEGORIES.map((category) => {
              const amount = expensesByCategory[category.value];
              if (!amount) return null;
              
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              const isMaxCategory = maxCategory && maxCategory[0] === category.value;
              
              return (
                <div key={category.value}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {category.label}
                      </span>
                      {isMaxCategory && (
                        <Badge variant="secondary" className="text-xs">
                          最多
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(amount, currentTrip.currency)}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 最近費用 */}
      {currentTrip.expenses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              最近費用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentTrip.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((expense) => {
                  const payer = currentTrip.members.find(m => m.id === expense.payerId);
                  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
                  
                  return (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => setViewingExpense(expense)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category?.icon || "📦"}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {expense.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payer?.name} · {new Date(expense.date).toLocaleDateString("zh-TW")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(expense.amountInBaseCurrency, currentTrip.currency)}
                        </div>
                        {expense.currency !== currentTrip.currency && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(expense.amount, expense.currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空狀態 */}
      {currentTrip.expenses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">尚未有費用記錄</h3>
            <p className="text-sm text-gray-500 mb-4">
              前往「費用」頁面添加第一筆費用
            </p>
          </CardContent>
        </Card>
      )}

      {/* 費用詳情 */}
      <ExpenseDetail
        expense={viewingExpense}
        open={!!viewingExpense}
        onOpenChange={(open) => !open && setViewingExpense(null)}
      />
    </div>
  );
}
