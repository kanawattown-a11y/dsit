import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
        }

        const inspectorId = (session.user as any).id;
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";

        const centers = await prisma.distributionCenter.findMany({
            where: {
                inspectorId: inspectorId,
                isActive: true,
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { region: { contains: search, mode: "insensitive" } },
                ],
            },
            include: {
                distributors: { select: { id: true, fullName: true, phone: true } },
                _count: { select: { transactions: true } }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ centers });
    } catch (error) {
        console.error("Inspector Centers GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب المراكز" }, { status: 500 });
    }
}
