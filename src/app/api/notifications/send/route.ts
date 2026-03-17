import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { title, body, type, targetRole, targetUserId } = await request.json();

        if (!title || !body) {
            return NextResponse.json({ error: "العنوان والنص مطلوبان" }, { status: 400 });
        }

        // Create notification record
        const notification = await prisma.notification.create({
            data: {
                title,
                body,
                type: type || "MANUAL",
                targetRole: targetRole || null,
                targetUserId: targetUserId || null,
                sentById: session.user.id,
            },
        });

        // If targeting a role, create individual notifications for each user
        if (targetRole) {
            const users = await prisma.user.findMany({
                where: { role: targetRole, status: "APPROVED" },
                select: { id: true },
            });

            if (users.length > 0) {
                await prisma.notification.createMany({
                    data: users.map((u) => ({
                        title,
                        body,
                        type: type || "MANUAL",
                        targetUserId: u.id,
                        sentById: session.user.id,
                    })),
                });
            }
        } else if (!targetUserId) {
            // Send to all approved users
            const users = await prisma.user.findMany({
                where: { status: "APPROVED" },
                select: { id: true },
            });

            if (users.length > 0) {
                await prisma.notification.createMany({
                    data: users.map((u) => ({
                        title,
                        body,
                        type: type || "MANUAL",
                        targetUserId: u.id,
                        sentById: session.user.id,
                    })),
                });
            }
        }

        return NextResponse.json({ notification, message: "تم إرسال الإشعار بنجاح" }, { status: 201 });
    } catch (error) {
        console.error("Error sending notification:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
