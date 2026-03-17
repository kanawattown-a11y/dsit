"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Center = {
    id: string;
    name: string;
    type: "BAKERY" | "GAS_STATION" | "SUPPLY_CENTER" | "FUEL_STATION";
    region: string | null;
    address: string | null;
    distributors: { id: string; fullName: string; phone: string | null }[];
    _count: { transactions: number };
};

export default function InspectorCentersPage() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCenters = async (q = "") => {
        try {
            setLoading(true);
            const res = await fetch(`/api/inspector/centers?search=${encodeURIComponent(q)}`);
            if (res.ok) {
                const json = await res.json();
                setCenters(json.centers);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCenters(search);
    };

    function translateType(type: string) {
        const types: Record<string, string> = {
            BAKERY: "مخبز",
            GAS_STATION: "مركز غاز",
            SUPPLY_CENTER: "صالة استهلاكية",
            FUEL_STATION: "محطة وقود",
        };
        return types[type] || type;
    }

    return (
        <main className="container" style={{ padding: "var(--space-6)" }}>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 className="page-title">مراكز التوزيع الخاضعة لتفتيشي</h1>
                    <p className="page-description">مراقبة المراكز المخصصة لك ومتابعة عملياتها.</p>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "var(--space-4)" }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="ابحث عن مركز بالاسم أو المنطقة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary">بحث</button>
                </form>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل المراكز...</div>
            ) : centers.length === 0 ? (
                <div className="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3>لا توجد مراكز مطابقة</h3>
                    <p>أنت غير مسؤول عن أي مراكز حالياً أو لم يتم العثور على نتائج للبحث.</p>
                </div>
            ) : (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
                    {centers.map((center) => (
                        <div key={center.id} className="admin-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--navy-900)" }}>
                                        {center.name}
                                    </h3>
                                    <div style={{ color: "var(--navy-500)", fontSize: "var(--font-size-sm)", marginTop: "var(--space-1)" }}>
                                        {translateType(center.type)} • {center.region || "منطقة غير محددة"}
                                    </div>
                                </div>
                                <span className="badge" style={{ background: "var(--primary-100)", color: "var(--primary-700)" }}>
                                    {center._count.transactions} حركة
                                </span>
                            </div>

                            <div style={{ marginTop: "var(--space-2)", fontSize: "var(--font-size-sm)", color: "var(--gray-600)" }}>
                                <strong>الموزعين:</strong>{" "}
                                {center.distributors.length > 0
                                    ? center.distributors.map(d => d.fullName).join("، ")
                                    : "لا يوجد موزعين"}
                            </div>

                            <div style={{ marginTop: "auto", paddingTop: "var(--space-4)", borderTop: "1px solid var(--gray-200)", display: "flex", gap: "var(--space-2)" }}>
                                <Link href={`/inspector/violations?centerId=${center.id}`} className="btn btn-outline" style={{ flex: 1, textAlign: "center", color: "var(--danger)", borderColor: "var(--danger-border)" }}>
                                    تسجيل ضبط
                                </Link>
                                <Link href={`/inspector/centers/${center.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>
                                    التفاصيل
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
