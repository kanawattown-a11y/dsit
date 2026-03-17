"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const validatePassword = (pwd: string) => {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(pwd);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setStatus("error");
            setMessage("رمز إعادة التعيين مفقود. يرجى طلب رابط جديد.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("كلمتا المرور غير متطابقتين.");
            return;
        }

        if (!validatePassword(password)) {
            setStatus("error");
            setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص.");
            return;
        }

        setStatus("loading");
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage("تم إعادة تعيين كلمة المرور بنجاح. سيتم توجيهك لصفحة تسجيل الدخول...");
                setTimeout(() => {
                    router.push("/auth/login");
                }, 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "حدث خطأ. قد يكون الرابط منتهي الصلاحية.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("خطأ في الاتصال بالخادم. حاول مرة أخرى.");
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
                    رمز إعادة التعيين مفقود أو غير صالح.
                </div>
                <Link href="/auth/forgot-password" className="btn btn-primary" style={{ width: "100%" }}>
                    طلب رابط جديد
                </Link>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="text-center" style={{ padding: "var(--space-4) 0" }}>
                <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.1)", color: "var(--success)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto var(--space-4)"
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>
                <h2 style={{ marginBottom: "var(--space-3)", color: "var(--navy-800)" }}>تم بنجاح!</h2>
                <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)" }}>
                    {message}
                </p>
                <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            {status === "error" && (
                <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
                    {message}
                </div>
            )}

            <div className="form-group">
                <label className="form-label" htmlFor="password">كلمة المرور الجديدة</label>
                <div className="input-with-icon">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        dir="ltr"
                    />
                </div>
                <div className="form-hint" style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--gray-500)" }}>
                    8 أحرف على الأقل، حرف كبير، مسافة، ورقم ورمز.
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: "var(--space-6)" }}>
                <label className="form-label" htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                <div className="input-with-icon">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        dir="ltr"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "var(--space-4)" }}
                disabled={status === "loading"}
            >
                {status === "loading" ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/logo.jpeg" alt="شعار مديرية التموين" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: "var(--space-4)" }} />
                    <h1 className="auth-title">إعادة تعيين كلمة المرور</h1>
                    <p className="auth-subtitle">مديرية التموين والتجارة الداخلية</p>
                </div>
                <Suspense fallback={<div className="text-center p-8"><div className="loading-spinner mx-auto" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
