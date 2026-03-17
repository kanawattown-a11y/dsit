import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminCharts from "./AdminCharts";

export const dynamic = "force-dynamic";

async function getStats() {
    const [
        totalUsers,
        pendingUsers,
        approvedUsers,
        totalFamilyBooks,
        totalCenters,
        activeCenters,
        totalTransactions,
        todayTransactions,
        totalAllocations,
        recentUsers,
        centersByTypeRaw,
        usersByRoleRaw,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { status: "APPROVED" } }),
        prisma.familyBook.count(),
        prisma.distributionCenter.count(),
        prisma.distributionCenter.count({ where: { isActive: true } }),
        prisma.transaction.count(),
        prisma.transaction.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
        }),
        prisma.allocation.count({ where: { isActive: true } }),
        prisma.user.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                fullName: true,
                nationalId: true,
                createdAt: true,
                region: true,
            },
        }),
        prisma.distributionCenter.groupBy({
            by: ['type'],
            _count: { id: true }
        }),
        prisma.user.groupBy({
            by: ['role'],
            _count: { id: true }
        })
    ]);

    const centerTypesMap: Record<string, string> = { BAKERY: "مخابز", GAS_STATION: "معتمدي غاز", SUPPLY_CENTER: "صالات السورية", FUEL_STATION: "محطات وقود" };
    const centersChart = centersByTypeRaw.map(c => ({
        name: centerTypesMap[c.type] || c.type,
        count: c._count.id
    })).sort((a, b) => b.count - a.count);

    const rolesMap: Record<string, string> = { ADMIN: "مدير نظام", USER: "مواطن (عائلة)", INSPECTOR: "مفتش تمويني", DISTRIBUTOR: "موزع" };
    const usersChart = usersByRoleRaw.map(u => ({
        name: rolesMap[u.role] || u.role,
        count: u._count.id
    })).filter(u => u.count > 0).sort((a, b) => b.count - a.count);

    return {
        totalUsers,
        pendingUsers,
        approvedUsers,
        totalFamilyBooks,
        totalCenters,
        activeCenters,
        totalTransactions,
        todayTransactions,
        totalAllocations,
        recentUsers,
        centersChart,
        usersChart,
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">لوحة التحكم</h1>
                <p className="page-subtitle">نظرة عامة على النظام والإحصائيات</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-4 mb-8">
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalUsers.toLocaleString("en-US")}</div>
                        <div className="stat-label">إجمالي المستخدمين</div>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pendingUsers.toLocaleString("en-US")}</div>
                        <div className="stat-label">طلبات بانتظار الموافقة</div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalFamilyBooks.toLocaleString("en-US")}</div>
                        <div className="stat-label">دفاتر العائلة</div>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-icon danger">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.todayTransactions.toLocaleString("en-US")}</div>
                        <div className="stat-label">معاملات اليوم</div>
                    </div>
                </div>
            </div>

            {/* Second Row Stats */}
            <div className="grid grid-3 mb-8">
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalAllocations.toLocaleString("en-US")}</div>
                        <div className="stat-label">مخصصات نشطة</div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <path d="M9 22v-4h6v4" />
                            <line x1="8" y1="6" x2="10" y2="6" />
                            <line x1="14" y1="6" x2="16" y2="6" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.activeCenters.toLocaleString("en-US")}</div>
                        <div className="stat-label">مراكز توزيع نشطة</div>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                            <line x1="8" y1="6" x2="16" y2="6" />
                            <line x1="8" y1="10" x2="16" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalTransactions.toLocaleString("en-US")}</div>
                        <div className="stat-label">إجمالي المعاملات</div>
                    </div>
                </div>
            </div>

            {/* Recharts Analytics Panel */}
            <AdminCharts usersChart={stats.usersChart} centersChart={stats.centersChart} />

            {/* Pending Users Table */}
            {stats.pendingUsers > 0 && (
                <div className="card mb-8 animate-slide-up">
                    <div className="card-header">
                        <h2 className="card-title">طلبات التسجيل المعلقة</h2>
                        <Link href="/admin/users?status=PENDING" className="btn btn-secondary btn-sm">
                            عرض الكل
                        </Link>
                    </div>
                    <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>الرقم الوطني</th>
                                    <th>المنطقة</th>
                                    <th>تاريخ الطلب</th>
                                    <th>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                                        <td dir="ltr">{user.nationalId}</td>
                                        <td>{user.region || "—"}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString("en-US")}</td>
                                        <td>
                                            <Link href={`/admin/users?id=${user.id}`} className="btn btn-primary btn-sm">
                                                مراجعة
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="card animate-slide-up">
                <div className="card-header">
                    <h2 className="card-title">إجراءات سريعة</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
                    <Link href="/admin/users?status=PENDING" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <polyline points="17 11 19 13 23 9" />
                        </svg>
                        مراجعة طلبات التسجيل
                    </Link>
                    <Link href="/admin/allocations" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        إدارة المخصصات
                    </Link>
                    <Link href="/admin/notifications" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        إرسال إشعارات
                    </Link>
                    <Link href="/admin/family-books" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14" /><path d="M5 12h14" />
                        </svg>
                        إضافة دفتر عائلة
                    </Link>
                </div>
            </div>
        </div>
    );
}
