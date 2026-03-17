import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "DISTRIBUTOR" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                distributorCenter: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        address: true,
                        region: true,
                        isActive: true,
                        phone: true,
                    }
                }
            }
        });

        const center = user?.distributorCenter;

        if (!center) {
            return NextResponse.json({ center: null, message: "لم يتم تعيينك لأي مركز توزيع بعد" });
        }

        return NextResponse.json({ center });
    } catch (error) {
        console.error("My Center error:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
