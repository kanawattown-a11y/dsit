import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";

        const centers = await prisma.distributionCenter.findMany({
            where: {
                isActive: true,
                ...(search ? { name: { contains: search, mode: "insensitive" } } : {})
            },
            include: {
                inventories: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ centers });
    } catch (error) {
        console.error("Admin Inventory GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل المخزون" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const data = await req.json(); // { centerId, category, quantity, type, notes }
        const { centerId, category, quantity, type, notes } = data;
        const amount = parseFloat(quantity);

        if (!centerId || !category || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: "الرجاء تعبئة كافة الحقول بشكل صحيح" }, { status: 400 });
        }

        const adminId = (session.user as any).id;

        // Perform inside a transaction
        await prisma.$transaction(async (tx) => {
            // Upsert Center Inventory
            const inventory = await tx.centerInventory.upsert({
                where: { centerId_category: { centerId, category } },
                update: {
                    quantity: {
                        [type === "IN" ? "increment" : "decrement"]: amount
                    }
                },
                create: {
                    centerId,
                    category,
                    quantity: type === "IN" ? amount : 0
                }
            });

            // Create Transaction Log
            await tx.inventoryTransaction.create({
                data: {
                    inventoryId: inventory.id,
                    type: type || "IN",
                    amount: amount,
                    notes: notes || null,
                    processedById: adminId
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Inventory POST error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء حفظ المخزون" }, { status: 500 });
    }
}
