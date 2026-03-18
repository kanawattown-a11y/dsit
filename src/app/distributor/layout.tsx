"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const distributorNavItems = [
    { href: "/distributor", label: "الرئيسية", icon: "home" },
    { href: "/distributor/scan", label: "مسح QR", icon: "scan" },
    { href: "/distributor/inventory", label: "مخزون واستهلاك المركز", icon: "receipt" },
    { href: "/distributor/transactions", label: "المعاملات", icon: "receipt" },
];

function getIcon(name: string) {
    const icons: Record<string, React.JSX.Element> = {
        home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
        scan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6V1h-5" /><path d="M1 6V1h5" /><path d="M23 18v5h-5" /><path d="M1 18v5h5" /><line x1="1" y1="12" x2="23" y2="12" /></svg>,
        receipt: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" /></svg>,
    };
    return icons[name] || null;
}

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
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
                        <div className="sidebar-brand-sub">لوحة الموزع</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {distributorNavItems.map((item) => (
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
                            style={{ display: "none" }} id="dist-mobile-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="header-right">
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-name">{session?.user?.name || "موزع"}</div>
                                <div className="user-role">موزع</div>
                            </div>
                            <div className="user-avatar">{session?.user?.name?.charAt(0) || "م"}</div>
                        </div>
                    </div>
                </header>
                {children}
            </div>

            {mobileMenuOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} onClick={() => setMobileMenuOpen(false)} />}
            <style jsx>{`@media (max-width: 768px) { #dist-mobile-btn { display: flex !important; } }`}</style>
        </div>
    );
}
