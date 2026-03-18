"use client";

import { useState, useEffect, Suspense } from "react";

type Material = {
    id: string;
    name: string;
    unit: string;
};

type InventoryRecord = {
    id: string;
    materialId: string;
    quantity: number;
    lastUpdated: string;
    material: Material;
};

function DistributorInventoryContent() {
    const [inventories, setInventories] = useState<InventoryRecord[]>([]);
    const [center, setCenter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        materialId: "",
        amount: "",
        notes: ""
    });

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/distributor/inventory");
            if (res.ok) {
                const data = await res.json();
                setCenter(data.center);
                setInventories(data.inventories || []);
                if (data.inventories?.length > 0) {
                    setFormData(prev => ({ ...prev, materialId: data.inventories[0].materialId }));
                }
            } else {
                console.error(await res.text());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/distributor/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            
            if (res.ok) {
                alert(data.message || "تم إرسال التقرير اليومي بنجاح بانتظار تصديق المفتش.");
                setFormData(prev => ({ ...prev, amount: "", notes: "" }));
                // It stays in Pending until inspector validates.
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري تحميل المخزون...</div>;

    if (!center) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: "var(--space-12)" }}>
                <h2>عذراً، لم يتم ربطك بأي مركز توزيع حتى الآن.</h2>
            </div>
        );
    }

    return (
        <main className="page-container">
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">مخزون واستهلاك المركز</h1>
                <p className="page-description">
                    أهلاً بك في تفويض مركز: <strong style={{color:"var(--primary-700)"}}>{center.name}</strong> 
                    <br/>
                    شاهد الكميات المتوفرة لديك، وسجل معدل استهلاكك اليومي ليقوم المفتش بالتصديق عليه.
                </p>
            </div>

            <div className="grid-2">
                {/* Current Stock Dashboard */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--navy-800)" }}>المخزون المتوفر محلياً:</h2>
                    {inventories.length === 0 ? (
                        <div className="card" style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-500)" }}>
                            لا يوجد أي مخصصات في جردك حالياً.
                        </div>
                    ) : (
                        <div className="grid-2">
                            {inventories.map(inv => (
                                <div key={inv.id} className="card" style={{ padding: "var(--space-4)", borderLeft: "4px solid var(--primary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                    <span style={{ fontSize: "var(--font-size-sm)", color: "var(--gray-500)", fontWeight: 600 }}>{inv.material.name}</span>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                                        <span style={{ fontSize: "var(--font-size-2xl)", fontWeight: 800, color: "var(--navy-900)" }}>
                                            {inv.quantity.toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--primary-700)" }}>{inv.material.unit}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--gray-400)" }}>
                                        آخر تحديث: {new Date(inv.lastUpdated).toLocaleDateString("ar-SY")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daily Report Entry Form */}
                <div className="card">
                    <div className="card-header" style={{ borderBottom: "1px solid var(--gray-200)", paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <span style={{ color: "var(--warning)" }}>📋</span> الإقرار بالاستهلاك اليومي (الإنفاق)
                        </h2>
                    </div>

                    <div className="alert alert-warning" style={{ marginBottom: "var(--space-6)" }}>
                        <strong>ملاحظة هامة:</strong> الأرقام المسجلة هنا سيتم مطابقتها فورياً مع أرقام المفتش المكلف بمركزك. أي تلاعب سيعرض المركز لتجميد المخصصات تلقائياً.
                    </div>

                    <form onSubmit={handleSubmitReport} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>المادة المستهلكة *</label>
                            <select 
                                className="form-input" 
                                required 
                                value={formData.materialId} 
                                onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                            >
                                {inventories.map(inv => (
                                    <option key={inv.id} value={inv.materialId}>{inv.material.name} ({inv.material.unit})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>الكمية المستهلكة أو المباعة لهذا اليوم *</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                required 
                                min="0.1"
                                step="0.1"
                                placeholder="مثال: 50"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>تفاصيل الإنفاق وسبب الخصم (اختياري)</label>
                            <textarea 
                                className="form-input" 
                                rows={2}
                                placeholder="مثال: تم خبز 50 كيس دقيق، وتم توزيع الغاز بموجب البطاقات..."
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                style={{ resize: "none" }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: "var(--space-2)" }}>
                            {isSubmitting ? "جاري الإرسال للمفتش..." : "إرسال تقرير الاستهلاك"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default function DistributorInventoryPage() {
    return (
        <Suspense fallback={<div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري التحميل...</div>}>
            <DistributorInventoryContent />
        </Suspense>
    );
}
