"use client";

import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import React, { useState, useEffect } from "react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
};

export default function CitizenNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/citizen/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const markAsRead = async (id?: string) => {
        try {
            const body = id ? { notificationId: id } : { markAllRead: true };
            const res = await fetch("/api/citizen/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                if (id) {
                    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } else {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "ALLOCATION": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>;
            case "SYSTEM": return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
            default: return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "ALLOCATION": return "var(--success)";
            case "SYSTEM": return "var(--primary)";
            default: return "var(--gray-500)";
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">صندوق الإشعارات</h1>
                    <p className="page-subtitle">تحديثات المخصصات ورسائل النظام الخاصة بك</p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={() => markAsRead()}>
                        تحديد الكل كمقروء
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div className="skeleton" style={{ height: 400 }} /> : notifications.length === 0 ? (
                    <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <h3>لا توجد إشعارات</h3>
                        <p>صندوق الإشعارات الخاص بك فارغ حالياً.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.isRead && markAsRead(n.id)}
                                style={{
                                    padding: "var(--space-4)",
                                    borderBottom: "1px solid var(--gray-200)",
                                    display: "flex",
                                    gap: "var(--space-4)",
                                    background: n.isRead ? "transparent" : "var(--ice-50)",
                                    cursor: n.isRead ? "default" : "pointer",
                                    transition: "background 0.2s"
                                }}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    background: `${getTypeColor(n.type)}15`, color: getTypeColor(n.type),
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                }}>
                                    {getTypeIcon(n.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <h4 style={{ margin: 0, fontWeight: n.isRead ? 500 : 700, color: "var(--navy-900)" }}>
                                            {n.title}
                                            {!n.isRead && <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--primary)", borderRadius: "50%", marginRight: 8 }} />}
                                        </h4>
                                        <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontFamily: "monospace" }}>
                                            {new Date(n.createdAt).toLocaleDateString('en-US')} - {new Date(n.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.9rem", color: n.isRead ? "var(--gray-600)" : "var(--navy-800)" }}>{n.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
