"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

type Material = {
    id: string;
    name: string;
    unit: string;
    isActive: boolean;
    createdAt: string;
};

function MaterialsContent() {
    const router = useRouter();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        unit: "كغ" // default
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/materials");
            if (res.ok) {
                const data = await res.json();
                setMaterials(data.materials);
            }
        } catch (error) {
            console.error("Error fetching materials:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/materials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            
            if (res.ok) {
                setFormData({ name: "", unit: "كغ" });
                fetchData();
                alert("تمت إضافة المادة بنجاح.");
            } else {
                alert(data.error || "حدث خطأ غير متوقع");
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="page-container">
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">إدارة المواد الأولية للإنتاج</h1>
                <p className="page-description">إضافة وتوصيف المواد القابلة للتوزيع على المراكز (ديناميكي)</p>
            </div>

            <div className="grid-2">
                {/* Form Section */}
                <div className="card" style={{ height: "fit-content" }}>
                    <div className="card-header">
                        <h2 className="card-title">إضافة مادة جديدة</h2>
                    </div>
                    
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>اسم المادة</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required 
                                placeholder="مثال: سكر, خميرة, أكياس نايلون..."
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600 }}>وحدة القياس</label>
                            <select 
                                className="form-input" 
                                required 
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            >
                                <option value="كغ">كيلوغرام (كغ)</option>
                                <option value="لتر">لتر (ل)</option>
                                <option value="قطعة">قطعة</option>
                                <option value="ربطة">ربطة</option>
                                <option value="اسطوانة">اسطوانة</option>
                                <option value="طن">طن</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: "var(--space-2)" }}>
                            {isSubmitting ? "جاري الإضافة..." : "تسجيل المادة في النظام"}
                        </button>
                    </form>
                </div>

                {/* Data Table Section */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--gray-200)" }}>
                        <h2 className="card-title">المواد المعرفة حالياً</h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: "var(--space-8)", textAlign: "center" }}>جاري تحميل المواد...</div>
                    ) : materials.length === 0 ? (
                        <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--gray-500)" }}>
                            لا توجد أي مواد معرفة في النظام حتى الآن.
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>تاريخ الإضافة</th>
                                        <th>اسم المادة</th>
                                        <th>وحدة القياس</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.createdAt).toLocaleDateString("ar-SY")}</td>
                                            <td style={{ fontWeight: 700, color: "var(--navy-800)" }}>{m.name}</td>
                                            <td><span className="badge" style={{ background: "var(--info-bg)", color: "var(--info)" }}>{m.unit}</span></td>
                                            <td>
                                                <span className="badge" style={{ background: m.isActive ? "var(--success-bg)" : "var(--danger-bg)", color: m.isActive ? "var(--success)" : "var(--danger)" }}>
                                                    {m.isActive ? "فعالة" : "معطلة"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function MaterialsPage() {
    return (
        <Suspense fallback={<div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري التحميل...</div>}>
            <MaterialsContent />
        </Suspense>
    );
}
