"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Transaction = {
    id: string;
    quantity: number;
    notes: string | null;
    createdAt: string;
    allocation: {
        user: { fullName: string; nationalId: string };
        period: { name: string; category: { nameAr: string; unit: string } };
    };
};

export default function DistributorTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ todayVolume: 0, todayCount: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    const fetchTransactions = async (q = "") => {
        try {
            setLoading(true);
            const res = await fetch(`/api/distributor/transactions?search=${encodeURIComponent(q)}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
                if (!q) setStats(data.stats); // Only update stats on initial load
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">سجل عمليات التوزيع</h1>
                <p className="page-subtitle">يعرض آخر 100 عملية قمت بتنفيذها للمواطنين</p>
            </div>

            <div className="grid-2" style={{ marginBottom: "var(--space-6)" }}>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>عمليات اليوم</h3>
                        <p>{stats.todayCount} عملية</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--ice-blue)", color: "var(--primary)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>الكمية الموزعة اليوم</h3>
                        <p>{stats.todayVolume.toLocaleString('en-US')}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={(e) => { e.preventDefault(); fetchTransactions(search); }} className="search-bar">
                    <input type="text" placeholder="بحث باسم المواطن أو الرقم الوطني..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-sm">بحث</button>
                </form>
            </div>

            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>لا توجد معاملات مطابقة للبحث</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>التاريخ والوقت</th>
                                <th>المستفيد</th>
                                <th>الرقم الوطني</th>
                                <th>المادة الموزعة</th>
                                <th>الكمية المُسلمة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ fontWeight: "bold" }}>{new Date(t.createdAt).toLocaleDateString('en-US')}</div>
                                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>
                                            {new Date(t.createdAt).toLocaleTimeString('en-US')}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{t.allocation.user.fullName}</td>
                                    <td style={{ fontFamily: "monospace", color: "var(--gray-500)" }}>{t.allocation.user.nationalId}</td>
                                    <td>
                                        <span className="badge badge-primary">{t.allocation.period.category.nameAr}</span>
                                        <div style={{ fontSize: "var(--font-size-xs)", marginTop: "2px", color: "var(--gray-500)" }}>دورة {t.allocation.period.name}</div>
                                    </td>
                                    <td style={{ fontWeight: "bold", color: "var(--success)" }}>
                                        {t.quantity} {unitLabels[t.allocation.period.category.unit] || t.allocation.period.category.unit}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
