"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import React from "react";

const adminNavItems = [
    {
        section: "الرئيسية",
        items: [
            { href: "/admin", label: "لوحة التحكم", icon: "dashboard" },
        ],
    },
    {
        section: "إدارة المستخدمين",
        items: [
            { href: "/admin/users", label: "المستخدمين", icon: "users" },
            { href: "/admin/family-books", label: "دفاتر العائلة", icon: "book" },
            { href: "/admin/vehicles", label: "المركبات", icon: "car" },
        ],
    },
    {
        section: "المخصصات",
        items: [
            { href: "/admin/allocations", label: "المواد والمخصصات", icon: "package" },
            { href: "/admin/periods", label: "دورات التوزيع", icon: "calendar" },
            { href: "/admin/centers", label: "مراكز التوزيع", icon: "building" },
            { href: "/admin/transactions", label: "المعاملات", icon: "receipt" },
        ],
    },
    {
        section: "الأدوات",
        items: [
            { href: "/admin/notifications", label: "الإشعارات", icon: "bell" },
            { href: "/admin/reports", label: "التقارير", icon: "chart" },
            { href: "/admin/audit-log", label: "سجل التدقيق", icon: "shield" },
        ],
    },
];

function getIcon(name: string) {
    const icons: Record<string, React.ReactElement> = {
        dashboard: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
        users: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        book: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        car: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                <circle cx="6.5" cy="16.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
            </svg>
        ),
        package: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
        ),
        building: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <line x1="8" y1="6" x2="10" y2="6" />
                <line x1="14" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="10" y2="14" />
                <line x1="14" y1="14" x2="16" y2="14" />
            </svg>
        ),
        receipt: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="12" y2="14" />
            </svg>
        ),
        bell: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
        chart: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
        shield: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        calendar: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    };
    return icons[name] || null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-brand">
                    <img src="/logo.jpeg" alt="DSIT" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: "var(--radius-md)" }} />
                    <div className="sidebar-brand-text">
                        <div className="sidebar-brand-title">نظام التموين</div>
                        <div className="sidebar-brand-sub">D.S.I.T</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {adminNavItems.map((section) => (
                        <div key={section.section} className="sidebar-section">
                            <div className="sidebar-section-title">{section.section}</div>
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {getIcon(item.icon)}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-link"
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        style={{ width: "100%" }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            style={{ display: "none" }}
                            id="mobile-menu-btn"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="header-right">
                        <Link href="/admin/notifications" className="notification-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            <span className="notification-dot" />
                        </Link>

                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-name">{session?.user?.name || "المدير"}</div>
                                <div className="user-role">مدير النظام</div>
                            </div>
                            <div className="user-avatar">
                                {session?.user?.name?.charAt(0) || "م"}
                            </div>
                        </div>
                    </div>
                </header>

                {children}
            </div>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 99,
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <style jsx>{`
        @media (max-width: 768px) {
          #mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
        </div>
    );
}
