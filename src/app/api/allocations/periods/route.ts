import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "";

        const where = categoryId ? { categoryId } : {};

        const periods = await prisma.allocationPeriod.findMany({
            where,
            include: {
                category: { select: { id: true, nameAr: true, unit: true } },
                _count: { select: { allocations: true } },
            },
            orderBy: { startDate: "desc" },
        });

        const categories = await prisma.allocationCategory.findMany({
            where: { isActive: true },
            select: { id: true, nameAr: true, unit: true, type: true },
            orderBy: { nameAr: "asc" },
        });

        return NextResponse.json({ periods, categories });
    } catch (error) {
        console.error("Periods GET error:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const body = await request.json();
        const { categoryId, name, startDate, endDate, status } = body;

        if (!categoryId || !name || !startDate || !endDate) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
        }

        const period = await prisma.allocationPeriod.create({
            data: {
                categoryId,
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: status || "UPCOMING",
            },
            include: {
                category: { select: { nameAr: true, unit: true } },
                _count: { select: { allocations: true } },
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "CREATE_PERIOD",
                entity: "AllocationPeriod",
                entityId: period.id,
                performedById: session.user.id,
                details: { name, categoryId, status },
            },
        });

        return NextResponse.json({ period }, { status: 201 });
    } catch (error) {
        console.error("Periods POST error:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
