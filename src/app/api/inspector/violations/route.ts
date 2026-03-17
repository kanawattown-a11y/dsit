import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const inspectorId = (session.user as any).id;

        const violations = await prisma.violation.findMany({
            where: { inspectorId },
            include: {
                center: { select: { name: true, type: true, region: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ violations });
    } catch (error) {
        console.error("Inspector Violations GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الضبوط" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const inspectorId = (session.user as any).id;
        const data = await req.json();

        if (!data.centerId || !data.details) {
            return NextResponse.json({ error: "المركز وتفاصيل المخالفة مطلوبة" }, { status: 400 });
        }

        // Verify that the inspector is actually assigned to this center
        const center = await prisma.distributionCenter.findFirst({
            where: { id: data.centerId, inspectorId: inspectorId }
        });

        if (!center) {
            return NextResponse.json({ error: "لا تملك صلاحية تحرير ضبط لهذا المركز" }, { status: 403 });
        }

        const violation = await prisma.violation.create({
            data: {
                inspectorId,
                centerId: data.centerId,
                details: data.details,
                fineAmount: data.fineAmount ? parseFloat(data.fineAmount) : null,
                images: data.images || [],
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, violation });
    } catch (error) {
        console.error("Inspector Violations POST error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء حفظ الضبط" }, { status: 500 });
    }
}
