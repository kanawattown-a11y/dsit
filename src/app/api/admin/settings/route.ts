import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const settings = await prisma.systemSetting.findMany({
            orderBy: { key: "asc" }
        });

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Admin Settings GET error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الإعدادات" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const data = await req.json();
        const updatedBy = (session.user as any).id;

        // Upsert all provided settings
        if (Array.isArray(data.settings)) {
            for (const s of data.settings) {
                if (s.key) {
                    await prisma.systemSetting.upsert({
                        where: { key: s.key },
                        update: { value: String(s.value), description: s.description, updatedBy },
                        create: { key: s.key, value: String(s.value), description: s.description, updatedBy }
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Settings POST error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء حفظ الإعدادات" }, { status: 500 });
    }
}
