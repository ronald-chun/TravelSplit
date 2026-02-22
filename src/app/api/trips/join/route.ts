import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 通過 PIN 碼加入旅程
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: "請輸入 6 位 PIN 碼" }, { status: 400 });
    }

    // 將 PIN 轉為大寫
    const upperPin = pin.toUpperCase();

    // 查找旅程
    const trip = await db.trip.findUnique({
      where: { pin: upperPin },
      include: {
        members: true,
        expenses: {
          include: {
            participants: {
              include: {
                member: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "找不到此旅程，請檢查 PIN 碼是否正確" }, { status: 404 });
    }

    // 返回旅程信息
    return NextResponse.json({
      trip: {
        id: trip.id,
        name: trip.name,
        pin: trip.pin,
        startDate: trip.startDate,
        endDate: trip.endDate,
        currency: trip.currency,
        enabledCurrencies: trip.enabledCurrencies ? JSON.parse(trip.enabledCurrencies) : undefined,
        customRates: trip.customRates ? JSON.parse(trip.customRates) : undefined,
        ratesLastFetched: trip.ratesLastFetched || undefined,
        members: trip.members.map((m) => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar || undefined,
          color: m.color,
        })),
        expenses: trip.expenses.map((e) => ({
          id: e.id,
          tripId: e.tripId,
          description: e.description,
          amount: e.amount,
          currency: e.currency,
          amountInBaseCurrency: e.amountInBaseCurrency,
          payerId: e.payerId,
          date: e.date,
          category: e.category,
          participants: e.participants.map((p) => p.memberId),
          splitType: e.splitType,
          customSplits: e.customSplits ? JSON.parse(e.customSplits) : undefined,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Join trip error:", error);
    return NextResponse.json({ error: "加入旅程失敗" }, { status: 500 });
  }
}
