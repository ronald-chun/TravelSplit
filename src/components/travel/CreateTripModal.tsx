"use client";

import { useState, useEffect, useRef } from "react";
import { useTravelStore } from "@/store/travel";
import { COMMON_CURRENCIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plane, Loader2, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

interface CreateTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TODAY = new Date().toISOString().split("T")[0];

export function CreateTripModal({ open, onOpenChange }: CreateTripModalProps) {
  const { createTrip } = useTravelStore();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [currency, setCurrency] = useState("HKD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [createdPin, setCreatedPin] = useState("");
  const [createdTripName, setCreatedTripName] = useState("");
  const [copied, setCopied] = useState(false);
  
  const submittingRef = useRef(false);

  // 重置状态当 modal 关闭
  useEffect(() => {
    if (!open) {
      setName("");
      setStartDate(TODAY);
      setEndDate(TODAY);
      setCurrency("HKD");
      setShowPin(false);
      setCreatedPin("");
      setCreatedTripName("");
      setCopied(false);
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || isSubmitting || submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    
    try {
      const tripId = await createTrip({
        name: name.trim(),
        startDate,
        endDate,
        currency,
      });

      const state = useTravelStore.getState();
      const newTrip = state.trips.find(t => t.id === tripId);
      
      if (newTrip?.pin) {
        setCreatedPin(newTrip.pin);
        setCreatedTripName(newTrip.name);
        setShowPin(true);
      }

      toast.success("旅行已創建");
    } catch (error) {
      console.error("Create trip error:", error);
      toast.error("創建失敗，請重試");
      submittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(createdPin)
      .then(() => {
        setCopied(true);
        toast.success("PIN 碼已複製");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("複製失敗");
      });
  };

  const handleShare = () => {
    const shareText = `來加入我的旅行「${createdTripName}」！\n\nPIN 碼: ${createdPin}\n\n在 TravelSplit 輸入此 PIN 碼即可加入。`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        toast.success("已複製分享內容");
      })
      .catch(() => {
        navigator.clipboard.writeText(createdPin)
          .then(() => {
            toast.success("PIN 碼已複製");
          })
          .catch(() => {
            toast.error("複製失敗");
          });
      });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  // PIN 顯示頁面
  if (showPin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              旅程已創建！
            </DialogTitle>
            <DialogDescription>
              分享 PIN 碼給朋友，讓他們加入旅程
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">旅程 PIN 碼</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-mono font-bold tracking-widest text-sky-600">
                  {createdPin}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPin}
                  className="h-10 w-10"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-500" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                朋友輸入此 PIN 碼即可加入旅程
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleClose}>
              關閉
            </Button>
            <Button
              onClick={handleShare}
              className="bg-sky-500 hover:bg-sky-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            創建新旅行
          </DialogTitle>
          <DialogDescription>
            填寫旅行基本資訊，開始記帳之旅
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>旅行名稱 *</Label>
              <Input
                placeholder="例如：東京之旅、週末露營"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
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
                      {c.name} ({c.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                選擇旅行的主要貨幣，所有費用將以此貨幣結算
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-sky-500 hover:bg-sky-600"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              創建
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
