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
        const { fcmToken } = body;

        if (!fcmToken || typeof fcmToken !== "string") {
            return NextResponse.json({ error: "FCM token مفقود أو غير صالح" }, { status: 400 });
        }

        // Upsert: if token exists, assign to current user; otherwise create
        await prisma.pushSubscription.upsert({
            where: { fcmToken },
            update: { userId: session.user.id },
            create: {
                userId: session.user.id,
                fcmToken,
            },
        });

        return NextResponse.json({ success: true, message: "تم التسجيل في الإشعارات بنجاح" });
    } catch (error) {
        console.error("FCM subscription error:", error);
        return NextResponse.json({ error: "فشل في حفظ اشتراك الإشعارات" }, { status: 500 });
    }
}
