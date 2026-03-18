import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "DISTRIBUTOR") {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const distributorId = (session.user as any).id;
        
        // Find distributor's center
        const user = await prisma.user.findUnique({
            where: { id: distributorId },
            include: {
                distributorCenter: {
                    include: {
                        inventories: {
                            include: { material: true }
                        }
                    }
                }
            }
        });

        if (!user || !user.distributorCenter) {
            return NextResponse.json({ error: "لم يتم تعيينك على أي مركز بعد." }, { status: 400 });
        }

        return NextResponse.json({
            center: user.distributorCenter,
            inventories: user.distributorCenter.inventories
        });
    } catch (error: any) {
        return NextResponse.json({ error: "حدث خطأ أثناء جلب المخزون." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "DISTRIBUTOR") {
            return NextResponse.json({ error: "غير مصرح لك" }, { status: 401 });
        }

        const data = await req.json();
        const { materialId, amount, notes } = data;
        
        if (!materialId || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: "الرجاء إدخال كمية صحيحة." }, { status: 400 });
        }

        const distributorId = (session.user as any).id;
        const user = await prisma.user.findUnique({ where: { id: distributorId }});
        
        if (!user || !user.distributorCenterId) {
             return NextResponse.json({ error: "لم يتم تعيينك على أي مركز بعد." }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create or update daily report based on composite key (center, material, date)
        await prisma.dailyConsumptionReport.upsert({
            where: {
                centerId_materialId_reportDate: {
                    centerId: user.distributorCenterId,
                    materialId: materialId,
                    reportDate: today
                }
            },
            update: {
                distributorAmount: parseFloat(amount),
                distributorNotes: notes || null,
                status: "PENDING"
            },
            create: {
                centerId: user.distributorCenterId,
                materialId: materialId,
                reportDate: today,
                distributorAmount: parseFloat(amount),
                distributorNotes: notes || null,
                status: "PENDING"
            }
        });

        return NextResponse.json({ success: true, message: "تم إرسال بلاغ الاستهلاك بنجاح بانتظار تصديق المفتش." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
