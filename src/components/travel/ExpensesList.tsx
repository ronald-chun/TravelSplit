"use client";

import { useState } from "react";
import { useTravelStore } from "@/store/travel";
import { formatCurrency, formatDate } from "@/lib/storage";
import { EXPENSE_CATEGORIES, COMMON_CURRENCIES, type Expense, type ExpenseCategory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Filter, Eye } from "lucide-react";
import { ExpenseDetail } from "./ExpenseDetail";
import { toast } from "sonner";

const TODAY = new Date().toISOString().split("T")[0];

interface ExpensesListProps {
  externalShowAdd?: boolean;
  onExternalShowAddChange?: (show: boolean) => void;
}

export function ExpensesList({ externalShowAdd, onExternalShowAddChange }: ExpensesListProps) {
  const { currentTrip, addExpense, updateExpense, deleteExpense } = useTravelStore();
  const [internalShowAddModal, setInternalShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">("all");

  // 使用外部狀態優先，否則使用內部狀態
  const showAddModal = externalShowAdd !== undefined ? externalShowAdd : internalShowAddModal;

  const handleShowAddModalChange = (show: boolean) => {
    if (onExternalShowAddChange) {
      onExternalShowAddChange(show);
    } else {
      setInternalShowAddModal(show);
    }
  };

  if (!currentTrip) return null;

  const filteredExpenses = currentTrip.expenses
    .filter(e => filterCategory === "all" || e.category === filterCategory)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* 操作欄 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ExpenseCategory | "all")}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分類</SelectItem>
              {EXPENSE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleShowAddModalChange(true)} className="bg-sky-500 hover:bg-sky-600">
          <Plus className="w-4 h-4 mr-1" />
          添加費用
        </Button>
      </div>

      {/* 費用列表 */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {filterCategory === "all" ? "尚未有費用記錄" : "此分類無費用"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              點擊上方按鈕添加費用
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const payer = currentTrip.members.find(m => m.id === expense.payerId);
            const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
            const participantNames = expense.participants
              .map(id => currentTrip.members.find(m => m.id === id)?.name)
              .filter(Boolean)
              .join("、");

            return (
              <Card key={expense.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewingExpense(expense)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        {category?.icon || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {expense.description}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {payer?.name} 付款 · {formatDate(expense.date)}
                        </div>
                        {expense.participants.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            分攤: {participantNames}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(expense.amountInBaseCurrency, currentTrip.currency)}
                        </div>
                        {expense.currency !== currentTrip.currency && (
                          <div className="text-xs text-gray-500">
                            原價: {formatCurrency(expense.amount, expense.currency)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingExpense(expense)}
                          title="查看詳情"
                        >
                          <Eye className="w-4 h-4 text-sky-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingExpense(expense)}
                          title="編輯"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteExpenseId(expense.id)}
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加費用 Modal */}
      <ExpenseModal
        open={showAddModal}
        onOpenChange={handleShowAddModalChange}
        trip={currentTrip}
        onSave={async (data) => {
          try {
            await addExpense(currentTrip.id, data);
            handleShowAddModalChange(false);
            toast.success("費用已添加");
          } catch (error) {
            toast.error("添加失敗");
          }
        }}
      />

      {/* 編輯費用 Modal */}
      {editingExpense && (
        <ExpenseModal
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          trip={currentTrip}
          expense={editingExpense}
          onSave={async (data) => {
            try {
              await updateExpense(currentTrip.id, editingExpense.id, data);
              setEditingExpense(null);
              toast.success("費用已更新");
            } catch (error) {
              toast.error("更新失敗");
            }
          }}
        />
      )}

      {/* 刪除確認 */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除這筆費用嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (deleteExpenseId) {
                  try {
                    await deleteExpense(currentTrip.id, deleteExpenseId);
                    setDeleteExpenseId(null);
                    toast.success("費用已刪除");
                  } catch (error) {
                    toast.error("刪除失敗");
                  }
                }
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 費用詳情 */}
      <ExpenseDetail
        expense={viewingExpense}
        open={!!viewingExpense}
        onOpenChange={(open) => !open && setViewingExpense(null)}
      />
    </div>
  );
}

// 費用表單 Modal
interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: typeof useTravelStore.getState extends () => infer R ? R extends { currentTrip: infer T } ? T : never : never;
  expense?: Expense;
  onSave: (data: Omit<Expense, "id" | "tripId" | "createdAt" | "updatedAt" | "amountInBaseCurrency">) => void;
}

function ExpenseModal({ open, onOpenChange, trip, expense, onSave }: ExpenseModalProps) {
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount.toString() || "");
  const [currency, setCurrency] = useState(expense?.currency || trip?.currency || "HKD");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || "food");
  const [payerId, setPayerId] = useState(expense?.payerId || "");
  const [date, setDate] = useState(expense?.date.split("T")[0] || TODAY);
  const [participants, setParticipants] = useState<string[]>(expense?.participants || []);
  const [splitType, setSplitType] = useState<"equal" | "custom">(expense?.splitType || "equal");
  const [customSplits, setCustomSplits] = useState<Record<string, number>>(expense?.customSplits || {});

  const isEditing = !!expense;

  // 計算自定義分攤總額（只計算當前參與者）
  const customTotal = participants.reduce((sum, id) => sum + (customSplits[id] || 0), 0);
  const totalAmount = parseFloat(amount) || 0;
  const remainingAmount = totalAmount - customTotal;
  // 使用較大的容差來處理浮點數精度問題
  const isBalanced = Math.abs(remainingAmount) < 0.001;

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCurrency(trip?.currency || "HKD");
    setCategory("food");
    setPayerId("");
    setDate(TODAY);
    setParticipants([]);
    setSplitType("equal");
    setCustomSplits({});
  };

  const handleSubmit = () => {
    if (!description || !amount || !payerId || participants.length === 0) return;

    // 自定義分攤時檢查金額是否正確
    if (splitType === "custom" && !isBalanced) {
      return;
    }

    // 只保存參與者的分攤金額
    const filteredCustomSplits: Record<string, number> = {};
    participants.forEach(id => {
      if (customSplits[id] !== undefined) {
        filteredCustomSplits[id] = customSplits[id];
      }
    });

    onSave({
      description,
      amount: parseFloat(amount),
      currency,
      date,
      category,
      payerId,
      participants,
      splitType,
      customSplits: splitType === "custom" ? filteredCustomSplits : undefined,
    });

    resetForm();
  };

  const handleParticipantToggle = (memberId: string) => {
    setParticipants(prev => {
      const newParticipants = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      // 移除未參與者的自定義金額
      if (!newParticipants.includes(memberId)) {
        setCustomSplits(prev => {
          const newSplits = { ...prev };
          delete newSplits[memberId];
          return newSplits;
        });
      }
      
      return newParticipants;
    });
  };

  const selectAllParticipants = () => {
    setParticipants(trip?.members.map(m => m.id) || []);
  };

  // 平均分配
  const distributeEqually = () => {
    if (participants.length === 0 || !amount) return;
    const perPerson = totalAmount / participants.length;
    const newSplits: Record<string, number> = {};
    participants.forEach(id => {
      newSplits[id] = perPerson;
    });
    setCustomSplits(newSplits);
  };

  // 更新自定義金額
  const handleCustomSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: numValue,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "編輯費用" : "添加費用"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="space-y-4 py-2">
            {/* 金額輸入 */}
            <div className="space-y-2">
              <Label>金額 *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xl font-bold h-12"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label>描述 *</Label>
              <Input
                placeholder="例如：午餐、計程車..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* 分類 */}
            <div className="space-y-2">
              <Label>分類</Label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={category === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat.value)}
                    className={category === cat.value ? "bg-sky-500 hover:bg-sky-600" : ""}
                  >
                    {cat.icon} {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 付款人 */}
            <div className="space-y-2">
              <Label>付款人 *</Label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇付款人" />
                </SelectTrigger>
                <SelectContent>
                  {trip?.members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.avatar || member.name.charAt(0)}</span>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 日期 */}
            <div className="space-y-2">
              <Label>日期</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* 分攤人員 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>分攤人員 *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllParticipants}
                  className="text-sky-500"
                >
                  全選
                </Button>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-2">
                  {trip?.members.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Checkbox
                        id={member.id}
                        checked={participants.includes(member.id)}
                        onCheckedChange={() => handleParticipantToggle(member.id)}
                      />
                      <Avatar className="w-6 h-6" style={{ backgroundColor: member.color + "20" }}>
                        <AvatarFallback className="text-xs" style={{ color: member.color }}>
                          {member.avatar || member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor={member.id} className="text-sm cursor-pointer flex-1">
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* 分攤方式 */}
            {participants.length > 0 && (
              <div className="space-y-2">
                <Label>分攤方式</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={splitType === "equal" ? "default" : "outline"}
                    onClick={() => setSplitType("equal")}
                    className={splitType === "equal" ? "bg-sky-500 hover:bg-sky-600" : ""}
                  >
                    平均分攤
                  </Button>
                  <Button
                    type="button"
                    variant={splitType === "custom" ? "default" : "outline"}
                    onClick={() => {
                      setSplitType("custom");
                      // 切換到自定義時，先平均分配
                      if (Object.keys(customSplits).length === 0) {
                        distributeEqually();
                      }
                    }}
                    className={splitType === "custom" ? "bg-sky-500 hover:bg-sky-600" : ""}
                  >
                    自定義金額
                  </Button>
                </div>

                {/* 自定義金額輸入 */}
                {splitType === "custom" && (
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">設定每人金額</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={distributeEqually}
                        className="text-sky-500 text-xs"
                      >
                        平均分配
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {participants.map(participantId => {
                        const member = trip?.members.find(m => m.id === participantId);
                        if (!member) return null;
                        
                        return (
                          <div key={participantId} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6" style={{ backgroundColor: member.color + "20" }}>
                              <AvatarFallback className="text-xs" style={{ color: member.color }}>
                                {member.avatar || member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm flex-1">{member.name}</span>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customSplits[participantId] || ""}
                              onChange={(e) => handleCustomSplitChange(participantId, e.target.value)}
                              className="w-24 h-8 text-right"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* 顯示分配狀態 */}
                    <div className={`p-3 rounded-lg text-sm ${
                      isBalanced 
                        ? "bg-green-50 border border-green-200" 
                        : remainingAmount > 0 
                          ? "bg-orange-50 border border-orange-200"
                          : "bg-purple-50 border border-purple-200"
                    }`}>
                      <div className="flex justify-between">
                        <span>總金額:</span>
                        <span className="font-medium">{formatCurrency(totalAmount, currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>已分配:</span>
                        <span className="font-medium">{formatCurrency(customTotal, currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t mt-1">
                        <span>差額:</span>
                        {isBalanced ? (
                          <span className="text-green-600">✓ 已平衡</span>
                        ) : remainingAmount > 0 ? (
                          <span className="text-orange-600">
                            尚未分配 {formatCurrency(remainingAmount, currency)}
                          </span>
                        ) : (
                          <span className="text-purple-600">
                            超出分配 {formatCurrency(Math.abs(remainingAmount), currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description || !amount || !payerId || participants.length === 0 || (splitType === "custom" && !isBalanced)}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {isEditing ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
