"use client";

import { useState, useEffect } from "react";

type CenterInventory = {
    id: string;
    category: string;
    quantity: number;
    lastUpdated: string;
};

type Center = {
    id: string;
    name: string;
    type: string;
    region: string | null;
    inventories: CenterInventory[];
};

export default function AdminInventoryPage() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        centerId: "",
        category: "FLOUR",
        quantity: "",
        type: "IN",
        notes: ""
    });

    const categories = [
        { id: "FLOUR", label: "طحين", unit: "كغ" },
        { id: "YEAST", label: "خميرة", unit: "كغ" },
        { id: "GAS_CYLINDER", label: "أسطوانات غاز", unit: "أسطوانة" },
        { id: "DIESEL", label: "مازوت التدفئة", unit: "لتر" }
    ];

    const fetchCenters = async (q = "") => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/inventory?search=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setCenters(data.centers);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCenters(search);
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setFormData({ centerId: "", category: "FLOUR", quantity: "", type: "IN", notes: "" });
                fetchCenters(search);
                alert("تم تحديث الرصيد بنجاح وتسجيل الحركة في السجل.");
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStockForCategory = (inventories: CenterInventory[], categoryId: string) => {
        const inv = inventories.find(i => i.category === categoryId);
        return inv ? inv.quantity : 0;
    };

    return (
        <main className="page-container">
            <div className="page-header" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)" }}>
                <div>
                    <h1 className="page-title">إدارة وتوزيع المخزون</h1>
                    <p className="page-description">مراقبة الأرصدة المتوفرة في المراكز وتخصيص حصص جديدة.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ whiteSpace: "nowrap" }}>
                    + تزويد مركز بمخصصات
                </button>
            </div>

            <div className="card mb-6">
                <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="ابحث عن مركز معين..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary">بحث</button>
                </form>
            </div>

            <div className="card table-container animate-fade-in" style={{ padding: 0 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل البيانات...</div>
                ) : centers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--gray-500)" }}>لا توجد مراكز مطابقة.</div>
                ) : (
                    <table className="table">
                        <thead>
                                <tr>
                                    <th>المركز</th>
                                    <th>المنطقة</th>
                                    {categories.map(cat => (
                                        <th key={cat.id} style={{ textAlign: "center" }}>{cat.label} ({cat.unit})</th>
                                    ))}
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {centers.map(center => (
                                    <tr key={center.id}>
                                        <td style={{ fontWeight: 600 }}>{center.name}</td>
                                        <td>{center.region || "-"}</td>
                                        {categories.map(cat => {
                                            const qty = getStockForCategory(center.inventories, cat.id);
                                            return (
                                                <td key={cat.id} style={{ textAlign: "center", fontWeight: 600, color: qty > 0 ? "var(--primary-700)" : "var(--gray-400)" }}>
                                                    {qty > 0 ? qty.toLocaleString() : "0"}
                                                </td>
                                            );
                                        })}
                                        <td>
                                            <button 
                                                className="btn btn-outline btn-sm"
                                                onClick={() => {
                                                    setFormData({ ...formData, centerId: center.id });
                                                    setIsAddModalOpen(true);
                                                }}
                                            >
                                                تزويد
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                )}
            </div>

            {isAddModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>إمداد مركز أو خصم مخزون</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddStock} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
                            
                            <div className="form-group">
                                <label className="form-label">المركز المستهدف *</label>
                                <select 
                                    className="form-select" 
                                    required 
                                    value={formData.centerId} 
                                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                                >
                                    <option value="">-- اختر المركز --</option>
                                    {centers.map(c => <option key={c.id} value={c.id}>{c.name} {c.region ? `(${c.region})` : ""}</option>)}
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: "var(--space-4)" }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">نوع المادة *</label>
                                    <select 
                                        className="form-select" 
                                        required 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">نوع الحركة *</label>
                                    <select 
                                        className="form-select" 
                                        required 
                                        value={formData.type} 
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        style={{ background: formData.type === "IN" ? "var(--primary-50)" : "var(--danger-bg)" }}
                                    >
                                        <option value="IN">تزويد (وارد +)</option>
                                        <option value="OUT">تخفيض (مصروف -)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">الكمية *</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    required 
                                    min="0.1"
                                    step="0.1"
                                    placeholder="مثال: 500"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">ملاحظات والتبرير (سجل إلزامي للمحاسبة)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="مثال: مخصصات شهر 2 قادمة من سادكوب..."
                                    required
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: "var(--space-2)" }}>
                                {isSubmitting ? "جاري الاعتماد..." : "تحميل وتثبيت الحركة المحاسبية"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
