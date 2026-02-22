"use client";

import { useTravelStore } from "@/store/travel";
import { formatCurrency, formatDate } from "@/lib/storage";
import { EXPENSE_CATEGORIES, type Expense } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Users,
  Calendar,
  Receipt,
  Divide,
  Coins
} from "lucide-react";

interface ExpenseDetailProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDetail({ expense, open, onOpenChange }: ExpenseDetailProps) {
  const { currentTrip } = useTravelStore();

  if (!expense || !currentTrip) return null;

  const payer = currentTrip.members.find(m => m.id === expense.payerId);
  const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
  
  // 計算每人應付金額
  const perPersonAmount = expense.splitType === "equal" 
    ? expense.amount / expense.participants.length 
    : null;

  // 基礎貨幣每人應付
  const perPersonBaseAmount = expense.splitType === "equal"
    ? expense.amountInBaseCurrency / expense.participants.length
    : null;

  // 參與者列表（包含計算）
  const participantDetails = expense.participants.map(participantId => {
    const member = currentTrip.members.find(m => m.id === participantId);
    const customAmount = expense.customSplits?.[participantId];
    const baseCustomAmount = customAmount 
      ? customAmount * (expense.amountInBaseCurrency / expense.amount)
      : null;
    
    return {
      member,
      customAmount,
      baseCustomAmount,
      isPayer: participantId === expense.payerId,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
              {category?.icon || "📦"}
            </div>
            <span className="truncate">{expense.description}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4 py-2">
            {/* 金額區塊 */}
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-4 text-white">
              <div className="text-sm text-sky-100 mb-1">總金額</div>
              <div className="text-3xl font-bold">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              {expense.currency !== currentTrip.currency && (
                <div className="text-sm text-sky-200 mt-1">
                  約 {formatCurrency(expense.amountInBaseCurrency, currentTrip.currency)}
                </div>
              )}
            </div>

            {/* 基本資訊 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">日期</div>
                  <div className="text-sm font-medium">{formatDate(expense.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Receipt className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">分類</div>
                  <div className="text-sm font-medium">{category?.label || "其他"}</div>
                </div>
              </div>
            </div>

            {/* 分攤方式 */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <Divide className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-xs text-amber-600">分攤方式</div>
                <div className="text-sm font-medium text-amber-800">
                  {expense.splitType === "equal" ? "平均分攤" : "自定義分配"}
                </div>
              </div>
            </div>

            <Separator />

            {/* 付款人 */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <User className="w-4 h-4" />
                付款人
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <Avatar className="w-10 h-10" style={{ backgroundColor: payer?.color + "30" }}>
                  <AvatarFallback className="font-semibold" style={{ color: payer?.color }}>
                    {payer?.avatar || payer?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{payer?.name || "未知"}</div>
                  <div className="text-sm text-green-600">
                    已付 {formatCurrency(expense.amount, expense.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">實付</div>
                  <div className="font-bold text-green-600">
                    -{formatCurrency(expense.amountInBaseCurrency, currentTrip.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* 參與分攤者 */}
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Users className="w-4 h-4" />
                分攤明細
                <Badge variant="secondary" className="text-xs">
                  {expense.participants.length} 人
                </Badge>
              </div>

              {expense.splitType === "equal" && perPersonAmount && (
                <div className="mb-3 p-2 bg-sky-50 rounded-lg text-center">
                  <div className="text-xs text-sky-600">每人應付</div>
                  <div className="text-lg font-bold text-sky-700">
                    {formatCurrency(perPersonAmount, expense.currency)}
                    {expense.currency !== currentTrip.currency && perPersonBaseAmount && (
                      <span className="text-sm font-normal text-sky-600 ml-1">
                        (約 {formatCurrency(perPersonBaseAmount, currentTrip.currency)})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {participantDetails.map(({ member, customAmount, baseCustomAmount, isPayer }) => {
                  if (!member) return null;

                  const amountOwed = customAmount || perPersonAmount || 0;
                  const baseAmountOwed = baseCustomAmount || perPersonBaseAmount || 0;
                  
                  // 計算淨額：如果是付款人，淨額 = 應付 - 已付
                  const netAmount = isPayer 
                    ? baseAmountOwed - expense.amountInBaseCurrency 
                    : baseAmountOwed;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isPayer 
                          ? "bg-green-50 border-green-200" 
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <Avatar className="w-8 h-8" style={{ backgroundColor: member.color + "30" }}>
                        <AvatarFallback className="text-sm" style={{ color: member.color }}>
                          {member.avatar || member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{member.name}</span>
                          {isPayer && (
                            <Badge variant="outline" className="text-xs bg-green-100 border-green-200 text-green-700">
                              付款人
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          應付 {formatCurrency(amountOwed, expense.currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        {isPayer ? (
                          <>
                            <div className="text-xs text-gray-500">結算後</div>
                            <div className={`font-bold ${netAmount < 0 ? "text-green-600" : "text-red-500"}`}>
                              {netAmount < 0 ? "+" : ""}
                              {formatCurrency(Math.abs(netAmount), currentTrip.currency)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-gray-500">需付</div>
                            <div className="font-bold text-red-500">
                              {formatCurrency(baseAmountOwed, currentTrip.currency)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 匯率資訊 */}
            {expense.currency !== currentTrip.currency && (
              <>
                <Separator />
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <Coins className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">匯率參考：</span>
                    <span className="font-medium">
                      1 {expense.currency} ≈ {(expense.amountInBaseCurrency / expense.amount).toFixed(4)} {currentTrip.currency}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* 計算說明 */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-xs text-blue-600 font-medium mb-2">💡 計算說明</div>
              <div className="text-xs text-blue-800 space-y-1">
                {expense.splitType === "equal" ? (
                  <>
                    <p>• 總金額 {formatCurrency(expense.amount, expense.currency)} ÷ {expense.participants.length} 人 = 每人 {formatCurrency(perPersonAmount!, expense.currency)}</p>
                    <p>• 付款人 {payer?.name} 已墊付全額，結算後可收回 {formatCurrency(expense.amountInBaseCurrency - (perPersonBaseAmount || 0), currentTrip.currency)}</p>
                  </>
                ) : (
                  <p>• 使用自定義金額分配，各人按設定金額支付</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
