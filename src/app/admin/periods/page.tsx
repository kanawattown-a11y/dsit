"use client";

import { useState, useEffect } from "react";

type Period = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "ACTIVE" | "UPCOMING" | "CLOSED";
    category: { id: string; nameAr: string; unit: string };
    _count: { allocations: number };
};

type Category = { id: string; nameAr: string; unit: string; type: string };

const statusLabels: Record<string, string> = {
    UPCOMING: "قادم",
    ACTIVE: "نشط",
    CLOSED: "منتهي",
};
const statusColors: Record<string, string> = {
    UPCOMING: "badge-warning",
    ACTIVE: "badge-success",
    CLOSED: "badge-gray",
};

export default function AdminPeriodsPage() {
    const [data, setData] = useState<{ periods: Period[]; categories: Category[] }>({ periods: [], categories: [] });
    const [loading, setLoading] = useState(true);
    const [catFilter, setCatFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ categoryId: "", name: "", startDate: "", endDate: "", status: "UPCOMING" });
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningPeriod, setAssigningPeriod] = useState<Period | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [assignResult, setAssignResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/allocations/periods${catFilter ? `?categoryId=${catFilter}` : ""}`);
            if (res.ok) setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [catFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/allocations/periods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ categoryId: "", name: "", startDate: "", endDate: "", status: "UPCOMING" });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || "خطأ");
            }
        } catch (e) { alert("خطأ في الاتصال"); }
        finally { setSaving(false); }
    };

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/allocations/periods/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchData();
        } catch (e) { console.error(e); }
        finally { setUpdatingId(null); }
    };

    const handleAssign = async () => {
        if (!assigningPeriod) return;
        setAssigning(true);
        setAssignResult(null);
        try {
            const res = await fetch("/api/allocations/bulk-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ periodId: assigningPeriod.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setAssignResult({ success: true, message: data.message, count: data.assignedCount });
                fetchData(); // Refresh the counts
            } else {
                setAssignResult({ success: false, message: data.error });
            }
        } catch (e) {
            setAssignResult({ success: false, message: "حدث خطأ في الاتصال بالخادم" });
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 className="page-title">إدارة دورات التوزيع</h1>
                    <p className="page-subtitle">إنشاء وإدارة دورات توزيع المخصصات الحكومية</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    دورة جديدة
                </button>
            </div>

            {/* Filter */}
            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>فلترة حسب المادة:</label>
                    <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ maxWidth: 250 }}>
                        <option value="">جميع المواد</option>
                        {data.categories.map(c => (
                            <option key={c.id} value={c.id}>{c.nameAr}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : data.periods.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <h3>لا توجد دورات توزيع</h3>
                        <p>ابدأ بإنشاء دورة توزيع جديدة.</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>اسم الدورة</th>
                                <th>المادة</th>
                                <th>تاريخ البداية</th>
                                <th>تاريخ الانتهاء</th>
                                <th>عدد المخصصات</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.periods.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td><span className="badge badge-info">{p.category.nameAr}</span></td>
                                    <td>{new Date(p.startDate).toLocaleDateString("en-US")}</td>
                                    <td>{new Date(p.endDate).toLocaleDateString("en-US")}</td>
                                    <td><span className="badge badge-gray">{p._count.allocations.toLocaleString("en-US")}</span></td>
                                    <td><span className={`badge ${statusColors[p.status]}`}>{statusLabels[p.status]}</span></td>
                                    <td>
                                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                            {p.status === "UPCOMING" && (
                                                <>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => {
                                                            setAssigningPeriod(p);
                                                            setAssignResult(null);
                                                            setShowAssignModal(true);
                                                        }}
                                                    >
                                                        توزيع
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        disabled={updatingId === p.id}
                                                        onClick={() => updateStatus(p.id, "ACTIVE")}
                                                    >
                                                        تفعيل
                                                    </button>
                                                </>
                                            )}
                                            {p.status === "ACTIVE" && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ color: "var(--danger)" }}
                                                    disabled={updatingId === p.id}
                                                    onClick={() => {
                                                        if (confirm("هل أنت متأكد من إغلاق هذه الدورة?")) updateStatus(p.id, "CLOSED");
                                                    }}
                                                >
                                                    إغلاق
                                                </button>
                                            )}
                                            {p.status === "CLOSED" && (
                                                <span className="badge badge-gray">مغلقة</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">إنشاء دورة توزيع جديدة</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="period-form" onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">المادة *</label>
                                    <select className="form-select" required value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}>
                                        <option value="">اختر المادة</option>
                                        {data.categories.map(c => <option key={c.id} value={c.id}>{c.nameAr} ({c.unit})</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">اسم الدورة *</label>
                                    <input className="form-input" required placeholder="مثال: مارس 2026" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">تاريخ البداية *</label>
                                        <input className="form-input" type="date" required value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">تاريخ الانتهاء *</label>
                                        <input className="form-input" type="date" required value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الحالة الابتدائية</label>
                                    <select className="form-select" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                                        <option value="UPCOMING">قادم (غير نشط بعد)</option>
                                        <option value="ACTIVE">نشط مباشرة</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button type="submit" form="period-form" className="btn btn-primary" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء الدورة"}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Assign Modal */}
            {showAssignModal && assigningPeriod && (
                <div className="modal-overlay" onClick={() => !assigning && setShowAssignModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">توزيع المخصصات</h2>
                            {!assigning && <button className="btn btn-ghost btn-icon" onClick={() => setShowAssignModal(false)}>×</button>}
                        </div>
                        <div className="modal-body">
                            {assignResult ? (
                                <div className={`alert ${assignResult.success ? "alert-success" : "alert-danger"}`}>
                                    {assignResult.success && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                                    {assignResult.message}
                                </div>
                            ) : (
                                <>
                                    <p style={{ marginBottom: "var(--space-4)" }}>
                                        هل أنت متأكد من الرغبة بتوزيع مخصصات <strong>{assigningPeriod.category.nameAr}</strong> لدورة <strong>{assigningPeriod.name}</strong> لجميع المواطنين المستحقين؟
                                    </p>
                                    <div className="alert alert-warning" style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                        <div style={{ fontSize: "var(--font-size-sm)" }}>
                                            <strong style={{ display: "block", marginBottom: 4 }}>تنبيه</strong>
                                            هذه العملية قد تستغرق بعض الوقت للإنتهاء، وسيتم إسناد الحصص لكل المواطنين بناءً على نوع المادة (عائلي أو فردي) ودفتر العائلة.
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            {!assignResult?.success && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAssign}
                                    disabled={assigning}
                                    style={{ flex: 1 }}
                                >
                                    {assigning ? "جاري عملية التوزيع..." : "بدء التوزيع الشامل"}
                                </button>
                            )}
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowAssignModal(false)}
                                disabled={assigning}
                                style={{ flex: assignResult?.success ? 1 : undefined }}
                            >
                                {assignResult?.success ? "إغلاق النافذة" : "إلغاء"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
