import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "INSPECTOR" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const centers = await prisma.distributionCenter.findMany({
            where: session.user.role === "INSPECTOR" ? { inspectorId: session.user.id } : {},
            include: {
                _count: {
                    select: {
                        transactions: true,
                        inspectionReports: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        const centerIds = centers.map((c) => c.id);

        // Calculate quick stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [recentViolations, todayTransactions, totalWarnings] = await Promise.all([
            prisma.inspectionReport.count({
                where: { centerId: { in: centerIds }, status: "VIOLATION", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            }),
            prisma.transaction.count({
                where: { centerId: { in: centerIds }, createdAt: { gte: today } }
            }),
            prisma.inspectionReport.count({
                where: { centerId: { in: centerIds }, status: "WARNING" }
            })
        ]);

        return NextResponse.json({
            centers,
            stats: {
                recentViolations,
                todayTransactions,
                totalWarnings
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
