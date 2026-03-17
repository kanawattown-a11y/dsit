"use client";

import { useState, useEffect } from "react";

type UserBasic = { id: string; fullName: string; nationalId: string };

type Center = {
    id: string;
    name: string;
    type: "BAKERY" | "GAS_STATION" | "SUPPLY_CENTER" | "FUEL_STATION";
    region: string | null;
    address: string | null;
    isActive: boolean;
    distributors: { id: string; fullName: string; phone: string | null }[];
    inspector: { id: string; fullName: string; phone: string | null } | null;
    inspectorId: string | null;
    _count: { transactions: number };
    createdAt: string;
};

export default function AdminCentersPage() {
    const [data, setData] = useState<{ centers: Center[], dists: UserBasic[], insps: UserBasic[] }>({
        centers: [], dists: [], insps: []
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignCenterId, setAssignCenterId] = useState("");
    const [assignDistId, setAssignDistId] = useState("");
    const [assignInspId, setAssignInspId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "", type: "BAKERY", region: "", address: "", phone: "", distributorId: "", inspectorId: ""
    });

    const fetchData = async (q = "") => {
        try {
            setLoading(true);
            const res = await fetch(`/api/centers?search=${encodeURIComponent(q)}`);
            if (res.ok) {
                const json = await res.json();
                setData({ centers: json.centers, dists: json.availableDistributors, insps: json.availableInspectors });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const toggleStatus = async (id: string, current: boolean) => {
        if (!confirm(`تأكيد العملية؟`)) return;
        try {
            const res = await fetch(`/api/centers/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current })
            });
            if (res.ok) fetchData();
        } catch (error) { console.error(error); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/centers", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setFormData({ name: "", type: "BAKERY", region: "", address: "", phone: "", distributorId: "", inspectorId: "" });
                fetchData();
            } else {
                alert((await res.json()).error);
            }
        } catch (error) {
            alert("خطأ شبكة");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAssignModal = (center: Center) => {
        setAssignCenterId(center.id);
        setAssignDistId(center.distributors.length > 0 ? center.distributors[0].id : "");
        setAssignInspId(center.inspectorId || "");
        setIsAssignModalOpen(true);
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/centers/${assignCenterId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignDistributorId: assignDistId || null,
                    inspectorId: assignInspId || null,
                })
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                fetchData();
            } else {
                alert((await res.json()).error);
            }
        } catch { alert("خطأ شبكة"); }
        finally { setIsSubmitting(false); }
    };

    const getTypeAr = (t: string) => ({ "BAKERY": "مخبز", "GAS_STATION": "محطة محروقات", "SUPPLY_CENTER": "صالة استهلاكية", "FUEL_STATION": "مركز توزيع غاز" })[t] || t;

    // Combine available + already assigned distributors for the assign modal
    const currentCenter = data.centers.find(c => c.id === assignCenterId);
    const allDistsForAssign = [
        ...data.dists,
        ...(currentCenter?.distributors.map(d => ({ id: d.id, fullName: d.fullName, nationalId: "" })) || [])
    ];

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">مراكز التوزيع</h1>
                    <p className="page-subtitle">إدارة الأفران، محطات الوقود، ومراكز السورية للتجارة</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>إضافة مركز جديد</button>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={(e) => { e.preventDefault(); fetchData(search); }} className="search-bar">
                    <input type="text" placeholder="بحث بالاسم أو المنطقة..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-sm">بحث</button>
                </form>
            </div>

            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>اسم المركز</th>
                                <th>النوع</th>
                                <th>المنطقة</th>
                                <th>الموزع المعتمد</th>
                                <th>المفتش المشرف</th>
                                <th>العمليات</th>
                                <th>الحالة</th>
                                <th>الخيارات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.centers.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: "bold" }}>{c.name}</td>
                                    <td><span className="badge badge-gray">{getTypeAr(c.type)}</span></td>
                                    <td>{c.region}</td>
                                    <td>
                                        {c.distributors.length > 0 ? (
                                            c.distributors.map(d => <div key={d.id}>{d.fullName}</div>)
                                        ) : <span style={{ color: "var(--gray-400)" }}>غير محدد</span>}
                                    </td>
                                    <td>
                                        {c.inspector ? (
                                            <div>{c.inspector.fullName}</div>
                                        ) : <span style={{ color: "var(--gray-400)" }}>غير محدد</span>}
                                    </td>
                                    <td>{c._count.transactions}</td>
                                    <td>
                                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {c.isActive ? "يعمل" : "متوقف"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                            <button className="btn btn-sm btn-outline" onClick={() => openAssignModal(c)}>
                                                تعيين موظفين
                                            </button>
                                            <button className={`btn btn-sm ${c.isActive ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggleStatus(c.id, c.isActive)}>
                                                {c.isActive ? "إيقاف" : "تفعيل"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">إضافة مركز جديد</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="add-form" onSubmit={handleAdd}>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">الاسم</label>
                                        <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">النوع</label>
                                        <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                            <option value="BAKERY">مخبز</option>
                                            <option value="GAS_STATION">محطة محروقات</option>
                                            <option value="SUPPLY_CENTER">صالة استهلاكية</option>
                                            <option value="FUEL_STATION">مركز غاز منزلي</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">المنطقة</label>
                                        <input className="form-input" required value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">رقم الهاتف</label>
                                        <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">العنوان التفصيلي</label>
                                    <input className="form-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">ربط بموزع (اختياري)</label>
                                        <select className="form-select" value={formData.distributorId} onChange={e => setFormData({ ...formData, distributorId: e.target.value })}>
                                            <option value="">-- بدون موزع حالياً --</option>
                                            {data.dists.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.nationalId})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ربط بمفتش (اختياري)</label>
                                        <select className="form-select" value={formData.inspectorId} onChange={e => setFormData({ ...formData, inspectorId: e.target.value })}>
                                            <option value="">-- بدون مفتش حالياً --</option>
                                            {data.insps.map(i => <option key={i.id} value={i.id}>{i.fullName} ({i.nationalId})</option>)}
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</button>
                            <button type="submit" form="add-form" className="btn btn-primary" disabled={isSubmitting}>حفظ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Staff Modal */}
            {isAssignModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">تعيين موظفين للمركز</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsAssignModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <form id="assign-form" onSubmit={handleAssign}>
                                <div className="form-group">
                                    <label className="form-label">الموزع المعتمد</label>
                                    <select className="form-select" value={assignDistId} onChange={e => setAssignDistId(e.target.value)}>
                                        <option value="">-- بدون موزع --</option>
                                        {allDistsForAssign.map(d => (
                                            <option key={d.id} value={d.id}>{d.fullName}{d.nationalId ? ` (${d.nationalId})` : ''}</option>
                                        ))}
                                    </select>
                                    <div className="form-hint">اختر الموزع المسؤول عن هذا المركز</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المفتش المشرف</label>
                                    <select className="form-select" value={assignInspId} onChange={e => setAssignInspId(e.target.value)}>
                                        <option value="">-- بدون مفتش --</option>
                                        {data.insps.map(i => (
                                            <option key={i.id} value={i.id}>{i.fullName} ({i.nationalId})</option>
                                        ))}
                                        {currentCenter?.inspector && !data.insps.find(i => i.id === currentCenter.inspector?.id) && (
                                            <option value={currentCenter.inspector.id}>{currentCenter.inspector.fullName} (معيّن حالياً)</option>
                                        )}
                                    </select>
                                    <div className="form-hint">اختر المفتش المشرف على هذا المركز</div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsAssignModalOpen(false)}>إلغاء</button>
                            <button type="submit" form="assign-form" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "جاري الحفظ..." : "حفظ التعيين"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
