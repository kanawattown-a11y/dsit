import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { periodId } = await request.json();
        if (!periodId) {
            return NextResponse.json({ error: "معرف الدورة مطلوب" }, { status: 400 });
        }

        const period = await prisma.allocationPeriod.findUnique({
            where: { id: periodId },
            include: { category: true },
        });

        if (!period) {
            return NextResponse.json({ error: "الدورة غير موجودة" }, { status: 404 });
        }

        // Only APPROVED users get allocations
        const users = await prisma.user.findMany({
            where: {
                role: "USER",
                status: "APPROVED",
            },
            include: { headOfFamilyBook: { include: { members: true } } },
        });

        let createdCount = 0;

        // Note: For large datasets (10k+ users), this should be a background job.
        // For this assignment MVP, we loop and insert in batches.
        const allocationsToCreate = [];

        for (const user of users) {
            // Check if user already has an allocation for this period
            const existing = await prisma.allocation.findFirst({
                where: { userId: user.id, periodId },
            });

            if (existing) continue;

            let totalQuota = period.category.baseQuota;

            if (period.category.type === "FAMILY" && user.headOfFamilyBook) {
                const headQuota = period.category.quotaPerPerson || 0;
                const membersQuota = (user.headOfFamilyBook.members.length) * (period.category.quotaPerPerson || 0);
                totalQuota = period.category.baseQuota + headQuota + membersQuota;
            }

            allocationsToCreate.push({
                userId: user.id,
                periodId: period.id,
                familyBookId: user.headOfFamilyBook ? user.headOfFamilyBook.id : null,
                totalQuota: totalQuota,
                remainingQuota: totalQuota,
            });
        }

        if (allocationsToCreate.length > 0) {
            // Prisma optimize: createMany
            const result = await prisma.allocation.createMany({
                data: allocationsToCreate,
                skipDuplicates: true,
            });
            createdCount = result.count;
        }

        await prisma.auditLog.create({
            data: {
                action: "BULK_ASSIGN_ALLOCATIONS",
                entity: "AllocationPeriod",
                entityId: periodId,
                performedById: session.user.id,
                details: { assignedCount: createdCount },
            },
        });

        return NextResponse.json({
            success: true,
            message: `تم توزيع المخصصات بنجاح لـ ${createdCount} مستفيد.`,
            assignedCount: createdCount,
        });

    } catch (error) {
        console.error("Bulk assign error:", error);
        return NextResponse.json({ error: "خطأ داخلي في الخادم" }, { status: 500 });
    }
}
