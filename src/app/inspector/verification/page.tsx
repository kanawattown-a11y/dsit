"use client";

import { useState, useEffect, Suspense } from "react";

type Report = {
    id: string;
    center: { id: string; name: string; region: string };
    material: { id: string; name: string; unit: string };
    reportDate: string;
    distributorAmount: number;
    distributorNotes: string | null;
    createdAt: string;
};

function VerificationContent() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [inspectorAmount, setInspectorAmount] = useState("");
    const [inspectorNotes, setInspectorNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/inspector/verification");
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleSubmitVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport) return;
        
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/inspector/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportId: selectedReport.id,
                    inspectorAmount: inspectorAmount,
                    inspectorNotes: inspectorNotes
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                alert(data.message);
                setSelectedReport(null);
                setInspectorAmount("");
                setInspectorNotes("");
                fetchReports(); // Refresh list
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page-container">
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">بوابة التصديق والمطابقة</h1>
                <p className="page-description">مراجعة تقارير الاستهلاك المرفوعة من المراكز الخاضعة لرقابتك وتأكيدها.</p>
            </div>

            <div className="card table-container animate-fade-in" style={{ padding: 0 }}>
                <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--gray-200)" }}>
                    <h2 className="card-title">التقارير اليومية المعلقة (بانتظار التدقيق)</h2>
                </div>
                
                {loading ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل التقارير...</div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--gray-500)" }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "48px", height: "48px", margin: "0 auto var(--space-4)", opacity: 0.5 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>لا يوجد تقارير معلقة</h3>
                        <p>جميع المراكز تمت مطابقتها بنجاح أو لم تقم برفع تقارير استهلاك بعد.</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>تاريخ التقرير</th>
                                <th>المركز</th>
                                <th>المادة</th>
                                <th>الكمية المُبلغة (من الموزع)</th>
                                <th>توقيت الرفع</th>
                                <th>إجراءات الرقابة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{new Date(r.reportDate).toLocaleDateString("ar-SY")}</td>
                                    <td style={{ fontWeight: 600, color: "var(--navy-800)" }}>{r.center.name}</td>
                                    <td><span className="badge" style={{ background: "var(--primary-50)", color: "var(--primary-700)" }}>{r.material.name}</span></td>
                                    <td style={{ fontWeight: 800 }}>
                                        {r.distributorAmount.toLocaleString()} <span style={{ fontSize: "0.8em", color: "var(--gray-500)", fontWeight: "normal" }}>{r.material.unit}</span>
                                    </td>
                                    <td style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>
                                        {new Date(r.createdAt).toLocaleTimeString("ar-SY")}
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                setSelectedReport(r);
                                                // Optional: prefill the amount to make it easier, but blind verification is more secure.
                                                // We'll leave it empty to force the inspector to type the real number.
                                                setInspectorAmount("");
                                            }}
                                        >
                                            القيام بالمطابقة ✔
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedReport && (
                <div className="modal-backdrop" style={{ backdropFilter: "blur(5px)", backgroundColor: "rgba(17, 30, 56, 0.7)" }}>
                    <div className="card modal-content" style={{ width: "90%", maxWidth: "500px", margin: "var(--space-4)", padding: "var(--space-6)", animation: "slideUp 0.3s ease-out" }}>
                        <div className="modal-header" style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, color: "var(--primary-800)" }}>تصديق الاستهلاك</h2>
                                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>مركز: {selectedReport.center.name}</p>
                            </div>
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setSelectedReport(null)}>×</button>
                        </div>

                        <div className="alert alert-info" style={{ marginBottom: "var(--space-4)" }}>
                            الموزع أبلغ عن استهلاك: <strong>{selectedReport.distributorAmount.toLocaleString()} {selectedReport.material.unit}</strong> من مادة ({selectedReport.material.name}).
                            <br/><br/>
                            الرجاء إدخال الرقم الفعلي الذي تم جرده على أرض الواقع.
                        </div>

                        <form onSubmit={handleSubmitVerification} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>الكمية المستهلكة الفعلية (حسب جرد المفتش) *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    required 
                                    min="0"
                                    step="0.1"
                                    placeholder="أدخل الرقم النهائي هنا..."
                                    value={inspectorAmount}
                                    onChange={(e) => setInspectorAmount(e.target.value)}
                                    style={{ fontSize: "var(--font-size-lg)", fontWeight: "bold" }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>ملاحظات التفتيش (اختياري / إلزامي في حال وجود نقص)</label>
                                <textarea 
                                    className="form-input" 
                                    rows={2}
                                    placeholder="اكتب التبرير أو الملاحظات في حال عدم مساواة الرقمين..."
                                    value={inspectorNotes}
                                    onChange={(e) => setInspectorNotes(e.target.value)}
                                    style={{ resize: "none" }}
                                />
                            </div>

                            <div className="grid-2" style={{ marginTop: "var(--space-2)" }}>
                                <button type="button" className="btn btn-outline" onClick={() => setSelectedReport(null)}>
                                    إلغاء النافذة
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? "جاري المطابقة..." : "تأكيد ومطابقة"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function InspectorVerificationPage() {
    return (
        <Suspense fallback={<div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري التحميل...</div>}>
            <VerificationContent />
        </Suspense>
    );
}
