import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                targetUserId: session.user.id
            },
            orderBy: { createdAt: "desc" },
            take: 50 // Limit to last 50
        });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Notifications API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب الإشعارات" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const body = await req.json();

        // Mark all as read
        if (body.markAllRead) {
            await prisma.notification.updateMany({
                where: { targetUserId: session.user.id, isRead: false },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true });
        }

        // Mark specific as read
        if (body.notificationId) {
            await prisma.notification.update({
                where: { id: body.notificationId, targetUserId: session.user.id },
                data: { isRead: true }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإشعارات" }, { status: 500 });
    }
}
