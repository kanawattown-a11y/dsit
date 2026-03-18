"use client";

import { useState, useEffect, Suspense } from "react";

type Report = {
    id: string;
    center: { id: string; name: string; region: string; type: string };
    material: { id: string; name: string; unit: string };
    reportDate: string;
    distributorAmount: number;
    inspectorAmount: number | null;
    distributorNotes: string | null;
    inspectorNotes: string | null;
    status: "PENDING" | "MATCHED" | "DISCREPANCY" | "RESOLVED";
    createdAt: string;
};

function ConsumptionRadarContent() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, DISCREPANCY, PENDING, MATCHED

    const fetchReports = async (f = filter) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/consumption-radar?filter=${f}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "MATCHED":
                return <span className="badge" style={{ background: "var(--success-bg)", color: "var(--success)" }}>متطابق ومصدق ✔</span>;
            case "PENDING":
                return <span className="badge" style={{ background: "var(--warning-bg)", color: "var(--warning-color)" }}>⏳ بانتظار المفتش</span>;
            case "DISCREPANCY":
                return <span className="badge" style={{ background: "var(--danger-bg)", color: "var(--danger)", animation: "pulse 2s infinite" }}>🚨 تضارب / تلاعب</span>;
            case "RESOLVED":
                return <span className="badge" style={{ background: "var(--gray-200)", color: "var(--gray-800)" }}>تمت المعالجة الإدارية</span>;
            default:
                return <span>{status}</span>;
        }
    };

    const countDiscrepancies = reports.filter(r => r.status === "DISCREPANCY").length;

    return (
        <main className="page-container">
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <span style={{ color: "var(--danger)" }}>📡</span> رادار المطابقة والرقابة
                    </h1>
                    <p className="page-description">مراقبة حية لتقارير الاستهلاك (الموزع ضد المفتش) لكشف التسريب والاختلاس.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid-3" style={{ marginBottom: "var(--space-6)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
                    <div className="stat-label">إنذارات التلاعب (النشطة)</div>
                    <div className="stat-value" style={{ color: "var(--danger)" }}>{countDiscrepancies}</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: "4px solid var(--warning-color)" }}>
                    <div className="stat-label">تقارير بانتظار التفتيش</div>
                    <div className="stat-value">{reports.filter(r => r.status === "PENDING").length}</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
                    <div className="stat-label">عمليات مطابقة وناجحة</div>
                    <div className="stat-value">{reports.filter(r => r.status === "MATCHED").length}</div>
                </div>
            </div>

            <div className="card table-container animate-fade-in" style={{ padding: 0 }}>
                <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
                    <h2 className="card-title">سجل الرادار المركزي</h2>
                    <select 
                        className="form-input" 
                        style={{ width: "fit-content", minWidth: "200px" }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="ALL">عرض جميع التقارير</option>
                        <option value="DISCREPANCY">🚨 عرض التلاعب والتضارب فقط</option>
                        <option value="PENDING">⏳ قيد انتظار المفتشين</option>
                        <option value="MATCHED">✔ المطابقات الناجحة المستمرة</option>
                    </select>
                </div>
                
                {loading ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري مسح البيانات...</div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--gray-500)" }}>
                        <h3>لا توجد تقارير في هذا القسم</h3>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>تاريخ التقرير</th>
                                <th>المركز</th>
                                <th>المادة المخزنية</th>
                                <th>رقم الموزع (المبلغ)</th>
                                <th>رقم المفتش (الفعلي)</th>
                                <th>الفارق (العجز)</th>
                                <th>الحالة والمطابقة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => {
                                const diff = r.inspectorAmount ? (r.distributorAmount - r.inspectorAmount) : null;
                                return (
                                    <tr key={r.id} style={{ background: r.status === "DISCREPANCY" ? "var(--danger-bg)" : "transparent" }}>
                                        <td style={{ fontWeight: 600 }}>{new Date(r.reportDate).toLocaleDateString("ar-SY")}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "var(--navy-900)" }}>{r.center.name}</div>
                                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>{r.center.region}</div>
                                        </td>
                                        <td><span className="badge" style={{ background: "var(--gray-100)" }}>{r.material.name}</span></td>
                                        
                                        <td style={{ fontWeight: 700 }}>
                                            {r.distributorAmount.toLocaleString()} <span style={{ fontSize: "0.8em", color: "var(--gray-500)", fontWeight: "normal" }}>{r.material.unit}</span>
                                            {r.distributorNotes && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)", marginTop: "4px" }}>"{r.distributorNotes}"</div>}
                                        </td>
                                        
                                        <td style={{ fontWeight: r.inspectorAmount ? 700 : "normal", color: r.inspectorAmount ? "var(--navy-900)" : "var(--gray-400)" }}>
                                            {r.inspectorAmount ? `${r.inspectorAmount.toLocaleString()} ${r.material.unit}` : "-"}
                                            {r.inspectorNotes && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)", marginTop: "4px" }}>"{r.inspectorNotes}"</div>}
                                        </td>
                                        
                                        <td dir="ltr" style={{ textAlign: "right", fontWeight: 800, color: diff && diff !== 0 ? "var(--danger)" : "var(--gray-400)" }}>
                                            {diff !== null && diff !== 0 ? (diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()) : "-"}
                                        </td>
                                        
                                        <td>{getStatusBadge(r.status)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}

export default function ConsumptionRadarPage() {
    return (
        <Suspense fallback={<div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري تحميل الرادار...</div>}>
            <ConsumptionRadarContent />
        </Suspense>
    );
}
