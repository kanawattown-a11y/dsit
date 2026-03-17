import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Fetch notifications specific to this user or role-based (targetRole=USER && targetUserId=null)
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { targetUserId: userId },
                    { targetUserId: null, targetRole: (session.user as any).role }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 50 // Limit to last 50
        });

        // Mark as read immediately when fetched
        const unreadIds = notifications.filter(n => !n.isRead && n.targetUserId === userId).map(n => n.id);
        if (unreadIds.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: unreadIds } },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Citizen Notifications GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الإشعارات" }, { status: 500 });
    }
}
