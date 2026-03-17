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
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>تحرير ضبط تمويني</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setIsModalOpen(false); router.replace("/inspector/violations"); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
                            <div className="form-group">
                                <label className="form-label">المركز المخالف *</label>
                                <select 
                                    className="form-select" 
                                    required 
                                    value={formData.centerId} 
                                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                                >
                                    <option value="">-- اختر المركز --</option>
                                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">تفاصيل الضبط أو الشكوى *</label>
                                <textarea 
                                    className="input-field" 
                                    required 
                                    rows={4} 
                                    placeholder="اكتب تفاصيل المخالفة (مثال: تلاعب بالوزن، بيع خارج المنصة، جودة سيئة...)"
                                    value={formData.details}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">الغرامة المقترحة أو المسجلة (ل.س) - اختياري</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    placeholder="مثال: 500000"
                                    value={formData.fineAmount}
                                    onChange={(e) => setFormData({...formData, fineAmount: e.target.value})}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); router.replace("/inspector/violations"); }} style={{ flex: 1 }}>إلغاء</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                                    {isSubmitting ? "جاري الحفظ..." : "تسجيل وضبط وتثبيت"}
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
