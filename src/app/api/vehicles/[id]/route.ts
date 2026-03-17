import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const id = (await params).id;
        const body = await req.json();
        const { isActive } = body;

        const vehicle = await prisma.vehicleRegistration.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json({ success: true, vehicle });
    } catch (error: any) {
        console.error("Vehicle PUT Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 });
    }
}
