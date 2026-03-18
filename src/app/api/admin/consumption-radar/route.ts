import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const url = new URL(req.url);
        const filter = url.searchParams.get("filter") || "ALL"; // ALL, DISCREPANCY, PENDING, MATCHED

        const whereClause: any = {};
        if (filter !== "ALL") {
            whereClause.status = filter;
        }

        const reports = await prisma.dailyConsumptionReport.findMany({
            where: whereClause,
            include: {
                center: { select: { id: true, name: true, region: true, type: true } },
                material: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ reports });
    } catch (error: any) {
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الرادار." }, { status: 500 });
    }
}
