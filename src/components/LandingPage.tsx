import React, { useState, useEffect } from "react";
import { 
  Heart, 
  ArrowRight, 
  Clock, 
  Check, 
  Sparkles, 
  Mic, 
  FileText, 
  Layers, 
  Users, 
  MousePointerClick,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { Patient } from "../types";

interface LandingPageProps {
  onEnterApp: () => void;
  mockPatients: Patient[];
}

export default function LandingPage({ onEnterApp, mockPatients }: LandingPageProps) {
  const [clicks, setClicks] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [emailValue, setEmailValue] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const [stats, setStats] = useState({
    total: 0,
    demoNavbar: 0,
    pilotHero: 0,
    liveHero: 0,
    dashboardNavbar: 0,
    waitlistSubmits: 0,
    devicePreviewClicks: 0
  });

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/kpi");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setClicks(data.total);
      }
    } catch (e) {
      console.warn("Failed to fetch server stats:", e);
    }
  };

  useEffect(() => {
    // Initial fetch of central stats
    fetchStats();

    // Auto-update stats every 5 seconds so you can watch other users' clicks in real-time!
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const trackDetailedClick = async (actionType: "demoNavbar" | "pilotHero" | "liveHero" | "dashboardNavbar" | "waitlistSubmits" | "devicePreviewClicks") => {
    // Optimistic UI update
    setStats(prev => {
      const next = {
        ...prev,
        [actionType]: (prev[actionType] || 0) + 1,
        total: (prev.total || 0) + 1
      };
      setClicks(next.total);
      return next;
    });

    // Send click to central server
    try {
      const response = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setStats(data.stats);
          setClicks(data.stats.total);
        }
      }
    } catch (e) {
      console.warn("Failed to register central click:", e);
    }
  };

  const handleEnter = (source: string) => {
    if (source === "navbar") {
      trackDetailedClick("dashboardNavbar");
    } else if (source === "hero_secondary") {
      trackDetailedClick("liveHero");
    } else {
      trackDetailedClick("devicePreviewClicks");
    }
    onEnterApp();
  };

  const handleDemoRequest = (source: string) => {
    if (source === "navbar") {
      trackDetailedClick("demoNavbar");
    } else {
      trackDetailedClick("pilotHero");
    }
    setIsSubmitted(false);
    setEmailValue("");
    setShowToast(true);
  };

  const submitWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    trackDetailedClick("waitlistSubmits");
    setIsSubmitted(true);
  };

  return (
    <div id="landing" className="flex flex-col min-h-screen bg-[#F4F3F0] text-[#1A1A18] selection:bg-[#E6F1FB] overflow-y-auto">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-black/10 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="p-1 px-1.5 bg-[#E6F1FB] text-[#185FA5] rounded-md">
            <Heart className="w-5 h-5 inline-block -mt-0.5 fill-[#185FA5]/10 text-[#185FA5]" />
          </span>
          <span className="font-bold">Medi<span className="text-[#185FA5]">Log</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            id="lp-nav-demo"
            onClick={() => handleDemoRequest("navbar")} 
            className="px-4 py-2 text-sm font-medium rounded-lg border border-black/20 hover:bg-[#EEECE8] transition"
          >
            Demo anfragen
          </button>
          <button 
            id="lp-nav-launch"
            onClick={() => handleEnter("navbar")} 
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#185FA5] text-white hover:bg-[#0C447C] transition flex items-center gap-1.5 shadow-sm"
          >
            Zum Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Body Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center max-w-[1320px] mx-auto px-6 py-12 md:py-20 w-full flex-1">
        {/* Left Column */}
        <div className="flex flex-col items-start text-left max-w-[545px]">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[#185FA5] bg-[#E6F1FB] px-3.5 py-1.5 rounded-full mb-6 border border-[#185FA5]/10">
            <Clock className="w-3.5 h-3.5" /> Schneller dokumentieren
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1E1E1E] leading-[1.1] mb-6">
            Vom Patienten zur fertigen Doku in <span className="text-[#185FA5] italic">unter einer Minute</span>
          </h1>
          
          <p className="text-base md:text-lg text-[#6B6B65] leading-relaxed mb-8">
            MediLog erfasst Anamnese, Vitalwerte und Befunde per Sprache und Formularscan - geräteübergreifend in Echtzeit. Damit das klinische Team weniger tippt und MEHR behandelt.
          </p>

          <div className="flex flex-wrap gap-3.5 w-full mb-5">
            <button 
              id="lp-hero-demo"
              onClick={() => handleDemoRequest("hero_primary")}
              className="px-6 py-3.5 rounded-lg bg-[#185FA5] text-white hover:bg-[#0C447C] transition-all font-semibold text-sm inline-flex items-center gap-2 shadow-md hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 fill-white/10" /> Pilotzugang anfragen
            </button>
            <button 
              id="lp-hero-launch"
              onClick={() => handleEnter("hero_secondary")}
              className="px-6 py-3.5 rounded-lg border border-black/15 bg-white text-[#1E1E1E] hover:bg-[#EEECE8] transition-all font-semibold text-sm inline-flex items-center gap-1.5 shadow-sm"
            >
              Live ausprobieren <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-[#A0A09A] flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-[#0F6E56] stroke-[2.5]" /> Kein Setup nötig - Walkthrough direkt auf Ihrer Station
          </div>
        </div>

        {/* Right Column - Device Simulator */}
        <div className="flex justify-center h-full lg:justify-end">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => handleEnter("device_preview")}
            className="w-[min(92vw,700px)] aspect-[16/9] border-[10px] border-[#1A1A18] rounded-[34px] bg-[#1A1A18] shadow-2xl overflow-hidden cursor-pointer group relative"
          >
            <div className="absolute top-3 left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/20 ring-2 ring-black/20">
              <span className="block h-full w-full rounded-full bg-[#10100F]"></span>
            </div>
            
            <div className="bg-[#F4F3F0] h-full rounded-[24px] flex flex-col overflow-hidden relative select-none">
              <div className="bg-white border-b border-black/5 px-6 pt-7 pb-3 flex justify-between items-center">
                <div>
                  <div className="text-base font-bold">Medi<span className="text-[#185FA5]">Log</span></div>
                  <div className="text-[11px] text-[#A0A09A]">Notaufnahme · Station A</div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#E1F5EE] px-3 py-1 text-[10px] font-bold text-[#0F6E56]">
                  <span className="h-2 w-2 rounded-full bg-[#0F6E56]"></span>
                  Live
                </div>
              </div>

              {/* Patient List Content Inside Simulator */}
              <div className="p-6 flex-1 overflow-hidden">
                <div className="text-[10px] font-bold text-[#A0A09A] uppercase tracking-wider mb-2.5">Aktuelle Fälle</div>
                
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {mockPatients.map((p) => {
                    const initials = `${p.lastName[0] || ""}${p.firstName[0] || ""}`.toUpperCase();
                    const ageStr = p.birthday ? "· 58 J" : ""; // static placeholders for looks only
                    const prioColors = 
                      p.prio === "P1" ? { bg: "bg-red-50", text: "text-red-700", label: "P1" } :
                      p.prio === "P2" ? { bg: "bg-amber-50", text: "text-amber-800", label: "P2" } :
                      { bg: "bg-green-50", text: "text-green-800", label: "P3" };

                    return (
                      <div key={p.id} className="bg-white border border-black/5 rounded-lg p-3 flex items-center gap-2.5 shadow-sm transform group-hover:scale-[1.01] transition-transform">
                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-xs ${prioColors.bg} ${prioColors.text}`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-[#1A1A18] truncate">{p.lastName}, {p.firstName}</span>
                          </div>
                          <div className="text-[11px] text-[#6B6B65] truncate">
                            {p.diagnoses || "V.a. Symptomatik"} {ageStr}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prioColors.bg} ${prioColors.text}`}>
                          {prioColors.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0A09A]">Doku</div>
                    <div className="mt-1 text-base font-extrabold text-[#185FA5]">42s</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0A09A]">Scan</div>
                    <div className="mt-1 text-base font-extrabold text-[#0F6E56]">bereit</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3 shadow-sm border border-black/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0A09A]">Team</div>
                    <div className="mt-1 text-base font-extrabold text-[#1A1A18]">6</div>
                  </div>
                </div>
              </div>

              {/* Glowing Interactive overlay banner */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent flex items-end justify-center pb-6 p-4">
                <button className="px-5 py-2.5 rounded-lg bg-[#185FA5] text-white hover:bg-[#0C447C] font-semibold text-xs transition duration-200 shadow-lg tracking-tight inline-flex items-center gap-1">
                  Live-Vorschau öffnen <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Stats Strip */}
      <section className="bg-white border-y border-black/10 py-8 px-6">
        <div className="max-w-[1140px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-black/10">
          <div className="py-4 md:py-0">
            <div className="text-3xl md:text-4xl font-extrabold text-[#1E1E1E]">~70%</div>
            <div className="text-sm font-medium text-[#6B6B65] mt-1.5">weniger Doku-Tippaufwand</div>
          </div>
          <div className="py-4 md:py-0">
            <div className="text-3xl md:text-4xl font-extrabold text-[#185FA5]">3</div>
            <div className="text-sm font-medium text-[#6B6B65] mt-1.5">Eingabewege: Sprache, Scan, Manuell</div>
          </div>
          <div className="py-4 md:py-0">
            <div className="text-3xl md:text-4xl font-extrabold text-[#0F6E56]">0 Sek</div>
            <div className="text-sm font-medium text-[#6B6B65] mt-1.5">Setup-Zeit pro Gerät im KHS</div>
          </div>
        </div>
      </section>

      {/* Feature Rows */}
      <section className="max-w-[1140px] mx-auto px-6 py-16 md:py-24">
        <div className="text-xs font-bold text-[#A0A09A] uppercase tracking-widest text-center mb-10 md:mb-14">Was MediLog für Sie tut</div>
        <div className="flex flex-col divide-y divide-black/10">
          
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-start gap-5 py-8 first:pt-0 last:pb-0">
            <div className="text-[#A0A09A] font-bold text-sm min-w-[30px] pt-1">01</div>
            <div className="p-3 bg-[#E6F1FB] text-[#185FA5] rounded-xl">
              <Mic className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Spracheingabe mit medizinischem Diktat</h3>
              <p className="text-sm md:text-base text-[#6B6B65] max-w-[620px] leading-relaxed">
                Diktieren Sie Anamnese und Vitalwerte direkt ins System. Die hochentwickelte KI-Aufbereitung strukturiert informelle Sprachaufzeichnungen sofort in präzise medizinische Befundberichte um.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row items-start gap-5 py-8">
            <div className="text-[#A0A09A] font-bold text-sm min-w-[30px] pt-1">02</div>
            <div className="p-3 bg-[#E1F5EE] text-[#0F6E56] rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Formular-Scanner per Kamera-Scan</h3>
              <p className="text-sm md:text-base text-[#6B6B65] max-w-[620px] leading-relaxed">
                Fotografieren Sie Einweisungen oder Notarztprotokolle mit Ihrem Smartphone oder Tablet. Unsere integrierte Gemini-Technik liest alle Felder automatisch aus und befüllt die Akte für Sie vor.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-start gap-5 py-8 last:pb-0">
            <div className="text-[#A0A09A] font-bold text-sm min-w-[30px] pt-1">03</div>
            <div className="p-3 bg-[#FFEEDA] text-[#854F0B] rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Echtzeit-Boards & Abhakbare Checklisten</h3>
              <p className="text-sm md:text-base text-[#6B6B65] max-w-[620px] leading-relaxed">
                Dringende Fälle (P1/P2) mit zeitkritischen Alarmsignalen sofort im Blick haben. Mit intelligenten, kategorisierten Teambords und anpassbaren Todo-Karten bleibt die Station sicher synchronisiert.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Waitlist Modal Dialog (Fake Door) */}
      {showToast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-[420px] w-full text-center shadow-2xl border border-black/10"
          >
            {!isSubmitted ? (
              <form onSubmit={submitWaitlist} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#E6F1FB] text-[#185FA5] flex items-center justify-center mb-4">
                  <span className="p-1"><Sparkles className="w-6 h-6 fill-[#185FA5]/10 text-[#185FA5]" /></span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">Danke für Ihr Interesse!</h3>
                <p className="text-sm text-[#6B6B65] mb-6 leading-relaxed">
                  MediLog befindet sich momentan in einer geschlossenen Pilotphase mit Universitätsklinika. Hinterlassen Sie Ihre Klinik-E-Mail und wir melden uns mit einem Vorort-Walkthrough auf Ihrer Station.
                </p>
                <input 
                  required
                  type="email" 
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="name@klinik.de" 
                  className="w-full px-4 py-3 border border-black/15 bg-[#F4F3F0] rounded-lg text-sm mb-4 outline-none focus:ring-1 focus:ring-[#185FA5] transition"
                />
                <button 
                  type="submit" 
                  id="lp-submit-email"
                  className="w-full py-3 bg-[#185FA5] text-white hover:bg-[#0C447C] transition rounded-lg font-semibold text-sm shadow-sm"
                >
                  Auf die Warteliste
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowToast(false)} 
                  className="w-full text-xs text-[#6B6B65] font-medium hover:underline mt-3.5"
                >
                  Schließen
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#E1F5EE] text-[#0F6E56] flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">Erfolgreich eingetragen!</h3>
                <p className="text-sm text-[#6B6B65] mb-6 leading-relaxed">
                  Vielen Dank. Wir haben Ihre E-Mailadresse <strong>{emailValue}</strong> auf unserer Prioritätsliste vermerkt und melden uns zeitnah für ein persönliches Gespräch.
                </p>
                <button 
                  type="button" 
                  onClick={() => setShowToast(false)}
                  className="w-full py-2.5 bg-[#EEECE8] text-[#1A1A18] hover:bg-neutral-200 transition rounded-lg font-semibold text-sm"
                >
                  Fenster schließen
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
