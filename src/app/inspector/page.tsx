"use client";

import { useState, useEffect } from "react";

interface Center {
    id: string;
    name: string;
    type: string;
    address: string | null;
    region: string | null;
    isActive: boolean;
    _count: { transactions: number; inspectionReports: number };
}

const typeLabels: Record<string, string> = {
    BAKERY: "فرن / مخبز",
    GAS_STATION: "محطة غاز",
    SUPPLY_CENTER: "مركز تموين",
    FUEL_STATION: "محطة وقود",
};

export default function InspectorDashboard() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [stats, setStats] = useState({ recentViolations: 0, todayTransactions: 0, totalWarnings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/inspector/centers")
            .then((r) => r.json())
            .then((d) => {
                setCenters(d.centers || []);
                if (d.stats) setStats(d.stats);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">لوحة المفتش</h1>
                <p className="page-subtitle">مراقبة مراكز التوزيع وتقديم تقارير التفتيش</p>
            </div>

            {/* Quick Stats overview */}
            <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
                <div className="stat-card primary">
                    <div className="stat-icon primary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                            <path d="M9 22v-4h6v4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{centers.length}</div>
                        <div className="stat-label">مراكز تحت إشرافك</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon success">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 10v12" />
                            <path d="M15 5.86V14" />
                            <path d="M10 21V10" />
                            <path d="M18 10v4" />
                            <path d="M5 21V14" />
                            <path d="M21 21H3" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.todayTransactions}</div>
                        <div className="stat-label">حركات المراكز اليوم</div>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon danger">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.recentViolations}</div>
                        <div className="stat-label">مخالفات أخر 30 يوم</div>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon warning">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.totalWarnings}</div>
                        <div className="stat-label">إجمالي التنبيهات المسجلة</div>
                    </div>
                </div>
            </div>

            {/* Centers List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">المراكز المخصصة لك</h2>
                </div>

                {loading ? (
                    <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                        <div className="skeleton" style={{ width: 200, height: 20, margin: "0 auto" }} />
                    </div>
                ) : centers.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        </svg>
                        <h3>لم يتم تخصيص مراكز لك بعد</h3>
                        <p>سيقوم المدير بتخصيص مراكز التوزيع لمراقبتها</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>اسم المركز</th>
                                    <th>النوع</th>
                                    <th>العنوان</th>
                                    <th>الحالة</th>
                                    <th>المعاملات</th>
                                    <th>التقارير</th>
                                </tr>
                            </thead>
                            <tbody>
                                {centers.map((center) => (
                                    <tr key={center.id}>
                                        <td className="font-semibold">{center.name}</td>
                                        <td>{typeLabels[center.type] || center.type}</td>
                                        <td>{center.address || "—"}</td>
                                        <td>
                                            <span className={`badge ${center.isActive ? "badge-success" : "badge-gray"}`}>
                                                {center.isActive ? "نشط" : "متوقف"}
                                            </span>
                                        </td>
                                        <td>{center._count?.transactions || 0}</td>
                                        <td>{center._count?.inspectionReports || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
