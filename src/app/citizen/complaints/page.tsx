"use client";

import { useState, useEffect } from "react";

type Center = {
    id: string;
    name: string;
    region: string | null;
};

type Complaint = {
    id: string;
    subject: string;
    description: string;
    status: string;
    adminReply: string | null;
    createdAt: string;
    center: { name: string; region: string | null } | null;
};

export default function CitizenComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        subject: "",
        centerId: "",
        description: "",
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/citizen/complaints");
            if (res.ok) {
                const data = await res.json();
                setComplaints(data.complaints);
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
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/citizen/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsFormOpen(false);
                setFormData({ subject: "", centerId: "", description: "" });
                fetchData();
                alert("تم تقديم الشكوى بنجاح. سيتم مراجعتها من قبل الإدارة في أقرب وقت.");
            } else {
                const data = await res.json();
                alert(data.error || "تأكد من الحقول المطلوبة");
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال بالخادم.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const translateStatus = (s: string) => {
        const statuses: Record<string, string> = {
            PENDING: "قيد المراجعة",
            REVIEWING: "تتم متابعتها",
            RESOLVED: "محلولة",
            REJECTED: "مرفوضة"
        };
        return statuses[s] || s;
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let bg = "var(--gray-200)", color = "var(--gray-700)";
        if (status === "PENDING") { bg = "var(--warning-bg)"; color = "span(--warning-color)"; }
        if (status === "REVIEWING") { bg = "var(--primary-100)"; color = "var(--primary-700)"; }
        if (status === "RESOLVED") { bg = "var(--success-bg)"; color = "var(--success)"; }
        if (status === "REJECTED") { bg = "var(--danger-bg)"; color = "var(--danger)"; }
        
        return <span className="badge" style={{ background: bg, color }}>{translateStatus(status)}</span>;
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="page-title">صندوق الشكاوى والمقترحات</h1>
                    <p className="page-description">لتبليغ الإدارة عن أي مخالفات بالأسعار، سوء الصنع، أو التلاعب بالأوزان.</p>
                </div>
                {!isFormOpen && (
                    <button className="btn btn-primary" onClick={() => setIsFormOpen(true)} style={{ whiteSpace: "nowrap" }}>
                        + كتابة شكوى
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="card mb-6 animate-slide-up">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>تفاصيل الشكوى</h2>
                        <button className="btn btn-ghost" onClick={() => setIsFormOpen(false)}>إلغاء</button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label">موضوع الشكوى *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required 
                                placeholder="مثال: الخبز غير ناضج، وزن الغاز ناقص..."
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">المركز المشتكى عليه (اختياري)</label>
                            <select 
                                className="form-select" 
                                value={formData.centerId}
                                onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                            >
                                <option value="">-- شكوى عامة بدون تحديد مركز --</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name} {c.region ? `(${c.region})` : ""}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">تفاصيل المشكلة بدقة *</label>
                            <textarea 
                                className="form-input" 
                                required 
                                rows={5}
                                placeholder="يرجى كتابة كافة تفاصيل الشكوى ليتمكن المفتش من متابعتها..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? "جاري الإرسال..." : "إرسال الشكوى للإدارة"}
                        </button>
                    </form>
                </div>
            )}

            {!isFormOpen && (
                <div className="card table-container animate-fade-in">
                    {loading ? (
                        <div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري تحميل شكاواك السابقة...</div>
                    ) : complaints.length === 0 ? (
                        <div className="empty-state" style={{ padding: "var(--space-12) 0" }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3>لا توجد شكاوى</h3>
                            <p>لم تقم بإرسال أي شكوى سابقة.</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>الموضوع</th>
                                    <th>المركز المشتكى عليه</th>
                                    <th>الحالة</th>
                                    <th>رد الإدارة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ whiteSpace: "nowrap" }}>{new Date(c.createdAt).toLocaleDateString("ar-SY")}</td>
                                        <td style={{ fontWeight: 600 }}>{c.subject}</td>
                                        <td>{c.center ? c.center.name : "عام"}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td style={{ color: c.adminReply ? "var(--gray-900)" : "var(--gray-400)" }}>
                                            {c.adminReply || "لا يوجد رد حتى الآن"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
