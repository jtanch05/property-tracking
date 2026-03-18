import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';
import { GlowingEffectDemo } from '@/components/ui/glowing-effect-demo';

// --- SVG Icons (inline, consistent 24x24 viewBox) ---
const IconBuilding = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /><path d="M9 7h1" /><path d="M9 11h1" /><path d="M14 7h1" /><path d="M14 11h1" />
    </svg>
);
const IconCalendar = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
    </svg>
);
const IconMail = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
const IconFileText = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
);
const IconTrendUp = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
);
const IconShield = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
    </svg>
);
const IconBell = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);
const IconUsers = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IconArrow = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);
const IconCheck = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);
const IconStar = () => (
    <svg className="lp-star" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);
const IconGoogle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// Animated counter hook
function useCounter(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

// Intersection Observer hook
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return [ref, inView];
}

// Stat counter component
function StatCounter({ value, label, suffix = '' }) {
    const [ref, inView] = useInView(0.3);
    const count = useCounter(value, 1800, inView);
    return (
        <div className="lp-stat" ref={ref}>
            <span className="lp-stat-value">{count}{suffix}</span>
            <span className="lp-stat-label">{label}</span>
        </div>
    );
}

// Feature card
function FeatureCard({ icon, title, description, delay = 0, gradient }) {
    const [ref, inView] = useInView(0.1);
    return (
        <div
            ref={ref}
            className={`lp-feature-card ${inView ? 'animate-in' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="lp-feature-icon" style={{ background: gradient }}>
                {icon}
            </div>
            <h3 className="lp-feature-title">{title}</h3>
            <p className="lp-feature-desc">{description}</p>
        </div>
    );
}

// Testimonial card
function TestimonialCard({ initials, name, role, text, delay = 0 }) {
    const [ref, inView] = useInView(0.1);
    return (
        <div
            ref={ref}
            className={`lp-testimonial-card ${inView ? 'animate-in' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="lp-testimonial-stars">
                {[...Array(5)].map((_, i) => <IconStar key={i} />)}
            </div>
            <p className="lp-testimonial-text">"{text}"</p>
            <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">{initials}</div>
                <div>
                    <div className="lp-testimonial-name">{name}</div>
                    <div className="lp-testimonial-role">{role}</div>
                </div>
            </div>
        </div>
    );
}

export default function Landing() {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div className="lp-root">
            {/* ---- NAVBAR ---- */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} role="button" tabIndex={0} aria-label="PropTrack Home">
                        <div className="lp-logo-icon">
                            <IconBuilding />
                        </div>
                        <span className="lp-logo-text">PropTrack</span>
                    </div>

                    <div className={`lp-nav-links ${mobileMenuOpen ? 'lp-nav-links--open' : ''}`}>
                        <button className="lp-nav-link" onClick={() => scrollTo('features')}>Features</button>
                        <button className="lp-nav-link" onClick={() => scrollTo('integrations')}>Integrations</button>
                        <button className="lp-nav-link" onClick={() => scrollTo('pricing')}>Pricing</button>
                        <div className="lp-nav-divider" />
                        <button className="lp-btn lp-btn--ghost" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="lp-btn lp-btn--primary" onClick={() => navigate('/login')}>Get Started Free</button>
                    </div>

                    <button
                        className="lp-mobile-toggle"
                        onClick={() => setMobileMenuOpen((v) => !v)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className={`lp-hamburger ${mobileMenuOpen ? 'lp-hamburger--open' : ''}`} />
                    </button>
                </div>
            </nav>

            {/* ---- HERO ---- */}
            <section className="lp-hero" ref={heroRef} id="hero">
                {/* Ambient blobs */}
                <div className="lp-blob lp-blob--1" aria-hidden="true" />
                <div className="lp-blob lp-blob--2" aria-hidden="true" />
                <div className="lp-blob lp-blob--3" aria-hidden="true" />

                {/* Grid overlay */}
                <div className="lp-grid-overlay" aria-hidden="true" />

                <div className="lp-hero-content">
                    <div className="lp-badge-pill">
                        <span className="lp-badge-dot" />
                        Real Estate Portfolio Management
                    </div>

                    <h1 className="lp-hero-title">
                        Track Every Property.<br />
                        <span className="lp-gradient-text">Never Miss an Alert.</span>
                    </h1>

                    <p className="lp-hero-subtitle">
                        PropTrack unifies your entire real estate portfolio — properties, tenants, leases, expenses
                        and maintenance — with smart alerts, Google Calendar sync, and automated email notifications.
                    </p>

                    <div className="lp-hero-actions">
                        <button className="lp-btn lp-btn--primary lp-btn--lg" onClick={() => navigate('/login')}>
                            Start Managing Free
                            <IconArrow />
                        </button>
                        <button className="lp-btn lp-btn--ghost lp-btn--lg" onClick={() => scrollTo('features')}>
                            See Features
                        </button>
                    </div>

                    <div className="lp-hero-trust">
                        <div className="lp-trust-avatars">
                            {['#2C2C2C', '#3a3a3a', '#484848', '#565656', '#646464'].map((c, i) => (
                                <div key={i} className="lp-avatar" style={{ background: c, zIndex: 5 - i }} />
                            ))}
                        </div>
                        <span className="lp-trust-text">Trusted by property investors &amp; managers</span>
                    </div>
                </div>

                {/* Hero UI Mockup */}
                <div className="lp-hero-mockup" aria-hidden="true">
                    <div className="lp-mockup-window">
                        <div className="lp-mockup-titlebar">
                            <span className="lp-mockup-dot" style={{ background: '#3a3a3a' }} />
                            <span className="lp-mockup-dot" style={{ background: '#4a4a4a' }} />
                            <span className="lp-mockup-dot" style={{ background: '#5a5a5a' }} />
                            <span className="lp-mockup-url">proptrack.app/dashboard</span>
                        </div>
                        <div className="lp-mockup-body">
                            {/* Stats row */}
                            <div className="lp-mockup-stats">
                                {[
                                    { label: 'Properties', value: '12' },
                                    { label: 'Monthly Revenue', value: '$24.8k' },
                                    { label: 'Active Tenants', value: '18' },
                                    { label: 'Occupancy', value: '94%' },
                                ].map((s, i) => (
                                    <div key={i} className="lp-mockup-stat">
                                        <div className="lp-mockup-stat-val">{s.value}</div>
                                        <div className="lp-mockup-stat-lbl">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Alert items */}
                            <div className="lp-mockup-alerts">
                                <div className="lp-mockup-alert-header">
                                    <span>Upcoming Alerts</span>
                                    <span className="lp-mockup-badge">3 new</span>
                                </div>
                                {[
                                    { text: 'Lease expiry — 14 Elm St', type: 'warn', time: 'in 7 days' },
                                    { text: 'Rent due — Unit 4B', type: 'info', time: 'Tomorrow' },
                                    { text: 'Maintenance complete — 22 Oak Ave', type: 'success', time: 'Just now' },
                                ].map((a, i) => (
                                    <div key={i} className={`lp-mockup-alert-item lp-mockup-alert--${a.type}`}>
                                        <div className="lp-mockup-alert-dot" />
                                        <span>{a.text}</span>
                                        <span className="lp-mockup-alert-time">{a.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- STATS STRIP ---- */}
            <section className="lp-stats-strip">
                <div className="lp-stats-inner">
                    <StatCounter value={500} label="Properties tracked" suffix="+" />
                    <div className="lp-stats-divider" />
                    <StatCounter value={98} label="Uptime reliability" suffix="%" />
                    <div className="lp-stats-divider" />
                    <StatCounter value={12} label="Integrations" suffix="+" />
                    <div className="lp-stats-divider" />
                    <StatCounter value={40} label="Hours saved per month" suffix="h" />
                </div>
            </section>

            {/* ---- FEATURES ---- */}
            <section className="lp-section" id="features">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-tag">Features</span>
                        <h2 className="lp-section-title">Everything you need to manage your portfolio</h2>
                        <p className="lp-section-subtitle">
                            From rent ledgers to maintenance tracking, PropTrack brings your entire real estate
                            operation into one beautifully designed workspace.
                        </p>
                    </div>

                    {/* Interactive bento grid with glowing mouse-tracking border effect */}
                    <GlowingEffectDemo />
                </div>
            </section>

            {/* ---- TESTIMONIALS ---- */}
            <section className="lp-section lp-section--alt" id="testimonials">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-tag">Testimonials</span>
                        <h2 className="lp-section-title">Trusted by property managers</h2>
                        <p className="lp-section-subtitle">
                            See what investors and landlords say about managing their portfolios with PropTrack.
                        </p>
                    </div>
                    <div className="lp-testimonials-grid">
                        <TestimonialCard
                            initials="MR"
                            name="Michael R."
                            role="Private Landlord · 8 properties"
                            text="PropTrack finally gave me a single place to track all my leases, rents, and maintenance. The automated email alerts save me at least a few hours every week."
                            delay={0}
                        />
                        <TestimonialCard
                            initials="SC"
                            name="Sarah C."
                            role="Property Manager · 24 properties"
                            text="The Google Calendar sync is a game-changer. All my lease renewals and inspection dates just appear in my calendar automatically — no manual entry."
                            delay={100}
                        />
                        <TestimonialCard
                            initials="JT"
                            name="James T."
                            role="Real Estate Investor · 15 properties"
                            text="Clean interface, fast, and the PDF export is exactly what I needed for end-of-year reporting. The dark theme is a bonus — easy on the eyes during late-night reviews."
                            delay={200}
                        />
                    </div>
                </div>
            </section>

            {/* ---- INTEGRATIONS ---- */}
            <section className="lp-section" id="integrations">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-tag">Integrations</span>
                        <h2 className="lp-section-title">Connected to the tools you already use</h2>
                        <p className="lp-section-subtitle">
                            PropTrack integrates seamlessly with Google Calendar and Resend to automate
                            your workflow — so alerts go exactly where you need them.
                        </p>
                    </div>

                    <div className="lp-integrations-layout">
                        {/* Calendar Integration card */}
                        <div className="lp-integration-card lp-integration-card--featured">
                            <div className="lp-integration-icon-wrap">
                                <div className="lp-integration-icon">
                                    <IconGoogle />
                                </div>
                                <div className="lp-integration-connector" />
                                <div className="lp-integration-icon lp-integration-icon--app">
                                    <IconCalendar />
                                </div>
                            </div>
                            <h3 className="lp-integration-title">Google Calendar Sync</h3>
                            <p className="lp-integration-desc">
                                Connect your Google account with OAuth and PropTrack will automatically populate your calendar
                                with lease renewals, rent due dates, inspections, and maintenance appointments.
                            </p>
                            <ul className="lp-integration-list">
                                {['Automatic event creation', 'Custom frequency (daily / weekly / monthly)', 'Bidirectional event updates', 'Works with any Google account'].map((item) => (
                                    <li key={item} className="lp-integration-list-item">
                                        <span className="lp-check-icon"><IconCheck /></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Email Integration card */}
                        <div className="lp-integration-card lp-integration-card--featured">
                            <div className="lp-integration-icon-wrap">
                                <div className="lp-integration-icon lp-integration-icon--resend">
                                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                                        <rect width="32" height="32" rx="8" fill="#000" />
                                        <path d="M9 8h8a5 5 0 0 1 0 10h-8V8Zm4 4v2h4a1 1 0 1 0 0-2h-4Zm-4 6h4l5 6h-5l-4-6Z" fill="#fff" />
                                    </svg>
                                </div>
                                <div className="lp-integration-connector" />
                                <div className="lp-integration-icon lp-integration-icon--app">
                                    <IconMail />
                                </div>
                            </div>
                            <h3 className="lp-integration-title">Automated Email Alerts</h3>
                            <p className="lp-integration-desc">
                                Powered by Resend, PropTrack delivers beautifully formatted alert emails on your schedule —
                                daily, weekly, bi-weekly, or monthly — so you're always informed without lifting a finger.
                            </p>
                            <ul className="lp-integration-list">
                                {['Configurable alert frequency', 'Rich HTML email templates', 'Instant critical notifications', 'Reliable delivery via Resend API'].map((item) => (
                                    <li key={item} className="lp-integration-list-item">
                                        <span className="lp-check-icon"><IconCheck /></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- HOW IT WORKS ---- */}
            <section className="lp-section lp-section--alt" id="how">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-tag">How it works</span>
                        <h2 className="lp-section-title">Up and running in minutes</h2>
                    </div>
                    <div className="lp-steps">
                        {[
                            { num: '01', title: 'Create your account', desc: 'Sign up with Google, add your properties and tenant details in minutes.' },
                            { num: '02', title: 'Connect integrations', desc: 'Link Google Calendar via OAuth and configure your email notification preferences.' },
                            { num: '03', title: 'Set your alerts', desc: 'Choose what matters — rent due, lease expiry, maintenance — and how often you want updates.' },
                            { num: '04', title: 'Stay in control', desc: 'Watch your dashboard update in real-time and receive automated calendar events and email summaries.' },
                        ].map((step, i) => (
                            <div key={i} className="lp-step">
                                <div className="lp-step-num">{step.num}</div>
                                <div className="lp-step-connector" />
                                <h3 className="lp-step-title">{step.title}</h3>
                                <p className="lp-step-desc">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- PRICING ---- */}
            <section className="lp-section" id="pricing">
                <div className="lp-section-inner">
                    <div className="lp-section-header">
                        <span className="lp-section-tag">Pricing</span>
                        <h2 className="lp-section-title">Simple, transparent pricing</h2>
                        <p className="lp-section-subtitle">No hidden fees. No credit card required to get started.</p>
                    </div>
                    <div className="lp-pricing-grid">
                        {/* Free */}
                        <div className="lp-pricing-card">
                            <div className="lp-pricing-header">
                                <h3 className="lp-pricing-name">Free</h3>
                                <div className="lp-pricing-price">$0<span>/month</span></div>
                                <p className="lp-pricing-tagline">Perfect for getting started</p>
                            </div>
                            <ul className="lp-pricing-features">
                                {['Up to 5 properties', 'Basic tenant management', 'Manual PDF export', 'Email alerts (weekly)', 'Firestore secure storage'].map(f => (
                                    <li key={f}><span className="lp-check-icon lp-check-icon--muted"><IconCheck /></span>{f}</li>
                                ))}
                            </ul>
                            <button className="lp-btn lp-btn--outline lp-btn--full" onClick={() => navigate('/login')}>Get Started Free</button>
                        </div>

                        {/* Pro - Featured */}
                        <div className="lp-pricing-card lp-pricing-card--featured">
                            <div className="lp-pricing-pill">Most Popular</div>
                            <div className="lp-pricing-header">
                                <h3 className="lp-pricing-name">Pro</h3>
                                <div className="lp-pricing-price">$12<span>/month</span></div>
                                <p className="lp-pricing-tagline">For active property managers</p>
                            </div>
                            <ul className="lp-pricing-features">
                                {['Unlimited properties', 'Full tenant & lease management', 'Google Calendar sync', 'Automated email alerts', 'Cash flow analytics', 'Priority support'].map(f => (
                                    <li key={f}><span className="lp-check-icon"><IconCheck /></span>{f}</li>
                                ))}
                            </ul>
                            <button className="lp-btn lp-btn--primary lp-btn--full" onClick={() => navigate('/login')}>Start Free Trial</button>
                        </div>

                        {/* Portfolio */}
                        <div className="lp-pricing-card">
                            <div className="lp-pricing-header">
                                <h3 className="lp-pricing-name">Portfolio</h3>
                                <div className="lp-pricing-price">$29<span>/month</span></div>
                                <p className="lp-pricing-tagline">For large portfolios &amp; teams</p>
                            </div>
                            <ul className="lp-pricing-features">
                                {['Everything in Pro', 'Team collaboration', 'Custom report templates', 'API access', 'Advanced analytics', 'Dedicated support'].map(f => (
                                    <li key={f}><span className="lp-check-icon lp-check-icon--muted"><IconCheck /></span>{f}</li>
                                ))}
                            </ul>
                            <button className="lp-btn lp-btn--outline lp-btn--full" onClick={() => navigate('/login')}>Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- CTA ---- */}
            <section className="lp-cta-section">
                <div className="lp-blob lp-blob--cta1" aria-hidden="true" />
                <div className="lp-blob lp-blob--cta2" aria-hidden="true" />
                <div className="lp-cta-inner">
                    <h2 className="lp-cta-title">Ready to take control of your portfolio?</h2>
                    <p className="lp-cta-sub">Join property investors and managers who rely on PropTrack every day.</p>
                    <div className="lp-cta-actions">
                        <button className="lp-btn lp-btn--primary lp-btn--lg lp-btn--glow" onClick={() => navigate('/login')}>
                            Get Started — It's Free
                            <IconArrow />
                        </button>
                    </div>
                </div>
            </section>

            {/* ---- FOOTER ---- */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <div className="lp-logo">
                            <div className="lp-logo-icon lp-logo-icon--sm">
                                <IconBuilding />
                            </div>
                            <span className="lp-logo-text">PropTrack</span>
                        </div>
                        <p className="lp-footer-tagline">Real estate portfolio management, simplified.</p>
                    </div>
                    <div className="lp-footer-links">
                        <button className="lp-footer-link" onClick={() => scrollTo('features')}>Features</button>
                        <button className="lp-footer-link" onClick={() => scrollTo('integrations')}>Integrations</button>
                        <button className="lp-footer-link" onClick={() => scrollTo('pricing')}>Pricing</button>
                        <button className="lp-footer-link" onClick={() => navigate('/login')}>Sign In</button>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    <span>© {new Date().getFullYear()} PropTrack. Built with Firebase, Vite &amp; React.</span>
                </div>
            </footer>
        </div>
    );
}
