import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const materials = await prisma.material.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ materials });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, unit } = await req.json();

        if (!name || !unit) {
            return NextResponse.json({ error: "الاسم والوحدة مطلوبان" }, { status: 400 });
        }

        const existing = await prisma.material.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ error: "تم إضاафة هذه المادة مسبقاً" }, { status: 400 });
        }

        const newMaterial = await prisma.material.create({
            data: { name, unit }
        });

        return NextResponse.json({ material: newMaterial, message: "تم تسجيل المادة بنجاح" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
