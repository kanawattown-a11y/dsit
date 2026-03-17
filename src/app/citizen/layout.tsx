"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const citizenNavItems = [
    { href: "/citizen", label: "الرئيسية", icon: "home" },
    { href: "/citizen/allocations", label: "المخصصات", icon: "package" },
    { href: "/citizen/qr", label: "رمز QR", icon: "qr" },
    { href: "/citizen/family", label: "دفتر العائلة", icon: "book" },
    { href: "/citizen/notifications", label: "الإشعارات", icon: "bell" },
    { href: "/citizen/profile", label: "الملف الشخصي", icon: "user" },
];

function getIcon(name: string) {
    const icons: Record<string, React.ReactElement> = {
        home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
        package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
        qr: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><line x1="21" y1="14" x2="21" y2="21" /><line x1="14" y1="21" x2="21" y2="21" /></svg>,
        book: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
        bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
        user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    };
    return icons[name] || null;
}

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
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
                        <div className="sidebar-brand-sub">حساب المواطن</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {citizenNavItems.map((item) => (
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
                            style={{ display: "none" }} id="citizen-mobile-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <div className="header-right">
                        <Link href="/citizen/notifications" className="notification-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </Link>
                        <div className="user-menu">
                            <div className="user-info">
                                <div className="user-name">{session?.user?.name || "مواطن"}</div>
                                <div className="user-role">مواطن</div>
                            </div>
                            <div className="user-avatar">{session?.user?.name?.charAt(0) || "م"}</div>
                        </div>
                    </div>
                </header>
                {children}
            </div>

            {mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} onClick={() => setMobileMenuOpen(false)} />
            )}
            <style jsx>{`@media (max-width: 768px) { #citizen-mobile-btn { display: flex !important; } }`}</style>
        </div>
    );
}
