"use client";

import { useState, useRef } from "react";
import { useTravelStore } from "@/store/travel";
import { COMMON_CURRENCIES, type Member } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Plane,
  Settings as SettingsIcon,
  Share2,
  Copy,
  Check,
  KeyRound,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ExchangeRateSettings } from "./ExchangeRateSettings";

interface SettingsProps {
  onCreateTrip: () => void;
}

export function Settings({ onCreateTrip }: SettingsProps) {
  const {
    currentTrip,
    trips,
    updateTrip,
    leaveTrip,
    confirmDeleteTrip,
    setCurrentTrip,
    addMember,
    updateMember,
    deleteMember,
    exportData,
    importData,
  } = useTravelStore();

  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentTrip) return null;

  // 導出數據
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `travelsplit_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("數據已導出");
  };

  // 導入數據
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        toast.success("數據已導入");
      } else {
        toast.error("導入失敗，請檢查文件格式");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 更新自定義匯率
  const handleUpdateRates = (rates: Record<string, number>) => {
    updateTrip(currentTrip.id, {
      customRates: rates,
      ratesLastFetched: new Date().toISOString(),
    });
  };

  // 更新啟用的貨幣列表
  const handleUpdateEnabledCurrencies = (currencies: string[]) => {
    updateTrip(currentTrip.id, { enabledCurrencies: currencies });
  };

  // 複製 PIN 碼
  const handleCopyPin = () => {
    navigator.clipboard.writeText(currentTrip.pin)
      .then(() => {
        setCopied(true);
        toast.success("PIN 碼已複製");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("複製失敗");
      });
  };

  // 分享 PIN 碼
  const handleSharePin = () => {
    const shareText = `來加入我的旅行「${currentTrip.name}」！\nPIN 碼: ${currentTrip.pin}\n在 TravelSplit 輸入此 PIN 碼即可加入。 \nhttps://travel-split-pi.vercel.app/`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast.success("已複製分享內容");
      })
      .catch(() => {
        navigator.clipboard.writeText(currentTrip.pin)
          .then(() => {
            toast.success("PIN 碼已複製");
          })
          .catch(() => {
            toast.error("複製失敗");
          });
      });
  };

  // 離開旅程
  const handleLeaveTrip = () => {
    leaveTrip(currentTrip.id);
    setShowLeaveConfirm(false);
    toast.success("已離開旅程");
  };

  // 確認刪除旅程（需要 PIN）
  const handleConfirmDelete = async () => {
    if (deletePin.length !== 6) {
      toast.error("請輸入 6 位 PIN 碼");
      return;
    }

    setIsDeleting(true);
    try {
      await confirmDeleteTrip(currentTrip.id, deletePin);
      setShowDeleteModal(false);
      setDeletePin("");
      toast.success("旅程已刪除");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("刪除失敗");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 成員管理 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              成員管理
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddMember(true)}
              className="bg-sky-500 hover:bg-sky-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentTrip.members.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">尚未有成員</p>
              <p className="text-xs">添加成員開始記帳</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentTrip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8" style={{ backgroundColor: member.color + "30" }}>
                      <AvatarFallback style={{ color: member.color }}>
                        {member.avatar || member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingMember(member)}
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteMemberId(member.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 匯率設定 */}
      <ExchangeRateSettings
        baseCurrency={currentTrip.currency}
        enabledCurrencies={currentTrip.enabledCurrencies}
        customRates={currentTrip.customRates}
        ratesLastFetched={currentTrip.ratesLastFetched}
        onUpdateRates={handleUpdateRates}
        onUpdateEnabledCurrencies={handleUpdateEnabledCurrencies}
      />

      {/* 分享旅程 PIN */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            分享旅程
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">分享 PIN 碼給朋友，讓他們加入旅程</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest text-sky-600">
                  {currentTrip.pin}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPin}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleSharePin}
                className="bg-sky-500 hover:bg-sky-600"
              >
                <Share2 className="w-4 h-4 mr-1" />
                分享
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 旅行設定 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plane className="w-5 h-5" />
            旅行設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-gray-900">{currentTrip.name}</div>
              <div className="text-sm text-gray-500">
                {currentTrip.startDate} ~ {currentTrip.endDate}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEditTrip(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              編輯
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-500">基礎貨幣</div>
              <div className="font-medium text-gray-900">
                {COMMON_CURRENCIES.find(c => c.code === currentTrip.currency)?.name || currentTrip.currency}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 其他旅行 */}
      {trips.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">其他旅行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trips
                .filter(t => t.id !== currentTrip.id)
                .map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setCurrentTrip(trip.id)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{trip.name}</div>
                      <div className="text-xs text-gray-500">
                        {trip.members.length} 人 · {trip.expenses.length} 筆費用
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      切換
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 旅程管理 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            旅程管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              導出數據
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              導入數據
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <Separator />

          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={onCreateTrip}>
              <Plus className="w-4 h-4 mr-2" />
              創建新旅行
            </Button>

            <Button
              variant="outline"
              className="w-full text-orange-500 hover:text-orange-600 hover:bg-orange-50"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              離開此旅程
            </Button>

            <Button
              variant="outline"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              刪除此旅程
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 添加成員 Modal */}
      <MemberModal
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onSave={async (data) => {
          try {
            await addMember(currentTrip.id, data);
            setShowAddMember(false);
            toast.success("成員已添加");
          } catch (error) {
            toast.error("添加失敗");
          }
        }}
      />

      {/* 編輯成員 Modal */}
      {editingMember && (
        <MemberModal
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember}
          onSave={async (data) => {
            try {
              await updateMember(currentTrip.id, editingMember.id, data);
              setEditingMember(null);
              toast.success("成員已更新");
            } catch (error) {
              toast.error("更新失敗");
            }
          }}
        />
      )}

      {/* 刪除成員確認 */}
      <AlertDialog open={!!deleteMemberId} onOpenChange={(open) => !open && setDeleteMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此成員嗎？該成員相關的費用記錄也會一併刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async () => {
                if (deleteMemberId) {
                  try {
                    await deleteMember(currentTrip.id, deleteMemberId);
                    setDeleteMemberId(null);
                    toast.success("成員已刪除");
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

      {/* 編輯旅行 Modal */}
      <TripEditModal
        open={showEditTrip}
        onOpenChange={setShowEditTrip}
        trip={currentTrip}
        onSave={async (data) => {
          try {
            await updateTrip(currentTrip.id, data);
            setShowEditTrip(false);
            toast.success("旅行已更新");
          } catch (error) {
            toast.error("更新失敗");
          }
        }}
      />

      {/* 離開旅程確認 */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>離開旅程</AlertDialogTitle>
            <AlertDialogDescription>
              確定要離開「{currentTrip.name}」嗎？之後可以使用 PIN 碼重新加入。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTrip}
            >
              離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除旅程 Modal（需要反轉 PIN 確認） */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>刪除旅程</DialogTitle>
            <DialogDescription>
              此操作無法復原。請輸入反轉 PIN 碼確認刪除「{currentTrip.name}」
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="text-amber-800">
                💡 刪除 PIN 碼為旅程 PIN 碼的反轉
              </p>
              <p className="text-amber-700 mt-1">
                旅程 PIN 碼：<span className="font-mono font-bold">{currentTrip.pin}</span>
              </p>
            </div>
            
            <div>
              <Label>輸入反轉 PIN 碼</Label>
              <Input
                placeholder="輸入 6 位反轉 PIN 碼"
                value={deletePin}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  if (value.length <= 6) setDeletePin(value);
                }}
                className="text-2xl text-center font-mono tracking-widest mt-2"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePin("");
              }}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePin.length !== 6 || isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 成員表單 Modal
