"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
}

export default function SearchableSelect({ value, onChange, options, placeholder = "اختر...", required = false }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = options.filter(o => o.includes(search));

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            <div 
                className="form-input" 
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: "var(--bg-card)" }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ color: value ? "inherit" : "var(--gray-500)" }}>{value || placeholder}</span>
                <ChevronDown size={18} style={{ color: "var(--gray-500)" }} />
            </div>

            {/* Hidden input for HTML required validation integration */}
            {required && <input type="text" style={{ opacity: 0, position: "absolute", zIndex: -1, width: "100%", height: 0, bottom: 0 }} value={value} onChange={() => {}} required />}

            {isOpen && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
                    background: "var(--bg-card)", border: "1px solid var(--border-color)", 
                    borderRadius: "var(--radius-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", 
                    zIndex: 50, maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column"
                }}>
                    <div style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 2 }}>
                        <div style={{ position: "relative" }}>
                            <Search size={16} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
                            <input 
                                autoFocus
                                type="text" 
                                className="form-input" 
                                style={{ paddingRight: "32px", height: "36px", margin: 0 }}
                                placeholder="ابحث..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    {filtered.length > 0 ? (
                        filtered.map(opt => (
                            <div 
                                key={opt} 
                                style={{
                                    padding: "var(--space-2) var(--space-3)", cursor: "pointer",
                                    background: value === opt ? "var(--primary-light)" : "transparent",
                                    color: value === opt ? "var(--primary-dark)" : "inherit"
                                }}
                                onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }}
                                onMouseEnter={(e) => {
                                    if(value !== opt) e.currentTarget.style.background = "var(--gray-100)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = value === opt ? "var(--primary-light)" : "transparent";
                                }}
                            >
                                {opt}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--gray-500)" }}>لا توجد نتائج مطابقة</div>
                    )}
                </div>
            )}
        </div>
    );
}
