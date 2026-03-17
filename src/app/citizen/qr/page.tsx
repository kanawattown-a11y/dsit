"use client";

import { useState, useEffect, useCallback } from "react";

export default function CitizenQRPage() {
    const [qrData, setQrData] = useState<string>("");
    const [qrImage, setQrImage] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [refreshing, setRefreshing] = useState(false);

    const generateQR = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch("/api/qr/generate");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setQrData(data.token);
            setQrImage(data.qrImage);
            setTimeLeft(300);
            setError("");
        } catch (err: any) {
            setError(err.message || "خطأ في إنشاء رمز QR");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        generateQR();
    }, [generateQR]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateQR(); // Auto-refresh when expired
                    return 300;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, generateQR]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ textAlign: "center" }}>
                <h1 className="page-title">رمز QR الخاص بك</h1>
                <p className="page-subtitle">استخدم هذا الرمز عند مراكز التوزيع لاستلام مخصصاتك</p>
            </div>

            <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
                {error ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <h3 style={{ color: "var(--danger)" }}>خطأ</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary mt-4" onClick={generateQR}>إعادة المحاولة</button>
                    </div>
                ) : loading ? (
                    <div className="qr-container">
                        <div className="skeleton" style={{ width: 256, height: 256, borderRadius: "var(--radius-xl)" }} />
                        <div className="skeleton" style={{ width: 120, height: 20 }} />
                    </div>
                ) : (
                    <div className="qr-container">
                        <div className="qr-frame">
                            {qrImage && (
                                <img
                                    src={qrImage}
                                    alt="QR Code"
                                    width={256}
                                    height={256}
                                    style={{ borderRadius: "var(--radius-md)" }}
                                />
                            )}
                        </div>

                        {/* Timer */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: "var(--space-2)",
                            padding: "var(--space-2) var(--space-4)",
                            background: timeLeft < 60 ? "var(--danger-bg)" : "var(--info-bg)",
                            borderRadius: "var(--radius-full)",
                            color: timeLeft < 60 ? "var(--danger)" : "var(--navy-600)",
                            fontWeight: 600, fontSize: "var(--font-size-sm)",
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            صالح لمدة: {formatTime(timeLeft)}
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={generateQR}
                            disabled={refreshing}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            تحديث الرمز
                        </button>

                        <div className="alert alert-info" style={{ textAlign: "center" }}>
                            <div>
                                <strong>تعليمات الاستخدام:</strong>
                                <br />
                                قدّم هذا الرمز عند الفرن أو مركز التوزيع ليتم مسحه وخصم الكمية من مخصصاتك.
                                <br />
                                يتم تحديث الرمز تلقائياً كل 5 دقائق للحماية.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
