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
        const status = searchParams.get("status") || "";
        const role = searchParams.get("role") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = {};

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { nationalId: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status) where.status = status;
        if (role) where.role = role;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    nationalId: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    region: true,
                    idPhotoFront: true,
                    idPhotoBack: true,
                    selfiePhoto: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({ users, total, page, limit });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
