import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "الرجاء تسجيل الدخول" }, { status: 401 });
        }

        const body = await request.json();
        const { bookNumber, region, address, members, documentPhotos } = body;

        if (!bookNumber || !documentPhotos || documentPhotos.length === 0) {
            return NextResponse.json({ error: "رقم الدفتر المرفق وصور الدفتر مطلوبة" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, fullName: true, nationalId: true, status: true }
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        // Check if already has a family book
        const existingBook = await prisma.familyBook.findUnique({
            where: { headOfFamilyId: user.id },
        });

        if (existingBook) {
            return NextResponse.json({ error: "لديك دفتر عائلة مسجل بالفعل" }, { status: 409 });
        }

        // Check book number uniqueness globally
        const existingNumber = await prisma.familyBook.findUnique({
            where: { bookNumber },
        });

        if (existingNumber) {
            return NextResponse.json({ error: "رقم الدفتر هذا مسجل مسبقاً في النظام" }, { status: 409 });
        }

        const familyBook = await prisma.familyBook.create({
            data: {
                bookNumber,
                headOfFamilyId: user.id,
                region,
                address,
                documentPhotos,
                status: "PENDING", // Must be approved by admin
                members: {
                    create: (members || []).map((m: any) => ({
                        fullName: m.fullName,
                        nationalId: m.nationalId || null,
                        birthDate: m.birthDate ? new Date(m.birthDate) : null,
                        relationship: m.relationship,
                        personalPhoto: m.personalPhoto || null,
                    })),
                },
            },
            include: {
                members: true,
            },
        });

        // Notify admins about the new family book submission
        await prisma.notification.create({
            data: {
                title: "طلب دفتر عائلة جديد",
                body: `قام المواطن ${user.fullName} برفع طلب دفتر عائلة (رقم ${bookNumber}) للمراجعة.`,
                type: "SYSTEM",
                targetRole: "ADMIN",
            },
        });

        return NextResponse.json(
            { message: "تم إرسال طلب إنشاء دفتر العائلة للإدارة بنجاح. سيتم مراجعته وتفعيله قريباً.", familyBook }, 
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Family book creation error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء إرسال الطلب: " + error.message }, { status: 500 });
    }
}
