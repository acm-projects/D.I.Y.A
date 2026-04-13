// So the logo stays and the second page scrolls into view,
//  `useRef` holds the second section `scrollIntoView`.
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import "./LandingPageCss/landing-mbp.css";
import "./LandingPageCss/landing-page-top-waves.css";
import "./LandingPageCss/landing-page-bottom-waves.css";
import "./LandingPageCss/landing-desktop-box.css";
import "./LandingPageCss/image-carousel-container.css";
import "./LandingPageCss/landing-features-panels.css";

// constant repeated layout features:
// colors for landing page
const palette = {
  darkest: "#270115",
  crimson: "#a22237",
  deepBurgundy: "#5C1E26",
  sage: "#7A9B76",
  cream: "#FBF5F0",
  lightGray: "#D6D6D6",
} as const;

// colors for top waves on landing page
const wavePalette = {
  deep: "#6E2A32",
  mid: "#9E4552",
  crimson: palette.crimson,
  rose: "#C96B78",
  blush: "#E8A8B0",
  pale: "#F2D0D5",
} as const;


const FEATURES_POPOUT_ANCHOR_NUDGE_X_PX = 0;
const FEATURES_POPOUT_ANCHOR_NUDGE_Y_PX = 0;

const STUDENT_FEATURE_IMAGES = [
  { src: "/diya-images/student-chat.png", alt: "Student chat" },
  { src: "/diya-images/student-office-hours.png", alt: "Student office hours" },
  { src: "/diya-images/student-self-check.png", alt: "Student self check" },
] as const;

const ADMIN_FEATURE_IMAGES = [
  { src: "/diya-images/professor-groups.png", alt: "Professor groups" },
  { src: "/diya-images/professor-analytics.png", alt: "Professor analytics" },
  { src: "/diya-images/admin-office-requests.png", alt: "Admin office requests" },
] as const;


const STUDENT_FEATURES_SLIDE_COPY = [
  "Students have access to group forum pages where they can ask questions and get answers from their peers, professors, and AI.",
  "Sometimes asking questions remotely may not be enough. This is why we want to give students the ability to request an office hour meet up with either the Professor or TA outside of normal times. Based on the start time and meeting duration chosen by the student, the professor can choose to accept or decline their request.",
  "Using our Self-Check feature, students can upload the provided rubric and the work they've already done in order to receive an estimated grade report. The report includes a potential grade for their assignment and suggestions for further improvement on their work.",
] as const;

const ADMIN_FEATURES_SLIDE_COPY = [
  "Professors have the ability to create a group for any of their classes. They can input any information about the group, give the group a name, and invite their students. Once a student accepts the invitation to join, they have access to all the group's forum pages. The professor has the ability to answer forum page questions, and verify if an AI generated answer to a student's question is correct. Both the Professor and TA are considered admin within the group.",
  "Based on key word analysis, AI is used to provide analytics to group admins about the forum posts. The analysis includes the most common types of questions, topics that professors could reconsider revisiting or re-explaining, and other AI generated information on their students.",
  "Depending on whether the student requested to meet with the TA or Professor, either one has the ability to deny a request to meet and provide an alternate date and time instead. They also have the ability to accept the request. If the student requested to meet online, they receive a meeting invitation created by the admin through their email.",
] as const;

/**
 * Arrows + horizontal strip, adn image slide */
