import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const allocations = await prisma.allocation.findMany({
            where: {
                userId: session.user.id,
                isActive: true
            },
            include: {
                period: {
                    include: {
                        category: true
                    }
                },
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                    include: {
                        center: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Current user stats
        const activePeriodsCount = allocations.filter(a => a.period.status === "ACTIVE").length;
        const totalRedeemed = allocations.reduce((acc, curr) => acc + (curr.totalQuota - curr.remainingQuota), 0);

        return NextResponse.json({ allocations, stats: { activePeriodsCount, totalRedeemed } });
    } catch (error) {
        console.error("Citizen Allocations API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب المخصصات" }, { status: 500 });
    }
}
