import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        const id = (await params).id;
        const data = await req.json();

        const updateData: any = {};
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.inspectorId !== undefined) updateData.inspectorId = data.inspectorId || null;

        // Update center fields (isActive, inspectorId)
        const center = await prisma.distributionCenter.update({
            where: { id },
            data: updateData,
        });

        // Handle distributor assignment (update User's distributorCenterId)
        if (data.assignDistributorId !== undefined) {
            // First, unassign any existing distributors from this center
            await prisma.user.updateMany({
                where: { distributorCenterId: id },
                data: { distributorCenterId: null },
            });

            // Then assign the new distributor if provided
            if (data.assignDistributorId) {
                await prisma.user.update({
                    where: { id: data.assignDistributorId },
                    data: { distributorCenterId: id },
                });
            }
        }

        // Return the updated center with relations
        const updatedCenter = await prisma.distributionCenter.findUnique({
            where: { id },
            include: {
                distributors: { select: { id: true, fullName: true, phone: true } },
                inspector: { select: { id: true, fullName: true, phone: true } },
                _count: { select: { transactions: true } },
            },
        });

        return NextResponse.json({ success: true, center: updatedCenter });
    } catch (error: any) {
        console.error("Center PUT error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
