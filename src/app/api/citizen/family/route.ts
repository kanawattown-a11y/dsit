import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "USER") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        // Fetch User's family book where they are head OR a member
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                headOfFamilyBook: {
                    include: { members: true }
                }
            }
        });

        if (!user) return NextResponse.json({ error: "مستخدم غير موجود" }, { status: 404 });

        // If they are head of family
        if (user.headOfFamilyBook) {
            return NextResponse.json({
                isHead: true,
                familyBook: user.headOfFamilyBook
            });
        }

        // If they are just a member, try finding their family book via National ID
        const memberRecord = await prisma.familyMember.findFirst({
            where: { nationalId: user.nationalId },
            include: {
                familyBook: {
                    include: { headOfFamily: { select: { fullName: true } }, members: true }
                }
            }
        });

        if (memberRecord) {
            return NextResponse.json({
                isHead: false,
                familyBook: memberRecord.familyBook
            });
        }

        // No family book found
        return NextResponse.json({ isHead: false, familyBook: null });
    } catch (error) {
        console.error("Family Book API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب دفتر العائلة" }, { status: 500 });
    }
}
