"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface AllocationSummary {
    id: string;
    totalQuota: number;
    remainingQuota: number;
    period: { name: string; category: { nameAr: string; unit: string; type: string } };
}

export default function CitizenDashboard() {
    const { data: session } = useSession();
    const [allocations, setAllocations] = useState<AllocationSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/citizen/allocations")
            .then(r => r.json())
            .then(d => setAllocations(d.allocations || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    return (
        <div className="page-container">
            {/* Welcome Card */}
            <div className="card mb-6" style={{
                background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                color: "white", border: "none",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
                    <div>
                        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>
                            أهلاً {session?.user?.name || ""}
                        </h1>
                        <p style={{ opacity: 0.8, fontSize: "var(--font-size-sm)" }}>
                            مرحباً بك في نظام التموين - مديرية التموين والتجارة الداخلية
                        </p>
                    </div>
                    <Link href="/citizen/qr" className="btn" style={{
                        background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
                        </svg>
                        عرض رمز QR
                    </Link>
                </div>
            </div>

            {/* Allocations */}
            <div className="page-header">
                <h2 className="page-title" style={{ fontSize: "var(--font-size-xl)" }}>المخصصات الحالية</h2>
            </div>

            {loading ? (
                <div className="grid grid-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card">
                            <div className="skeleton" style={{ width: "60%", height: 20, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: "100%", height: 10, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: "40%", height: 16 }} />
                        </div>
                    ))}
                </div>
            ) : allocations.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <h3>لا توجد مخصصات حالياً</h3>
                        <p>سيتم إضافة المخصصات من قبل الإدارة عند توفرها</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-3">
                    {allocations.map((alloc) => {
                        const percentage = alloc.totalQuota > 0 ? (alloc.remainingQuota / alloc.totalQuota) * 100 : 0;
                        const unit = unitLabels[alloc.period.category.unit] || alloc.period.category.unit;
                        const progressClass = percentage > 50 ? "success" : percentage > 20 ? "warning" : "danger";

                        return (
                            <div key={alloc.id} className="card animate-slide-up">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                                    <div>
                                        <h3 className="font-bold text-lg">{alloc.period.category.nameAr}</h3>
                                        <span className="text-xs text-gray-400">{alloc.period.name}</span>
                                    </div>
                                    <span className={`badge badge-${alloc.period.category.type === "FAMILY" ? "info" : "primary"}`}>
                                        {alloc.period.category.type === "FAMILY" ? "عائلي" : "فردي"}
                                    </span>
                                </div>

                                <div style={{ marginBottom: "var(--space-3)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                                        <span className="text-sm text-gray-500">المتبقي</span>
                                        <span className="font-bold text-navy">
                                            {alloc.remainingQuota} / {alloc.totalQuota} {unit}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className={`progress-fill ${progressClass}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Links */}
            <div className="card mt-4">
                <div className="card-header">
                    <h2 className="card-title">روابط سريعة</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
                    <Link href="/citizen/qr" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        رمز QR الخاص بي
                    </Link>
                    <Link href="/citizen/family" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        دفتر العائلة
                    </Link>
                    <Link href="/citizen/allocations" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        كل المخصصات
                    </Link>
                </div>
            </div>
        </div>
    );
}
