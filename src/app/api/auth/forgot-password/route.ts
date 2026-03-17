import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This is a simplified forgot-password handler.
// In production, integrate with an email provider (SendGrid, Resend, etc.)
export async function POST(request: Request) {
    try {
        const { nationalId } = await request.json();

        if (!nationalId) {
            return NextResponse.json({ error: "الرقم الوطني مطلوب" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { nationalId },
            select: { id: true, email: true, fullName: true },
        });

        // Always return success to prevent user enumeration
        if (!user || !user.email) {
            return NextResponse.json({ message: "إذا كان الرقم مسجلاً، ستصل رسالة للبريد الإلكتروني" });
        }

        // Generate a secure 32-byte reset token
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate old tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Save new token
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // TODO: send email using SendGrid / Resend / Nodemailer
        // The reset link would be: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}
        // For now, log to console for development
        console.log(`[Password Reset] User: ${user.email} | Token: ${token} | Expires: ${expiresAt}`);

        return NextResponse.json({
            message: "إذا كان الرقم الوطني مسجلاً، ستصل رسالة إلى بريدك الإلكتروني خلال دقائق",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
