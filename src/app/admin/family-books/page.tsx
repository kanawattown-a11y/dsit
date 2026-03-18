"use client";

import { useState, useEffect, useCallback } from "react";
import { AS_SUWAYDA_REGIONS } from "@/lib/constants";
import SearchableSelect from "@/components/SearchableSelect";

interface FamilyBook {
    id: string;
    bookNumber: string;
    region: string | null;
    address: string | null;
    headOfFamily: { id: string; fullName: string; nationalId: string };
    members: {
        id: string;
        fullName: string;
        nationalId: string | null;
        birthDate: string | null;
        relationship: string;
        personalPhoto: string | null;
    }[];
    status: string;
    documentPhotos?: string[];
    createdAt: string;
}

const statusLabels: Record<string, string> = {
    PENDING: "قيد المراجعة",
    APPROVED: "معتمد",
    REJECTED: "مرفوض",
};

const statusColors: Record<string, string> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
};

export default function AdminFamilyBooksPage() {
    const [books, setBooks] = useState<FamilyBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDocsModal, setShowDocsModal] = useState<FamilyBook | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        bookNumber: "", headOfFamilyNationalId: "", region: "", address: "",
        members: [{ fullName: "", nationalId: "", birthDate: "", relationship: "زوجة" }],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            const res = await fetch(`/api/family-books?${params}`);
            const data = await res.json();
            setBooks(data.familyBooks || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchBooks(); }, [fetchBooks]);

    const addMember = () => {
        setFormData(p => ({
            ...p,
            members: [...p.members, { fullName: "", nationalId: "", birthDate: "", relationship: "" }],
        }));
    };

    const removeMember = (index: number) => {
        setFormData(p => ({
            ...p,
            members: p.members.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const url = editingId ? `/api/family-books/${editingId}` : "/api/family-books";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowModal(false);
            setEditingId(null);
            setFormData({
                bookNumber: "", headOfFamilyNationalId: "", region: "", address: "",
                members: [{ fullName: "", nationalId: "", birthDate: "", relationship: "زوجة" }],
            });
            fetchBooks();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (book: FamilyBook) => {
        setFormData({
            bookNumber: book.bookNumber,
            headOfFamilyNationalId: book.headOfFamily.nationalId,
            region: book.region || "",
            address: book.address || "",
            members: book.members.map(m => ({
                fullName: m.fullName,
                nationalId: m.nationalId || "",
                birthDate: m.birthDate ? m.birthDate.split("T")[0] : "",
                relationship: m.relationship,
            })),
        });
        setEditingId(book.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف دفتر العائلة هذا؟ سيؤدي ذلك إلى حذف جميع أفراد العائلة المرتبطين به.")) return;
        try {
            const res = await fetch(`/api/family-books/${id}`, { method: "DELETE" });
            if (res.ok) fetchBooks();
            else alert("فشل الحذف");
        } catch (e) {
            alert("خطأ في الاتصال");
        }
    };

    const handleAction = async (bookId: string, action: "approve" | "reject") => {
        setActionLoading(bookId);
        try {
            const statusMap = { approve: "APPROVED", reject: "REJECTED" };
            const res = await fetch(`/api/family-books/${bookId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: statusMap[action] }),
            });

            if (res.ok) fetchBooks();
            else alert("فشل تغيير الحالة");
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                <div>
                    <h1 className="page-title">دفاتر العائلة</h1>
                    <p className="page-subtitle">إدارة دفاتر العائلة وأفراد كل عائلة</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    إنشاء دفتر عائلة
                </button>
            </div>

            {/* Search */}
            <div className="card mb-6">
                <div className="search-bar" style={{ maxWidth: 400 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input placeholder="بحث برقم الدفتر أو اسم رب الأسرة..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Books List */}
            {loading ? (
                <div className="grid grid-2">
                    {[1, 2].map(i => <div key={i} className="card"><div className="skeleton" style={{ width: "100%", height: 120 }} /></div>)}
                </div>
            ) : books.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>لا توجد دفاتر عائلة</h3>
                    <p>ابدأ بإنشاء دفتر عائلة جديد</p>
                </div></div>
            ) : (
                <div className="grid grid-2">
                    {books.map((book) => (
                        <div key={book.id} className="card animate-fade-in">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                                <div>
                                    <div className="text-xs text-gray-400">رقم الدفتر</div>
                                    <div className="font-bold text-lg" dir="ltr">{book.bookNumber}</div>
                                </div>
                                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                                    <span className={`badge badge-${statusColors[book.status]}`}>{statusLabels[book.status]}</span>
                                    {book.documentPhotos && book.documentPhotos.length > 0 && (
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowDocsModal(book)} title="عرض الوثائق" style={{ color: "var(--primary)" }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                    )}
                                    <span className="badge badge-info">{book.members.length + 1} فرد</span>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(book)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(book.id)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginBottom: "var(--space-4)" }}>
                                <div className="text-xs text-gray-400">رب الأسرة</div>
                                <div className="font-semibold">{book.headOfFamily.fullName}</div>
                                <div className="text-xs text-gray-500" dir="ltr">{book.headOfFamily.nationalId}</div>
                            </div>
                            {book.members.length > 0 && (
                                <div>
                                    <div className="text-xs text-gray-400 mb-2">الأفراد</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                                        {book.members.map((m) => (
                                            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)" }}>
                                                <span>{m.fullName}</span>
                                                <span className="text-gray-400">{m.relationship}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {book.status === "PENDING" && (
                                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--gray-200)" }}>
                                    <button 
                                        className="btn btn-success" 
                                        style={{ flex: 1 }} 
                                        onClick={() => handleAction(book.id, "approve")}
                                        disabled={actionLoading === book.id}
                                    >
                                        موافقة
                                    </button>
                                    <button 
                                        className="btn btn-danger" 
                                        style={{ flex: 1 }} 
                                        onClick={() => handleAction(book.id, "reject")}
                                        disabled={actionLoading === book.id}
                                    >
                                        رفض
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingId ? "تعديل دفتر العائلة" : "إنشاء دفتر عائلة جديد"}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowModal(false); setEditingId(null); }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger mb-4"><span>{error}</span></div>}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                    <div className="form-group">
                                        <label className="form-label">رقم الدفتر *</label>
                                        <input className="form-input" dir="ltr" style={{ textAlign: "right" }} value={formData.bookNumber}
                                            onChange={(e) => setFormData(p => ({ ...p, bookNumber: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الرقم الوطني لرب الأسرة *</label>
                                        <input className="form-input" dir="ltr" style={{ textAlign: "right" }} value={formData.headOfFamilyNationalId}
                                            onChange={(e) => setFormData(p => ({ ...p, headOfFamilyNationalId: e.target.value }))} required disabled={!!editingId} />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                    <div className="form-group">
                                        <label className="form-label">المنطقة</label>
                                        <SearchableSelect 
                                            value={formData.region} 
                                            onChange={val => setFormData(p => ({ ...p, region: val }))} 
                                            options={AS_SUWAYDA_REGIONS} 
                                            placeholder="-- اختر أو ابحث عن المنطقة --" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">العنوان</label>
                                        <input className="form-input" value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} />
                                    </div>
                                </div>

                                <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "var(--space-4)", marginTop: "var(--space-2)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                                        <h4 className="font-semibold">أفراد العائلة</h4>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addMember}>+ إضافة فرد</button>
                                    </div>
                                    {formData.members.map((member, i) => (
                                        <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)", alignItems: "end" }}>
                                            <div className="form-group" style={{ flex: "1 1 200px", marginBottom: 0 }}>
                                                {i === 0 && <label className="form-label">الاسم</label>}
                                                <input className="form-input" placeholder="الاسم الكامل" value={member.fullName}
                                                    onChange={(e) => { const m = [...formData.members]; m[i].fullName = e.target.value; setFormData(p => ({ ...p, members: m })); }} />
                                            </div>
                                            <div className="form-group" style={{ flex: "1 1 150px", marginBottom: 0 }}>
                                                {i === 0 && <label className="form-label">الرقم الوطني</label>}
                                                <input className="form-input" dir="ltr" value={member.nationalId}
                                                    onChange={(e) => { const m = [...formData.members]; m[i].nationalId = e.target.value; setFormData(p => ({ ...p, members: m })); }} />
                                            </div>
                                            <div className="form-group" style={{ flex: "1 1 120px", marginBottom: 0 }}>
                                                {i === 0 && <label className="form-label">صلة القرابة</label>}
                                                <select className="form-select" value={member.relationship}
                                                    onChange={(e) => { const m = [...formData.members]; m[i].relationship = e.target.value; setFormData(p => ({ ...p, members: m })); }}>
                                                    <option value="زوجة">زوجة</option><option value="ابن">ابن</option>
                                                    <option value="ابنة">ابنة</option><option value="أب">أب</option>
                                                    <option value="أم">أم</option><option value="أخ">أخ</option>
                                                    <option value="أخت">أخت</option><option value="أخرى">أخرى</option>
                                                </select>
                                            </div>
                                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeMember(i)}
                                                style={{ color: "var(--danger)" }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إنشاء الدفتر"}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => { setShowModal(false); setEditingId(null); }}>إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Docs Modal */}
            {showDocsModal && (
                <div className="modal-overlay" onClick={() => setShowDocsModal(null)}>
                    <div className="modal-content" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">وثائق دفتر العائلة ({showDocsModal.bookNumber})</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowDocsModal(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                            {showDocsModal.documentPhotos && showDocsModal.documentPhotos.map((photo, i) => (
                                <div key={i} style={{ marginBottom: "var(--space-4)" }}>
                                    <div style={{ padding: "var(--space-2)", background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderBottom: "none", borderRadius: "var(--radius) var(--radius) 0 0", fontWeight: 600 }}>وثيقة دفتر العائلة {i + 1}</div>
                                    <a href={photo} target="_blank" rel="noreferrer">
                                        <img 
                                            src={photo} 
                                            alt={`Document ${i + 1}`} 
                                            style={{ width: "100%", borderRadius: "0 0 var(--radius) var(--radius)", border: "1px solid var(--gray-200)", display: "block", cursor: "zoom-in" }} 
                                        />
                                    </a>
                                </div>
                            ))}
                            
                            {showDocsModal.members && showDocsModal.members.length > 0 && (
                                <div style={{ marginTop: "var(--space-6)" }}>
                                    <h4 style={{ marginBottom: "var(--space-3)", fontSize: "1.1rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "var(--space-2)" }}>الصور الشخصية لأفراد العائلة</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                        {showDocsModal.members.map((m, i) => (
                                            <div key={i} style={{ border: "1px solid var(--gray-200)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                                                <div style={{ padding: "var(--space-2)", background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)", fontSize: "0.9rem", fontWeight: 600 }}>
                                                    {m.fullName} <span style={{ color: "var(--gray-500)", fontWeight: 400, fontSize: "0.8rem" }}>({m.relationship})</span>
                                                </div>
                                                <div style={{ padding: "var(--space-3)", textAlign: "center", background: "#fff" }}>
                                                    {m.personalPhoto ? (
                                                        <a href={m.personalPhoto} target="_blank" rel="noreferrer">
                                                            <img 
                                                                src={m.personalPhoto} 
                                                                alt={`صورة ${m.fullName}`} 
                                                                style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "var(--radius)", cursor: "zoom-in" }} 
                                                            />
                                                        </a>
                                                    ) : (
                                                        <div style={{ padding: "var(--space-4)", color: "var(--gray-400)", fontSize: "0.85rem", background: "var(--gray-50)", borderRadius: "var(--radius)" }}>لم يتم إرفاق صورة شخصية</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowDocsModal(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
