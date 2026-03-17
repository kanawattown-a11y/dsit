import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const complaints = await prisma.complaint.findMany({
            where: { userId },
            include: {
                center: { select: { name: true, region: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        const centers = await prisma.distributionCenter.findMany({
            where: { isActive: true },
            select: { id: true, name: true, region: true },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ complaints, centers });
    } catch (error) {
        console.error("Citizen Complaints GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الشكاوى" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const data = await req.json();

        if (!data.subject || !data.description) {
            return NextResponse.json({ error: "عنوان الشكوى والتفاصيل مطلوبة" }, { status: 400 });
        }

        const complaint = await prisma.complaint.create({
            data: {
                userId,
                centerId: data.centerId || null,
                subject: data.subject,
                description: data.description,
                images: data.images || [],
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, complaint });
    } catch (error) {
        console.error("Citizen Complaints POST error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال الشكوى" }, { status: 500 });
    }
}
