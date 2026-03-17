"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [nationalId, setNationalId] = useState("");
    const [step, setStep] = useState<"request" | "sent">("request");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nationalId }),
            });
            // Always show "sent" step to prevent user enumeration
            setStep("sent");
        } catch {
            setError("خطأ في الاتصال. يرجى المحاولة مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/logo.jpeg" alt="شعار مديرية التموين" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: "var(--space-4)" }} />
                    <h1 className="auth-title">استعادة كلمة المرور</h1>
                    <p className="auth-subtitle">مديرية التموين والتجارة الداخلية</p>
                </div>

                {step === "request" ? (
                    <>
                        {error && (
                            <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
                                <span>{error}</span>
                            </div>
                        )}

                        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)", textAlign: "center", fontSize: "var(--font-size-sm)" }}>
                            أدخل رقمك الوطني وسيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني المسجل
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="nationalId">الرقم الوطني</label>
                                <input
                                    id="nationalId"
                                    type="text"
                                    className="form-input"
                                    placeholder="أدخل الرقم الوطني المسجل"
                                    value={nationalId}
                                    onChange={e => setNationalId(e.target.value)}
                                    required
                                    dir="ltr"
                                    style={{ textAlign: "right" }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: "100%", marginTop: "var(--space-2)" }}
                                disabled={loading}
                            >
                                {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%",
                            background: "var(--success-bg)", color: "var(--success)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto var(--space-6)",
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: "var(--space-3)" }}>تم الإرسال</h2>
                        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)" }}>
                            إذا كان الرقم الوطني مسجلاً لدينا، فسيصلك بريد إلكتروني يحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.
                        </p>
                        <Link href="/auth/login" className="btn btn-primary">
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                )}

                <div className="auth-footer" style={{ marginTop: "var(--space-6)" }}>
                    <Link href="/auth/login">← العودة لتسجيل الدخول</Link>
                </div>
            </div>
        </div>
    );
}
