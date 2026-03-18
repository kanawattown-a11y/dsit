"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Violation = {
    id: string;
    details: string;
    fineAmount: number | null;
    status: string;
    createdAt: string;
    center: { name: string; type: string; region: string | null };
};

type Center = {
    id: string;
    name: string;
};

// Main component content wrapped to access useSearchParams
function ViolationsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const preselectedCenterId = searchParams.get("centerId") || "";

    const [violations, setViolations] = useState<Violation[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(preselectedCenterId !== "");
    const [formData, setFormData] = useState({
        centerId: preselectedCenterId,
        details: "",
        fineAmount: "",
        images: [] as string[]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [violsRes, centersRes] = await Promise.all([
                fetch("/api/inspector/violations"),
                fetch("/api/inspector/centers")
            ]);

            if (violsRes.ok) {
                const data = await violsRes.json();
                setViolations(data.violations);
            }
            if (centersRes.ok) {
                const data = await centersRes.json();
                setCenters(data.centers);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/inspector/violations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ centerId: "", details: "", fineAmount: "", images: [] });
                // If it was opened via URL params, clean the URL
                if (preselectedCenterId) router.replace("/inspector/violations");
                fetchData();
                alert("تم تسجيل الضبط بنجاح.");
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const translateStatus = (s: string) => {
        const statuses: Record<string, string> = { PENDING: "قيد المراجعة", REVIEWING: "تتم دراسته", PENALIZED: "تمت المخالفة", DISMISSED: "ملغى" };
        return statuses[s] || s;
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let bg = "var(--gray-200)", color = "var(--gray-700)";
        if (status === "PENDING" || status === "REVIEWING") { bg = "var(--warning-bg)"; color = "span(--warning-color)"; }
        if (status === "PENALIZED") { bg = "var(--danger-bg)"; color = "var(--danger)"; }
        if (status === "DISMISSED") { bg = "var(--success-bg)"; color = "var(--success)"; }
        return <span className="badge" style={{ background: bg, color }}>{translateStatus(status)}</span>;
    };

    return (
        <main className="page-container">
            <div className="page-header" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 className="page-title">الضبوط والمخالفات التموينية</h1>
                    <p className="page-description">إدارة وتأسيس الضبوط للمراكز المخالفة.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ whiteSpace: "nowrap" }}>
                    + كتابة ضبط جديد
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل البيانات...</div>
            ) : violations.length === 0 ? (
                <div className="empty-state">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3>لا توجد ضبوط سابقة</h3>
                    <p>لم تقم بتسجيل أي مخالفة تموينية حتى الآن.</p>
                </div>
            ) : (
                <div className="card table-container animate-fade-in" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                    <th>التاريخ</th>
                                    <th>المركز المخالف</th>
                                    <th>المنطقة</th>
                                    <th>نوع المخالفة / التفاصيل</th>
                                    <th>الغرامة المقترحة</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {violations.map((v) => (
                                    <tr key={v.id}>
                                        <td>{new Date(v.createdAt).toLocaleDateString("ar-SY")}</td>
                                        <td style={{ fontWeight: 600 }}>{v.center.name}</td>
                                        <td>{v.center.region}</td>
                                        <td style={{ maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {v.details}
                                        </td>
                                        <td>{v.fineAmount ? `${v.fineAmount.toLocaleString()} ل.س` : "-"}</td>
                                        <td><StatusBadge status={v.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-backdrop" style={{ backdropFilter: "blur(5px)", backgroundColor: "rgba(17, 30, 56, 0.7)" }}>
                    <div className="card modal-content" style={{ width: "90%", maxWidth: "550px", margin: "var(--space-4)", padding: "var(--space-6)" }}>
                        <div className="modal-header" style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                <div className="stat-icon danger" style={{ width: "48px", height: "48px", borderRadius: "12px" }}>
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "24px", height: "24px" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, color: "var(--danger)" }}>تحرير ضبط تمويني</h2>
                                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)", marginTop: "var(--space-1)" }}>تسجيل مخالفة رسمية بحق مركز توزيع</p>
                                </div>
                            </div>
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setIsModalOpen(false); router.replace("/inspector/violations"); }}>×</button>
                        </div>

                        <div className="alert alert-danger" style={{ marginBottom: "var(--space-6)", padding: "var(--space-3) var(--space-4)" }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: "20px", height: "20px", flexShrink: 0 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span style={{ fontSize: "var(--font-size-sm)", lineHeight: 1.5 }}>تنبيه: سيتم تثبيت هذا الضبط أصولاً وتطبيق حجز البضائع أو الغرامات القانونية فوراً.</span>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>المركز المخالف *</label>
                                <select 
                                    className="form-input" 
                                    required 
                                    value={formData.centerId} 
                                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                                >
                                    <option value="">-- اختر المركز --</option>
                                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>تفاصيل الضبط أو الشكوى الدقيقة *</label>
                                <textarea 
                                    className="form-input" 
                                    required 
                                    rows={4} 
                                    placeholder="اكتب تفاصيل المخالفة (مثال: تلاعب بالوزن، بيع خارج المنصة، جودة سيئة...)"
                                    value={formData.details}
                                    style={{ resize: "none" }}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>الغرامة المقترحة أو المسجلة (ل.س) - اختياري</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    placeholder="مثال: 500000"
                                    value={formData.fineAmount}
                                    onChange={(e) => setFormData({...formData, fineAmount: e.target.value})}
                                />
                            </div>

                            <div className="grid-2" style={{ marginTop: "var(--space-2)" }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); router.replace("/inspector/violations"); }}>
                                    تراجع وإلغاء
                                </button>
                                <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                                    {isSubmitting ? "جاري تثبيت الضبط..." : "تسجيل وتثبيت الضبط"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function InspectorViolationsPage() {
    return (
        <Suspense fallback={<div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري التحميل...</div>}>
            <ViolationsContent />
        </Suspense>
    );
}