function FeaturesCarouselColumn({
  stripRef,
  onStripScroll,
  slides,
  prevLabel,
  nextLabel,
}: {
  stripRef: RefObject<HTMLDivElement | null>;
  onStripScroll: () => void;
  slides: readonly { src: string; alt: string }[];
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="carousel-container carousel-container--in-panel">
      <button
        type="button"
        className="carousel-arrow carousel-arrow--left"
        aria-label={prevLabel}
        onClick={() => {
          const el = stripRef.current;
          if (!el) return;
          const w = el.clientWidth;
          if (w <= 0) return;
          const n = slides.length;
          const idx = Math.round(el.scrollLeft / w);
          // From first slide, wrap to last (infinite loop).
          if (idx <= 0) {
            el.scrollTo({ left: (n - 1) * w, behavior: "smooth" });
          } else {
            el.scrollBy({ left: -w, behavior: "smooth" });
          }
        }}
      >
        <svg className="carousel-arrow__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"
          />
        </svg>
      </button>
      <button
        type="button"
        className="carousel-arrow carousel-arrow--right"
        aria-label={nextLabel}
        onClick={() => {
          const el = stripRef.current;
          if (!el) return;
          const w = el.clientWidth;
          if (w <= 0) return;
          const n = slides.length;
          const idx = Math.round(el.scrollLeft / w);
          // From last slide, wrap to first (infinite loop).
          if (idx >= n - 1) {
            el.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            el.scrollBy({ left: w, behavior: "smooth" });
          }
        }}
      >
        <svg className="carousel-arrow__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
          />
        </svg>
      </button>
      <div className="carousel-slide" ref={stripRef} onScroll={onStripScroll}>
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className="carousel-slide__page"
            aria-label={`Slide ${i + 1} of ${slides.length}`}
          >
            <img src={slide.src} alt={slide.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}


function FeaturesPopoutMockup({
  featuresAudience,
  setFeaturesAudience,
  onClose,
  studentCarouselStripRef,
  adminCarouselStripRef,
  onStudentFeaturesCarouselScroll,
  onAdminFeaturesCarouselScroll,
  studentFeaturesSlideIdx,
  adminFeaturesSlideIdx,
  frameStyle,
  onPopoutHeaderPointerDown,
}: {
  featuresAudience: "student" | "admin";
  setFeaturesAudience: React.Dispatch<React.SetStateAction<"student" | "admin">>;
  onClose: () => void;
  studentCarouselStripRef: RefObject<HTMLDivElement | null>;
  adminCarouselStripRef: RefObject<HTMLDivElement | null>;
  onStudentFeaturesCarouselScroll: () => void;
  onAdminFeaturesCarouselScroll: () => void;
  studentFeaturesSlideIdx: number;
  adminFeaturesSlideIdx: number;
  frameStyle: React.CSSProperties;
  onPopoutHeaderPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="desktop-window desktop-window--features-popout"
      style={{ animation: "none", ...frameStyle }}
    >
   
      <div
        className="desktop-window__header desktop-window__header--popout-toolbar desktop-window__header--popout-draggable"
        onPointerDown={onPopoutHeaderPointerDown}
      >
        <button
          type="button"
          className="desktop-window__header-close"
          aria-label="Close features"
          onClick={onClose}
        >
          ×
        </button>
        <label
          className="desktop-window__header-features-select-label"
          htmlFor="desktop-features-audience-select"
        >
          <span className="desktop-window__header-sr-only">
            Choose which features to show
          </span>
          <select
            id="desktop-features-audience-select"
            className="desktop-window__header-features-select"
            value={featuresAudience}
            onChange={(e) => {
              const v = e.target.value;
              setFeaturesAudience(v === "admin" ? "admin" : "student");
            }}
          >
            <option value="student">Student features</option>
            <option value="admin">Admin features</option>
          </select>
        </label>
      </div>
      <div className="desktop-window__body desktop-window__body--page">
        <div className="desktop-window__features-stack desktop-window__features-stack--audience">
          <div className="desktop-window__features-title-slot" />
          <div className="features-panels-viewport">
            <div
              className="features-panels-track"
              style={{
                transform:
                  featuresAudience === "student"
                    ? "translateX(0)"
                    : "translateX(-50%)",
              }}
            >
              <div
                className="features-panel"
                data-active={featuresAudience === "student" ? "true" : "false"}
                aria-hidden={featuresAudience !== "student"}
              >
                <div className="features-panel__inner">
                  <div className="features-panel__carousel-col">
                    <FeaturesCarouselColumn
                      stripRef={studentCarouselStripRef}
                      onStripScroll={onStudentFeaturesCarouselScroll}
                      slides={STUDENT_FEATURE_IMAGES}
                      prevLabel="Previous student feature slide"
                      nextLabel="Next student feature slide"
                    />
                  </div>
                  <div className="features-panel__copy-col" aria-live="polite">
                    <p>
                      {STUDENT_FEATURES_SLIDE_COPY[studentFeaturesSlideIdx]}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="features-panel"
                data-active={featuresAudience === "admin" ? "true" : "false"}
                aria-hidden={featuresAudience !== "admin"}
              >
                <div className="features-panel__inner">
                  <div className="features-panel__carousel-col">
                    <FeaturesCarouselColumn
                      stripRef={adminCarouselStripRef}
                      onStripScroll={onAdminFeaturesCarouselScroll}
                      slides={ADMIN_FEATURE_IMAGES}
                      prevLabel="Previous admin feature slide"
                      nextLabel="Next admin feature slide"
                    />
                  </div>
                  <div className="features-panel__copy-col" aria-live="polite">
                    <p>{ADMIN_FEATURES_SLIDE_COPY[adminFeaturesSlideIdx]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const firstPageRef = useRef<HTMLElement | null>(null);
  // For (logo/second page scroll into view) ref attached to the second page layout bellow.
  const secondPageRef = useRef<HTMLElement | null>(null);
  const studentCarouselStripRef = useRef<HTMLDivElement>(null);
  const adminCarouselStripRef = useRef<HTMLDivElement>(null);
  const [featuresAudience, setFeaturesAudience] = useState<"student" | "admin">("student");
  const [studentFeaturesSlideIdx, setStudentFeaturesSlideIdx] = useState(0);
  const [adminFeaturesSlideIdx, setAdminFeaturesSlideIdx] = useState(0);
  const [learnMoreOnSecondPage, setLearnMoreOnSecondPage] = useState(false);
  const [secondScreenPanel, setSecondScreenPanel] = useState<"mission" | "features">(
    "mission",
  );

  const [featuresPopoutOffset, setFeaturesPopoutOffset] = useState({ x: 0, y: 0 });
  const featuresPopoutDragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });


  useEffect(() => {
    if (secondScreenPanel === "features") {
      setFeaturesPopoutOffset({ x: 0, y: 0 });
    }
  }, [secondScreenPanel]);

 
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!featuresPopoutDragRef.current.dragging) return;
      const d = featuresPopoutDragRef.current;
      setFeaturesPopoutOffset({
        x: d.origX + e.clientX - d.startX,
        y: d.origY + e.clientY - d.startY,
      });
    };
    const endDrag = () => {
      featuresPopoutDragRef.current.dragging = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

 
  const onFeaturesPopoutHeaderPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if ((e.target as HTMLElement).closest("button, select, label")) return;
    e.preventDefault();
    featuresPopoutDragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: featuresPopoutOffset.x,
      origY: featuresPopoutOffset.y,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    const el = secondPageRef.current;
    if (!el) return;

    const updateLearnMoreColor = () => {
      const top = el.getBoundingClientRect().top;
      const vh = window.innerHeight;
      setLearnMoreOnSecondPage(top < vh * 0.88);
    };

    updateLearnMoreColor();
    window.addEventListener("scroll", updateLearnMoreColor, { passive: true });
    window.addEventListener("resize", updateLearnMoreColor);
    return () => {
      window.removeEventListener("scroll", updateLearnMoreColor);
      window.removeEventListener("resize", updateLearnMoreColor);
    };
  }, []);


  const onStudentFeaturesCarouselScroll = () => {
    const el = studentCarouselStripRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const idx = Math.round(el.scrollLeft / w);
    setStudentFeaturesSlideIdx(
      Math.min(Math.max(0, idx), STUDENT_FEATURE_IMAGES.length - 1),
    );
  };

  const onAdminFeaturesCarouselScroll = () => {
    const el = adminCarouselStripRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const idx = Math.round(el.scrollLeft / w);
    setAdminFeaturesSlideIdx(
      Math.min(Math.max(0, idx), ADMIN_FEATURE_IMAGES.length - 1),
    );
  };

  const onLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (learnMoreOnSecondPage) {
      firstPageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      secondPageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div

      style={{
        minHeight: "100vh",
        position: "relative",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/*  
      Main part of the page. 
      Everything that is important that shows on this screen goes inside here. 
      The layout/background styles are grouped, and so accessibility tools 
      can find the main content area. */}
      <main 

      style={{ 
        minHeight: "100vh",
        position: "relative",
        backgroundColor: palette.cream,
      }}>
        <div
        // landing-top-waves (class names from landing-page-waves.css file)
          className="landing-top-waves landing-top-waves--fullscreen"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGradBack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wavePalette.deep} />
                <stop offset="42%" stopColor={wavePalette.mid} stopOpacity={0.95} />
                <stop offset="72%" stopColor={wavePalette.crimson} stopOpacity={0.45} />
                <stop offset="100%" stopColor={wavePalette.rose} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="waveGradMidA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wavePalette.crimson} stopOpacity={0.92} />
                <stop offset="48%" stopColor={wavePalette.rose} stopOpacity={0.6} />
                <stop offset="100%" stopColor={wavePalette.blush} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="waveGradMidB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wavePalette.rose} stopOpacity={0.88} />
                <stop offset="55%" stopColor={wavePalette.blush} stopOpacity={0.42} />
                <stop offset="100%" stopColor={wavePalette.pale} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="waveGradFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wavePalette.blush} stopOpacity={0.55} />
                <stop offset="55%" stopColor={wavePalette.pale} stopOpacity={0.28} />
                <stop offset="100%" stopColor={wavePalette.pale} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              className="wave-back"
              fill="url(#waveGradBack)"
              d="M0 0H1440V60C1200 140 900 20 720 100C520 170 260 40 0 120V0Z"
            />
            <path
              className="wave-mid-a"
              fill="url(#waveGradMidA)"
              d="M0 0H1440V90C1100 200 820 40 600 130C380 210 180 70 0 150V0Z"
            />
            <path
              className="wave-mid-b"
              fill="url(#waveGradMidB)"
              d="M0 0H1440V110C1250 230 950 60 720 160C500 250 240 100 0 190V0Z"
            />
            <path
              className="wave-front"
              fill="url(#waveGradFront)"
              d="M0 0H1440V130C1180 260 860 80 640 175C420 260 200 130 0 220V0Z"
            />
          </svg>
        </div>

        <section
          ref={firstPageRef}
          className="landing-intro-shell"
          style={{
            minHeight: "100svh",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            boxSizing: "border-box",
            padding:
              "clamp(28px, 3.5vh, 48px) clamp(20px, 4vw, 40px) clamp(32px, 6vh, 56px)",
          }}
        >
          {/* landing-hero
                landing-hero-title: has the css code for D.I.Y.A
                landing-hero-subtitle: has css code for the subtitle
          
          */}
          <div className="landing-hero">
            <header className="landing-hero-headline">
              <h1 className="landing-hero-title">D.I.Y.A</h1>
              <p className="landing-hero-subtitle">
                Digital Intake Yielding Answers
              </p>
            </header>
           {/* landing-hero-macbook - has css code for macbook on first page
               Httml code for macbook bellow:
           */}
            <div
              className="landing-hero-macbook"
              style={{
                filter: "drop-shadow(0 22px 44px rgba(39, 1, 21, 0.2))",
              }}
            >
              <div className="mbp-mockup-wrapper">
                <div className="mbp-container">
                  <div className="mbp-display with-glare">
                    <div className="display-edge">
                      <div className="bezel">
                        <div className="display-camera" aria-hidden />
                        <div className="display-frame">
                          <video
                            src="/diya-website-walkthrough.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            aria-label="D.I.Y.A product walkthrough"
                          />
                        </div>
                        <div className="below-display">
                          <div className="macbookpro" aria-hidden />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mbp-keyboard">
                    <div className="front">
                      <div className="opener-left" />
                      <div className="opener-right" />
                    </div>
                    <div className="bottom-left" />
                    <div className="bottom-right" />
                    <div className="mbp-shadow">
                      <div className="shadow-left" />
                      <div className="shadow-right" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 
        Blank second screen so when you scroll to the next page, the waves don't follow from the first page.
        An paque full-height block paints over the waves, so it covers the fixed layer (the red waves) in the viewport: */}
        <section
          ref={secondPageRef}
          id="landing-second-page"
          style={{
            /* The second page filled the viewport so for one full scroll height it is just solid color, no waves */
            minHeight: "100svh",
            boxSizing: "border-box",
            position: "relative",
            zIndex: 1,
            /* solid color, so you no longer “see through” to the red waves in that viewport area. */
            backgroundColor: palette.cream,
            overflow: "hidden",
          }}
          
        >
         
          {/* desktop window gets centered, while bottom waves stay at the abosolute bottom. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
          
            
            <div
              className="landing-second-mission-block"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "clamp(12px, 2.2vh, 24px)",
                pointerEvents: "auto",
                maxWidth: "100%",
              }}
            >
              <h2 className="landing-second-mission-title">Our Mission</h2>
              <div className="desktop-windows-stack">
              <div
                className="desktop-window desktop-window--mission-back"
                style={{
                  animation: "desktopBounce 1.5s ease-in-out infinite",
                }}
              >
                <div className="desktop-window__header" aria-hidden={true} />
                <div className="desktop-window__body desktop-window__body--page desktop-window__body--mission-layout">
                  <p className="desktop-window__mission-text">
                    D.I.Y.A is dedicated to strengthening the connection between
                    students and professors by making homework help more flexible
                    and accessible beyond the classroom. With our website, we hope
                    to create a learning environment that motivates students to
                    ask questions, engage in discussions, and seek personal
                    support, while also providing professors with analytics on
                    student concerns and a platform that makes organizing student
                    needs like office hour requests easier, reducing the risk of
                    emails being overlooked or lost in busy inboxes.
                  </p>
                  <div className="desktop-window__mission-cta">
                    <button
                      type="button"
                      className="desktop-window__mission-cta-btn"
                      onClick={() => setSecondScreenPanel("features")}
                    >
                      View D.I.Y.A&apos;s features
                    </button>
                  </div>
                </div>
              </div>
              {secondScreenPanel === "features" ? (
                <div
                  className="desktop-window-features-overlay-dim"
                  aria-hidden
                />
              ) : null}
              {secondScreenPanel === "features" ? (
                <FeaturesPopoutMockup
                  featuresAudience={featuresAudience}
                  setFeaturesAudience={setFeaturesAudience}
                  onClose={() => setSecondScreenPanel("mission")}
                  studentCarouselStripRef={studentCarouselStripRef}
                  adminCarouselStripRef={adminCarouselStripRef}
                  onStudentFeaturesCarouselScroll={onStudentFeaturesCarouselScroll}
                  onAdminFeaturesCarouselScroll={onAdminFeaturesCarouselScroll}
                  studentFeaturesSlideIdx={studentFeaturesSlideIdx}
                  adminFeaturesSlideIdx={adminFeaturesSlideIdx}
                  frameStyle={{
                    position: "absolute",
                    left: `calc(50% + ${FEATURES_POPOUT_ANCHOR_NUDGE_X_PX + featuresPopoutOffset.x}px)`,
                    top: `calc(50% + ${FEATURES_POPOUT_ANCHOR_NUDGE_Y_PX + featuresPopoutOffset.y}px)`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                    pointerEvents: "auto",
                  }}
                  onPopoutHeaderPointerDown={onFeaturesPopoutHeaderPointerDown}
                />
              ) : null}
              </div>
            </div>
          </div>

          
          {/* Waves on the bottom of the Landing Page */}
          <div
            className="landing-bottom-waves landing-bottom-waves--band"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 1440 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradMidB_Bottom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={wavePalette.rose} stopOpacity={0.88} />
                  <stop offset="55%" stopColor={wavePalette.blush} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={wavePalette.pale} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waveGradFront_Bottom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={wavePalette.blush} stopOpacity={0.55} />
                  <stop offset="55%" stopColor={wavePalette.pale} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={wavePalette.pale} stopOpacity={0} />
                </linearGradient>
              </defs>

              <path
                className="wave-mid-b"
                fill="url(#waveGradMidB_Bottom)"
                d="M0 0H1440V110C1250 230 950 60 720 160C500 250 240 100 0 190V0Z"
              />
              <path
                className="wave-front"
                fill="url(#waveGradFront_Bottom)"
                d="M0 0H1440V130C1180 260 860 80 640 175C420 260 200 130 0 220V0Z"
              />
            </svg>
          </div>
        </section>

      
        <Link
          to="/"
          onClick={onLogoClick}
          className={
            learnMoreOnSecondPage
              ? "landing-logo-nav landing-logo-nav--second-screen"
              : "landing-logo-nav"
          }
        >
          <img
            className="landing-logo-nav__img"
            src="/logo.png"
            alt="D.I.Y.A"
          />
          <span className="landing-logo-nav__hint">
            {learnMoreOnSecondPage ? "home" : "learn more"}
          </span>
        </Link>




 {/* 
 NAV REGION FOR LOGIN / SIGNUP
 Creating a navigation region in the top right.
 Fixes nav region to viewport while scrolling
 */}
        <nav
          style={{
            position: "fixed",
            top: "3vh",
            right: "5vh",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
           
          <Link
          // Link: from react-router-dom, does not reload page, internal navigation link
          ///login (Apps): Link to the Login page
          
            to="/login"
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.01em",
              color: "#ffff",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 980,
              backgroundColor: "#270115",
              // horizontal offset (no left/right), vertical offset (shadow moved down), shadow blur
              boxShadow: "0 2px 4px black",
            }}
          >
            Login
          </Link>
          <Link
             // /signup (Apps): Link to the Signup page
            to="/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: palette.darkest,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 980,
              border: "1px solid white",
              backgroundColor: "white",
              // horizontal offset (no left/right), vertical offset (shadow moved down), shadow blur
              boxShadow: "0 2px 4px black",
            }}
          >
            Sign up
          </Link>
        </nav>
      </main>
    </div>
  );
}
