import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
        }

        // Validate password strength
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(newPassword)) {
            return NextResponse.json({ error: "كلمة المرور ضعيفة" }, { status: 400 });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json({ error: "الرابط غير صالح أو انتهت صلاحيته" }, { status: 400 });
        }

        if (resetToken.expiresAt < new Date()) {
            // Cleanup expired token
            await prisma.passwordResetToken.delete({ where: { token } });
            return NextResponse.json({ error: "انتهت صلاحية رابط إعادة التعيين" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Transaction to update password and delete token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.delete({
                where: { token },
            }),
            prisma.auditLog.create({
                data: {
                    action: "PASSWORD_RESET",
                    entity: "User",
                    entityId: resetToken.userId,
                    performedById: resetToken.userId,
                    details: { method: "token_reset" },
                },
            }),
        ]);

        return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
    }
}
