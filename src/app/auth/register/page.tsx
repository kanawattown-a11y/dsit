"use client";

import { useState } from "react";
import Link from "next/link";
import WebcamCapture from "@/components/WebcamCapture";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        fullName: "",
        nationalId: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        region: "",
    });
    const [idPhotoFront, setIdPhotoFront] = useState<File | null>(null);
    const [idPhotoBack, setIdPhotoBack] = useState<File | null>(null);
    const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("كلمتا المرور غير متطابقتين");
            return;
        }

        if (formData.password.length < 6) {
            setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        if (!idPhotoFront || !idPhotoBack || !selfiePhoto) {
            setError("صور الهوية وصورة السيلفي مطلوبة لإكمال التسجيل");
            return;
        }

        setLoading(true);

        try {
            // Upload Images
            const uploadFile = async (file: File) => {
                const form = new FormData();
                form.append("file", file);
                form.append("folder", "id-photos");
                const res = await fetch("/api/upload", { method: "POST", body: form });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data.url;
            };

            const frontUrl = await uploadFile(idPhotoFront);
            const backUrl = await uploadFile(idPhotoBack);
            const selfieUrl = await uploadFile(selfiePhoto);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    nationalId: formData.nationalId,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    password: formData.password,
                    region: formData.region || undefined,
                    idPhotoFront: frontUrl,
                    idPhotoBack: backUrl,
                    selfiePhoto: selfieUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "حدث خطأ أثناء التسجيل");
            } else {
                setSuccess(true);
            }
        } catch {
            setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: "var(--success-bg)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto var(--space-6)",
                        color: "var(--success)",
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--navy-800)", marginBottom: "var(--space-3)" }}>
                        تم تقديم طلب التسجيل بنجاح
                    </h2>
                    <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)", lineHeight: 1.8 }}>
                        سيتم مراجعة طلبك من قبل الإدارة والموافقة عليه.
                        <br />
                        ستتمكن من تسجيل الدخول بعد الموافقة على حسابك.
                    </p>
                    <Link href="/auth/login" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </div>
        );
    }

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
                    <h1 className="auth-title">طلب تسجيل جديد</h1>
                    <p className="auth-subtitle">سيتم مراجعة الطلب والموافقة عليه من قبل الإدارة</p>
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
                        <label className="form-label" htmlFor="fullName">الاسم الكامل *</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            className="form-input"
                            placeholder="أدخل الاسم الكامل"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="nationalId">الرقم الوطني *</label>
                        <input
                            id="nationalId"
                            name="nationalId"
                            type="text"
                            className="form-input"
                            placeholder="أدخل الرقم الوطني"
                            value={formData.nationalId}
                            onChange={handleChange}
                            required
                            dir="ltr"
                            style={{ textAlign: "right" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">البريد الإلكتروني</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="البريد الإلكتروني (اختياري)"
                                value={formData.email}
                                onChange={handleChange}
                                dir="ltr"
                                style={{ textAlign: "right" }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">رقم الهاتف</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="form-input"
                                placeholder="رقم الهاتف (اختياري)"
                                value={formData.phone}
                                onChange={handleChange}
                                dir="ltr"
                                style={{ textAlign: "right" }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="region">المنطقة</label>
                        <select
                            id="region"
                            name="region"
                            className="form-select"
                            value={formData.region}
                            onChange={handleChange}
                        >
                            <option value="">اختر المنطقة (اختياري)</option>
                            <option value="center">المركز</option>
                            <option value="north">المنطقة الشمالية</option>
                            <option value="south">المنطقة الجنوبية</option>
                            <option value="east">المنطقة الشرقية</option>
                            <option value="west">المنطقة الغربية</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label">صورتك مع الهوية (الوجه الأمامي) *</label>
                            <label 
                                htmlFor="idPhotoFront" 
                                style={{ 
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                                    background: "var(--gray-50)", padding: "var(--space-4)", 
                                    border: "2px dashed var(--gray-300)", borderRadius: "var(--radius)", 
                                    cursor: "pointer", transition: "all 0.2s", flexWrap: "wrap", textAlign: "center"
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span style={{ fontWeight: 500, color: "var(--gray-700)" }}>
                                    {idPhotoFront ? "تغيير الصورة" : "اختر ملفاً"}
                                </span>
                            </label>
                            <input
                                id="idPhotoFront"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setIdPhotoFront(e.target.files?.[0] || null)}
                                required
                                style={{ display: "none" }}
                            />
                            {idPhotoFront && (
                                <div style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: "var(--space-2)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={idPhotoFront.name}>
                                    ✓ تم إرفاق: {idPhotoFront.name}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">صورة الهوية (الوجه الخلفي) *</label>
                            <label 
                                htmlFor="idPhotoBack" 
                                style={{ 
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                                    background: "var(--gray-50)", padding: "var(--space-4)", 
                                    border: "2px dashed var(--gray-300)", borderRadius: "var(--radius)", 
                                    cursor: "pointer", transition: "all 0.2s", flexWrap: "wrap", textAlign: "center"
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span style={{ fontWeight: 500, color: "var(--gray-700)" }}>
                                    {idPhotoBack ? "تغيير الصورة" : "اختر ملفاً"}
                                </span>
                            </label>
                            <input
                                id="idPhotoBack"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setIdPhotoBack(e.target.files?.[0] || null)}
                                required
                                style={{ display: "none" }}
                            />
                            {idPhotoBack && (
                                <div style={{ fontSize: "0.85rem", color: "var(--success)", marginTop: "var(--space-2)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={idPhotoBack.name}>
                                    ✓ تم إرفاق: {idPhotoBack.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: "var(--space-4)" }}>
                        <label className="form-label" htmlFor="selfiePhoto">التقط صورة شخصية (سيلفي) للوجه حصراً بالكاميرا الأمامية *</label>
                        <div className="file-upload" style={{
                            background: "var(--gray-50)", padding: "var(--space-6) var(--space-4)", 
                            border: "2px dashed var(--gray-300)", borderRadius: "var(--radius)", textAlign: "center",
                            transition: "all 0.2s"
                        }}>
                            <WebcamCapture 
                                onCapture={(file) => setSelfiePhoto(file)} 
                                onError={(err) => setError(err)}
                                label="اضغط هنا لفتح الكاميرا والتقاط صورة"
                            />
                            {selfiePhoto && <div style={{ fontSize: "0.9rem", color: "var(--success)", marginTop: "var(--space-3)", fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={selfiePhoto.name}>
                                ✓ تم الإرفاق بنجاح: {selfiePhoto.name}
                            </div>}
                            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: "var(--space-3)", maxWidth: 400, margin: "var(--space-3) auto 0" }}>سوف تستخدم صورتك الشخصية للتحقق من هويتك ومطابقتها مع صورة البطاقة المدخلة.</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">كلمة المرور *</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            dir="ltr"
                            style={{ textAlign: "right" }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="form-input"
                            placeholder="أعد إدخال كلمة المرور"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
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
                                جاري تقديم الطلب...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                تقديم طلب التسجيل
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    لديك حساب بالفعل؟{" "}
                    <Link href="/auth/login">تسجيل الدخول</Link>
                </div>
            </div>
        </div>
    );
}
