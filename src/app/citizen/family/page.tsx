"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type FamilyBook = {
    id: string;
    bookNumber: string;
    region: string | null;
    address: string | null;
    status?: string;
    headOfFamilyId?: string;
    headOfFamily?: { fullName: string };
    documentPhotos?: string[];
    members?: {
        id: string;
        fullName: string;
        nationalId: string | null;
        relationship: string;
        birthDate: string | null;
        personalPhoto: string | null;
    }[];
};

type FamilyData = {
    isHead: boolean;
    familyBook: FamilyBook | null;
};

export default function CitizenFamilyBookPage() {
    const [data, setData] = useState<FamilyData | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state for creating a new family book
    const [isCreating, setIsCreating] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        bookNumber: "",
        region: "",
        address: "",
    });
    const [members, setMembers] = useState<{ fullName: string; relationship: string; nationalId: string; birthDate: string; personalPhoto: File | null }[]>([
        { fullName: "", relationship: "زوجة", nationalId: "", birthDate: "", personalPhoto: null },
    ]);
    const [photos, setPhotos] = useState<File[]>([]);

    const fetchFamily = async () => {
        try {
            const res = await fetch("/api/citizen/family");
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamily();
    }, []);

    const handleAddMember = () => {
        setMembers([...members, { fullName: "", relationship: "ابن", nationalId: "", birthDate: "", personalPhoto: null }]);
    };

    const handleMemberChange = (index: number, field: string, value: any) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setMembers(newMembers);
    };

    const handleRemoveMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setPhotos((prev) => [...prev, ...newFiles]);
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.bookNumber) return setError("رقم الدفتر مطلوب");
        if (photos.length === 0) return setError("يجب رفع صورة لدفتر العائلة على الأقل");

        setSubmitLoading(true);

        try {
            // Upload photos first
            const uploadPromises = photos.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "family-books");
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                return data.url;
            });

            const documentPhotos = await Promise.all(uploadPromises);

            // Upload members personal photos if requested
            const processedMembers = await Promise.all(members.map(async (m) => {
                let personalPhotoUrl = null;
                if (m.personalPhoto) {
                    const form = new FormData();
                    form.append("file", m.personalPhoto);
                    form.append("folder", "family-faces");
                    const pRes = await fetch("/api/upload", { method: "POST", body: form });
                    const pData = await pRes.json();
                    if (pRes.ok) personalPhotoUrl = pData.url;
                }
                return {
                    fullName: m.fullName,
                    relationship: m.relationship,
                    nationalId: m.nationalId,
                    birthDate: m.birthDate,
                    personalPhoto: personalPhotoUrl,
                };
            }));

            // Submit book application
            const res = await fetch("/api/citizen/family-books", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookNumber: form.bookNumber,
                    region: form.region,
                    address: form.address,
                    members: processedMembers,
                    documentPhotos,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "حدث خطأ");
            } else {
                setIsCreating(false);
                fetchFamily(); // Refresh state
            }
        } catch (err: any) {
            setError(err.message || "حدث خطأ أثناء الرفع بالشبكة");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return (
        <div className="page-container">
            <div className="skeleton" style={{ height: 100, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 300 }} />
        </div>
    );

    // Empty state: show info or creation form
    if (!data?.familyBook) {
        if (!isCreating) {
            return (
                <div className="page-container">
                    <div className="page-header">
                        <h1 className="page-title">دفتر العائلة</h1>
                        <p className="page-subtitle">لا يوجد دفتر عائلة مرتبط بحسابك</p>
                    </div>
                    <div className="card empty-state" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--primary)", marginBottom: "var(--space-4)" }}>
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <h3>قم بإنشاء دفتر عائلتك الإلكتروني الآن</h3>
                        <p style={{ color: "var(--gray-500)", marginBottom: "var(--space-6)", maxWidth: 500, margin: "10px auto var(--space-6)" }}>
                            يمكنك الآن ربط بيانات عائلتك بالنظام عن طريق رفع صور الدفتر وإدخال البيانات ليتم تدقيقها من الإدارة وربط المخصصات بها.
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={() => setIsCreating(true)}>
                            إنشاء دفتر عائلة جديد
                        </button>
                    </div>
                </div>
            );
        }

        // Creation form
        return (
            <div className="page-container animate-fade-in">
                <div className="page-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <h1 className="page-title">طلب دفتر عائلة جديد</h1>
                            <p className="page-subtitle">يرجى إدخال البيانات بدقة وإرفاق صور واضحة للدفتر</p>
                        </div>
                        <button className="btn btn-outline" onClick={() => setIsCreating(false)}>إلغاء</button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: "var(--space-6)" }}>
                        {error}
                    </div>
                )}

                <div className="grid" style={{ alignItems: "start", gap: "var(--space-6)" }}>
                    {/* Left: Metadata */}
                    <div className="card">
                        <h3 style={{ marginBottom: "var(--space-4)", borderBottom: "1px solid var(--gray-200)", paddingBottom: "var(--space-2)" }}>معلومات الدفتر الأساسية</h3>

                        <div className="form-group">
                            <label className="form-label">رقم دفتر العائلة *</label>
                            <input
                                className="form-input"
                                placeholder="مثال: 123456"
                                value={form.bookNumber}
                                onChange={e => setForm({ ...form, bookNumber: e.target.value })}
                                dir="ltr"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">المنطقة</label>
                            <input
                                className="form-input"
                                placeholder="المدينة"
                                value={form.region}
                                onChange={e => setForm({ ...form, region: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">العنوان التفصيلي</label>
                            <textarea
                                className="form-input"
                                placeholder="عنوان السكن بالتفصيل"
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="form-group" style={{ marginTop: "var(--space-6)" }}>
                            <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>صور دفتر العائلة (إلزامي) *</span>
                                <span style={{ fontSize: "0.8rem", color: "var(--gray-500)", fontWeight: "normal" }}>اقصى حجم 5MB للصورة</span>
                            </label>
                            <div className="file-upload" style={{
                                background: "var(--gray-50)", padding: "var(--space-6) var(--space-4)",
                                border: "2px dashed var(--gray-300)", borderRadius: "var(--radius)", textAlign: "center",
                                transition: "all 0.2s"
                            }}>
                                <label htmlFor="documentPhotos" style={{ cursor: "pointer", display: "inline-block", width: "100%" }}>
                                    <div style={{ background: "var(--primary-light)", color: "var(--primary)", width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <span style={{ fontWeight: 600, color: "var(--navy-800)", display: "block", fontSize: "1.05rem" }}>
                                        اضغط هنا لاختيار صور الدفتر
                                    </span>
                                </label>
                                <input
                                    id="documentPhotos"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoChange}
                                    style={{ display: "none" }}
                                />
                                <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: "var(--space-3)", maxWidth: 400, margin: "var(--space-3) auto 0" }}>يرجى رفع صور لجميع صفحات الدفتر التي تحتوي على بيانات لأفراد الأسرة</p>
                            </div>

                            {photos.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                                    {photos.map((p, i) => (
                                        <div key={i} className="badge badge-primary" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)" }}>
                                            <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                                            <button onClick={() => handleRemovePhoto(i)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex" }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Members */}
                    <div className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", borderBottom: "1px solid var(--gray-200)", paddingBottom: "var(--space-2)" }}>
                            <h3 style={{ margin: 0 }}>أفراد العائلة </h3>
                            <button className="btn btn-outline btn-sm" onClick={handleAddMember}>+ إضافة فرد</button>
                        </div>

                        <div style={{ maxHeight: 500, overflowY: "auto", paddingRight: "var(--space-2)" }}>
                            {members.map((m, i) => (
                                <div key={i} style={{ padding: "var(--space-4)", background: "var(--gray-50)", borderRadius: "var(--radius)", marginBottom: "var(--space-4)", position: "relative" }}>
                                    {members.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveMember(i)}
                                            style={{ position: "absolute", top: 10, left: 10, background: "white", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                        >×</button>
                                    )}
                                    <div className="grid-2" style={{ gap: "var(--space-3)" }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: "0.8rem" }}>الاسم الكامل</label>
                                            <input className="form-input" style={{ padding: "8px" }} value={m.fullName} onChange={e => handleMemberChange(i, "fullName", e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: "0.8rem" }}>صلة القرابة</label>
                                            <select className="form-select" style={{ padding: "8px" }} value={m.relationship} onChange={e => handleMemberChange(i, "relationship", e.target.value)}>
                                                <option>زوجة</option>
                                                <option>زوج</option>
                                                <option>ابن</option>
                                                <option>ابنة</option>
                                                <option>أخرى</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: "0.8rem" }}>الرقم الوطني (اختياري)</label>
                                            <input className="form-input" style={{ padding: "8px" }} value={m.nationalId} onChange={e => handleMemberChange(i, "nationalId", e.target.value)} dir="ltr" />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: "0.8rem" }}>تاريخ الميلاد</label>
                                            <input type="date" className="form-input" style={{ padding: "8px" }} value={m.birthDate} onChange={e => handleMemberChange(i, "birthDate", e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "var(--space-2)" }}>
                                        <label className="form-label" style={{ fontSize: "0.8rem", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <span>صورة شخصية للفرد (اختياري)</span>
                                            {m.personalPhoto && <span style={{ color: "var(--success)" }}>✓ تم إرفاق صورة</span>}
                                        </label>
                                        <label
                                            htmlFor={`personalPhoto-${i}`}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                                                background: "white", padding: "8px",
                                                border: "1px solid var(--gray-300)", borderRadius: "var(--radius)",
                                                cursor: "pointer", transition: "all 0.2s", fontSize: "0.85rem"
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            <span style={{ fontWeight: 500, color: "var(--gray-700)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {m.personalPhoto ? `تغيير المرفق (${m.personalPhoto.name})` : "اختر صورة شخصية"}
                                            </span>
                                        </label>
                                        <input
                                            id={`personalPhoto-${i}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleMemberChange(i, "personalPhoto", e.target.files?.[0] || null)}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: "100%", marginTop: "var(--space-4)" }}
                            onClick={handleSubmit}
                            disabled={submitLoading}
                        >
                            {submitLoading ? "جاري الإرسال..." : "إرسال الطلب واعتماد الدفتر"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Existing family book view
    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h1 className="page-title">دفتر العائلة</h1>
                        <p className="page-subtitle">بيانات البطاقة العائلية المرتبطة لتحديد المخصصات</p>
                    </div>
                    {data.familyBook.status === "PENDING" && (
                        <div className="badge badge-warning" style={{ fontWeight: 600, padding: "var(--space-2) var(--space-4)", fontSize: "0.95rem" }}>
                            قيد المراجعة من الإدارة
                        </div>
                    )}
                    {data.familyBook.status === "APPROVED" && (
                        <div className="badge badge-success" style={{ fontWeight: 600, padding: "var(--space-2) var(--space-4)", fontSize: "0.95rem" }}>
                            معتمد
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-6)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "100%", height: 6, background: "linear-gradient(90deg, var(--primary), var(--navy-300))" }} />

                <div className="grid-2">
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 4 }}>رقم دفتر العائلة</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "bold", fontFamily: "monospace", color: "var(--navy-700)" }}>{data.familyBook.bookNumber}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 4 }}>صفة الارتباط</div>
                        <div>
                            {data.isHead ?
                                <span className="badge badge-primary">رب الأسرة</span> :
                                <span className="badge badge-gray">فرد من العائلة</span>
                            }
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 4 }}>المنطقة الرئيسية</div>
                        <div style={{ fontWeight: 600 }}>{data.familyBook.region || "غير محدد"}</div>
                    </div>
                    {!data.isHead && data.familyBook.headOfFamily && (
                        <div>
                            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 4 }}>اسم رب الأسرة</div>
                            <div style={{ fontWeight: 600 }}>{data.familyBook.headOfFamily.fullName}</div>
                        </div>
                    )}
                </div>
            </div>

            {data.isHead && data.familyBook.members && (
                <div className="card table-container">
                    <h3 style={{ marginBottom: "var(--space-4)" }}>أفراد العائلة المسجلين ({data.familyBook.members.length})</h3>
                    {data.familyBook.members.length === 0 ? (
                        <p className="text-gray-500">لا يوجد أفراد مسجلين في دفتر العائلة هذا</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>الاسم الكامل</th>
                                    <th>صلة القرابة</th>
                                    <th>الرقم الوطني</th>
                                    <th>سنة الميلاد</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.familyBook.members.map((m, i) => (
                                    <tr key={m.id || i}>
                                        <td style={{ fontWeight: 600 }}>{m.fullName}</td>
                                        <td><span className="badge badge-gray">{m.relationship}</span></td>
                                        <td style={{ fontFamily: "monospace", color: "var(--gray-500)" }}>{m.nationalId || "—"}</td>
                                        <td>{m.birthDate ? new Date(m.birthDate).getFullYear() : "—"}</td>
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
