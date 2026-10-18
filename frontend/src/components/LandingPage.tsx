import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ScanLine,
  Truck,
  Droplets,
  BookOpen,
  ShoppingBag,
  Tent,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  Layers,
  Leaf,
  Sprout,
} from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

export default function LandingPage({ setActiveTab }: LandingPageProps) {
  const { t, isLoggedIn, setIsAuthModalOpen, setAuthModalMode, activeRole } = useApp();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      setActiveTab('dashboard');
    } else {
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
    }
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('platform-features-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const quickActions = [
    {
      id: 'disease',
      title: t('actionDetectDisease'),
      icon: ScanLine,
      color: 'forest',
      badge: t('badgeAiVision'),
    },
    {
      id: 'waterwindow',
      title: t('actionCheckIrrigation'),
      icon: Droplets,
      color: 'cyan',
      badge: t('badgeWeatherSmart'),
    },
    {
      id: 'fairqueue',
      title: t('actionRentMachinery'),
      icon: Truck,
      color: 'emerald',
      badge: t('badgeFairQueue'),
    },
    {
      id: 'schemes',
      title: t('actionFindSchemes'),
      icon: BookOpen,
      color: 'purple',
      badge: t('badgeZeroPii'),
    },
    {
      id: 'marketplace',
      title: t('actionSellCrops'),
      icon: ShoppingBag,
      color: 'amber',
      badge: t('badgeDirectTrade'),
    },
  ];

  const features = [
    {
      id: 'disease',
      title: t('featureDiseaseTitle'),
      desc: t('featureDiseaseDesc'),
      icon: ScanLine,
      tag: t('tagDisease'),
      metrics: t('metricsDisease'),
    },
    {
      id: 'fairqueue',
      title: t('featureMachineryTitle'),
      desc: t('featureMachineryDesc'),
      icon: Truck,
      tag: t('tagMachinery'),
      metrics: t('metricsMachinery'),
    },
    {
      id: 'waterwindow',
      title: t('featureIrrigationTitle'),
      desc: t('featureIrrigationDesc'),
      icon: Droplets,
      tag: t('tagIrrigation'),
      metrics: t('metricsIrrigation'),
    },
    {
      id: 'schemes',
      title: t('featureSchemesTitle'),
      desc: t('featureSchemesDesc'),
      icon: BookOpen,
      tag: t('tagSchemes'),
      metrics: t('metricsSchemes'),
    },
    {
      id: 'marketplace',
      title: t('featureMarketTitle'),
      desc: t('featureMarketDesc'),
      icon: ShoppingBag,
      tag: t('tagMarket'),
      metrics: t('metricsMarket'),
    },
    {
      id: 'camps',
      title: t('featureCampsTitle'),
      desc: t('featureCampsDesc'),
      icon: Tent,
      tag: t('tagCamps'),
      metrics: t('metricsCamps'),
    },
  ];

  return (
    <div className="landing-page-container">
      {/* 1. Hero Section */}
      <section className="hero-banner-section">
        <div className="hero-content-grid">
          <div className="hero-text-block">
            <div className="hero-eyebrow-pill">
              <Sparkles size={15} className="hero-sparkle-icon" />
              <span>{t('heroEyebrow')}</span>
            </div>
            <h1 className="hero-main-heading">{t('heroHeading')}</h1>
            <p className="hero-supporting-text">{t('heroSubheading')}</p>

            <div className="hero-cta-buttons">
              <button type="button" className="cta-btn primary-cta" onClick={handleGetStarted}>
                <span>{t('getStarted')}</span>
                <ArrowRight size={18} />
              </button>
              <button type="button" className="cta-btn secondary-cta" onClick={handleExploreFeatures}>
                <span>{t('exploreFeatures')}</span>
              </button>
            </div>

            <div className="hero-trust-indicators">
              <div className="trust-item">
                <ShieldCheck size={18} className="trust-icon" />
                <span>{t('trustKvk')}</span>
              </div>
              <div className="trust-item">
                <Cpu size={18} className="trust-icon" />
                <span>{t('trustAi')}</span>
              </div>
              <div className="trust-item">
                <Users size={18} className="trust-icon" />
                <span>{t('trustNoBroker')}</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-block">
            <div className="hero-image-card">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80"
                alt="Indian farmer inspecting lush green crops at sunrise"
                className="hero-farmer-photo"
                loading="eager"
              />
              <div className="hero-floating-card top-float">
                <ScanLine size={20} className="float-icon-green" />
                <div>
                  <div className="float-title">{t('floatAiReady')}</div>
                  <div className="float-sub">{t('floatAiCrops')}</div>
                </div>
              </div>
              <div className="hero-floating-card bottom-float">
                <TrendingUp size={20} className="float-icon-gold" />
                <div>
                  <div className="float-title">{t('floatMandi')}</div>
                  <div className="float-sub">{t('floatZeroComm')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Actions Strip */}
      <section className="quick-actions-section">
        <div className="section-header-compact">
          <h2 className="section-title-compact">
            <Sparkles size={20} style={{ color: '#059669' }} />
            <span>{t('quickActions')}</span>
          </h2>
          <span className="section-subtitle-compact">{t('quickActionsSubtitle')}</span>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                className={`quick-action-card action-theme-${action.color}`}
                onClick={() => {
                  setActiveTab(action.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="action-icon-circle">
                  <Icon size={24} />
                </div>
                <div className="action-text-area">
                  <span className="action-badge-pill">{action.badge}</span>
                  <h3 className="action-title-text">{action.title}</h3>
                </div>
                <ChevronRight size={18} className="action-arrow-icon" />
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Platform Features */}
      <section id="platform-features-section" className="platform-features-section">
        <div className="section-header-centered">
          <span className="section-kicker-tag">{t('featuresKicker')}</span>
          <h2 className="section-main-title">{t('platformFeaturesTitle')}</h2>
          <p className="section-description-text">{t('platformFeaturesSub')}</p>
        </div>

        <div className="features-showcase-grid">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.id} className="feature-card-item">
                <div className="feature-card-top">
                  <div className="feature-icon-wrapper">
                    <Icon size={26} />
                  </div>
                  <span className="feature-tag-pill">{feat.tag}</span>
                </div>
                <h3 className="feature-item-title">{feat.title}</h3>
                <p className="feature-item-desc">{feat.desc}</p>
                <div className="feature-metrics-row">
                  <Layers size={14} className="metrics-icon" />
                  <span>{feat.metrics}</span>
                </div>
                <button
                  type="button"
                  className="feature-action-link"
                  onClick={() => {
                    setActiveTab(feat.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span>{t('launchModule')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. About Section with Farm Photo */}
      <section className="about-deepdive-section">
        <div className="about-content-grid">
          <div className="about-photo-card">
            <img
              src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1000&q=80"
              alt="Golden wheat harvest in Punjab field"
              className="about-farm-photo"
              loading="lazy"
            />
            <div className="about-badge-card">
              <Leaf size={24} className="about-leaf-symbol" />
              <div>
                <strong>{t('aboutBadgeTech')}</strong>
                <div>{t('aboutBadgeSub')}</div>
              </div>
            </div>
          </div>

          <div className="about-narrative-card">
            <span className="section-kicker-tag">{t('aboutKicker')}</span>
            <h2 className="about-heading-text">{t('aboutTitle')}</h2>
            <p className="about-body-paragraph">{t('aboutParagraph1')}</p>
            <p className="about-body-paragraph">{t('aboutParagraph2')}</p>

            <div className="about-points-list">
              <div className="about-point-row">
                <CheckCircle2 size={20} className="check-point-icon" />
                <div>
                  <strong>{t('aboutPoint1Title')}</strong> {t('aboutPoint1Desc')}
                </div>
              </div>
              <div className="about-point-row">
                <CheckCircle2 size={20} className="check-point-icon" />
                <div>
                  <strong>{t('aboutPoint2Title')}</strong> {t('aboutPoint2Desc')}
                </div>
              </div>
              <div className="about-point-row">
                <CheckCircle2 size={20} className="check-point-icon" />
                <div>
                  <strong>{t('aboutPoint3Title')}</strong> {t('aboutPoint3Desc')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="how-it-works-section">
        <div className="section-header-centered">
          <span className="section-kicker-tag">{t('howItWorksKicker')}</span>
          <h2 className="section-main-title">{t('howItWorksTitle')}</h2>
          <p className="section-description-text">{t('howItWorksSub')}</p>
        </div>

        <div className="steps-cards-grid">
          <div className="step-card">
            <div className="step-number-circle">1</div>
            <h3 className="step-card-title">{t('step1Title')}</h3>
            <p className="step-card-text">{t('step1Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number-circle">2</div>
            <h3 className="step-card-title">{t('step2Title')}</h3>
            <p className="step-card-text">{t('step2Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number-circle">3</div>
            <h3 className="step-card-title">{t('step3Title')}</h3>
            <p className="step-card-text">{t('step3Desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-number-circle">4</div>
            <h3 className="step-card-title">{t('step4Title')}</h3>
            <p className="step-card-text">{t('step4Desc')}</p>
          </div>
        </div>
      </section>

      {/* 6. Impact Statistics */}
      <section className="impact-metrics-section">
        <div className="impact-container-inner">
          <h2 className="impact-title-text">{t('impactTitle')}</h2>

          <div className="impact-stats-grid">
            <div className="stat-card">
              <div className="stat-number">{t('impactStat1Number')}</div>
              <div className="stat-label">{t('impactStat1Label')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{t('impactStat2Number')}</div>
              <div className="stat-label">{t('impactStat2Label')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{t('impactStat3Number')}</div>
              <div className="stat-label">{t('impactStat3Label')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{t('impactStat4Number')}</div>
              <div className="stat-label">{t('impactStat4Label')}</div>
            </div>
          </div>

          <div className="impact-disclaimer-note">{t('impactDisclaimer')}</div>
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="testimonials-section">
        <div className="section-header-centered">
          <span className="section-kicker-tag">{t('testimonialsKicker')}</span>
          <h2 className="section-main-title">{t('testimonialsTitle')}</h2>
          <p className="section-description-text">{t('testimonialsSub')}</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-quote">"{t('testimonial1Text')}"</p>
            <div className="testimonial-author-block">
              <div className="author-avatar-initials">GS</div>
              <div>
                <div className="author-name">{t('testimonial1Author')}</div>
                <div className="author-role">{t('testimonial1Role')}</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-quote">"{t('testimonial2Text')}"</p>
            <div className="testimonial-author-block">
              <div className="author-avatar-initials">RP</div>
              <div>
                <div className="author-name">{t('testimonial2Author')}</div>
                <div className="author-role">{t('testimonial2Role')}</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-quote">"{t('testimonial3Text')}"</p>
            <div className="testimonial-author-block">
              <div className="author-avatar-initials">SA</div>
              <div>
                <div className="author-name">{t('testimonial3Author')}</div>
                <div className="author-role">{t('testimonial3Role')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Modern Footer */}
      <footer className="hackshift-modern-footer">
        <div className="footer-top-grid">
          <div className="footer-brand-column">
            <div className="footer-brand-title">
              <Sprout size={24} className="footer-leaf" />
              <span>{t('brandName')}</span>
            </div>
            <p className="footer-brand-desc">{t('brandSubtitle')}</p>
            <div className="footer-copyright-statement">{t('footerTagline')}</div>
          </div>

          <div className="footer-nav-column">
            <h4 className="footer-col-title">{t('footerCoreModules')}</h4>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => setActiveTab('disease')}>{t('diseaseDetection')}</button></li>
              <li><button type="button" onClick={() => setActiveTab('waterwindow')}>{t('smartIrrigation')}</button></li>
              <li><button type="button" onClick={() => setActiveTab('fairqueue')}>{t('machineryRental')}</button></li>
              <li><button type="button" onClick={() => setActiveTab('schemes')}>{t('governmentSchemes')}</button></li>
              <li><button type="button" onClick={() => setActiveTab('marketplace')}>{t('marketplace')}</button></li>
              <li><button type="button" onClick={() => setActiveTab('camps')}>{t('campsEvents')}</button></li>
            </ul>
          </div>

          <div className="footer-nav-column">
            <h4 className="footer-col-title">{t('footerPlatformSafety')}</h4>
            <ul className="footer-links-list">
              <li><a href="#about" onClick={(e) => { e.preventDefault(); handleExploreFeatures(); }}>{t('footerAgronomicStandards')}</a></li>
              <li><a href="#disclaimer" onClick={(e) => { e.preventDefault(); alert("Advisory Disclaimer: ML recommendations are screening estimates. Consult certified extension officers before chemical application."); }}>{t('footerSafetyDisclaimers')}</a></li>
              <li><button type="button" onClick={() => setActiveTab('dashboard')}>{t('dashboard')}</button></li>
              <li><button type="button" onClick={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }}>{t('footerFarmerRegistration')}</button></li>
            </ul>
          </div>

          <div className="footer-contact-column">
            <h4 className="footer-col-title">{t('footerEmergencyContacts')}</h4>
            <div className="emergency-contact-box">
              <div className="contact-line">{t('footerKisanCallCenter')}</div>
              <div className="contact-line">{t('footerKvkSupport')}</div>
              <div className="contact-line">{t('footerTechnicalApi')}</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-legal-copy">{t('footerCopyright')}</div>
          <div className="footer-regulatory-note">
            {t('footerComplianceNote')}
          </div>
        </div>
      </footer>
    </div>
  );
}
