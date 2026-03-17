import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");

        const where: any = search ? {
            OR: [
                { plateNumber: { contains: search, mode: "insensitive" } },
                { user: { fullName: { contains: search, mode: "insensitive" } } },
                { user: { nationalId: { contains: search } } },
            ],
        } : {};

        const [vehicles, total] = await Promise.all([
            prisma.vehicleRegistration.findMany({
                where,
                include: {
                    user: {
                        select: {
                            fullName: true,
                            nationalId: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.vehicleRegistration.count({ where }),
        ]);

        return NextResponse.json({ vehicles, total, page, limit });
    } catch (error: any) {
        console.error("Vehicles GET Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء جلب بيانات المركبات" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 401 });
        }

        const body = await req.json();
        const { nationalId, plateNumber, vehicleType, fuelType, engineSize } = body;

        if (!nationalId || !plateNumber || !vehicleType || !fuelType) {
            return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { nationalId },
        });

        if (!user) {
            return NextResponse.json({ error: "لم يتم العثور على مستخدم بهذا الرقم الوطني" }, { status: 404 });
        }

        const vehicle = await prisma.vehicleRegistration.create({
            data: {
                userId: user.id,
                plateNumber,
                vehicleType,
                fuelType,
                engineSize: engineSize ? parseFloat(engineSize) : null,
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        nationalId: true,
                    },
                },
            },
        });

        return NextResponse.json({ success: true, vehicle });
    } catch (error: any) {
        console.error("Vehicle POST Error:", error);
        return NextResponse.json({ error: error.message || "حدث خطأ أثناء تسجيل المركبة" }, { status: 500 });
    }
}
