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
        const action = url.searchParams.get("action") || "";
        const entity = url.searchParams.get("entity") || "";
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");

        const where: any = {};
        const conditions: any[] = [];

        if (search) {
            conditions.push({
                OR: [
                    { action: { contains: search, mode: "insensitive" } },
                    { entity: { contains: search, mode: "insensitive" } },
                    { performedBy: { fullName: { contains: search, mode: "insensitive" } } },
                ],
            });
        }

        if (action) conditions.push({ action: { contains: action, mode: "insensitive" } });
        if (entity) conditions.push({ entity: { contains: entity, mode: "insensitive" } });

        if (dateFrom) {
            conditions.push({ createdAt: { gte: new Date(dateFrom) } });
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            conditions.push({ createdAt: { lte: endDate } });
        }

        if (conditions.length > 0) {
            where.AND = conditions;
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    performedBy: { select: { fullName: true, role: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        const safeLogs = logs.map(l => ({
            ...l,
            details: l.details ? (typeof l.details === 'string' ? JSON.parse(l.details) : l.details) : null
        }));

        return NextResponse.json({ logs: safeLogs, total, page, limit });
    } catch (error) {
        console.error("Audit Logs Error:", error);
        return NextResponse.json({ error: "خطأ أثناء جلب سجلات التدقيق" }, { status: 500 });
    }
}
