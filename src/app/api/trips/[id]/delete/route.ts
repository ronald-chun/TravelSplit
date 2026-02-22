import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 通過反轉 PIN 碼確認後刪除旅程
// 刪除 PIN 碼 = 旅程 PIN 碼的反轉
// 例如：旅程 PIN 碼 123456 → 刪除 PIN 碼 654321
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "請輸入 PIN 碼" }, { status: 400 });
    }

    // 查找旅程
    const trip = await db.trip.findUnique({
      where: { id },
    });

    if (!trip) {
      return NextResponse.json({ error: "找不到此旅程" }, { status: 404 });
    }

    // 計算正確的刪除 PIN 碼（旅程 PIN 碼的反轉）
    const correctDeletePin = trip.pin.toUpperCase().split("").reverse().join("");

    // 驗證刪除 PIN 碼
    if (correctDeletePin !== pin.toUpperCase()) {
      return NextResponse.json({ error: "PIN 碼不正確" }, { status: 400 });
    }

    // 刪除旅程（會級聯刪除相關的成員和費用）
    await db.trip.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
}
