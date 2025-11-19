import React, { useEffect, useState, useRef } from 'react';
import LightningCursor from './components/LightningCursor';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty('--mouse-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${y}px`);

      const panels = document.querySelectorAll('.glass-panel');
      panels.forEach(panel => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        panel.style.setProperty('--mouse-x', `${x}px`);
        panel.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    // Scroll Reveal Observer
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => {
      observerRef.current.observe(el);
    });

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return (
    <div className="container-fluid">
      <LightningCursor />
      <div className="spotlight-overlay"></div>

      {/* Background Blobs */}
      <div className="bg-blob" style={{ width: '600px', height: '600px', background: '#b91c1c', top: '-200px', left: '-200px', opacity: 0.15 }}></div>
      <div className="bg-blob" style={{ width: '500px', height: '500px', background: '#15803d', top: '40%', right: '-100px', opacity: 0.15 }}></div>
      <div className="bg-blob" style={{ width: '400px', height: '400px', background: '#ca8a04', bottom: '-100px', left: '20%', opacity: 0.1 }}></div>

      {/* Navigation */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
          <a href="#" className="logo" style={{ fontFamily: 'var(--font-heading)' }}>RdLn™</a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#contact" className="nav-link">Contact</a>
            <a href="/RdLn-Setup.exe" className="glass-button" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="glass-panel fade-up visible" style={{ padding: '4rem', maxWidth: '1000px', width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #b91c1c, #ca8a04)' }}></div>

          <h1 className="animate-float" style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
            Document Comparison <br />
            <span className="text-gradient">Reimagined</span>
          </h1>

          <p style={{ fontSize: '1.25rem', margin: '0 auto 2.5rem', color: 'var(--text-muted)' }}>
            The professional choice for legal document analysis.
            Secure, client-side processing with the precision of the Myers algorithm.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <a href="/RdLn-Setup.exe" className="glass-button" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>
              Download for Windows
            </a>
            <a href="#pricing" className="glass-button" style={{ fontSize: '1.1rem', padding: '16px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              View Pricing
            </a>
          </div>

          {/* 3D App Mockup */}
          <div className="mockup-container fade-up stagger-1">
            <div className="mockup-window">
              <div className="window-header">
                {/* Windows 11 Controls */}
                <div className="win-control">
                  <svg className="win-icon" viewBox="0 0 10 10">
                    <path d="M0,5 L10,5" />
                  </svg>
                </div>
                <div className="win-control">
                  <svg className="win-icon" viewBox="0 0 10 10">
                    <rect x="1" y="1" width="8" height="8" fill="none" stroke="white" />
                  </svg>
                </div>
                <div className="win-control win-close">
                  <svg className="win-icon" viewBox="0 0 10 10">
                    <path d="M0,0 L10,10 M10,0 L0,10" />
                  </svg>
                </div>
              </div>
              <div className="window-content">
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="skeleton-line" style={{ width: '60%' }}></div>
                    <div className="skeleton-line" style={{ width: '80%' }}></div>
                    <div className="skeleton-line" style={{ width: '70%' }}></div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="skeleton-block" style={{ flex: 1 }}></div>
                      <div className="skeleton-block" style={{ flex: 1 }}></div>
                    </div>
                    <div className="skeleton-line" style={{ width: '40%' }}></div>
                    <div className="skeleton-block" style={{ height: '200px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div style={{ marginTop: '5rem', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem', letterSpacing: '0.05em' }}>TRUSTED BY TEAMS AT</p>
            <div style={{ display: 'flex', gap: '4rem', justifyContent: 'center', opacity: 0.6, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Placeholder Logos */}
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-body)' }}>LEXCORP</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-body)' }}>HAMLIN</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-body)' }}>PEARSON</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-body)' }}>SPECTER</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <h2 className="section-title fade-up" style={{ fontFamily: 'var(--font-heading)' }}>Why Choose RdLn?</h2>
        <p className="section-subtitle fade-up stagger-1">Built for accuracy, designed for privacy.</p>

        <div className="features-grid">
          {[
            { icon: "🔒", title: "100% Secure", desc: "Your documents never leave your device. All processing happens locally using advanced client-side technology." },
            { icon: "⚡", title: "Lightning Fast", desc: "Powered by the Myers diff algorithm, RdLn handles large legal documents with pixel-perfect precision." },
            { icon: "👁️", title: "Built-in OCR", desc: "Compare scanned PDFs effortlessly with our integrated multi-language Optical Character Recognition." },
            { icon: "🎨", title: "Kyoto Theme", desc: "A beautiful, nature-inspired interface designed to reduce eye strain and bring tranquility to your workflow." },
            { icon: "💻", title: "Cross Platform", desc: "Optimized for Windows, with macOS and Linux support coming soon. One license, any device." },
            { icon: "🔄", title: "Smart Sync", desc: "Automatically detects and highlights changes, moves, and formatting updates instantly." }
          ].map((feature, i) => (
            <div key={i} className={`glass-panel feature-card fade-up stagger-${(i % 3) + 1}`}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <h2 className="section-title fade-up" style={{ fontFamily: 'var(--font-heading)' }}>Simple, Transparent Pricing</h2>
        <p className="section-subtitle fade-up stagger-1">Choose the plan that fits your workflow.</p>

        {/* Toggle */}
        <div className="fade-up stagger-1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <span style={{ color: !isYearly ? 'var(--text-body)' : 'var(--text-muted)', fontWeight: !isYearly ? 600 : 400 }}>Monthly</span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            style={{
              width: '50px',
              height: '26px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '13px',
              position: 'relative',
              cursor: 'pointer',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              background: 'var(--primary-color)',
              borderRadius: '50%',
              position: 'absolute',
              top: '2px',
              left: isYearly ? '26px' : '2px',
              transition: 'left 0.3s ease'
            }}></div>
          </div>
          <span style={{ color: isYearly ? 'var(--text-body)' : 'var(--text-muted)', fontWeight: isYearly ? 600 : 400 }}>Yearly <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>(Save 20%)</span></span>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="glass-panel pricing-card fade-up stagger-1">
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Starter</h3>
            <div className="price">$0<span>/mo</span></div>
            <p style={{ color: 'var(--text-muted)' }}>Perfect for occasional use</p>

            <ul className="features-list">
              <li><span className="check-icon">✓</span> Basic Document Comparison</li>
              <li><span className="check-icon">✓</span> 5 Comparisons / Month</li>
              <li><span className="check-icon">✓</span> Standard Support</li>
              <li style={{ opacity: 0.5 }}><span>✕</span> OCR Capabilities</li>
              <li style={{ opacity: 0.5 }}><span>✕</span> Batch Processing</li>
            </ul>

            <a href="/RdLn-Setup.exe" className="glass-button" style={{ width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              Download Free
            </a>
          </div>

          {/* Pro Tier */}
          <div className="glass-panel pricing-card featured fade-up stagger-2">
            <div className="popular-tag">MOST POPULAR</div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Professional</h3>
            <div className="price">${isYearly ? '24' : '29'}<span>/mo</span></div>
            <p style={{ color: 'var(--text-muted)' }}>{isYearly ? 'Billed $290 yearly' : 'Billed monthly'}</p>

            <ul className="features-list">
              <li><span className="check-icon">✓</span> Unlimited Comparisons</li>
              <li><span className="check-icon">✓</span> Advanced OCR Engine</li>
              <li><span className="check-icon">✓</span> Priority Support</li>
              <li><span className="check-icon">✓</span> Export to PDF/Word</li>
              <li><span className="check-icon">✓</span> Kyoto Dark Mode</li>
            </ul>

            <button className="glass-button" style={{ width: '100%', background: '#b91c1c', border: 'none', color: '#fef7e6' }}>
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="glass-panel pricing-card fade-up stagger-3">
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Enterprise</h3>
            <div className="price">Custom</div>
            <p style={{ color: 'var(--text-muted)' }}>For large organizations</p>

            <ul className="features-list">
              <li><span className="check-icon">✓</span> Everything in Pro</li>
              <li><span className="check-icon">✓</span> SSO Integration</li>
              <li><span className="check-icon">✓</span> Dedicated Account Manager</li>
              <li><span className="check-icon">✓</span> Custom Contracts</li>
              <li><span className="check-icon">✓</span> On-premise Options</li>
            </ul>

            <a href="mailto:sales@rdln.com" className="glass-button" style={{ width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ textAlign: 'center', padding: '8rem 2rem' }}>
        <div className="glass-panel fade-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem', background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.2), rgba(202, 138, 4, 0.2))' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>Ready to streamline your workflow?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', color: 'var(--text-muted)' }}>
            Join thousands of legal professionals who trust RdLn for their document analysis needs.
          </p>
          <a href="/RdLn-Setup.exe" className="glass-button" style={{ fontSize: '1.2rem', padding: '16px 40px', background: '#fef7e6', color: '#1c1917' }}>
            Get Started Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer fade-up">
        <div className="footer-content">
          <div className="footer-col">
            <h3 className="logo" style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'inline-block', fontFamily: 'var(--font-heading)' }}>RdLn™</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              The new standard in document comparison technology. Secure, fast, and beautiful.
            </p>
          </div>

          <div className="footer-col">
            <h4 style={{ fontFamily: 'var(--font-heading)' }}>Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Download</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 style={{ fontFamily: 'var(--font-heading)' }}>Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Legal</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 style={{ fontFamily: 'var(--font-heading)' }}>Support</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
          <p>© 2025 RdLn Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
