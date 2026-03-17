import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { bookNumber: { contains: search } },
                { headOfFamily: { fullName: { contains: search, mode: "insensitive" } } },
                { headOfFamily: { nationalId: { contains: search } } },
            ];
        }

        const familyBooks = await prisma.familyBook.findMany({
            where,
            include: {
                headOfFamily: { select: { id: true, fullName: true, nationalId: true } },
                members: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({ familyBooks });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { bookNumber, headOfFamilyNationalId, region, address, members } = await request.json();

        // Find user by national ID
        const user = await prisma.user.findUnique({
            where: { nationalId: headOfFamilyNationalId },
        });

        if (!user) {
            return NextResponse.json({ error: "لم يتم العثور على مستخدم بهذا الرقم الوطني" }, { status: 404 });
        }

        // Check if already has a family book
        const existingBook = await prisma.familyBook.findUnique({
            where: { headOfFamilyId: user.id },
        });

        if (existingBook) {
            return NextResponse.json({ error: "هذا المستخدم لديه دفتر عائلة بالفعل" }, { status: 409 });
        }

        // Check book number uniqueness
        const existingNumber = await prisma.familyBook.findUnique({
            where: { bookNumber },
        });

        if (existingNumber) {
            return NextResponse.json({ error: "رقم الدفتر موجود مسبقاً" }, { status: 409 });
        }

        const familyBook = await prisma.familyBook.create({
            data: {
                bookNumber,
                headOfFamilyId: user.id,
                region,
                address,
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

        return NextResponse.json({ familyBook }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
