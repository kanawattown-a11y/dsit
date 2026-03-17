import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateQRPayload, encryptQRToken } from "@/lib/qr-encryption";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        // Get user's family book
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                headOfFamilyBook: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        // Generate payload
        const payload = generateQRPayload(
            user.id,
            user.headOfFamilyBook?.id
        );

        // Encrypt the payload
        const token = encryptQRToken(payload);

        // Generate QR code image as data URL
        const qrImage = await QRCode.toDataURL(token, {
            width: 256,
            margin: 2,
            color: {
                dark: "#1B2A4A",
                light: "#FFFFFF",
            },
            errorCorrectionLevel: "H",
        });

        return NextResponse.json({
            token,
            qrImage,
            expiresAt: new Date(payload.timestamp + 5 * 60 * 1000).toISOString(),
        });
    } catch (error) {
        console.error("QR generation error:", error);
        return NextResponse.json({ error: "خطأ في إنشاء رمز QR" }, { status: 500 });
    }
}
