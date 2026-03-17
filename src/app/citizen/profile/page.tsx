"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Profile = {
    id: string;
    fullName: string;
    nationalId: string;
    email: string | null;
    phone: string | null;
    region: string | null;
    status: string;
    createdAt: string;
};

export default function CitizenProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ phone: "", email: "" });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/citizen/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.profile);
                    setFormData({ phone: data.profile.phone || "", email: data.profile.email || "" });
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/citizen/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setEditing(false);
                setSuccess("تم تحديث البيانات بنجاح");
            } else {
                const data = await res.json();
                setError(data.error || "خطأ في الحفظ");
            }
        } catch (e) { setError("خطأ في الاتصال"); }
        finally { setSaving(false); }
    };

    const statusLabels: Record<string, string> = {
        APPROVED: "مفعّل",
        PENDING: "قيد المراجعة",
        REJECTED: "مرفوض",
        SUSPENDED: "موقوف",
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">الملف الشخصي</h1>
                <p className="page-subtitle">استعراض وتعديل بياناتك الشخصية</p>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: 300 }} />
            ) : profile && (
                <div style={{ maxWidth: 640, margin: "0 auto" }}>
                    {success && <div className="alert alert-success mb-4">{success}</div>}
                    {error && <div className="alert alert-danger mb-4">{error}</div>}

                    <div className="card animate-slide-up">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: "50%",
                                    background: "var(--primary)", color: "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.5rem", fontWeight: 800,
                                }}>
                                    {profile.fullName.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{profile.fullName}</div>
                                    <div style={{ color: "var(--gray-500)", fontSize: "var(--font-size-sm)" }}>{profile.nationalId}</div>
                                </div>
                            </div>
                            <span className={`badge ${profile.status === "APPROVED" ? "badge-success" : "badge-warning"}`}>
                                {statusLabels[profile.status] || profile.status}
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                            <div>
                                <div style={{ color: "var(--gray-500)", fontSize: "var(--font-size-xs)", marginBottom: 4 }}>الرقم الوطني</div>
                                <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{profile.nationalId}</div>
                            </div>
                            <div>
                                <div style={{ color: "var(--gray-500)", fontSize: "var(--font-size-xs)", marginBottom: 4 }}>تاريخ التسجيل</div>
                                <div>{new Date(profile.createdAt).toLocaleDateString("en-US")}</div>
                            </div>
                            <div>
                                <div style={{ color: "var(--gray-500)", fontSize: "var(--font-size-xs)", marginBottom: 4 }}>رقم الهاتف</div>
                                <div dir="ltr" style={{ textAlign: "right" }}>{profile.phone || "—"}</div>
                            </div>
                            <div>
                                <div style={{ color: "var(--gray-500)", fontSize: "var(--font-size-xs)", marginBottom: 4 }}>البريد الإلكتروني</div>
                                <div dir="ltr" style={{ textAlign: "right" }}>{profile.email || "—"}</div>
                            </div>
                        </div>

                        {!editing ? (
                            <button className="btn btn-primary" onClick={() => setEditing(true)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                تعديل البيانات
                            </button>
                        ) : (
                            <form onSubmit={handleSave}>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف</label>
                                    <input
                                        className="form-input"
                                        type="tel"
                                        dir="ltr"
                                        style={{ textAlign: "right" }}
                                        placeholder="مثال: 0912345678"
                                        value={formData.phone}
                                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">البريد الإلكتروني</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        dir="ltr"
                                        style={{ textAlign: "right" }}
                                        placeholder="example@gmail.com"
                                        value={formData.email}
                                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
                                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>إلغاء</button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="card animate-slide-up" style={{ marginTop: "var(--space-4)" }}>
                        <h3 style={{ marginBottom: "var(--space-4)" }}>الأمان</h3>
                        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-3)" }}>
                            لتغيير كلمة المرور، يرجى استخدام خاصية إعادة تعيين كلمة المرور
                        </p>
                        <a href="/auth/forgot-password" className="btn btn-outline">
                            تغيير كلمة المرور
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
