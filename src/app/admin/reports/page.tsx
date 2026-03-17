"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StatsData = {
    stats: {
        totalTransactions: number;
        totalCenters: number;
        totalUsers: number;
        recentTransactions: number;
    };
    topCenters: {
        centerName: string;
        volume: number;
        type: string;
    }[];
    weeklyChart: {
        label: string;
        date: string;
        count: number;
    }[];
};

export default function AdminReportsPage() {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/reports/stats');
                if (res.ok) setData(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="page-container">
            <div className="skeleton" style={{ height: 100, marginBottom: 20 }} />
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
            </div>
            <div className="skeleton" style={{ height: 300 }} />
        </div>
    );

    if (!data) return <div className="page-container"><h3>حدث خطأ أثناء تحميل البيانات</h3></div>;

    const maxVolume = Math.max(...data.topCenters.map(c => c.volume), 1);
    const maxDayCount = Math.max(...(data.weeklyChart || []).map(d => d.count), 1);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">التقارير والإحصائيات</h1>
                <p className="page-subtitle">نظرة عامة على أداء نظام التوزيع والمراكز</p>
            </div>

            <div className="grid-4" style={{ marginBottom: "var(--space-6)" }}>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--ice-blue)", color: "var(--primary)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>إجمالي العمليات</h3>
                        <p>{data.stats.totalTransactions.toLocaleString('en-US')}</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>عمليات آخر 7 أيام</h3>
                        <p>{data.stats.recentTransactions.toLocaleString('en-US')}</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>المراكز الفعالة</h3>
                        <p>{data.stats.totalCenters.toLocaleString('en-US')}</p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon" style={{ background: "var(--navy-50)", color: "var(--secondary)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="stat-info">
                        <h3>إجمالي المستفيدين</h3>
                        <p>{data.stats.totalUsers.toLocaleString('en-US')}</p>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                {/* Top Centers */}
                <div className="card">
                    <h3 style={{ marginBottom: "var(--space-4)" }}>أكثر المراكز نشاطاً (حجم التوزيع)</h3>
                    {data.topCenters.length === 0 ? <p className="text-gray-500">لا توجد بيانات كافية</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {data.topCenters.map((c, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 'var(--font-size-sm)' }}>
                                        <span style={{ fontWeight: 600 }}>{c.centerName}</span>
                                        <span>{c.volume.toLocaleString('en-US')} وحدة</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(c.volume / maxVolume) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--navy-300), var(--navy-400))',
                                            borderRadius: '4px',
                                            transition: 'width 1s ease'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Weekly Chart */}
                <div className="card">
                    <h3 style={{ marginBottom: "var(--space-4)" }}>حركة التوزيع الأسبوعية</h3>
                    {(!data.weeklyChart || data.weeklyChart.length === 0) ? (
                        <p className="text-gray-500">لا توجد بيانات كافية</p>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '200px', paddingTop: '20px' }}>
                            {data.weeklyChart.map((day, i) => {
                                const height = maxDayCount > 0 ? (day.count / maxDayCount) * 160 : 4;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-700)' }}>
                                            {day.count}
                                        </span>
                                        <div style={{
                                            width: '100%',
                                            maxWidth: '40px',
                                            height: `${Math.max(height, 4)}px`,
                                            background: 'linear-gradient(180deg, var(--primary), var(--navy-400))',
                                            borderRadius: '6px 6px 2px 2px',
                                            transition: 'height 0.8s ease',
                                        }} />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                                            {day.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
