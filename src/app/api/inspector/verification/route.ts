import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const inspectorId = (session.user as any).id;
        
        // Find centers supervised by this inspector
        const centers = await prisma.distributionCenter.findMany({
            where: { inspectorId: inspectorId, isActive: true },
            select: { id: true }
        });
        
        const centerIds = centers.map(c => c.id);

        if (centerIds.length === 0) {
            return NextResponse.json({ reports: [] });
        }

        const reports = await prisma.dailyConsumptionReport.findMany({
            where: {
                centerId: { in: centerIds },
                status: "PENDING"
            },
            include: {
                center: { select: { id: true, name: true, region: true } },
                material: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ reports });
    } catch (error: any) {
        return NextResponse.json({ error: "حدث خطأ أثناء جلب التقارير." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "INSPECTOR") {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const data = await req.json();
        const { reportId, inspectorAmount, inspectorNotes } = data;
        const inspectorId = (session.user as any).id;
        
        if (!reportId || isNaN(parseFloat(inspectorAmount))) {
            return NextResponse.json({ error: "الرجاء إدخال رقم صحيح." }, { status: 400 });
        }

        const report = await prisma.dailyConsumptionReport.findUnique({
            where: { id: reportId }
        });

        if (!report || report.status !== "PENDING") {
             return NextResponse.json({ error: "هذا التقرير غير موجود أو تم معالجته مسبقاً." }, { status: 400 });
        }

        const isMatched = Math.abs(report.distributorAmount - parseFloat(inspectorAmount)) < 0.01;

        await prisma.$transaction(async (tx) => {
            // Update Report
            await tx.dailyConsumptionReport.update({
                where: { id: reportId },
                data: {
                    inspectorAmount: parseFloat(inspectorAmount),
                    inspectorNotes: inspectorNotes || null,
                    status: isMatched ? "MATCHED" : "DISCREPANCY",
                }
            });

            // If matched perfectly, deduct inventory and log transaction.
            if (isMatched) {
                // Find existing inventory to safely decrement
                const inv = await tx.centerInventory.findUnique({
                    where: { centerId_materialId: { centerId: report.centerId, materialId: report.materialId } }
                });

                if (inv) {
                    await tx.centerInventory.update({
                        where: { id: inv.id },
                        data: { quantity: { decrement: parseFloat(inspectorAmount) } }
                    });

                    await tx.inventoryTransaction.create({
                        data: {
                            inventoryId: inv.id,
                            materialId: report.materialId,
                            type: "CONSUMPTION",
                            amount: parseFloat(inspectorAmount),
                            notes: "صرف يومي موثق ومطابق برقم: " + report.id,
                            processedById: inspectorId
                        }
                    });
                }
            }
        });

        if (isMatched) {
             return NextResponse.json({ success: true, message: "تمت المطابقة بنجاح وتم خصم الرصيد أصولاً." });
        } else {
             return NextResponse.json({ success: true, message: "تم تسجيل تضارب في الأرقام. رفع النظام إنذاراً للإدارة للتحقيق." });
        }
        
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
