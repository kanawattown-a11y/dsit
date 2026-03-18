"use client";

import { useState, useEffect } from "react";

// Known keys we expect to see
const DEFAULT_KEYS = [
    { key: "BREAD_QUOTA_PER_PERSON", defaultValue: "2", label: "مخصصات الخبز للفرد (ربطة/يوم)" },
    { key: "GAS_DAYS_INTERVAL", defaultValue: "60", label: "مدة تبديل الغاز (بالأيام)" },
    { key: "MAX_FAMILY_MEMBERS", defaultValue: "10", label: "الحد الأقصى لأفراد البطاقة" },
    { key: "DIESEL_LITERS", defaultValue: "50", label: "مخصصات المازوت للبطاقة (لتر/فصل)" },
    { key: "ENABLE_REGISTRATION", defaultValue: "true", label: "تفعيل التسجيلات الجديدة (true/false)" }
];

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                const settingsMap: Record<string, string> = {};
                // fill defaults
                DEFAULT_KEYS.forEach(k => settingsMap[k.key] = k.defaultValue);
                // override with db values
                data.settings.forEach((s: any) => {
                    settingsMap[s.key] = s.value;
                });
                setSettings(settingsMap);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = DEFAULT_KEYS.map(k => ({
                key: k.key,
                value: settings[k.key] || k.defaultValue,
                description: k.label
            }));

            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: payload })
            });

            if (res.ok) {
                alert("تم تحديث إعدادات النظام بنجاح.");
                fetchData();
            } else {
                alert("فشل تحديث الإعدادات.");
            }
        } catch (error) {
            alert("حدث خطأ في الاتصال.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="page-container">
            <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
                <h1 className="page-title">إعدادات النظام المركزية</h1>
                <p className="page-description">التحكم بكميات التوزيع ومحصصات البطاقات لكافة المواطنين في المحافظة.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "var(--space-12)" }}>جاري تحميل الإعدادات...</div>
            ) : (
                <form onSubmit={handleSave}>
                    <div className="grid-2">
                        {DEFAULT_KEYS.map((k) => (
                            <div key={k.key} className="card animate-fade-in" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column" }}>
                                <label className="form-label" style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--navy-800)", marginBottom: "var(--space-3)" }}>
                                    {k.label}
                                </label>
                                <input
                                    type={k.defaultValue === "true" || k.defaultValue === "false" ? "text" : "number"}
                                    className="form-input"
                                    value={settings[k.key] || ""}
                                    onChange={(e) => handleChange(k.key, e.target.value)}
                                    dir="ltr"
                                    style={{ textAlign: "right", marginBottom: "var(--space-3)" }}
                                />
                                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--gray-500)", marginTop: "auto" }}>
                                    المفتاح البرمجي: <code style={{ color: "var(--primary-700)", background: "var(--primary-50)", padding: "2px 6px", borderRadius: "4px" }}>{k.key}</code>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card mt-6" style={{ display: "flex", justifyContent: "flex-end", padding: "var(--space-4)" }}>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving} style={{ minWidth: "250px" }}>
                            {isSaving ? "جاري الحفظ..." : "حفظ التغييرات ونشرها"}
                        </button>
                    </div>
                </form>
            )}
        </main>
    );
}
