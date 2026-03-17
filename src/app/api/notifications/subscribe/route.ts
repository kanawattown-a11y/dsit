import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint, p256dh, auth } = body;

        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: "بيانات الاشتراك غير مكتملة" }, { status: 400 });
        }

        // Check if subscription already exists
        const existing = await prisma.pushSubscription.findFirst({
            where: { endpoint },
        });

        if (existing) {
            // Unassign from any previous user and assign to current user
            await prisma.pushSubscription.update({
                where: { id: existing.id },
                data: { userId: session.user.id },
            });
            return NextResponse.json({ success: true, message: "تم تحديث الاشتراك بنجاح" });
        }

        // Save new subscription
        await prisma.pushSubscription.create({
            data: {
                userId: session.user.id,
                endpoint,
                p256dh,
                auth,
            },
        });

        return NextResponse.json({ success: true, message: "تم التسجيل بنجاح في الإشعارات" });
    } catch (error) {
        console.error("Push subscription error:", error);
        return NextResponse.json({ error: "فشل في حفظ اشتراك الإشعارات" }, { status: 500 });
    }
}
