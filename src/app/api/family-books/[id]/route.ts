import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { bookNumber, region, address, members, status } = body;

        // Check if book exists
        const existingBook = await prisma.familyBook.findUnique({
            where: { id },
        });

        if (!existingBook) {
            return NextResponse.json({ error: "الدفتر غير موجود" }, { status: 404 });
        }

        if (bookNumber && bookNumber !== existingBook.bookNumber) {
            const existingNumber = await prisma.familyBook.findUnique({
                where: { bookNumber },
            });
            if (existingNumber) {
                return NextResponse.json({ error: "رقم الدفتر موجود مسبقاً" }, { status: 409 });
            }
        }

        // To update members, we delete existing and recreate them (simple approach) 
        // Or update individually. Deleting and recreating is simpler for arrays.

        await prisma.familyMember.deleteMany({
            where: { familyBookId: id },
        });

        const updatedBook = await prisma.familyBook.update({
            where: { id },
            data: {
                bookNumber: bookNumber || existingBook.bookNumber,
                region: region !== undefined ? region : existingBook.region,
                address: address !== undefined ? address : existingBook.address,
                status: status !== undefined ? status : existingBook.status,
                members: {
                    create: (members || []).map((m: any) => ({
                        fullName: m.fullName,
                        nationalId: m.nationalId || null,
                        birthDate: m.birthDate ? new Date(m.birthDate) : null,
                        relationship: m.relationship,
                    })),
                },
            },
            include: {
                headOfFamily: { select: { id: true, fullName: true } },
                members: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "UPDATE_FAMILY_BOOK",
                entity: "FamilyBook",
                entityId: id,
                performedById: session.user.id,
                details: { bookNumber, region },
            },
        });

        return NextResponse.json({ familyBook: updatedBook });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.familyBook.delete({
            where: { id },
        });

        await prisma.auditLog.create({
            data: {
                action: "DELETE_FAMILY_BOOK",
                entity: "FamilyBook",
                entityId: id,
                performedById: session.user.id,
            },
        });

        return NextResponse.json({ success: true, message: "تم الحذف بنجاح" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
