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

        const category = await prisma.allocationCategory.update({
            where: { id },
            data: body,
        });

        return NextResponse.json({ category });
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
        await prisma.allocationCategory.delete({ where: { id } });

        return NextResponse.json({ message: "تم الحذف بنجاح" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
