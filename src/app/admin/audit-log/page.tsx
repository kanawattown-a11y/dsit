"use client";

import { useState, useEffect, useCallback } from "react";

type AuditLog = {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: any;
    ipAddress: string | null;
    createdAt: string;
    performedBy: { fullName: string; role: string };
};

export default function AdminAuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (actionFilter) params.set("action", actionFilter);
            if (entityFilter) params.set("entity", entityFilter);
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);
            params.set("page", String(page));
            params.set("limit", String(limit));

            const res = await fetch(`/api/audit-logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, actionFilter, entityFilter, dateFrom, dateTo, page]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const totalPages = Math.ceil(total / limit);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const resetFilters = () => {
        setSearch("");
        setActionFilter("");
        setEntityFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const getActionColor = (action: string) => {
        if (action.includes("CREATE") || action.includes("ADD") || action.includes("APPROVE")) return "var(--success)";
        if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("SUSPEND") || action.includes("REJECT")) return "var(--danger)";
        if (action.includes("UPDATE") || action.includes("EDIT")) return "var(--warning)";
        if (action.includes("REDEEM")) return "var(--primary)";
        return "var(--gray-600)";
    };

    const getActionAr = (action: string) => {
        if (action.includes("CREATE") || action.includes("ADD")) return "إنشاء";
        if (action.includes("DELETE") || action.includes("REMOVE")) return "حذف";
        if (action.includes("SUSPEND")) return "تعليق";
        if (action.includes("UPDATE") || action.includes("EDIT")) return "تعديل";
        if (action.includes("APPROVE")) return "موافقة";
        if (action.includes("REJECT")) return "رفض";
        if (action.includes("REDEEM")) return "خصم مخصصات";
        if (action.includes("LOGIN")) return "تسجيل دخول";
        return action;
    };

    const getRoleAr = (role: string) => {
        switch (role) {
            case "ADMIN": return "مدير نظام";
            case "DISTRIBUTOR": return "موزع";
            case "INSPECTOR": return "مفتش";
            case "USER": return "مواطن";
            default: return role;
        }
    };

    const getEntityAr = (entity: string) => {
        switch (entity) {
            case "User": return "مستخدم";
            case "Transaction": return "عملية توزيع";
            case "Allocation": return "مخصصات";
            case "DistributionCenter": return "مركز توزيع";
            case "InspectionReport": return "تقرير تفتيش";
            case "FamilyBook": return "دفتر عائلة";
            case "Vehicle": return "مركبة";
            default: return entity;
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">سجل التدقيق</h1>
                <p className="page-subtitle">مراقبة جميع العمليات والإجراءات على النظام — {total} سجل</p>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "var(--space-6)" }}>
                <form onSubmit={handleFilter}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem" }}>بحث عام</label>
                            <input type="text" className="form-input" placeholder="اسم الموظف، العملية..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem" }}>نوع العملية</label>
                            <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                                <option value="">الكل</option>
                                <option value="CREATE">إنشاء</option>
                                <option value="UPDATE">تعديل</option>
                                <option value="DELETE">حذف</option>
                                <option value="APPROVE">موافقة</option>
                                <option value="REJECT">رفض</option>
                                <option value="REDEEM">خصم مخصصات</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem" }}>من تاريخ</label>
                            <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.75rem" }}>إلى تاريخ</label>
                            <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button type="submit" className="btn btn-primary btn-sm">تطبيق الفلاتر</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>إعادة تعيين</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="card table-container">
                {loading ? <div className="skeleton" style={{ height: 300 }} /> : logs.length === 0 ? (
                    <div className="empty-state">لا توجد سجلات مطابقة للفلاتر المحددة.</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>التاريخ والوقت</th>
                                <th>المستخدم</th>
                                <th>العملية</th>
                                <th>الكيان</th>
                                <th>معرف الكيان</th>
                                <th>عنوان IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                        {new Date(log.createdAt).toLocaleString('ar-SA')}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{log.performedBy.fullName}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{getRoleAr(log.performedBy.role)}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: getActionColor(log.action) + "20", color: getActionColor(log.action) }}>
                                            {getActionAr(log.action)}
                                        </span>
                                    </td>
                                    <td>{getEntityAr(log.entity)}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gray-500)" }}>{log.entityId?.slice(0, 8) || "—"}</td>
                                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gray-500)" }}>{log.ipAddress || "—"}</td>
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
        </div>
    );
}
