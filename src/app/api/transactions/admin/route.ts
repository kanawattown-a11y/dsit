import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");

        const where: any = search ? {
            OR: [
                { center: { name: { contains: search, mode: "insensitive" } } },
                { processedBy: { fullName: { contains: search, mode: "insensitive" } } },
                { allocation: { user: { fullName: { contains: search, mode: "insensitive" } } } },
            ],
        } : {};

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    center: { select: { name: true, type: true } },
                    processedBy: { select: { fullName: true } },
                    allocation: {
                        select: {
                            user: { select: { fullName: true, nationalId: true } },
                            period: { select: { name: true, category: { select: { nameAr: true, unit: true } } } }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        return NextResponse.json({ transactions, total, page, limit });
    } catch (error) {
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل المعاملات" }, { status: 500 });
    }
}
