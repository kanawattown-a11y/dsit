import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            fullName: true,
            nationalId: true,
            email: true,
            phone: true,
            region: true,
            status: true,
            createdAt: true,
        },
    });

    if (!profile) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    return NextResponse.json({ profile });
}

const updateSchema = z.object({
    phone: z.string().optional(),
    email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
});

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { phone, email } = parsed.data;

    // Check email uniqueness if changing
    if (email && email !== "") {
        const existing = await prisma.user.findFirst({
            where: { email, NOT: { id: session.user.id } },
        });
        if (existing) {
            return NextResponse.json({ error: "البريد الإلكتروني مستخدم من قبل شخص آخر" }, { status: 409 });
        }
    }

    const profile = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            phone: phone || null,
            email: email || null,
        },
        select: {
            id: true, fullName: true, nationalId: true,
            email: true, phone: true, region: true, status: true, createdAt: true,
        },
    });

    return NextResponse.json({ profile });
}
