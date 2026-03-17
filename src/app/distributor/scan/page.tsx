"use client";

import { useState, useRef, useEffect } from "react";

interface CitizenInfo {
    id: string;
    fullName: string;
    nationalId: string;
    familyBook: { bookNumber: string; members: any[] } | null;
    memberCount: number;
}

interface AllocationInfo {
    id: string;
    categoryName: string;
    categoryType: string;
    unit: string;
    periodName: string;
    totalQuota: number;
    remainingQuota: number;
}

export default function DistributorScanPage() {
    const [manualToken, setManualToken] = useState("");
    const [citizen, setCitizen] = useState<CitizenInfo | null>(null);
    const [allocations, setAllocations] = useState<AllocationInfo[]>([]);
    const [selectedAllocation, setSelectedAllocation] = useState<string>("");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [error, setError] = useState("");
    const scannerRef = useRef<any>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [myCenter, setMyCenter] = useState<{ id: string; name: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Fetch the distributor's assigned center on mount
    useEffect(() => {
        fetch("/api/distributor/my-center")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.center) setMyCenter(d.center); })
            .catch(() => { });
    }, []);

    // Initialize camera scanner
    useEffect(() => {
        if (cameraActive && typeof window !== "undefined") {
            import("html5-qrcode").then(({ Html5Qrcode }) => {
                const scanner = new Html5Qrcode("qr-reader");
                scannerRef.current = scanner;

                scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        scanner.stop().then(() => setCameraActive(false));
                        handleVerify(decodedText);
                    },
                    () => { } // ignore errors (no QR found in frame)
                ).catch((err: any) => {
                    console.error("Camera error:", err);
                    setError("لا يمكن الوصول للكاميرا. يرجى استخدام الإدخال اليدوي");
                    setCameraActive(false);
                });
            });
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [cameraActive]);

    const handleVerify = async (token: string) => {
        setVerifying(true);
        setError("");
        setCitizen(null);
        setResult(null);

        try {
            const res = await fetch("/api/qr/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCitizen(data.citizen);
            setAllocations(data.allocations);
            if (data.allocations.length > 0) {
                setSelectedAllocation(data.allocations[0].id);
            }
        } catch (err: any) {
            setError(err.message || "خطأ في التحقق من الرمز");
        } finally {
            setVerifying(false);
        }
    };

    const handleRedeem = async () => {
        if (!selectedAllocation || !quantity) return;
        if (!myCenter) {
            setResult({ success: false, message: "لم يتم تعيينك لأي مركز توزيع. تواصل مع الإدارة" });
            return;
        }
        setShowConfirm(false);
        setProcessing(true);
        setResult(null);

        try {
            const res = await fetch("/api/transactions/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    allocationId: selectedAllocation,
                    quantity: parseFloat(quantity),
                    citizenId: citizen?.id,  // Ownership validation
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResult({ success: true, message: data.message });

            // Update allocation in list
            setAllocations((prev) =>
                prev.map((a) =>
                    a.id === selectedAllocation
                        ? { ...a, remainingQuota: data.remainingQuota }
                        : a
                )
            );
            setQuantity("");
        } catch (err: any) {
            setResult({ success: false, message: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const resetScan = () => {
        setCitizen(null);
        setAllocations([]);
        setSelectedAllocation("");
        setQuantity("");
        setResult(null);
        setError("");
        setManualToken("");
    };

    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    return (
        <div className="page-container">
            <div className="page-header" style={{ textAlign: "center" }}>
                <h1 className="page-title">مسح رمز QR</h1>
                <p className="page-subtitle">مسح رمز المواطن للتحقق وخصم المخصصات</p>
            </div>

            {/* Step 1: Scan or Enter QR */}
            {!citizen && (
                <div className="card" style={{ maxWidth: 500, margin: "0 auto" }}>
                    {/* Camera Scanner */}
                    <div style={{ marginBottom: "var(--space-4)" }}>
                        {cameraActive ? (
                            <div className="scanner-container">
                                <div className="scanner-frame">
                                    <div id="qr-reader" style={{ width: "100%" }} />
                                    <div className="scanner-overlay">
                                        <div className="scanner-line" />
                                    </div>
                                </div>
                                <button className="btn btn-ghost mt-4" onClick={() => { setCameraActive(false); scannerRef.current?.stop().catch(() => { }); }}
                                    style={{ width: "100%" }}>
                                    إيقاف الكاميرا
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-primary btn-lg" onClick={() => setCameraActive(true)} style={{ width: "100%" }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 6V1h-5" /><path d="M1 6V1h5" />
                                    <path d="M23 18v5h-5" /><path d="M1 18v5h5" />
                                    <line x1="1" y1="12" x2="23" y2="12" />
                                </svg>
                                فتح الكاميرا للمسح
                            </button>
                        )}
                    </div>

                    <div className="auth-divider">أو إدخال الرمز يدوياً</div>

                    <div className="form-group">
                        <input
                            className="form-input"
                            placeholder="الصق رمز QR هنا..."
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            dir="ltr"
                            style={{ fontFamily: "monospace", fontSize: "var(--font-size-xs)" }}
                        />
                    </div>
                    <button className="btn btn-secondary btn-lg" style={{ width: "100%" }} disabled={!manualToken || verifying}
                        onClick={() => handleVerify(manualToken)}>
                        {verifying ? "جاري التحقق..." : "تحقق من الرمز"}
                    </button>

                    {error && (
                        <div className="alert alert-danger mt-4">
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Citizen Info & Allocations */}
            {citizen && (
                <div style={{ maxWidth: 600, margin: "0 auto" }}>
                    {/* Citizen Card */}
                    <div className="card mb-4 animate-slide-up" style={{
                        background: "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                        color: "white", border: "none",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 className="font-bold text-xl">{citizen.fullName}</h2>
                                <div style={{ opacity: 0.8, fontSize: "var(--font-size-sm)", marginTop: 4 }}>
                                    الرقم الوطني: <span dir="ltr">{citizen.nationalId}</span>
                                </div>
                                {citizen.familyBook && (
                                    <div style={{ opacity: 0.8, fontSize: "var(--font-size-sm)", marginTop: 2 }}>
                                        دفتر العائلة: {citizen.familyBook.bookNumber} ({citizen.memberCount} أفراد)
                                    </div>
                                )}
                            </div>
                            <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: "rgba(255,255,255,0.15)", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                fontSize: "var(--font-size-xl)", fontWeight: 800,
                            }}>
                                {citizen.fullName.charAt(0)}
                            </div>
                        </div>
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`alert ${result.success ? "alert-success" : "alert-danger"} mb-4 animate-slide-up`}>
                            <span>{result.message}</span>
                        </div>
                    )}

                    {/* Allocations */}
                    {allocations.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <h3>لا توجد مخصصات متاحة</h3>
                                <p>لا توجد مخصصات نشطة لهذا المواطن حالياً</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="font-bold text-lg mb-4">المخصصات المتاحة</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                                {allocations.map((alloc) => {
                                    const pct = alloc.totalQuota > 0 ? (alloc.remainingQuota / alloc.totalQuota) * 100 : 0;
                                    const unit = unitLabels[alloc.unit] || alloc.unit;
                                    return (
                                        <label key={alloc.id} className="card animate-fade-in" style={{
                                            cursor: "pointer",
                                            borderColor: selectedAllocation === alloc.id ? "var(--primary)" : undefined,
                                            boxShadow: selectedAllocation === alloc.id ? "0 0 0 2px var(--navy-300)" : undefined,
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                                <input type="radio" name="allocation" value={alloc.id}
                                                    checked={selectedAllocation === alloc.id}
                                                    onChange={() => setSelectedAllocation(alloc.id)}
                                                    style={{ width: 18, height: 18 }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold">{alloc.categoryName}</span>
                                                        <span className={`badge ${pct > 50 ? "badge-success" : pct > 20 ? "badge-warning" : "badge-danger"}`}>
                                                            {alloc.remainingQuota} / {alloc.totalQuota} {unit}
                                                        </span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div className={`progress-fill ${pct > 50 ? "success" : pct > 20 ? "warning" : "danger"}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Quantity & Submit */}
                            <div className="card animate-slide-up">
                                {myCenter && (
                                    <div className="alert alert-info" style={{ marginBottom: "var(--space-3)", padding: "var(--space-2) var(--space-3)" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                        <span style={{ fontSize: "var(--font-size-xs)" }}>مركز التوزيع: <strong>{myCenter.name}</strong></span>
                                    </div>
                                )}
                                {!myCenter && (
                                    <div className="alert alert-danger" style={{ marginBottom: "var(--space-3)" }}>
                                        <span>لم يتم تعيينك لأي مركز توزيع. تواصل مع الإدارة.</span>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">الكمية المراد خصمها</label>
                                    <input className="form-input" type="number" step="0.1" min="0.1"
                                        value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="أدخل الكمية" dir="ltr" style={{ textAlign: "right" }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                                    <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
                                        disabled={!selectedAllocation || !quantity || processing || !myCenter}
                                        onClick={() => setShowConfirm(true)}>
                                        {processing ? "جاري المعالجة..." : "تأكيد الخصم"}
                                    </button>
                                    <button className="btn btn-ghost btn-lg" onClick={resetScan}>
                                        مسح جديد
                                    </button>
                                </div>
                            </div>

                            {/* Confirmation Dialog */}
                            {showConfirm && (
                                <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
                                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                                        <div className="modal-header">
                                            <h2 className="modal-title">تأكيد العملية</h2>
                                        </div>
                                        <div className="modal-body">
                                            <p>هل أنت متأكد من خصم <strong>{quantity}</strong> من مخصصات:</p>
                                            <p style={{ fontWeight: 700, color: "var(--primary)", marginTop: "var(--space-2)" }}>{citizen?.fullName}</p>
                                            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--gray-500)" }}>عبر مركز: {myCenter?.name}</p>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>إلغاء</button>
                                            <button className="btn btn-primary" onClick={handleRedeem}>تأكيد الخصم</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
