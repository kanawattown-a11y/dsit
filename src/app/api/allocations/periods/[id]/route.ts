import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, name, startDate, endDate } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const period = await prisma.allocationPeriod.update({
        where: { id },
        data: updateData,
        include: {
            category: { select: { nameAr: true, unit: true } },
            _count: { select: { allocations: true } },
        },
    });

    await prisma.auditLog.create({
        data: {
            action: "UPDATE_PERIOD",
            entity: "AllocationPeriod",
            entityId: id,
            performedById: session.user.id,
            details: updateData,
        },
    });

    return NextResponse.json({ period });
}
