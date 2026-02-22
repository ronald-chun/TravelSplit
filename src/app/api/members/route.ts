import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// 添加成員
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, name, avatar, color } = body;

    const member = await db.member.create({
      data: {
        name,
        avatar: avatar || null,
        color: color || "#4ECDC4",
        tripId,
      },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        avatar: member.avatar || undefined,
        color: member.color,
      },
    });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}

// 更新成員
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { memberId, name, avatar, color } = body;

    const member = await db.member.update({
      where: { id: memberId },
      data: {
        name,
        avatar: avatar || null,
        color,
      },
    });

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        avatar: member.avatar || undefined,
        color: member.color,
      },
    });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// 刪除成員
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    await db.member.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
