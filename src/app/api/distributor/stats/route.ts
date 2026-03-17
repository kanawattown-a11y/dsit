import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "DISTRIBUTOR") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [todayTransactions, totalTransactions] = await Promise.all([
            prisma.transaction.count({
                where: {
                    processedById: session.user.id,
                    createdAt: { gte: today }
                }
            }),
            prisma.transaction.count({
                where: { processedById: session.user.id }
            })
        ]);

        return NextResponse.json({
            stats: {
                todayTransactions,
                totalTransactions
            }
        });
    } catch (error) {
        console.error("Distributor stats error:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
