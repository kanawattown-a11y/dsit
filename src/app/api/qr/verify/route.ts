import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptQRToken } from "@/lib/qr-encryption";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "DISTRIBUTOR" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { token } = await request.json();
        if (!token) {
            return NextResponse.json({ error: "رمز QR مطلوب" }, { status: 400 });
        }

        // Decrypt and validate
        let payload;
        try {
            payload = decryptQRToken(token);
        } catch (err: any) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        // ── Replay Attack Protection: Check if nonce was already used ──
        const existing = await prisma.usedQRNonce.findUnique({
            where: { nonce: payload.nonce },
        });

        if (existing) {
            return NextResponse.json(
                { error: "تم استخدام رمز QR هذا مسبقاً. يرجى طلب رمز جديد من المواطن" },
                { status: 400 }
            );
        }

        // Register the nonce as used (expires slightly after QR validity window)
        await prisma.usedQRNonce.create({
            data: {
                nonce: payload.nonce,
                userId: payload.userId,
                expiresAt: new Date(payload.timestamp + 10 * 60 * 1000), // 10 min grace
            },
        });

        // Get user info with allocations
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { // changed select to include to inherit base fields
                headOfFamilyBook: {
                    include: {
                        members: true,
                    },
                },
                allocations: {
                    where: { isActive: true, remainingQuota: { gt: 0 } },
                    include: {
                        period: {
                            include: { category: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "المواطن غير موجود" }, { status: 404 });
        }

        if (user.status !== "APPROVED") {
            return NextResponse.json({ error: "حساب المواطن غير مفعّل أو معلّق" }, { status: 403 });
        }

        // Filter allocations that have a valid (ACTIVE) period
        const validAllocations = user.allocations.filter((a: any) => a.period && a.period.status === "ACTIVE");

        return NextResponse.json({
            valid: true,
            citizen: {
                id: user.id,
                fullName: user.fullName,
                nationalId: user.nationalId,
                familyBook: user.headOfFamilyBook,
                memberCount: user.headOfFamilyBook?.members.length || 0,
            },
            allocations: validAllocations.map((a: any) => ({
                id: a.id,
                categoryName: a.period.category.nameAr,
                categoryType: a.period.category.type,
                unit: a.period.category.unit,
                periodName: a.period.name,
                totalQuota: a.totalQuota,
                remainingQuota: a.remainingQuota,
            })),
        });
    } catch (error) {
        console.error("QR verify error:", error);
        return NextResponse.json({ error: "خطأ في التحقق من الرمز" }, { status: 500 });
    }
}
