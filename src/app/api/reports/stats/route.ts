import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

        // Aggregate transactions by center
        const volumeByCategory = await prisma.transaction.groupBy({
            by: ['centerId'],
            _sum: { quantity: true },
        });

        // Get total stats
        const [totalTransactions, totalCenters, totalUsers, recentTransactions] = await Promise.all([
            prisma.transaction.count(),
            prisma.distributionCenter.count({ where: { isActive: true } }),
            prisma.user.count({ where: { role: "USER" } }),
            prisma.transaction.count({
                where: { createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } }
            }),
        ]);

        // Get centers mapping for labels
        const centers = await prisma.distributionCenter.findMany({ select: { id: true, name: true, type: true } });

        const topCenters = volumeByCategory.map(v => ({
            centerName: centers.find(c => c.id === v.centerId)?.name || 'غير معروف',
            volume: v._sum.quantity || 0,
            type: centers.find(c => c.id === v.centerId)?.type,
        })).sort((a, b) => b.volume - a.volume).slice(0, 5);

        // Get daily transactions for the last 7 days
        const days = [];
        const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);

            const count = await prisma.transaction.count({
                where: { createdAt: { gte: d, lt: nextDay } }
            });

            days.push({
                label: dayNames[d.getDay()],
                date: d.toISOString().split('T')[0],
                count,
            });
        }

        return NextResponse.json({
            stats: { totalTransactions, totalCenters, totalUsers, recentTransactions },
            topCenters,
            weeklyChart: days,
        });
    } catch (error) {
        console.error("Reports stats error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء تحميل الإحصائيات" }, { status: 500 });
    }
}
