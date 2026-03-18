"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface User {
    id: string;
    fullName: string;
    nationalId: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    region: string | null;
    idPhotoFront?: string | null;
    idPhotoBack?: string | null;
    selfiePhoto?: string | null;
    createdAt: string;
}

const roleLabels: Record<string, string> = {
    ADMIN: "مدير",
    USER: "مواطن",
    INSPECTOR: "مفتش",
    DISTRIBUTOR: "موزع",
};

const roleBadgeColors: Record<string, string> = {
    ADMIN: "#dc2626",
    USER: "#2563eb",
    INSPECTOR: "#7c3aed",
    DISTRIBUTOR: "#059669",
};

const statusLabels: Record<string, string> = {
    PENDING: "قيد المراجعة",
    APPROVED: "مفعّل",
    REJECTED: "مرفوض",
    SUSPENDED: "معلّق",
};

const statusColors: Record<string, string> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    SUSPENDED: "gray",
};

function AdminUsersContent() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get("status") || "";

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [roleFilter, setRoleFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showRoleModal, setShowRoleModal] = useState<User | null>(null);
    const [showIdModal, setShowIdModal] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchUsers = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            if (roleFilter) params.set("role", roleFilter);
            params.set("page", String(p));
            params.set("limit", String(limit));

            const res = await fetch(`/api/users?${params.toString()}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, roleFilter, page]);

    useEffect(() => {
        fetchUsers(page);
    }, [page, statusFilter, roleFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchUsers(1);
    };

    const handleAction = async (userId: string, action: "approve" | "reject" | "suspend" | "activate") => {
        setActionLoading(userId);
        try {
            const statusMap = {
                approve: "APPROVED",
                reject: "REJECTED",
                suspend: "SUSPENDED",
                activate: "APPROVED",
            };

            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: statusMap[action] }),
            });

            if (res.ok) fetchUsers(page);
            else {
                const data = await res.json();
                alert(data.error || "حدث خطأ");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async () => {
        if (!showRoleModal || !selectedRole) return;
        setActionLoading(showRoleModal.id);
        try {
            const res = await fetch(`/api/users/${showRoleModal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (res.ok) {
                setShowRoleModal(null);
                fetchUsers(page);
            } else {
                const data = await res.json();
                alert(data.error || "حدث خطأ");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">إدارة المستخدمين</h1>
                <p className="page-subtitle">إدارة حسابات المستخدمين والأدوار — {total.toLocaleString()} مستخدم</p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 250px" }}>
                        <label className="form-label">بحث</label>
                        <div className="search-bar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                placeholder="البحث بالاسم أو الرقم الوطني..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSearch}>بحث</button>
                        </div>
                    </div>
                    <div style={{ flex: "0 0 180px" }}>
                        <label className="form-label">الحالة</label>
                        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="">جميع الحالات</option>
                            <option value="PENDING">قيد المراجعة</option>
                            <option value="APPROVED">مفعّل</option>
                            <option value="REJECTED">مرفوض</option>
                            <option value="SUSPENDED">معلّق</option>
                        </select>
                    </div>
                    <div style={{ flex: "0 0 180px" }}>
                        <label className="form-label">الدور</label>
                        <select className="form-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                            <option value="">جميع الأدوار</option>
                            <option value="USER">مواطن</option>
                            <option value="ADMIN">مدير</option>
                            <option value="INSPECTOR">مفتش</option>
                            <option value="DISTRIBUTOR">موزع</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="table-container animate-fade-in">
                {loading ? (
                    <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
                        <div className="skeleton" style={{ width: 200, height: 20, margin: "0 auto var(--space-4)" }} />
                        <div className="skeleton" style={{ width: 300, height: 16, margin: "0 auto" }} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <h3>لا يوجد مستخدمين</h3>
                        <p>لم يتم العثور على مستخدمين بالفلاتر المحددة</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>الرقم الوطني</th>
                                <th>البريد</th>
                                <th>الهاتف</th>
                                <th>الهوية</th>
                                <th>الدور</th>
                                <th>الحالة</th>
                                <th>المنطقة</th>
                                <th>تاريخ التسجيل</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                                    <td dir="ltr" style={{ fontFamily: "monospace" }}>{user.nationalId}</td>
                                    <td dir="ltr" style={{ fontSize: "0.85rem" }}>{user.email || "—"}</td>
                                    <td dir="ltr">{user.phone || "—"}</td>
                                    <td>
                                        {(user.idPhotoFront || user.idPhotoBack || user.selfiePhoto) ? (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)" }}>
                                                <button 
                                                    className="btn btn-ghost btn-sm" 
                                                    onClick={() => setShowIdModal(user)}
                                                    style={{ color: "var(--primary)", padding: "var(--space-1) var(--space-2)" }}
                                                    title="عرض صور الهوية"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                                <div style={{ display: "flex", gap: "var(--space-1)" }}>
                                                    {user.idPhotoFront && <span className="badge badge-info" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>ورقة 1</span>}
                                                    {user.idPhotoBack && <span className="badge badge-info" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>ورقة 2</span>}
                                                    {user.selfiePhoto && <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>سيلفي</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: "0.85rem", color: "var(--gray-400)" }}>غير متوفر</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="badge"
                                            onClick={() => {
                                                setShowRoleModal(user);
                                                setSelectedRole(user.role);
                                            }}
                                            style={{
                                                cursor: "pointer",
                                                backgroundColor: `${roleBadgeColors[user.role]}15`,
                                                color: roleBadgeColors[user.role],
                                                border: `1px solid ${roleBadgeColors[user.role]}30`,
                                                fontWeight: 600,
                                            }}
                                            title="انقر لتغيير الدور"
                                        >
                                            {roleLabels[user.role]}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${statusColors[user.status]}`}>
                                            {statusLabels[user.status]}
                                        </span>
                                    </td>
                                    <td>{user.region || "—"}</td>
                                    <td style={{ fontSize: "0.85rem" }}>{new Date(user.createdAt).toLocaleDateString("ar-SA")}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                            {user.status === "PENDING" && (
                                                <>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleAction(user.id, "approve")}
                                                        disabled={actionLoading === user.id}
                                                    >
                                                        موافقة
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleAction(user.id, "reject")}
                                                        disabled={actionLoading === user.id}
                                                    >
                                                        رفض
                                                    </button>
                                                </>
                                            )}
                                            {user.status === "APPROVED" && (
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleAction(user.id, "suspend")}
                                                    disabled={actionLoading === user.id}
                                                    style={{ color: "var(--danger)" }}
                                                >
                                                    تعليق
                                                </button>
                                            )}
                                            {(user.status === "SUSPENDED" || user.status === "REJECTED") && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleAction(user.id, "activate")}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    تفعيل
                                                </button>
                                            )}
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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(1)}>الأولى</button>
                    <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                    <span style={{ fontSize: "0.9rem", color: "var(--gray-600)", padding: "0 var(--space-3)" }}>
                        صفحة {page} من {totalPages} ({total.toLocaleString()} مستخدم)
                    </span>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</button>
                    <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>الأخيرة</button>
                </div>
            )}

            {/* Role Change Modal */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">تغيير دور المستخدم</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowRoleModal(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--gray-50)", borderRadius: "var(--radius)" }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{showRoleModal.fullName}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontFamily: "monospace" }}>{showRoleModal.nationalId}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
                                    الدور الحالي: <strong style={{ color: roleBadgeColors[showRoleModal.role] }}>{roleLabels[showRoleModal.role]}</strong>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">الدور الجديد</label>
                                <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                    <option value="USER">مواطن — يمكنه عرض مخصصاته واستلام المواد</option>
                                    <option value="DISTRIBUTOR">موزع — يمكنه مسح QR وتسليم المواد في المراكز</option>
                                    <option value="INSPECTOR">مفتش — يمكنه رفع تقارير التفتيش على المراكز</option>
                                    <option value="ADMIN">مدير نظام — صلاحيات كاملة على النظام</option>
                                </select>
                                <div className="form-hint">سيتم إرسال إشعار للمستخدم بتغيير دوره ويجب عليه تسجيل الخروج وإعادة الدخول</div>
                            </div>
                            {selectedRole !== showRoleModal.role && (
                                <div style={{ padding: "var(--space-3)", background: "#fef3c7", borderRadius: "var(--radius)", border: "1px solid #f59e0b50", fontSize: "0.85rem" }}>
                                    ⚠️ سيتم تغيير الدور من <strong>{roleLabels[showRoleModal.role]}</strong> إلى <strong>{roleLabels[selectedRole]}</strong>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowRoleModal(null)}>إلغاء</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleRoleChange}
                                disabled={actionLoading === showRoleModal.id || selectedRole === showRoleModal.role}
                            >
                                {actionLoading === showRoleModal.id ? "جاري الحفظ..." : "حفظ التغيير"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View ID Modal */}
            {showIdModal && (
                <div className="modal-overlay" onClick={() => setShowIdModal(null)}>
                    <div className="modal-content" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">الوثائق الثبوتية - {showIdModal.fullName}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowIdModal(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div>
                                    <h4 style={{ marginBottom: "var(--space-2)", fontSize: "0.9rem", color: "var(--gray-600)" }}>الوجه الأمامي</h4>
                                    {showIdModal.idPhotoFront ? (
                                        <a href={showIdModal.idPhotoFront} target="_blank" rel="noreferrer">
                                            <img src={showIdModal.idPhotoFront} alt="الوجه الأمامي" style={{ width: "100%", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)", cursor: "zoom-in" }} />
                                        </a>
                                    ) : <div className="p-4 bg-gray-50 text-center rounded border text-gray-400">غير متوفر</div>}
                                </div>
                                <div>
                                    <h4 style={{ marginBottom: "var(--space-2)", fontSize: "0.9rem", color: "var(--gray-600)" }}>الوجه الخلفي</h4>
                                    {showIdModal.idPhotoBack ? (
                                        <a href={showIdModal.idPhotoBack} target="_blank" rel="noreferrer">
                                            <img src={showIdModal.idPhotoBack} alt="الوجه الخلفي" style={{ width: "100%", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)", cursor: "zoom-in" }} />
                                        </a>
                                    ) : (
                                        <div style={{ width: "100%", height: 250, background: "var(--gray-100)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gray-500)" }}>لا توجد صورة</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginTop: "var(--space-4)" }}>
                                <h4 style={{ marginBottom: "var(--space-2)", fontSize: "0.9rem", color: "var(--gray-600)" }}>صورة السيلفي للمطابقة</h4>
                                {showIdModal.selfiePhoto ? (
                                    <a href={showIdModal.selfiePhoto} target="_blank" rel="noreferrer">
                                        <img src={showIdModal.selfiePhoto} alt="السيلفي" style={{ maxWidth: "50%", margin: "0 auto", display: "block", borderRadius: "var(--radius)", border: "1px solid var(--gray-200)", cursor: "zoom-in" }} />
                                    </a>
                                ) : <div className="p-4 bg-gray-50 text-center rounded border text-gray-400">غير متوفرة</div>}
                            </div>
                            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--gray-50)", borderRadius: "var(--radius)", display: "flex", gap: "var(--space-4)" }}>
                                <div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>الرقم الوطني</div>
                                    <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{showIdModal.nationalId}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowIdModal(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">جاري التحميل...</div>}>
            <AdminUsersContent />
        </Suspense>
    );
}
