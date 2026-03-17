import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "DISTRIBUTOR") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const limitStr = url.searchParams.get("limit");
        const limit = limitStr ? parseInt(limitStr) : 50;

        const transactions = await prisma.transaction.findMany({
            where: {
                processedById: session.user.id,
                OR: [
                    { allocation: { user: { fullName: { contains: search, mode: "insensitive" } } } },
                    { allocation: { user: { nationalId: { contains: search } } } },
                ],
            },
            include: {
                allocation: {
                    select: {
                        user: { select: { fullName: true, nationalId: true } },
                        period: { select: { name: true, category: { select: { nameAr: true, unit: true } } } }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        // Compute daily summary for distributor
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyStats = await prisma.transaction.aggregate({
            _sum: { quantity: true },
            _count: { id: true },
            where: {
                processedById: session.user.id,
                createdAt: { gte: today }
            }
        });

        return NextResponse.json({
            transactions,
            stats: {
                todayVolume: dailyStats._sum.quantity || 0,
                todayCount: dailyStats._count.id || 0
            }
        });
    } catch (error) {
        console.error("Distributor Transactions Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل المعاملات" }, { status: 500 });
    }
}
