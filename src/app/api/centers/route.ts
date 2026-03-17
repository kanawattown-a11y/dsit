import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
        }

        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";

        const centers = await prisma.distributionCenter.findMany({
            where: {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { region: { contains: search, mode: "insensitive" } },
                ],
            },
            include: {
                distributors: { select: { id: true, fullName: true, phone: true } },
                inspector: { select: { id: true, fullName: true, phone: true } },
                _count: { select: { transactions: true } }
            },
            orderBy: { createdAt: "desc" },
        });

        // Get available distributors (not assigned to any center)
        const availableDistributors = await prisma.user.findMany({
            where: { role: "DISTRIBUTOR", status: "APPROVED", distributorCenterId: null },
            select: { id: true, fullName: true, nationalId: true }
        });

        const availableInspectors = await prisma.user.findMany({
            where: { role: "INSPECTOR", status: "APPROVED" },
            select: { id: true, fullName: true, nationalId: true }
        });

        return NextResponse.json({ centers, availableDistributors, availableInspectors });
    } catch (error) {
        console.error("Centers GET error:", error);
        return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        const data = await req.json();

        if (!data.name || !data.type || !data.region) {
            return NextResponse.json({ error: "الرجاء تعبئة الحقول الأساسية" }, { status: 400 });
        }

        const center = await prisma.distributionCenter.create({
            data: {
                name: data.name,
                type: data.type,
                region: data.region,
                address: data.address || null,
                phone: data.phone || null,
                inspectorId: data.inspectorId || null,
            },
        });

        // If a distributor was selected, assign them to this center
        if (data.distributorId) {
            await prisma.user.update({
                where: { id: data.distributorId },
                data: { distributorCenterId: center.id },
            });
        }

        return NextResponse.json({ success: true, center });
    } catch (error: any) {
        console.error("Center POST error:", error);
        return NextResponse.json({ error: error.message || "حدث خطأ أثناء الإنشاء" }, { status: 500 });
    }
}
