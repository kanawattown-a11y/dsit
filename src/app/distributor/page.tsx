"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Stats {
    todayTransactions: number;
    totalTransactions: number;
}

export default function DistributorDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetch("/api/distributor/stats")
            .then(res => res.json())
            .then(data => {
                if (data.stats) setStats(data.stats);
            })
            .catch(err => console.error("Error fetching stats:", err));
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">لوحة الموزع</h1>
                <p className="page-subtitle">مسح رموز QR وإدارة عمليات التوزيع</p>
            </div>

            <div className="grid grid-2 mb-6">
                <div className="stat-card">
                    <span className="stat-label">عمليات اليوم</span>
                    <span className="stat-value">{stats?.todayTransactions ?? "-"}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">إجمالي العمليات</span>
                    <span className="stat-value">{stats?.totalTransactions ?? "-"}</span>
                </div>
            </div>

            <div className="grid grid-2 mb-6">
                <Link href="/distributor/scan" className="card" style={{
                    textAlign: "center", padding: "var(--space-10)",
                    background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                    color: "white", border: "none", cursor: "pointer",
                    transition: "all var(--transition-base)",
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto var(--space-4)" }}>
                        <path d="M23 6V1h-5" /><path d="M1 6V1h5" />
                        <path d="M23 18v5h-5" /><path d="M1 18v5h5" />
                        <line x1="1" y1="12" x2="23" y2="12" />
                    </svg>
                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-2)" }}>مسح رمز QR</h2>
                    <p style={{ opacity: 0.8, fontSize: "var(--font-size-sm)" }}>مسح رمز المواطن لخصم المخصصات</p>
                </Link>

                <Link href="/distributor/transactions" className="card" style={{
                    textAlign: "center", padding: "var(--space-10)", cursor: "pointer",
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--navy-300)" strokeWidth="1.5" style={{ margin: "0 auto var(--space-4)" }}>
                        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                        <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
                    </svg>
                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-2)", color: "var(--navy-800)" }}>سجل المعاملات</h2>
                    <p className="text-sm text-gray-400">عرض جميع المعاملات السابقة</p>
                </Link>
            </div>
        </div>
    );
}
