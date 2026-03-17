import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import rateLimit from "@/lib/rate-limit";
import { z } from "zod";

const limiter = rateLimit({
    interval: 60000,
    uniqueTokenPerInterval: 500,
});

const registerSchema = z.object({
    fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    nationalId: z.string().min(8, "الرقم الوطني يجب أن يكون 8 أرقام على الأقل").max(20),
    email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
    phone: z.string().optional(),
    password: z
        .string()
        .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
        .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
        .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
    region: z.string().optional(),
    idPhotoFront: z.string().min(1, "صورة الوجه الأمامي للهوية مطلوبة"),
    idPhotoBack: z.string().min(1, "صورة الوجه الخلفي للهوية مطلوبة"),
    selfiePhoto: z.string().min(1, "صورة السيلفي للمطابقة مطلوبة"),
});

export async function POST(request: Request) {
    try {
        // ── Rate Limiting: max 5 requests per IP per minute ──
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "unknown";

        try {
            await limiter.check(5, `register:${ip}`);
        } catch (e: any) {
            return NextResponse.json(
                { error: "محاولات كثيرة جداً. يرجى الانتظار دقيقة واحدة ثم المحاولة مرة أخرى" },
                { status: 429 }
            );
        }

        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = parsed.error.errors[0];
            return NextResponse.json(
                { error: firstError.message },
                { status: 400 }
            );
        }

        const { fullName, nationalId, email, phone, password, region, idPhotoFront, idPhotoBack, selfiePhoto } = parsed.data;

        // Check if national ID already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { nationalId },
                    ...(email ? [{ email }] : []),
                ],
            },
        });

        if (existingUser) {
            if (existingUser.nationalId === nationalId) {
                return NextResponse.json(
                    { error: "الرقم الوطني مسجل مسبقاً" },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: "البريد الإلكتروني مسجل مسبقاً" },
                { status: 409 }
            );
        }

        // Hash password with strong bcrypt cost
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with PENDING status
        const user = await prisma.user.create({
            data: {
                fullName,
                nationalId,
                email: email || null,
                phone: phone || null,
                password: hashedPassword,
                region: region || null,
                idPhotoFront,
                idPhotoBack,
                selfiePhoto,
                role: "USER",
                status: "PENDING",
            },
            select: {
                id: true,
                fullName: true,
                nationalId: true,
                status: true,
                createdAt: true,
            },
        });

        // Create notification for admins
        await prisma.notification.create({
            data: {
                title: "طلب تسجيل جديد",
                body: `${fullName} يطلب تسجيل حساب جديد - الرقم الوطني: ${nationalId}`,
                type: "SYSTEM",
                targetRole: "ADMIN",
            },
        });

        return NextResponse.json(
            { message: "تم تقديم طلب التسجيل بنجاح. سيتم مراجعته من قبل الإدارة وستصلك إشعار عند الموافقة", user },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى" },
            { status: 500 }
        );
    }
}
