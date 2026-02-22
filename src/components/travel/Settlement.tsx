"use client";

import { useState } from "react";
import { useTravelStore } from "@/store/travel";
import { formatCurrency } from "@/lib/storage";
import { generateSettlementSummary } from "@/lib/settlement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export function Settlement() {
  const { currentTrip, balances, transactions } = useTravelStore();
  const [copied, setCopied] = useState(false);

  if (!currentTrip) return null;

  const handleCopy = async () => {
    const summary = generateSettlementSummary(currentTrip, balances, transactions);
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("已複製結算明細");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const summary = generateSettlementSummary(currentTrip, balances, transactions);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentTrip.name} 結算明細`,
          text: summary,
        });
      } catch (err) {
        // 用戶取消分享
      }
    } else {
      handleCopy();
    }
  };

  // 按正負排序
  const sortedBalances = [...balances].sort((a, b) => b.balance - a.balance);
  
  // 計算統計
  const creditors = balances.filter(b => b.balance > 0.01);
  const debtors = balances.filter(b => b.balance < -0.01);
  const settled = balances.filter(b => Math.abs(b.balance) <= 0.01);

  return (
    <div className="space-y-6">
      {/* 操作按鈕 */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCopy} className="flex-1">
          {copied ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copied ? "已複製" : "複製結算"}
        </Button>
        <Button onClick={handleShare} className="flex-1 bg-sky-500 hover:bg-sky-600">
          <Share2 className="w-4 h-4 mr-2" />
          分享
        </Button>
      </div>

      {/* 收支統計 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{creditors.length}</div>
            <div className="text-xs text-gray-500">應收人</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-500">{debtors.length}</div>
            <div className="text-xs text-gray-500">應付人</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{settled.length}</div>
            <div className="text-xs text-gray-500">已結清</div>
          </CardContent>
        </Card>
      </div>

      {/* 成員收支概覽 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">收支概覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedBalances.map((balance) => {
              const member = currentTrip.members.find(m => m.id === balance.memberId);
              const isPositive = balance.balance >= 0;
              const isSettled = Math.abs(balance.balance) <= 0.01;

              return (
                <div
                  key={balance.memberId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isSettled
                      ? "bg-gray-50"
                      : isPositive
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10" style={{ backgroundColor: member?.color + "30" }}>
                      <AvatarFallback className="font-semibold" style={{ color: member?.color }}>
                        {member?.avatar || member?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{balance.memberName}</div>
                      <div className="text-xs text-gray-500">
                        已付 {formatCurrency(balance.totalPaid, currentTrip.currency)} ·
                        應付 {formatCurrency(balance.totalOwed, currentTrip.currency)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isSettled ? (
                      <Badge variant="secondary" className="bg-gray-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        結清
                      </Badge>
                    ) : (
                      <div className={`font-bold flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {formatCurrency(Math.abs(balance.balance), currentTrip.currency)}
                      </div>
                    )}
                    {!isSettled && (
                      <div className="text-xs text-gray-500">
                        {isPositive ? "應收" : "應付"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 結算建議 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            結算建議
            {transactions.length > 0 && (
              <Badge variant="secondary">{transactions.length} 筆交易</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">全部結清！</h3>
              <p className="text-sm text-gray-500">沒有待結算的款項</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => {
                const fromMember = currentTrip.members.find(m => m.id === transaction.fromId);
                const toMember = currentTrip.members.find(m => m.id === transaction.toId);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8" style={{ backgroundColor: fromMember?.color + "30" }}>
                        <AvatarFallback className="text-sm" style={{ color: fromMember?.color }}>
                          {fromMember?.avatar || fromMember?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{transaction.fromName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-orange-600">
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-bold">
                        {formatCurrency(transaction.amount, currentTrip.currency)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{transaction.toName}</span>
                      <Avatar className="w-8 h-8" style={{ backgroundColor: toMember?.color + "30" }}>
                        <AvatarFallback className="text-sm" style={{ color: toMember?.color }}>
                          {toMember?.avatar || toMember?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提示 */}
      {transactions.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">結算提示</p>
                <p>上方建議已使用最少交易次數算法，可快速完成結算。請按建議金額進行轉帳或現金付款。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
