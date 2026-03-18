import Link from "next/link";

export default function LandingPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, var(--bg-default) 0%, #e0e7ff 100%)", fontFamily: "var(--font-sans)" }}>
            <header className="landing-header">
                <div className="landing-logo-container">
                    <div className="landing-logo">
                        <img src="/logo.jpeg" alt="D.S.I.T Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="landing-title">
                        <h1 style={{ margin: 0, fontSize: "clamp(1rem, 2.5vw, 1.15rem)", fontWeight: 800, color: "var(--navy-800)" }}>مديرية التموين والتجارة الداخلية</h1>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: 500 }}>السويداء</p>
                    </div>
                </div>
                <div className="landing-actions">
                    <Link href="/auth/login" className="btn btn-outline" style={{ borderRadius: "50px", fontWeight: 600 }}>تسجيل الدخول</Link>
                    <Link href="/auth/register" className="btn btn-primary" style={{ borderRadius: "50px", fontWeight: 600, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)", backgroundImage: "var(--primary)" }}>إنشاء حساب</Link>
                </div>
            </header>

            {/* Hero Section */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--space-8) var(--space-4)", textAlign: "center" }}>

                <div style={{
                    display: "inline-block",
                    padding: "4px 16px",
                    background: "rgba(37, 99, 235, 0.1)",
                    color: "var(--primary)",
                    borderRadius: "50px",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    marginBottom: "var(--space-6)",
                    border: "1px solid rgba(37, 99, 235, 0.2)"
                }}>
                    بوابة المواطن الرقمية الموحدة
                </div>

                <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, color: "var(--navy-900)", lineHeight: 1.2, margin: "0 0 var(--space-4)", maxWidth: 900, letterSpacing: "-1px" }}>
                    نظام الإدارة الذكية <br /> <span style={{ color: "var(--primary)" }}>لمخصصات المواطنين</span>
                </h2>

                <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "var(--gray-600)", maxWidth: 700, margin: "0 auto var(--space-8)", lineHeight: 1.6 }}>
                    المنصة الرسمية لمديرية التموين والتجارة الداخلية في السويداء (D.S.I.T) لحجز ومراقبة وتوزيع المخصصات الحكومية والبطاقة العائلية بكل شفافية وسهولة وسرعة.
                </p>

                <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", justifyContent: "center" }}>
                    <Link href="/auth/register" className="btn btn-primary btn-lg" style={{ borderRadius: "50px", padding: "16px 40px", fontSize: "1.1rem", fontWeight: 700, boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)", backgroundImage: "var(--primary)", transition: "transform 0.2s, box-shadow 0.2s" }}>
                        ابدأ الآن وانشئ حسابك
                    </Link>
                    <Link href="/auth/login" className="btn btn-outline btn-lg" style={{ borderRadius: "50px", padding: "16px 40px", fontSize: "1.1rem", fontWeight: 700, background: "white", transition: "transform 0.2s" }}>
                        لدي حساب بالفعل
                    </Link>
                </div>

                {/* Features Highlights */}
                <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap", justifyContent: "center", marginTop: "100px", maxWidth: 1100, width: "100%" }}>

                    <div className="card" style={{ flex: "1 1 300px", textAlign: "center", padding: "var(--space-8) var(--space-6)", borderRadius: "var(--radius-lg)", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
                        <div style={{ width: 70, height: 70, margin: "0 auto var(--space-6)", background: "rgba(37, 99, 235, 0.1)", color: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy-800)", marginBottom: "var(--space-3)" }}>مخصصات آمنة</h3>
                        <p style={{ color: "var(--gray-500)", lineHeight: 1.6, margin: 0 }}>نظام حماية وتوثيق عالي الدقة يضمن وصول مخصصاتك التموينية والمحروقات إليك مباشرة دون تلاعب.</p>
                    </div>

                    <div className="card" style={{ flex: "1 1 300px", textAlign: "center", padding: "var(--space-8) var(--space-6)", borderRadius: "var(--radius-lg)", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
                        <div style={{ width: 70, height: 70, margin: "0 auto var(--space-6)", background: "var(--primary)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(37, 99, 235, 0.3)" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy-800)", marginBottom: "var(--space-3)" }}>إدارة دفتر العائلة</h3>
                        <p style={{ color: "var(--gray-500)", lineHeight: 1.6, margin: 0 }}>أضف أفراد عائلتك، التقط صورهم لمرة واحدة، واعتمد دفتر العائلة رقمياً لربط مخصصات الأسرة بأكملها.</p>
                    </div>

                    <div className="card" style={{ flex: "1 1 300px", textAlign: "center", padding: "var(--space-8) var(--space-6)", borderRadius: "var(--radius-lg)", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
                        <div style={{ width: 70, height: 70, margin: "0 auto var(--space-6)", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy-800)", marginBottom: "var(--space-3)" }}>استلام سريع</h3>
                        <p style={{ color: "var(--gray-500)", lineHeight: 1.6, margin: 0 }}>مع الـ QR Code الخاص بك، تستطيع استلام الخبز والمحروقات والمواد التموينية من أقرب مركز معتمد في السويداء فوراً.</p>
                    </div>

                </div>
            </main>

            <footer style={{ padding: "var(--space-6) var(--space-8)", borderTop: "1px solid var(--border-light)", textAlign: "center", color: "var(--gray-500)", fontSize: "0.9rem", marginTop: "auto" }}>
                <p style={{ margin: 0 }}>جميع الحقوق محفوظة © {new Date().getFullYear()} - مديرية التموين والتجارة الداخلية - السويداء</p>
                <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.8rem" }}>Directorate of Supply and Internal Trade (D.S.I.T)</p>
            </footer>

            {/* Global overrides for hover effects inside the landing page only */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .btn:hover {
                    transform: translateY(-2px);
                }

                .landing-header {
                    padding: var(--space-4) var(--space-8);
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--border-light);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .landing-logo-container {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                }
                .landing-logo {
                    width: 45px;
                    height: 45px;
                    border-radius: var(--radius);
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
                }
                .landing-actions {
                    display: flex;
                    gap: var(--space-3);
                }
                .landing-actions .btn {
                    padding: 8px 24px;
                }
                
                @media (max-width: 600px) {
                    .landing-header {
                        padding: var(--space-3) var(--space-4);
                    }
                    .landing-actions {
                        display: none;
                    }
                }
            `}} />
        </div>
    );
}
