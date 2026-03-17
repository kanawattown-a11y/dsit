import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const reports = await prisma.inspectionReport.findMany({
            where: { inspectorId: session.user.id },
            include: {
                center: { select: { name: true, type: true, address: true, region: true } }
            },
            orderBy: { createdAt: "desc" },
            take: 100
        });

        // Get centers assigned to this inspector for the create form
        const myCenters = await prisma.distributionCenter.findMany({
            where: { inspectorId: session.user.id, isActive: true },
            select: { id: true, name: true, type: true }
        });

        return NextResponse.json({ reports, myCenters });
    } catch (error) {
        console.error("Inspector Reports API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل التقارير" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const body = await req.json();
        const { centerId, findings, status, attachments } = body;

        if (!centerId || !findings || !status) {
            return NextResponse.json({ error: "يرجى تعبئة جميع الحقول المطلوبة" }, { status: 400 });
        }

        // Optional: verify the center actually belongs to this inspector
        const center = await prisma.distributionCenter.findFirst({
            where: { id: centerId, inspectorId: session.user.id }
        });

        if (!center) {
            return NextResponse.json({ error: "هذا المركز غير مخصص لإشرافك" }, { status: 403 });
        }

        const report = await prisma.inspectionReport.create({
            data: {
                inspectorId: session.user.id,
                centerId,
                findings,
                status,
                attachments: Array.isArray(attachments) ? attachments : []
            },
            include: {
                center: { select: { name: true, type: true } }
            }
        });

        return NextResponse.json({ success: true, report });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "حدث خطأ أثناء إرسال التقرير" }, { status: 500 });
    }
}
