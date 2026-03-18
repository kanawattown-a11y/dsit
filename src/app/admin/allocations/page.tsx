"use client";

import { useState, useEffect, useCallback } from "react";

interface AllocationCategory {
    id: string;
    name: string;
    nameAr: string;
    type: string;
    unit: string;
    baseQuota: number;
    quotaPerPerson: number | null;
    icon: string | null;
    isActive: boolean;
    description: string | null;
    _count?: { periods: number };
}

export default function AdminAllocationsPage() {
    const [categories, setCategories] = useState<AllocationCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AllocationCategory | null>(null);
    const [formData, setFormData] = useState({
        name: "", nameAr: "", type: "FAMILY", unit: "kg",
        baseQuota: "", quotaPerPerson: "", description: "",
    });
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/allocations/categories");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: "", nameAr: "", type: "FAMILY", unit: "kg", baseQuota: "", quotaPerPerson: "", description: "" });
        setShowModal(true);
    };

    const openEditModal = (cat: AllocationCategory) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name, nameAr: cat.nameAr, type: cat.type,
            unit: cat.unit, baseQuota: String(cat.baseQuota),
            quotaPerPerson: cat.quotaPerPerson ? String(cat.quotaPerPerson) : "",
            description: cat.description || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/allocations/categories/${editingCategory.id}`
                : "/api/allocations/categories";
            const method = editingCategory ? "PUT" : "POST";
            await fetch(url, {
                method, headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    baseQuota: parseFloat(formData.baseQuota),
                    quotaPerPerson: formData.quotaPerPerson ? parseFloat(formData.quotaPerPerson) : null,
                }),
            });
            setShowModal(false);
            fetchCategories();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const toggleActive = async (cat: AllocationCategory) => {
        await fetch(`/api/allocations/categories/${cat.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !cat.isActive }),
        });
        fetchCategories();
    };

    const typeLabels: Record<string, string> = { FAMILY: "عائلي", INDIVIDUAL: "فردي" };
    const unitLabels: Record<string, string> = { kg: "كغ", liter: "لتر", piece: "قطعة", loaf: "رغيف", cylinder: "أسطوانة" };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 className="page-title">إدارة المخصصات</h1>
                    <p className="page-subtitle">إدارة أنواع المخصصات والحصص الحكومية</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    إضافة نوع مخصصات
                </button>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="grid grid-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card">
                            <div className="skeleton" style={{ width: "60%", height: 20, marginBottom: "var(--space-3)" }} />
                            <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: "var(--space-4)" }} />
                            <div className="skeleton" style={{ width: "100%", height: 40 }} />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <h3>لا توجد أنواع مخصصات</h3>
                        <p>ابدأ بإضافة أنواع المخصصات مثل الخبز والمحروقات والمواد التموينية</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-3">
                    {categories.map((cat) => (
                        <div key={cat.id} className="card" style={{ position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                                <div>
                                    <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--navy-800)" }}>
                                        {cat.nameAr}
                                    </h3>
                                    <span className="text-sm text-gray-400">{cat.name}</span>
                                </div>
                                <span className={`badge ${cat.isActive ? "badge-success" : "badge-gray"}`}>
                                    {cat.isActive ? "نشط" : "متوقف"}
                                </span>
                            </div>

                            <div className="grid-2" style={{ gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                                <div>
                                    <div className="text-xs text-gray-400">النوع</div>
                                    <div className="text-sm font-semibold">{typeLabels[cat.type]}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">الوحدة</div>
                                    <div className="text-sm font-semibold">{unitLabels[cat.unit] || cat.unit}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400">الحصة الأساسية</div>
                                    <div className="text-sm font-semibold">{cat.baseQuota} {unitLabels[cat.unit] || cat.unit}</div>
                                </div>
                                {cat.quotaPerPerson && (
                                    <div>
                                        <div className="text-xs text-gray-400">لكل فرد</div>
                                        <div className="text-sm font-semibold">{cat.quotaPerPerson} {unitLabels[cat.unit] || cat.unit}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(cat)} style={{ flex: 1 }}>
                                    تعديل
                                </button>
                                <button
                                    className={`btn btn-sm ${cat.isActive ? "btn-ghost" : "btn-success"}`}
                                    onClick={() => toggleActive(cat)}
                                    style={{ flex: 1, color: cat.isActive ? "var(--danger)" : undefined }}
                                >
                                    {cat.isActive ? "إيقاف" : "تفعيل"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingCategory ? "تعديل المخصصات" : "إضافة نوع مخصصات جديد"}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">الاسم (إنجليزي)</label>
                                        <input className="form-input" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="bread" dir="ltr" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الاسم (عربي)</label>
                                        <input className="form-input" value={formData.nameAr} onChange={(e) => setFormData(p => ({ ...p, nameAr: e.target.value }))} required placeholder="خبز" />
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">النوع</label>
                                        <select className="form-select" value={formData.type} onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}>
                                            <option value="FAMILY">عائلي (حسب دفتر العائلة)</option>
                                            <option value="INDIVIDUAL">فردي (حسب الشخص)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الوحدة</label>
                                        <select className="form-select" value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}>
                                            <option value="kg">كيلوغرام</option>
                                            <option value="liter">لتر</option>
                                            <option value="piece">قطعة</option>
                                            <option value="loaf">رغيف</option>
                                            <option value="cylinder">أسطوانة</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">الحصة الأساسية</label>
                                        <input className="form-input" type="number" step="0.1" value={formData.baseQuota} onChange={(e) => setFormData(p => ({ ...p, baseQuota: e.target.value }))} required dir="ltr" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">كمية إضافية لكل فرد</label>
                                        <input className="form-input" type="number" step="0.1" value={formData.quotaPerPerson} onChange={(e) => setFormData(p => ({ ...p, quotaPerPerson: e.target.value }))} dir="ltr" placeholder="اختياري" />
                                        <span className="form-hint">تضاف للحصة الأساسية عند نوع عائلي</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الوصف</label>
                                    <textarea className="form-input" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="وصف اختياري" rows={3} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? "جاري الحفظ..." : editingCategory ? "تحديث" : "إنشاء"}
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
