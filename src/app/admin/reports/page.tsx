"use client";

import { useState, useEffect } from "react";

export default function AdminReportsPage() {
    const [activeTab, setActiveTab] = useState<"complaints" | "violations">("complaints");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [formData, setFormData] = useState({ status: "", adminReply: "", fineAmount: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async (type: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/reports?type=${type}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setData([]);
        fetchData(activeTab);
    }, [activeTab]);

    const handleOpenModal = (item: any) => {
        setSelectedItem(item);
        setFormData({
            status: item.status,
            adminReply: item.adminReply || "",
            fineAmount: item.fineAmount ? String(item.fineAmount) : ""
        });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/reports", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeTab === "complaints" ? "complaint" : "violation",
                    id: selectedItem.id,
                    status: formData.status,
                    adminReply: formData.adminReply,
                    fineAmount: formData.fineAmount
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchData(activeTab); // refresh exactly where we are
            } else {
                alert("حدث خطأ أثناء التحديث");
            }
        } catch (error) {
            alert("فشل الاتصال");
        } finally {
            setIsSubmitting(false);
        }
    };

    const StatusBadge = ({ status, type }: { status: string, type: string }) => {
        let text = status, bg = "var(--gray-200)", color = "var(--gray-700)";
        
        if (type === "complaints") {
            const map: any = { PENDING: ["قيد المراجعة", "var(--warning-bg)", "var(--warning-color)"], REVIEWING: ["تحت التدقيق", "var(--primary-100)", "var(--primary-700)"], RESOLVED: ["محلولة", "var(--success-bg)", "var(--success)"], REJECTED: ["مرفوضة", "var(--danger-bg)", "var(--danger)"] };
            if (map[status]) [text, bg, color] = map[status];
        } else {
            const map: any = { PENDING: ["قيد المراجعة", "var(--warning-bg)", "var(--warning-color)"], REVIEWING: ["قيد الدراسة", "var(--primary-100)", "var(--primary-700)"], PENALIZED: ["تمت المخالفة", "var(--danger-bg)", "var(--danger)"], DISMISSED: ["ملغى", "var(--success-bg)", "var(--success)"] };
            if (map[status]) [text, bg, color] = map[status];
        }

        return <span className="badge" style={{ background: bg, color }}>{text}</span>;
    };

    return (
        <main className="container" style={{ padding: "var(--space-6)" }}>
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">مراقبة الشكاوى والضبوط</h1>
                <p className="page-description">مراجعة وتحليل كافة شكاوى المواطنين والمخالفات المسجلة من قبل المفتشين.</p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                <button 
                    className={`btn ${activeTab === "complaints" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveTab("complaints")}
                >
                    شكاوى المواطنين
                </button>
                <button 
                    className={`btn ${activeTab === "violations" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveTab("violations")}
                >
                    الضبوط التموينية (مفتشين)
                </button>
            </div>

            <div className="admin-card" style={{ padding: 0, overflowX: "auto" }}>
                {loading ? (
                    <div style={{ padding: "var(--space-12)", textAlign: "center" }}>جاري تحميل السجلات...</div>
                ) : data.length === 0 ? (
                    <div className="empty-state" style={{ padding: "var(--space-12) 0" }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                        <h3>المجلد فارغ</h3>
                        <p>لا توجد بيانات حالية في هذا القسم.</p>
                    </div>
                ) : (
                    <table className="table" style={{ width: "100%", minWidth: "900px" }}>
                        <thead>
                            {activeTab === "complaints" ? (
                                <tr>
                                    <th>التاريخ</th>
                                    <th>المواطن</th>
                                    <th>المركز</th>
                                    <th>الموضوع / التفاصيل</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>التاريخ</th>
                                    <th>المفتش</th>
                                    <th>المركز المخالف</th>
                                    <th>التفاصيل</th>
                                    <th>الغرامة المعتمدة</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.id}>
                                    <td style={{ whiteSpace: "nowrap" }}>{new Date(item.createdAt).toLocaleDateString("ar-SY")}</td>
                                    {activeTab === "complaints" ? (
                                        <>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.user.fullName}</div>
                                                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--gray-500)" }}>{item.user.phone || item.user.nationalId}</div>
                                            </td>
                                            <td>{item.center ? item.center.name : "عام"}</td>
                                            <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                <strong>{item.subject}</strong>: {item.description}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{item.inspector.fullName}</td>
                                            <td>{item.center.name}</td>
                                            <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.details}
                                            </td>
                                            <td style={{ color: item.fineAmount ? "var(--danger)" : "inherit", fontWeight: 600 }}>
                                                {item.fineAmount ? `${item.fineAmount.toLocaleString()} ل.س` : "-"}
                                            </td>
                                        </>
                                    )}
                                    <td><StatusBadge status={item.status} type={activeTab} /></td>
                                    <td>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal(item)}>معاينة وقرار</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && selectedItem && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
                                {activeTab === "complaints" ? "دراسة شكوى مواطن" : "دراسة تقرير مفتش"}
                            </h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        
                        <div style={{ background: "var(--gray-50)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", marginTop: "var(--space-4)" }}>
                            <h4 style={{ color: "var(--navy-800)", marginBottom: "var(--space-2)" }}>التفاصيل المرفوعة:</h4>
                            {activeTab === "complaints" ? (
                                <p style={{ lineHeight: 1.6, color: "var(--gray-700)" }}><strong>{selectedItem.subject}</strong><br/>{selectedItem.description}</p>
                            ) : (
                                <p style={{ lineHeight: 1.6, color: "var(--gray-700)" }}>{selectedItem.details}</p>
                            )}
                        </div>

                        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            <div className="form-group">
                                <label className="form-label">القرار الإداري (الحالة) *</label>
                                <select 
                                    className="input" 
                                    required 
                                    value={formData.status} 
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    {activeTab === "complaints" ? (
                                        <>
                                            <option value="PENDING">قيد المراجعة</option>
                                            <option value="REVIEWING">نحن ندقق بالأمر</option>
                                            <option value="RESOLVED">تم حل المشكلة (إغلاق وتنبيه المشتكي)</option>
                                            <option value="REJECTED">الشكوى باطلة ومرفوضة</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="PENDING">مستلمة - قيد المراجعة</option>
                                            <option value="REVIEWING">قيد دراسة قانونية</option>
                                            <option value="PENALIZED">اعتماد الضبط والمخالفة المادية</option>
                                            <option value="DISMISSED">إلغاء الضبط / براءة</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {activeTab === "complaints" && (
                                <div className="form-group">
                                    <label className="form-label">رد الإدارة (يصل للمواطن)</label>
                                    <textarea 
                                        className="input" 
                                        rows={3} 
                                        placeholder="اكتب ردك ليظهر في صندوق شكاوى المواطن..."
                                        value={formData.adminReply}
                                        onChange={(e) => setFormData({...formData, adminReply: e.target.value})}
                                    />
                                </div>
                            )}

                            {activeTab === "violations" && (
                                <div className="form-group">
                                    <label className="form-label">الغرامة المادية المعتمدة (ل.س)</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        placeholder="أدخل مبلغ المخالفة النهائي لتثبيته للمحاسبة..."
                                        value={formData.fineAmount}
                                        onChange={(e) => setFormData({...formData, fineAmount: e.target.value})}
                                    />
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>إغلاق وتأجيل</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                                    {isSubmitting ? "جاري الحفظ..." : "حفظ القرار"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
