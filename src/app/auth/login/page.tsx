"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const errorMessages: Record<string, string> = {
        "PENDING": "حسابك قيد المراجعة من قبل الإدارة. يرجى الانتظار حتى تتم الموافقة",
        "REJECTED": "تم رفض طلب تسجيلك. يرجى التواصل مع الإدارة",
        "SUSPENDED": "تم تعليق حسابك. يرجى التواصل مع الإدارة",
        "CredentialsSignin": "بيانات الدخول غير صحيحة",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                login,
                password,
                redirect: false,
            });

            if (result?.error) {
                // NextAuth wraps thrown errors from authorize
                const errMsg = errorMessages[result.error] || result.error;
                setError(errMsg);
            } else if (result?.ok) {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img
                        src="/logo.jpeg"
                        alt="شعار مديرية التموين والتجارة الداخلية"
                        style={{
                            width: 100,
                            height: 100,
                            objectFit: "contain",
                            marginBottom: "var(--space-4)",
                        }}
                    />
                    <h1 className="auth-title">نظام التموين</h1>
                    <p className="auth-subtitle">مديرية التموين والتجارة الداخلية - D.S.I.T</p>
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="login">
                            الرقم الوطني أو البريد الإلكتروني
                        </label>
                        <input
                            id="login"
                            type="text"
                            className="form-input"
                            placeholder="أدخل الرقم الوطني أو البريد الإلكتروني"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                            autoComplete="username"
                            dir="ltr"
                            style={{ textAlign: "right" }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            كلمة المرور
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="أدخل كلمة المرور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
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
                        {loading ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
                                </svg>
                                جاري تسجيل الدخول...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                تسجيل الدخول
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    ليس لديك حساب؟{" "}
                    <Link href="/auth/register">تقديم طلب تسجيل</Link>
                </div>
                <div className="auth-footer" style={{ marginTop: "var(--space-2)" }}>
                    <Link href="/auth/forgot-password">نسيت كلمة المرور؟</Link>
                </div>
            </div>
        </div>
    );
}
