'use client';
/**
 * components/landing/CTASection.tsx
 *
 * Standalone CTA + Footer component extracted from app/page.tsx.
 * This section has no shared state dependencies and is safe to render independently.
 */
import Link from 'next/link';

export default function CTASection({
  onScrollToSection,
}: {
  onScrollToSection?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <>
      <section id="cta">
        <h2 className="d rv">
          Ready to own your
          <br />
          <em>professional presence?</em>
        </h2>
        <Link className="btn" href="/signup" style={{ padding: '20px 40px', fontSize: '18px' }}>
          Get Started Free
        </Link>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <Link
              href="#overview"
              className="lg"
              aria-label="UNOOL Home"
              onClick={onScrollToSection ? (e) => onScrollToSection(e, '#overview') : undefined}
            >
              <img src="/unool-logo.png" alt="UNOOL" className="lg-img" />
            </Link>
            <p className="footer-legal-text">
              Unool is a personal branding and publishing platform owned and operated by{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                Pixenox Solutions
              </a>
              . Built to help founders, creators, and teams own their professional narrative.
            </p>
            <p className="footer-legal-text" style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>
              Corporate Portal:{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                www.pixenox.com
              </a>{' '}
              · Prathipadu, Kakinada District, Andhra Pradesh, India
            </p>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Legal &amp; Policies</span>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/refund">Refund &amp; Cancellation</Link>
            <Link href="/shipping">Shipping &amp; Delivery</Link>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Support &amp; Contact</span>
            <Link href="/contact">Contact Us</Link>
            <a href="mailto:connect@pixenox.com">connect@pixenox.com</a>
            <a href="mailto:support@unool.co">support@unool.co</a>
            <span style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>
              Support Hours: Mon-Fri 9AM-6PM IST
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pixenox Solutions. All rights reserved.</span>
          <span>Unool &trade; is a registered trademark of Pixenox Solutions.</span>
        </div>
      </footer>
    </>
  );
}

