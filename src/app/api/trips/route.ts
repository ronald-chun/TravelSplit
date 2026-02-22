import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 生成 6 位 PIN 碼
function generatePin(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除容易混淆的字符
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// 生成唯一的 PIN 碼
async function generateUniquePin(): Promise<string> {
  let pin = generatePin();
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const existing = await db.trip.findUnique({ where: { pin } });
    if (!existing) return pin;
    pin = generatePin();
    attempts++;
  }

  throw new Error("Failed to generate unique PIN");
}

// 獲取旅程列表（支持 ids 查詢參數）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    
    let trips;
    
    if (idsParam) {
      // 只返回指定的旅程
      const ids = idsParam.split(",").filter(Boolean);
      trips = await db.trip.findMany({
        where: {
          id: { in: ids },
        },
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
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      // 返回所有旅程（用於向後兼容，但實際上不應該使用）
      trips = await db.trip.findMany({
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
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    // 轉換為前端格式
    const formattedTrips = trips.map((trip) => ({
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
        category: e.category as "transport" | "accommodation" | "food" | "entertainment" | "shopping" | "other",
        participants: e.participants.map((p) => p.memberId),
        splitType: e.splitType as "equal" | "custom",
        customSplits: e.customSplits ? JSON.parse(e.customSplits) : undefined,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
    }));

    return NextResponse.json({ trips: formattedTrips });
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json({ error: "Failed to get trips" }, { status: 500 });
  }
}

// 創建新旅程
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, currency } = body;

    // 生成唯一的 PIN 碼
    const pin = await generateUniquePin();

    const trip = await db.trip.create({
      data: {
        name,
        pin,
        startDate,
        endDate,
        currency: currency || "HKD",
      },
    });

    return NextResponse.json({
      trip: {
        id: trip.id,
        name: trip.name,
        pin: trip.pin,
        startDate: trip.startDate,
        endDate: trip.endDate,
        currency: trip.currency,
        members: [],
        expenses: [],
        createdAt: trip.createdAt.toISOString(),
        updatedAt: trip.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
