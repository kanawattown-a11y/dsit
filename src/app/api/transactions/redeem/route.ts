import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "DISTRIBUTOR" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const body = await request.json();
        const { allocationId, quantity, notes, citizenId, centerId: requestedCenterId } = body;

        if (!allocationId || !quantity) {
            return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
        }

        if (quantity <= 0) {
            return NextResponse.json({ error: "الكمية يجب أن تكون أكبر من صفر" }, { status: 400 });
        }

        // ── Auto-resolve centerId from distributor's assigned center ──
        let centerId: string;

        if (session.user.role === "ADMIN") {
            // Admin must supply centerId explicitly
            if (!requestedCenterId) {
                return NextResponse.json({ error: "المدير يجب أن يحدد المركز" }, { status: 400 });
            }
            centerId = requestedCenterId;
        } else {
            // Distributor: fetch their assigned center automatically
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { distributorCenter: { select: { id: true, isActive: true } } }
            });

            const assignedCenter = user?.distributorCenter;

            if (!assignedCenter) {
                return NextResponse.json(
                    { error: "لم يتم تعيينك لأي مركز توزيع. تواصل مع الإدارة" },
                    { status: 403 }
                );
            }

            if (!assignedCenter.isActive) {
                return NextResponse.json(
                    { error: "مركز التوزيع الخاص بك غير مفعّل حالياً" },
                    { status: 403 }
                );
            }

            centerId = assignedCenter.id;
        }

        // Get allocation with owner info
        const allocation = await prisma.allocation.findUnique({
            where: { id: allocationId },
            include: {
                period: { include: { category: true } },
                user: { select: { id: true, status: true } },
            },
        });

        if (!allocation) {
            return NextResponse.json({ error: "المخصصات غير موجودة" }, { status: 404 });
        }

        // ── Security: Verify allocationId belongs to the scanned citizen ──
        if (citizenId && allocation.userId !== citizenId) {
            return NextResponse.json(
                { error: "المخصصات لا تنتمي للمواطن المُسحوب رمزه" },
                { status: 403 }
            );
        }

        // Verify citizen account is still active
        if (allocation.user.status !== "APPROVED") {
            return NextResponse.json({ error: "حساب المواطن غير مفعّل" }, { status: 403 });
        }

        if (!allocation.isActive) {
            return NextResponse.json({ error: "المخصصات غير نشطة" }, { status: 400 });
        }

        if (allocation.period.status !== "ACTIVE") {
            return NextResponse.json({ error: "دورة التوزيع لهذه المادة لم تعد نشطة" }, { status: 400 });
        }

        if (allocation.remainingQuota < quantity) {
            return NextResponse.json({
                error: `الكمية المطلوبة (${quantity}) أكبر من المتبقي (${allocation.remainingQuota})`,
            }, { status: 400 });
        }

        // Create transaction and update allocation atomically
        const [transaction] = await prisma.$transaction([
            prisma.transaction.create({
                data: {
                    allocationId,
                    centerId,
                    processedById: session.user.id,
                    quantity,
                    notes,
                },
            }),
            prisma.allocation.update({
                where: { id: allocationId },
                data: {
                    remainingQuota: { decrement: quantity },
                },
            }),
        ]);

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "REDEEM_ALLOCATION",
                entity: "Transaction",
                entityId: transaction.id,
                performedById: session.user.id,
                details: { allocationId, quantity, centerId, citizenId },
            },
        });

        const unitLabels: Record<string, string> = {
            kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة"
        };

        const unitAr = unitLabels[allocation.period.category.unit] || allocation.period.category.unit;

        return NextResponse.json({
            transaction,
            message: `تم خصم ${quantity} ${unitAr} من مخصصات ${allocation.period.category.nameAr} بنجاح`,
            remainingQuota: allocation.remainingQuota - quantity,
        }, { status: 201 });
    } catch (error) {
        console.error("Redeem error:", error);
        return NextResponse.json({ error: "خطأ في معالجة العملية" }, { status: 500 });
    }
}
