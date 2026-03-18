"use client";

import { useState, useEffect } from "react";

type Material = {
    id: string;
    name: string;
    unit: string;
    isActive: boolean;
};

type CenterInventory = {
    id: string;
    materialId: string;
    quantity: number;
    lastUpdated: string;
    material: Material;
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
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        centerId: "",
        materialId: "",
        quantity: "",
        type: "IN",
        notes: ""
    });

    const fetchData = async (q = "") => {
        try {
            setLoading(true);
            const [centersRes, materialsRes] = await Promise.all([
                fetch(`/api/admin/inventory?search=${encodeURIComponent(q)}`),
                fetch(`/api/admin/materials`)
            ]);

            if (centersRes.ok) {
                const data = await centersRes.json();
                setCenters(data.centers);
            }
            if (materialsRes.ok) {
                const data = await materialsRes.json();
                const activeMaterials = data.materials.filter((m: Material) => m.isActive);
                setMaterials(activeMaterials);
                if (activeMaterials.length > 0) {
                    setFormData(prev => ({ ...prev, materialId: activeMaterials[0].id }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(search);
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
                setFormData({ centerId: "", materialId: materials[0]?.id || "", quantity: "", type: "IN", notes: "" });
                fetchData(search);
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

    const getStockForMaterial = (inventories: CenterInventory[], materialId: string) => {
        const inv = inventories.find(i => i.materialId === materialId);
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
                        className="form-input"
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
                                    {materials.map(mat => (
                                        <th key={mat.id} style={{ textAlign: "center" }}>{mat.name} ({mat.unit})</th>
                                    ))}
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {centers.map(center => (
                                    <tr key={center.id}>
                                        <td style={{ fontWeight: 600 }}>{center.name}</td>
                                        <td>{center.region || "-"}</td>
                                        {materials.map(mat => {
                                            const qty = getStockForMaterial(center.inventories, mat.id);
                                            return (
                                                <td key={mat.id} style={{ textAlign: "center", fontWeight: 600, color: qty > 0 ? "var(--primary-700)" : "var(--gray-400)" }}>
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
                                                تزويد / سحب
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                )}
            </div>

            {isAddModalOpen && (
                <div className="modal-backdrop" style={{ backdropFilter: "blur(5px)", backgroundColor: "rgba(17, 30, 56, 0.7)" }}>
                    <div className="card modal-content" style={{ width: "90%", maxWidth: "550px", margin: "var(--space-4)", padding: "var(--space-6)" }}>
                        <div className="modal-header" style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                                <div>
                                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>إمداد مركز أو خصم مخزون</h2>
                                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)", marginTop: "var(--space-1)" }}>تحويل أو خصم مخصصات مادية من الجرد المركزي</p>
                                </div>
                            </div>
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddStock} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600 }}>المركز المستهدف *</label>
                                <select 
                                    className="form-input" 
                                    required 
                                    value={formData.centerId} 
                                    onChange={(e) => setFormData({...formData, centerId: e.target.value})}
                                >
                                    <option value="">-- اختر المركز --</option>
                                    {centers.map(c => <option key={c.id} value={c.id}>{c.name} {c.region ? `(${c.region})` : ""}</option>)}
                                </select>
                            </div>

                            <div className="grid-2">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>المادة الأولية *</label>
                                    <select 
                                        className="form-input" 
                                        required 
                                        value={formData.materialId} 
                                        onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                                    >
                                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                                    </select>
                                </div>
                                
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontWeight: 600 }}>نوع الحركة *</label>
                                    <select 
                                        className="form-input" 
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
                                <label className="form-label" style={{ fontWeight: 600 }}>الكمية المستهدفة *</label>
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
                                <label className="form-label" style={{ fontWeight: 600 }}>ملاحظات وتبرير (سجل إلزامي للمحاسبة)</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="مثال: مخصصات شهر 2 قادمة من سادكوب..."
                                    required
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>

                            <div className="grid-2" style={{ marginTop: "var(--space-2)" }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                                    تراجع وإلغاء
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? "جاري التثبيت..." : "تسجيل الحركة المحاسبية"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
