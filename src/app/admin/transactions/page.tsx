"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Transaction = {
    id: string;
    quantity: number;
    notes: string | null;
    createdAt: string;
    center: { name: string; type: string };
    processedBy: { fullName: string };
    allocation: {
        user: { fullName: string; nationalId: string };
        period: { name: string; category: { nameAr: string; unit: string } };
    };
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    const fetchTransactions = async (q = "", p = page) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/transactions/admin?search=${encodeURIComponent(q)}&page=${p}&limit=${limit}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(search, page); }, [page]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">سجل المعاملات العام</h1>
                <p className="page-subtitle">جميع عمليات التوزيع في المراكز — {total} عملية</p>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchTransactions(search, 1); }} className="search-bar">
                    <input type="text" placeholder="بحث باسم المواطن، المركز، أو الموزع..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-sm">بحث</button>
                    {search && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setPage(1); fetchTransactions("", 1); }}>إلغاء</button>}
                </form>
            </div>

            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 300 }} /> : transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>لا توجد معاملات مطابقة للبحث</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>التاريخ والوقت</th>
                                <th>المستفيد</th>
                                <th>المادة الموزعة</th>
                                <th>الكمية</th>
                                <th>مركز التوزيع</th>
                                <th>بواسطة الموزع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ fontWeight: "bold" }}>{new Date(t.createdAt).toLocaleDateString('ar-SA')}</div>
                                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>
                                            {new Date(t.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div>{t.allocation.user.fullName}</div>
                                        <div style={{ fontSize: "var(--font-size-xs)", fontFamily: "monospace", color: "var(--gray-500)" }}>
                                            {t.allocation.user.nationalId}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">{t.allocation.period.category.nameAr}</span>
                                        <div style={{ fontSize: "var(--font-size-xs)", marginTop: "2px" }}>دورة {t.allocation.period.name}</div>
                                    </td>
                                    <td style={{ fontWeight: "bold", color: "var(--success)" }}>
                                        {t.quantity} {unitLabels[t.allocation.period.category.unit] || t.allocation.period.category.unit}
                                    </td>
                                    <td>{t.center.name}</td>
                                    <td>{t.processedBy.fullName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                    <span style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>صفحة {page} من {totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
                </div>
            )}
        </div>
    );
}
