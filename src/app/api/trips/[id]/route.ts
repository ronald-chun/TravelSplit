import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 獲取單個旅行
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = await db.trip.findUnique({
      where: { id },
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
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json({ error: "Failed to get trip" }, { status: 500 });
  }
}

// 更新旅行
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, startDate, endDate, currency, enabledCurrencies, customRates, ratesLastFetched, setCurrent } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (currency !== undefined) updateData.currency = currency;
    if (enabledCurrencies !== undefined) updateData.enabledCurrencies = JSON.stringify(enabledCurrencies);
    if (customRates !== undefined) updateData.customRates = JSON.stringify(customRates);
    if (ratesLastFetched !== undefined) updateData.ratesLastFetched = ratesLastFetched;
    if (setCurrent === true) {
      // 先將其他旅行設為非當前
      await db.trip.updateMany({
        where: { currentTrip: true },
        data: { currentTrip: false },
      });
      updateData.currentTrip = true;
    }

    const trip = await db.trip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Update trip error:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

// 刪除旅行
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.trip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
