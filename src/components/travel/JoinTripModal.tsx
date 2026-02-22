"use client";

import { useState } from "react";
import { useTravelStore } from "@/store/travel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { KeyRound, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface JoinTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinTripModal({ open, onOpenChange }: JoinTripModalProps) {
  const { joinTripByPin } = useTravelStore();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      toast.error("請輸入 6 位 PIN 碼");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinTripByPin(pin.trim());
      toast.success("已成功加入旅程！");
      setPin("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("加入失敗，請檢查 PIN 碼是否正確");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setPin("");
    onOpenChange(false);
  };

  const handlePinChange = (value: string) => {
    // 只允許字母和數字，並轉為大寫
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (filtered.length <= 6) {
      setPin(filtered);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            加入旅程
          </DialogTitle>
          <DialogDescription>
            輸入旅程 PIN 碼即可查看旅程內容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>PIN 碼</Label>
            <Input
              placeholder="輸入 6 位 PIN 碼"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="text-2xl text-center font-mono tracking-widest uppercase"
              maxLength={6}
            />
            <p className="text-xs text-gray-500">
              向旅程創建者索取 6 位 PIN 碼
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pin.length !== 6 || isSubmitting}
            className="bg-sky-500 hover:bg-sky-600"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Users className="w-4 h-4 mr-2" />
            加入旅程
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
