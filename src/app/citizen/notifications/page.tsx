"use client";

import { useState, useEffect } from "react";

type Notification = {
    id: string;
    title: string;
    body: string;
    type: "SYSTEM" | "ALLOCATION" | "MANUAL" | "INSPECTION";
    isRead: boolean;
    createdAt: string;
};

export default function CitizenNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/citizen/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "ALLOCATION":
                return (
                    <div style={{ background: "var(--primary-100)", color: "var(--primary-700)", padding: "var(--space-2)", borderRadius: "var(--radius-full)" }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case "SYSTEM":
            case "MANUAL":
            default:
                return (
                    <div style={{ background: "var(--info-bg)", color: "var(--info)", padding: "var(--space-2)", borderRadius: "var(--radius-full)" }}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <main className="container" style={{ padding: "var(--space-6)" }}>
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">سجل الإشعارات</h1>
                <p className="page-description">تصفح كافة الرسائل والتنبيهات الموجهة إليك حتى وإن فاتتك على الهاتف.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل التنبيهات...</div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3>لا توجد إشعارات</h3>
                    <p>صندوق الوارد الخاص بك فارغ حالياً.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {notifications.map((msg) => (
                        <div key={msg.id} className="admin-card" style={{ 
                            display: "flex", gap: "var(--space-4)", alignItems: "flex-start",
                            borderLeft: !msg.isRead ? "4px solid var(--primary-500)" : "1px solid var(--gray-200)",
                            background: !msg.isRead ? "var(--primary-50)" : "white" 
                        }}>
                            {getTypeIcon(msg.type)}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
                                    <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: !msg.isRead ? 700 : 600, color: "var(--navy-900)" }}>
                                        {msg.title}
                                    </h3>
                                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>
                                        {new Date(msg.createdAt).toLocaleString("ar-SY", {
                                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </span>
                                </div>
                                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--gray-600)", lineHeight: 1.5 }}>
                                    {msg.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
