/* =====================================================================
   APP — composição final
   ===================================================================== */
function App() {
  const [quickView, setQuickView] = useState(null); // {product, colorIdx}
  const [menuOpen, setMenuOpen] = useState(false);

  const onOpenQuickView = useCallback((product, colorIdx) => {
    setQuickView({ product, colorIdx });
  }, []);
  const onCloseQuickView = useCallback(() => setQuickView(null), []);

  return (
    <div className="uni-root">
      <style>{STYLES}</style>
      <PromoStrip />
      <Header onOpenMenu={() => setMenuOpen(true)} />
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      <main>
        <Hero />
        <CredibilityStrip />
        <WholesaleVsRetail />
        <Catalog onOpenQuickView={onOpenQuickView} />
        <Manifesto />
        <Social />
        <FAQSection />
        <Location />
        <Newsletter />
      </main>
      <Footer />
      <FloatingWA />
      {quickView && (
        <QuickView
          product={quickView.product}
          initialColorIdx={quickView.colorIdx}
          onClose={onCloseQuickView}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
