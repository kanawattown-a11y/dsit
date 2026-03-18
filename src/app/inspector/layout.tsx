"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const inspectorNavItems = [
    { href: "/inspector", label: "الرئيسية", icon: "home" },
    { href: "/inspector/centers", label: "المراكز الرقابية", icon: "building" },
    { href: "/inspector/violations", label: "تنظيم الضبوط", icon: "shield" },
    { href: "/inspector/verification", label: "التصديق والمطابقة", icon: "shield" },
    { href: "/inspector/reports", label: "التقارير المرفوعة", icon: "report" },
];

function getIcon(name: string) {
    const icons: Record<string, React.JSX.Element> = {
        home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
        building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" /></svg>,
        report: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
        shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    };
    return icons[name] || null;
}

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="app-layout">
            <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <div className="sidebar-brand">
                    <img src="/logo.jpeg" alt="DSIT" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: "var(--radius-md)" }} />
                    <div className="sidebar-brand-text">
                        <div className="sidebar-brand-title">نظام التموين</div>
                        <div className="sidebar-brand-sub">لوحة المفتش</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {inspectorNavItems.map((item) => (
                        <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                            onClick={() => setMobileMenuOpen(false)}>
                            {getIcon(item.icon)}<span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link" onClick={() => signOut({ callbackUrl: "/auth/login" })} style={{ width: "100%" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header">
                    <div className="header-left">
                        <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            style={{ display: "none" }} id="insp-mobile-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="header-right">
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-name">{session?.user?.name || "مفتش"}</div>
                                <div className="user-role">مفتش</div>
                            </div>
                            <div className="user-avatar">{session?.user?.name?.charAt(0) || "م"}</div>
                        </div>
                    </div>
                </header>
                {children}
            </div>

            {mobileMenuOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} onClick={() => setMobileMenuOpen(false)} />}
            <style jsx>{`@media (max-width: 768px) { #insp-mobile-btn { display: flex !important; } }`}</style>
        </div>
    );
}