interface MemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member;
  onSave: (data: Omit<Member, "id" | "color">) => void;
}

function MemberModal({ open, onOpenChange, member, onSave }: MemberModalProps) {
  const [name, setName] = useState(member?.name || "");
  const [avatar, setAvatar] = useState(member?.avatar || "");

  const isEditing = !!member;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), avatar: avatar || undefined });
    setName("");
    setAvatar("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "編輯成員" : "添加成員"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>姓名 *</Label>
            <Input
              placeholder="輸入姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>頭像 Emoji (選填)</Label>
            <Input
              placeholder="例如：😊"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="text-2xl text-center"
              maxLength={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {isEditing ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 旅行編輯 Modal
interface TripEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: typeof useTravelStore.getState extends () => infer R ? R extends { currentTrip: infer T } ? NonNullable<T> : never : never;
  onSave: (data: { name: string; startDate: string; endDate: string; currency: string }) => void;
}

function TripEditModal({ open, onOpenChange, trip, onSave }: TripEditModalProps) {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [currency, setCurrency] = useState(trip.currency);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), startDate, endDate, currency });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>編輯旅行</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>旅行名稱 *</Label>
            <Input
              placeholder="例如：東京之旅"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>開始日期</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>結束日期</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>基礎貨幣</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-sky-500 hover:bg-sky-600"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
