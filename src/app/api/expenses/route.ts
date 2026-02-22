import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_RATES } from "@/types";

// 匯率轉換函數
function convertToBaseCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // 使用自定義匯率或預設匯率
  const getRateInUSD = (currency: string): number => {
    if (customRates && customRates[currency]) {
      // customRates 是相對於基礎貨幣的匯率，需要轉換
      return 1 / customRates[currency];
    }
    return DEFAULT_RATES[currency] || 1;
  };

  const fromRateInUSD = getRateInUSD(fromCurrency);
  const toRateInUSD = getRateInUSD(toCurrency);

  // 先轉換為 USD，再轉換為目標貨幣
  const amountInUSD = amount / fromRateInUSD;
  return amountInUSD * toRateInUSD;
}

// 添加費用
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, description, amount, currency, payerId, date, category, participants, splitType, customSplits, baseCurrency, customRates } = body;

    // 計算基礎貨幣金額
    const amountInBaseCurrency = convertToBaseCurrency(
      amount,
      currency,
      baseCurrency,
      customRates
    );

    const expense = await db.expense.create({
      data: {
        description,
        amount,
        currency,
        amountInBaseCurrency,
        payerId,
        date,
        category,
        splitType: splitType || "equal",
        customSplits: customSplits ? JSON.stringify(customSplits) : null,
        tripId,
      },
    });

    // 創建參與者關聯
    if (participants && participants.length > 0) {
      await db.expenseParticipant.createMany({
        data: participants.map((memberId: string) => ({
          expenseId: expense.id,
          memberId,
        })),
      });
    }

    return NextResponse.json({
      expense: {
        id: expense.id,
        tripId: expense.tripId,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        amountInBaseCurrency: expense.amountInBaseCurrency,
        payerId: expense.payerId,
        date: expense.date,
        category: expense.category,
        participants: participants || [],
        splitType: expense.splitType,
        customSplits: customSplits,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// 更新費用
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { expenseId, description, amount, currency, payerId, date, category, participants, splitType, customSplits, baseCurrency, customRates } = body;

    // 計算基礎貨幣金額
    const amountInBaseCurrency = convertToBaseCurrency(
      amount,
      currency,
      baseCurrency,
      customRates
    );

    const expense = await db.expense.update({
      where: { id: expenseId },
      data: {
        description,
        amount,
        currency,
        amountInBaseCurrency,
        payerId,
        date,
        category,
        splitType: splitType || "equal",
        customSplits: customSplits ? JSON.stringify(customSplits) : null,
      },
    });

    // 更新參與者關聯
    if (participants) {
      // 先刪除舊的參與者
      await db.expenseParticipant.deleteMany({
        where: { expenseId },
      });

      // 創建新的參與者
      if (participants.length > 0) {
        await db.expenseParticipant.createMany({
          data: participants.map((memberId: string) => ({
            expenseId,
            memberId,
          })),
        });
      }
    }

    return NextResponse.json({
      expense: {
        id: expense.id,
        tripId: expense.tripId,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        amountInBaseCurrency: expense.amountInBaseCurrency,
        payerId: expense.payerId,
        date: expense.date,
        category: expense.category,
        participants: participants || [],
        splitType: expense.splitType,
        customSplits: customSplits,
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// 刪除費用
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID required" }, { status: 400 });
    }

    // 先刪除參與者關聯
    await db.expenseParticipant.deleteMany({
      where: { expenseId },
    });

    await db.expense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
