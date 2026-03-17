"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type VehicleType = {
    id: string;
    plateNumber: string;
    vehicleType: string;
    fuelType: "GASOLINE" | "DIESEL" | "NONE";
    engineSize: number | null;
    isActive: boolean;
    createdAt: string;
    user: {
        fullName: string;
        nationalId: string;
        phone: string | null;
    };
};

export default function AdminVehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const [formData, setFormData] = useState({
        nationalId: "",
        plateNumber: "",
        vehicleType: "",
        fuelType: "GASOLINE",
        engineSize: "",
    });

    const fetchVehicles = async (search = "", p = page) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}&page=${p}&limit=${limit}`);
            if (res.ok) {
                const data = await res.json();
                setVehicles(data.vehicles || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles(searchQuery, page);
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchVehicles(searchQuery, 1);
    };

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "حدث خطأ أثناء الإضافة" });
            } else {
                setMessage({ type: "success", text: "تم تسجيل المركبة بنجاح!" });
                setTimeout(() => {
                    setIsAddModalOpen(false);
                    setFormData({ nationalId: "", plateNumber: "", vehicleType: "", fuelType: "GASOLINE", engineSize: "" });
                    setMessage({ type: "", text: "" });
                    fetchVehicles(searchQuery, 1);
                }, 1500);
            }
        } catch (error) {
            setMessage({ type: "error", text: "حدث خطأ في الاتصال" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!confirm(`هل أنت متأكد من ${currentStatus ? 'إيقاف' : 'تفعيل'} المركبة؟`)) return;

        try {
            const res = await fetch(`/api/vehicles/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) {
                setVehicles(vehicles.map(v => v.id === id ? { ...v, isActive: !currentStatus } : v));
            } else {
                alert("حدث خطأ أثناء تحديث الحالة");
            }
        } catch (error) {
            console.error(error);
            alert("خطأ في الاتصال");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">إدارة المركبات</h1>
                    <p className="page-subtitle">سجل المركبات المسجلة — {total} مركبة</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    تسجيل مركبة جديدة
                </button>
            </div>

            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={handleSearch} className="search-bar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" placeholder="ابحث برقم اللوحة، اسم المالك، أو الرقم الوطني..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="submit" className="btn btn-primary btn-sm">بحث</button>
                    {searchQuery && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearchQuery(""); setPage(1); fetchVehicles("", 1); }}>إلغاء</button>
                    )}
                </form>
            </div>

            <div className="card table-container">
                {loading ? (
                    <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                        <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
                        <div className="skeleton" style={{ height: 40 }} />
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="empty-state">
                        <h3>لا توجد مركبات</h3>
                        <p>لم يتم العثور على أي مركبات مسجلة.</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>المالك</th>
                                <th>رقم اللوحة</th>
                                <th>نوع المركبة</th>
                                <th>نوع الوقود</th>
                                <th>سعة المحرك</th>
                                <th>تاريخ التسجيل</th>
                                <th>الحالة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((v) => (
                                <tr key={v.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{v.user.fullName}</div>
                                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)", fontFamily: "var(--font-family-mono)", direction: "ltr", textAlign: "right" }}>
                                            {v.user.nationalId}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-gray" style={{ fontFamily: "var(--font-family-mono)", direction: "ltr" }}>
                                            {v.plateNumber}
                                        </span>
                                    </td>
                                    <td>{v.vehicleType}</td>
                                    <td>
                                        {v.fuelType === "GASOLINE" ? "بنزين" : v.fuelType === "DIESEL" ? "مازوت" : "غير محدد"}
                                    </td>
                                    <td>{v.engineSize ? `${v.engineSize} cc` : "—"}</td>
                                    <td>{new Date(v.createdAt).toLocaleDateString("ar-SA")}</td>
                                    <td>
                                        <span className={`badge ${v.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {v.isActive ? "فعالة" : "موقوفة"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                            <button
                                                className={`btn btn-sm ${v.isActive ? 'btn-outline' : 'btn-success'}`}
                                                onClick={() => toggleStatus(v.id, v.isActive)}
                                            >
                                                {v.isActive ? "إيقاف" : "تفعيل"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                    <span style={{ fontSize: "0.9rem", color: "var(--gray-600)" }}>صفحة {page} من {totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">تسجيل مركبة جديدة</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {message.text && (
                                <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: "var(--space-4)" }}>
                                    {message.text}
                                </div>
                            )}
                            <form id="add-vehicle-form" onSubmit={handleAddVehicle}>
                                <div className="form-group">
                                    <label className="form-label">الرقم الوطني للمالك *</label>
                                    <input type="text" className="form-input" required dir="ltr" style={{ textAlign: "right" }}
                                        value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} placeholder="مثال: 01012345678" />
                                    <div className="form-hint">يجب أن يكون المالك مسجلاً في النظام ومقبولاً</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم اللوحة *</label>
                                    <input type="text" className="form-input" required dir="ltr" style={{ textAlign: "right" }}
                                        value={formData.plateNumber} onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })} placeholder="مثال: 123-456" />
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">نوع المركبة *</label>
                                        <input type="text" className="form-input" required value={formData.vehicleType}
                                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })} placeholder="سيدان / بيك آب / ..." />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">سعة المحرك (cc) اختياري</label>
                                        <input type="number" className="form-input" dir="ltr" style={{ textAlign: "right" }}
                                            value={formData.engineSize} onChange={(e) => setFormData({ ...formData, engineSize: e.target.value })} placeholder="1600" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نوع الوقود *</label>
                                    <select className="form-select" value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}>
                                        <option value="GASOLINE">بنزين</option>
                                        <option value="DIESEL">مازوت</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>إلغاء</button>
                            <button type="submit" form="add-vehicle-form" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'جاري الحفظ...' : 'حفظ المركبة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
