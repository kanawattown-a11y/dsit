import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                nationalId: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                region: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                headOfFamilyBook: {
                    include: { members: true },
                },
                vehicleRegistrations: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, role, region, phone, email } = body;

        // Prevent admin from demoting themselves
        if (role && id === session.user.id && role !== "ADMIN") {
            return NextResponse.json({ error: "لا يمكنك تغيير دورك الخاص" }, { status: 400 });
        }

        // Validate role value
        const validRoles = ["ADMIN", "USER", "INSPECTOR", "DISTRIBUTOR"];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
        }

        // Get current user data before update (for role change detection)
        const currentUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true, fullName: true },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (role) updateData.role = role;
        if (region !== undefined) updateData.region = region;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                role: true,
                status: true,
            },
        });

        // Determine audit action
        const auditAction = role && role !== currentUser.role ? "CHANGE_ROLE" : "UPDATE_USER";

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: auditAction,
                entity: "User",
                entityId: id,
                performedById: session.user.id,
                details: {
                    ...updateData,
                    ...(role && role !== currentUser.role ? { previousRole: currentUser.role, newRole: role } : {}),
                },
            },
        });

        // Notify user of role change
        if (role && role !== currentUser.role) {
            const roleNames: Record<string, string> = {
                ADMIN: "مدير نظام",
                USER: "مواطن",
                INSPECTOR: "مفتش",
                DISTRIBUTOR: "موزع معتمد",
            };
            await prisma.notification.create({
                data: {
                    title: "تغيير الدور",
                    body: `تم تغيير دورك إلى: ${roleNames[role] || role}. يرجى تسجيل الخروج وإعادة الدخول لتفعيل الصلاحيات الجديدة.`,
                    type: "SYSTEM",
                    targetUserId: id,
                    sentById: session.user.id,
                },
            });
        }

        // Notify user of status change
        if (status) {
            const statusMessages: Record<string, string> = {
                APPROVED: "تمت الموافقة على حسابك. يمكنك الآن تسجيل الدخول",
                REJECTED: "تم رفض طلب تسجيلك. يرجى التواصل مع الإدارة",
                SUSPENDED: "تم تعليق حسابك. يرجى التواصل مع الإدارة",
            };

            if (statusMessages[status]) {
                await prisma.notification.create({
                    data: {
                        title: "تحديث حالة الحساب",
                        body: statusMessages[status],
                        type: "SYSTEM",
                        targetUserId: id,
                        sentById: session.user.id,
                    },
                });
            }
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.user.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: "DELETE_USER",
                entity: "User",
                entityId: id,
                performedById: session.user.id,
            },
        });

        return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
    }
}
