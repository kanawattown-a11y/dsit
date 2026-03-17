"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Center = {
    id: string;
    name: string;
    type: string;
};

type Report = {
    id: string;
    findings: string;
    status: "COMPLIANT" | "VIOLATION" | "WARNING";
    createdAt: string;
    attachments: string[];
    center: {
        name: string;
        type: string;
        region: string | null;
    };
};

export default function InspectorReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [myCenters, setMyCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        centerId: "",
        status: "COMPLIANT",
        findings: "",
        attachments: [] as string[]
    });
    const [uploading, setUploading] = useState(false);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/inspector/reports");
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports);
                setMyCenters(data.myCenters);
                if (data.myCenters.length > 0) {
                    setFormData(prev => ({ ...prev, centerId: data.myCenters[0].id }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/inspector/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                setReports([data.report, ...reports]);
                setIsAddModalOpen(false);
                setFormData({ ...formData, findings: "", status: "COMPLIANT", attachments: [] });
            } else {
                const err = await res.json();
                alert(err.error || "حدث خطأ");
            }
        } catch (error) {
            alert("خطأ في الاتصال");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("حجم الملف يجب ألا يتجاوز 5 ميغابايت");
            return;
        }

        setUploading(true);
        try {
            // 1. Get presigned URL
            const urlRes = await fetch("/api/inspector/s3-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, contentType: file.type })
            });

            if (!urlRes.ok) throw new Error("فشل في الحصول على رابط الرفع");
            const { uploadUrl, fileUrl } = await urlRes.json();

            // 2. Upload to S3 directly
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error("فشل في رفع الملف");

            // 3. Save URL to form data
            setFormData(prev => ({ ...prev, attachments: [...prev.attachments, fileUrl] }));
        } catch (error: any) {
            alert(error.message || "خطأ في رفع الملف");
        } finally {
            setUploading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "COMPLIANT": return "badge-success";
            case "VIOLATION": return "badge-danger";
            case "WARNING": return "badge-warning";
            default: return "badge-gray";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "COMPLIANT": return "مطابق / لا توجد مخالفات";
            case "VIOLATION": return "مخالفة (ضبط تمويني)";
            case "WARNING": return "تنبيه مسجل";
            default: return status;
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">التقارير والمخالفات</h1>
                    <p className="page-subtitle">سجل التقارير التفتيشية للمراكز الواقعة ضمن إشرافك</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                    كتابة تقرير جديد
                </button>
            </div>

            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : reports.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        <h3>لا توجد تقارير</h3>
                        <p>لم تقم بكتابة أي تقارير تفتيشية حتى الآن.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        {reports.map(report => (
                            <div key={report.id} style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)", paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--gray-100)" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{report.center.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>{report.center.region || "منطقة غير محددة"}</div>
                                    </div>
                                    <div style={{ textAlign: "left" }}>
                                        <div className={`badge ${getStatusStyle(report.status)}`} style={{ marginBottom: 4 }}>
                                            {getStatusText(report.status)}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", fontFamily: "monospace" }}>
                                            {new Date(report.createdAt).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--navy-800)", marginBottom: report.attachments?.length > 0 ? "var(--space-3)" : 0 }}>
                                    {report.findings}
                                </div>
                                {report.attachments && report.attachments.length > 0 && (
                                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
                                        {report.attachments.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                المرفق {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for new report */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">رفع تقرير تفتيشي جديد</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {myCenters.length === 0 ? (
                                <div className="alert alert-warning">
                                    لا يوجد أي مراكز مخصصة لإشرافك حالياً. يرجى مراجعة إدارة النظام لربط المراكز بحسابك لتتمكن من رفع التقارير.
                                </div>
                            ) : (
                                <form id="report-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">المركز المفتش عليه *</label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.centerId}
                                            onChange={e => setFormData({ ...formData, centerId: e.target.value })}
                                        >
                                            <option value="" disabled>-- اختر المركز --</option>
                                            {myCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">نتيجة الجولة التفتيشية *</label>
                                        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: 8 }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                                <input type="radio" name="status" value="COMPLIANT"
                                                    checked={formData.status === "COMPLIANT"}
                                                    onChange={e => setFormData({ ...formData, status: "COMPLIANT" })}
                                                />
                                                <span className="badge badge-success">{getStatusText("COMPLIANT")}</span>
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                                <input type="radio" name="status" value="WARNING"
                                                    checked={formData.status === "WARNING"}
                                                    onChange={e => setFormData({ ...formData, status: "WARNING" })}
                                                />
                                                <span className="badge badge-warning">{getStatusText("WARNING")}</span>
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                                <input type="radio" name="status" value="VIOLATION"
                                                    checked={formData.status === "VIOLATION"}
                                                    onChange={e => setFormData({ ...formData, status: "VIOLATION" })}
                                                />
                                                <span className="badge badge-danger">{getStatusText("VIOLATION")}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">المشاهدات والملاحظات التفصيلية (الضبط) *</label>
                                        <textarea
                                            className="form-input"
                                            required
                                            rows={5}
                                            placeholder="اكتب تفاصيل التقرير، المخالفات المضبوطة (إن وجدت)، أو ملاحظات الجولة..."
                                            value={formData.findings}
                                            onChange={e => setFormData({ ...formData, findings: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">إرفاق صور أو مستندات (أدلة)</label>
                                        <input
                                            type="file"
                                            className="form-input"
                                            accept="image/*,application/pdf"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        {uploading && <div style={{ fontSize: "0.85rem", color: "var(--primary)", marginTop: 4 }}>جاري الرفع...</div>}
                                        {formData.attachments.length > 0 && (
                                            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
                                                {formData.attachments.map((url, i) => (
                                                    <div key={i} className="badge badge-info" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                        مرفق {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-info" style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 8 }}>
                                        ملاحظة: سيتم تسجيل التقرير باسم المفتش بشكل دائم ولا يمكن حذفه لضمان الشفافية.
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                            <button type="submit" form="report-form" className="btn btn-primary" disabled={isSubmitting || myCenters.length === 0}>
                                {isSubmitting ? "جاري الإرسال..." : "اعتماد وإرسال التقرير"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
