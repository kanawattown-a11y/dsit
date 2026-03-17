"use client";

import { useState } from "react";

export default function AdminNotificationsPage() {
    const [formData, setFormData] = useState({
        title: "",
        body: "",
        targetRole: "",
        targetUserId: "",
        type: "MANUAL" as string,
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSending(true);
        setSent(false);

        try {
            const res = await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    type: "MANUAL",
                    targetRole: formData.targetRole || undefined,
                    targetUserId: formData.targetUserId || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "فشل في الإرسال");
            }

            setSent(true);
            setFormData({ title: "", body: "", targetRole: "", targetUserId: "", type: "MANUAL" });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">إرسال الإشعارات</h1>
                <p className="page-subtitle">إرسال إشعارات يدوية للمستخدمين حسب الدور أو لمستخدم محدد</p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
                {/* Send Form */}
                <div className="card animate-slide-up">
                    <div className="card-header">
                        <h2 className="card-title">إشعار جديد</h2>
                    </div>

                    {sent && (
                        <div className="alert alert-success mb-4">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>تم إرسال الإشعار بنجاح!</span>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">الفئة المستهدفة</label>
                            <select
                                className="form-select"
                                value={formData.targetRole}
                                onChange={(e) => setFormData(p => ({ ...p, targetRole: e.target.value, targetUserId: "" }))}
                            >
                                <option value="">جميع المستخدمين</option>
                                <option value="USER">المواطنين</option>
                                <option value="DISTRIBUTOR">الموزعين</option>
                                <option value="INSPECTOR">المفتشين</option>
                                <option value="ADMIN">المدراء</option>
                            </select>
                        </div>

                        {!formData.targetRole && (
                            <div className="form-group">
                                <label className="form-label">أو معرف مستخدم محدد</label>
                                <input
                                    className="form-input"
                                    placeholder="أدخل معرف المستخدم (اختياري)"
                                    value={formData.targetUserId}
                                    onChange={(e) => setFormData(p => ({ ...p, targetUserId: e.target.value }))}
                                    dir="ltr"
                                    style={{ textAlign: "right" }}
                                />
                                <span className="form-hint">اتركه فارغاً لإرسال الإشعار للجميع</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">عنوان الإشعار *</label>
                            <input
                                className="form-input"
                                placeholder="مثال: توفر مخصصات جديدة"
                                value={formData.title}
                                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">نص الإشعار *</label>
                            <textarea
                                className="form-input"
                                placeholder="أدخل نص الإشعار..."
                                value={formData.body}
                                onChange={(e) => setFormData(p => ({ ...p, body: e.target.value }))}
                                required
                                rows={4}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={sending}>
                            {sending ? (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
                                    </svg>
                                    جاري الإرسال...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    إرسال الإشعار
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Quick Templates */}
                <div className="card animate-slide-up">
                    <div className="card-header">
                        <h2 className="card-title">قوالب سريعة</h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {[
                            { title: "توفر مخصصات جديدة", body: "تم توفر مخصصات جديدة. يرجى مراجعة حسابكم لمعرفة التفاصيل", role: "USER" },
                            { title: "تحديث كميات التوزيع", body: "تم تحديث كميات التوزيع للفترة الحالية. يرجى الاطلاع", role: "DISTRIBUTOR" },
                            { title: "تقرير تفتيش مطلوب", body: "يرجى تقديم تقرير التفتيش الشهري في أقرب وقت", role: "INSPECTOR" },
                            { title: "صيانة النظام", body: "سيتم إجراء صيانة دورية على النظام. نعتذر عن أي إزعاج", role: "" },
                        ].map((template, i) => (
                            <button
                                key={i}
                                className="btn btn-outline"
                                style={{ justifyContent: "flex-start", textAlign: "right", height: "auto", padding: "var(--space-3)" }}
                                onClick={() => setFormData({
                                    title: template.title,
                                    body: template.body,
                                    targetRole: template.role,
                                    targetUserId: "",
                                    type: "MANUAL",
                                })}
                            >
                                <div>
                                    <div className="font-semibold text-sm">{template.title}</div>
                                    <div className="text-xs text-gray-400" style={{ marginTop: 2 }}>
                                        {template.role ? `لـ ${template.role === "USER" ? "المواطنين" : template.role === "DISTRIBUTOR" ? "الموزعين" : "المفتشين"}` : "للجميع"}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
