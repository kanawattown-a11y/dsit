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
                <div className="card">
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
                        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
                            {DEFAULT_KEYS.map((k) => (
                                <div key={k.key} className="form-group" style={{ background: "var(--gray-50)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--gray-200)" }}>
                                    <label className="form-label" style={{ fontWeight: 600, color: "var(--navy-800)" }}>
                                        {k.label}
                                    </label>
                                    <input
                                        type={k.defaultValue === "true" || k.defaultValue === "false" ? "text" : "number"}
                                        className="input-field"
                                        value={settings[k.key] || ""}
                                        onChange={(e) => handleChange(k.key, e.target.value)}
                                        style={{ background: "white", marginTop: "var(--space-2)" }}
                                    />
                                    <small style={{ color: "var(--gray-500)", display: "block", marginTop: "var(--space-1)", fontSize: "0.80rem" }}>
                                        مفتاح القاعدة: <code style={{ color: "var(--primary-600)", background: "transparent", padding: 0 }}>{k.key}</code>
                                    </small>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ minWidth: "200px" }}>
                                {isSaving ? "جاري الحفظ..." : "حفظ التغييرات ونشرها"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
