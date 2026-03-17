"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Allocation = {
    id: string;
    totalQuota: number;
    remainingQuota: number;
    isActive: boolean;
    period: {
        id: string;
        name: string;
        status: "ACTIVE" | "UPCOMING" | "CLOSED";
        startDate: string;
        endDate: string;
        category: {
            nameAr: string;
            unit: string;
            icon: string | null;
        }
    };
    transactions: {
        id: string;
        quantity: number;
        createdAt: string;
        center: { name: string };
    }[];
};

type Stats = {
    activePeriodsCount: number;
    totalRedeemed: number;
};

export default function CitizenAllocationsPage() {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [stats, setStats] = useState<Stats>({ activePeriodsCount: 0, totalRedeemed: 0 });
    const [loading, setLoading] = useState(true);

    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/citizen/allocations");
                if (res.ok) {
                    const data = await res.json();
                    setAllocations(data.allocations);
                    setStats(data.stats);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "ACTIVE": return "badge-success";
            case "UPCOMING": return "badge-warning";
            case "CLOSED": return "badge-gray";
            default: return "badge-primary";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "ACTIVE": return "طبيعي / متاح";
            case "UPCOMING": return "قادم قريباً";
            case "CLOSED": return "منتهي";
            default: return status;
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">مخصصاتي التموينية</h1>
                <p className="page-subtitle">استعرض حصصك المتاحة والمسحوبة لجميع المواد</p>
            </div>

            <div className="grid-2" style={{ marginBottom: "var(--space-6)" }}>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>الدورات الفعالة حالياً</h3>
                        <p>{stats.activePeriodsCount}</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--navy-50)", color: "var(--primary)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>وحدات مستهلكة (إجمالي)</h3>
                        <p>{stats.totalRedeemed.toLocaleString('en-US')}</p>
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: "var(--space-4)" }}>المخصصات الحالية</h3>
            {loading ? (
                <div className="grid-2">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
                </div>
            ) : allocations.length === 0 ? (
                <div className="card empty-state">
                    <p>لا توجد مخصصات مرتبطة بحسابك حالياً.</p>
                </div>
            ) : (
                <div className="grid-2">
                    {allocations.map(a => {
                        const usagePercentage = ((a.totalQuota - a.remainingQuota) / a.totalQuota) * 100;
                        const isDepleted = a.remainingQuota <= 0;

                        return (
                            <div key={a.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                                {isDepleted && (
                                    <div style={{ position: "absolute", top: 10, left: -30, background: "var(--danger)", color: "white", padding: "4px 40px", transform: "rotate(-45deg)", fontSize: "12px", fontWeight: "bold" }}>
                                        مستنفذ
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ margin: 0 }}>{a.period.category.nameAr}</h3>
                                            <span className={`badge ${getStatusStyle(a.period.status)} badge-sm`}>{getStatusText(a.period.status)}</span>
                                        </div>
                                        <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: 0 }}>
                                            دورة {a.period.name} ({new Date(a.period.startDate).toLocaleDateString('en-US')} - {new Date(a.period.endDate).toLocaleDateString('en-US')})
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "left" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: isDepleted ? "var(--danger)" : "var(--primary)", lineHeight: 1 }}>
                                            {a.remainingQuota}
                                        </div>
                                        <div style={{ color: "var(--gray-500)", fontSize: "0.8rem" }}>{unitLabels[a.period.category.unit] || a.period.category.unit} متبقي</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: "var(--space-4)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
                                        <span>مستهلك: {a.totalQuota - a.remainingQuota} {unitLabels[a.period.category.unit] || a.period.category.unit}</span>
                                        <span>الإجمالي: {a.totalQuota} {unitLabels[a.period.category.unit] || a.period.category.unit}</span>
                                    </div>
                                    <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                                        <div style={{
                                            width: `${usagePercentage}%`,
                                            height: "100%",
                                            background: isDepleted ? "var(--danger)" : "var(--primary)",
                                            transition: "width 0.5s ease-in-out"
                                        }} />
                                    </div>
                                </div>

                                {a.transactions.length > 0 && (
                                    <div style={{ background: "var(--navy-50)", padding: "var(--space-3)", borderRadius: "var(--radius-md)" }}>
                                        <div style={{ fontSize: "0.8rem", fontWeight: "bold", marginBottom: 8, color: "var(--navy-700)" }}>آخر السحوبات:</div>
                                        {a.transactions.map(t => (
                                            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "4px 0", borderBottom: "1px dashed var(--gray-300)" }}>
                                                <span>{t.center.name}</span>
                                                <span style={{ fontFamily: "monospace", display: "flex", gap: 8 }}>
                                                    <span style={{ color: "var(--danger)", fontWeight: "bold" }}>-{t.quantity}</span>
                                                    <span style={{ color: "var(--gray-500)" }}>{new Date(t.createdAt).toLocaleDateString('en-US')}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ marginTop: "var(--space-8)", textAlign: "center" }}>
                <Link href="/citizen/qr" className="btn btn-primary btn-lg" style={{ borderRadius: 30, padding: "12px 32px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><line x1="21" y1="14" x2="21" y2="21" /><line x1="14" y1="21" x2="21" y2="21" /></svg>
                    إظهار بطاقة QR للتبديل
                </Link>
            </div>
        </div>
    );
}
