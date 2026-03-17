import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const categories = await prisma.allocationCategory.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { periods: true } } },
        });
        return NextResponse.json({ categories });
    } catch (error) {
        console.error(error);
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
        const category = await prisma.allocationCategory.create({
            data: {
                name: body.name,
                nameAr: body.nameAr,
                type: body.type,
                unit: body.unit,
                baseQuota: body.baseQuota,
                quotaPerPerson: body.quotaPerPerson,
                description: body.description,
                icon: body.icon,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
