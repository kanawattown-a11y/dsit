import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        const url = new URL(req.url);
        const type = url.searchParams.get("type"); 

        if (type === "complaints") {
            const complaints = await prisma.complaint.findMany({
                include: {
                    user: { select: { fullName: true, nationalId: true, phone: true } },
                    center: { select: { name: true, region: true } }
                },
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json({ data: complaints });
        } else if (type === "violations") {
            const violations = await prisma.violation.findMany({
                include: {
                    inspector: { select: { fullName: true, phone: true } },
                    center: { select: { name: true, region: true } }
                },
                orderBy: { createdAt: "desc" }
            });
            return NextResponse.json({ data: violations });
        }

        return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    } catch (error) {
        console.error("Reports GET error:", error);
        return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        const body = await req.json();
        const { type, id, status, adminReply, fineAmount } = body;

        if (type === "complaint") {
            const updated = await prisma.complaint.update({
                where: { id },
                data: { status, adminReply }
            });
            
            // Optionally, we could create a Notification here for the citizen
            if (updated.status !== "PENDING" && updated.status !== "REVIEWING") {
                await prisma.notification.create({
                    data: {
                        targetUserId: updated.userId,
                        type: "SYSTEM",
                        title: "تحديث على شكواك",
                        body: `تغيرت حالة شكواك ( ${updated.subject} ) إلى: ${updated.status === "RESOLVED" ? "محلولة" : "مرفوضة"}. يرجى التحقق من رد الإدارة.`,
                        sentById: (session.user as any).id
                    }
                });
            }

            return NextResponse.json({ success: true, data: updated });
        } else if (type === "violation") {
            const updated = await prisma.violation.update({
                where: { id },
                data: { 
                    status, 
                    fineAmount: fineAmount ? parseFloat(fineAmount) : null 
                }
            });
            return NextResponse.json({ success: true, data: updated });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        console.error("Reports PUT error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 });
    }
}
