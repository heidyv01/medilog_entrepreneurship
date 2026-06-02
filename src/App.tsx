import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import PatientsTab from "./components/PatientsTab";
import NewPatientTab from "./components/NewPatientTab";
import ChecklistsTab from "./components/ChecklistsTab";
import { Patient, ChecklistItem, Activity, ProjectStats } from "./types";
import { ShieldAlert, RefreshCw, X, Heart } from "lucide-react";

// Helper keys for LocalStorage persistence
const LOCAL_PATIENTS_KEY = "medilog_patients_store";
const LOCAL_CHECKLISTS_KEY = "medilog_checklists_store";
const LOCAL_ACTIVITIES_KEY = "medilog_activities_store";
const LOCAL_DISCHARGED_KEY = "medilog_discharged_stat";

export default function App() {
  // Global view router
  const [viewMode, setViewState] = useState<"landing" | "app">("landing");
  const [activeTab, setActiveTab] = useState<"dashboard" | "patienten" | "neu" | "checklist">("dashboard");

  // Selected patient case ID pointer
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Settings Modal state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<{
    total: number;
    demoNavbar: number;
    pilotHero: number;
    liveHero: number;
    dashboardNavbar: number;
    waitlistSubmits: number;
    devicePreviewClicks: number;
  } | null>(null);

  useEffect(() => {
    let timer: any = null;
    
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch("/api/kpi");
        if (response.ok) {
          const data = await response.json();
          setSessionStats(data);
        }
      } catch (e) {
        console.warn("Failed to fetch central stats in App.tsx:", e);
      }
    };

    if (showSettings) {
      fetchGlobalStats();
      timer = setInterval(fetchGlobalStats, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showSettings]);

  // States: Patients Directory
  const [patients, setPatients] = useState<Patient[]>([]);

  // States: Checklists per categories
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});

  // States: Admission ledger/Activities list
  const [activities, setActivities] = useState<Activity[]>([]);

  // States: Stats counters
  const [dischargedStat, setDischargedStat] = useState<number>(2);

  // Bootstrapping Initial Default Datasets
  useEffect(() => {
    // 1. Loading active patients
    const storedPatients = localStorage.getItem(LOCAL_PATIENTS_KEY);
    if (storedPatients) {
      try {
        setPatients(JSON.parse(storedPatients));
      } catch (e) {
        // Fallback
      }
    } else {
      const defaults: Patient[] = [
        {
          id: "mueller",
          lastName: "Müller",
          firstName: "Max",
          birthday: "1968-04-12",
          gender: "Männlich",
          insurance: "AOK Plus",
          prio: "P1",
          bed: "Bett 3",
          admittedAt: "08:14",
          diagnoses: "Chest Pain (V.a. Akutes Koronarsyndrom)",
          history: "KHK, Hypertonie, Diabetes Typ 2",
          medication: "ASS 100mg, Metoprolol 50mg, Metformin 1000mg",
          allergies: "Keine bekannt",
          notes: "Patient klagt über starke Brustschmerzen seit 30 Min., Ausstrahlung in linken Arm. Kaltschweißig, leicht dyspnoeisch. EKG wurde angeordnet, Troponin ausstehend.",
          vitalBP: "148/92 mmHg",
          vitalPulse: "98 bpm",
          vitalTemp: "37.1",
          vitalSpO2: "94",
          vitalRespRate: "18",
          vitalGCS: "15"
        },
        {
          id: "schmidt",
          lastName: "Schmidt",
          firstName: "Anna",
          birthday: "1992-09-02",
          gender: "Weiblich",
          insurance: "Techniker Krankenkasse (TK)",
          prio: "P2",
          bed: "Bett 7",
          admittedAt: "09:02",
          diagnoses: "Abdominalschmerz (V.a. Appendizitis)",
          history: "Keine",
          medication: "Keine",
          allergies: "Penicillin",
          notes: "Rechtsseitiger Unterbauchschmerz seit 6 Stunden, NRS 7/10. Übelkeit, kein Erbrechen. Loslassschmerz positiv. Sono und Labor angeordnet.",
          vitalBP: "118/76 mmHg",
          vitalPulse: "82 bpm",
          vitalTemp: "37.8",
          vitalSpO2: "99",
          vitalRespRate: "14",
          vitalGCS: "15"
        },
        {
          id: "weber",
          lastName: "Weber",
          firstName: "Klaus",
          birthday: "1954-02-18",
          gender: "Männlich",
          insurance: "Barmer",
          prio: "P3",
          bed: "Bett 12",
          admittedAt: "09:45",
          diagnoses: "Schwindel (Benigner paroxysmaler Lagerungsschwindel)",
          history: "Hypertonie, Hypothyreose",
          medication: "Ramipril 5mg, L-Thyroxin 75mcg",
          allergies: "Keine",
          notes: "Schwindel beim Aufstehen und bei Kopfbewegungen seit heute Morgen. Dix-Hallpike positiv rechts. Epley-Manöver durchgeführt, Beschwerden rückläufig.",
          vitalBP: "132/84 mmHg",
          vitalPulse: "68 bpm",
          vitalTemp: "36.9",
          vitalSpO2: "97",
          vitalRespRate: "16",
          vitalGCS: "15"
        }
      ];
      setPatients(defaults);
      localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(defaults));
    }

    // 2. Loading Checklists ToDos
    const storedChecklists = localStorage.getItem(LOCAL_CHECKLISTS_KEY);
    if (storedChecklists) {
      try {
        setChecklists(JSON.parse(storedChecklists));
      } catch (e) {
        // Fallback
      }
    } else {
      const defaultToDos: Record<string, ChecklistItem[]> = {
        aufnahme: [
          { id: "a1", text: "Patientendaten erfassen", done: true, urgent: false },
          { id: "a2", text: "Vitalwerte messen", done: true, urgent: false },
          { id: "a3", text: "Dringlichkeitsstufe (MTS) festlegen", done: true, urgent: false },
          { id: "a4", text: "Bett / Liegeplatz zuweisen", done: true, urgent: false },
          { id: "a5", text: "Angehörige informieren", done: false, urgent: false }
        ],
        diagnostik: [
          { id: "d1", text: "EKG ableiten (Müller Max)", done: false, urgent: true },
          { id: "d2", text: "Troponin abnehmen (Müller Max)", done: false, urgent: true },
          { id: "d3", text: "Notfall-Labor anordnen (Schmidt Anna)", done: true, urgent: false },
          { id: "d4", text: "Sono Abdomen (Schmidt Anna)", done: false, urgent: true },
          { id: "d5", text: "Röntgen Thorax organisieren", done: false, urgent: false }
        ],
        behandlung: [
          { id: "b1", text: "Venösen Zugang legen (Müller Max)", done: true, urgent: false },
          { id: "b2", text: "Sauerstoffbrille 4L anlegen (Müller Max)", done: true, urgent: false },
          { id: "b3", text: "Schmerzmedikation verabreichen", done: false, urgent: false },
          { id: "b4", text: "Epley-Manöver durchführen (Weber Klaus)", done: true, urgent: false }
        ],
        entlassung: [
          { id: "e1", text: "Stationären Arztbrief unterzeichnen", done: false, urgent: false },
          { id: "e2", text: "Folgerezepte ausstellen", done: false, urgent: false },
          { id: "e3", text: "Rücktransport bestellen", done: false, urgent: false }
        ]
      };
      setChecklists(defaultToDos);
      localStorage.setItem(LOCAL_CHECKLISTS_KEY, JSON.stringify(defaultToDos));
    }

    // 3. Loading admission logs today
    const storedActivities = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (storedActivities) {
      try {
        setActivities(JSON.parse(storedActivities));
      } catch (e) {
        // Fallback
      }
    } else {
      const defaultActivities: Activity[] = [
        { id: "l1", text: "Müller, Max — P1 aufgenommen", time: "08:14", type: "P1" },
        { id: "l2", text: "Schmidt, Anna — P2 aufgenommen", time: "09:02", type: "P2" },
        { id: "l3", text: "Weber, Klaus — P3 aufgenommen", time: "09:45", type: "P3" },
        { id: "l4", text: "Bauer, Elsa — entlassen", time: "10:30", type: "discharge" },
        { id: "l5", text: "Koch, Peter — entlassen", time: "11:15", type: "discharge" }
      ];
      setActivities(defaultActivities);
      localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(defaultActivities));
    }

    // 4. Discharged count
    const storedDischarged = localStorage.getItem(LOCAL_DISCHARGED_KEY);
    if (storedDischarged) {
      setDischargedStat(parseInt(storedDischarged, 10));
    }
  }, []);

  // Sync back to local storage whenever states update
  const savePatientsToLocalStorage = (newPatients: Patient[]) => {
    setPatients(newPatients);
    localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(newPatients));
  };

  const saveChecklistsToLocalStorage = (newChecklists: Record<string, ChecklistItem[]>) => {
    setChecklists(newChecklists);
    localStorage.setItem(LOCAL_CHECKLISTS_KEY, JSON.stringify(newChecklists));
  };

  const saveActivitiesToLocalStorage = (newActivities: Activity[]) => {
    setActivities(newActivities);
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(newActivities));
  };

  // Callback: User updates patient record in form or vitals
  const updatePatientHandler = (updatedPatient: Patient) => {
    const updatedList = patients.map((p) => {
      if (p.id === updatedPatient.id) {
        return updatedPatient;
      }
      return p;
    });
    savePatientsToLocalStorage(updatedList);

    // Append log activity matching this update
    const now = new Date();
    const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const matchType = updatedPatient.prio;
    const itemLog: Activity = {
      id: `l_${Date.now()}`,
      text: `${updatedPatient.lastName}, ${updatedPatient.firstName} — Doku aktualisiert`,
      time: timeStr,
      type: matchType
    };
    saveActivitiesToLocalStorage([itemLog, ...activities]);
  };

  // Callback: Create new patient case inside the stepper wizard
  const createPatientHandler = (pData: Omit<Patient, "id" | "admittedAt">) => {
    const rawId = `pat_${Date.now()}`;
    const now = new Date();
    const admittedAt = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    const freshPatient: Patient = {
      id: rawId,
      admittedAt,
      ...pData
    };

    const updatedPatients = [...patients, freshPatient];
    savePatientsToLocalStorage(updatedPatients);

    // Append admission log
    const itemLog: Activity = {
      id: `l_${Date.now()}`,
      text: `${freshPatient.lastName}, ${freshPatient.firstName} — Prio ${freshPatient.prio} aufgenommen`,
      time: admittedAt,
      type: freshPatient.prio
    };
    saveActivitiesToLocalStorage([itemLog, ...activities]);
  };

  // Callback: Discharge patient file (Ausbuchen)
  const dischargePatientHandler = (patientId: string) => {
    const pRecord = patients.find(p => p.id === patientId);
    if (!pRecord) return;

    // Filter patient list out
    const updatedPatients = patients.filter(p => p.id !== patientId);
    savePatientsToLocalStorage(updatedPatients);

    // Increment overall discharged metric
    const incrementedDischarged = dischargedStat + 1;
    setDischargedStat(incrementedDischarged);
    localStorage.setItem(LOCAL_DISCHARGED_KEY, incrementedDischarged.toString());

    // Record Log activity
    const now = new Date();
    const dischargedAt = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const itemLog: Activity = {
      id: `l_${Date.now()}`,
      text: `${pRecord.lastName}, ${pRecord.firstName} — entlassen`,
      time: dischargedAt,
      type: "discharge"
    };
    saveActivitiesToLocalStorage([itemLog, ...activities]);

    // Back to cases registry list
    setSelectedPatientId(null);
    setActiveTab("patienten");
  };

  // Callback: Toggle single checklist item completeness
  const toggleCheckItemHandler = (category: string, itemId: string) => {
    const list = checklists[category] || [];
    const updatedItems = list.map((item) => {
      if (item.id === itemId) {
        return { ...item, done: !item.done };
      }
      return item;
    });

    const updatedChecklists = {
      ...checklists,
      [category]: updatedItems
    };
    saveChecklistsToLocalStorage(updatedChecklists);
  };

  // Callback: Add a brand new item into a checklist category
  const addCheckItemHandler = (category: string, text: string) => {
    const freshItem: ChecklistItem = {
      id: `chk_${Date.now()}`,
      text,
      done: false,
      urgent: false
    };

    const updatedChecklists = {
      ...checklists,
      [category]: [...(checklists[category] || []), freshItem]
    };
    saveChecklistsToLocalStorage(updatedChecklists);
  };

  // Callback: Delete a single checklist task
  const deleteCheckItemHandler = (category: string, itemId: string) => {
    const list = checklists[category] || [];
    const updatedItems = list.filter(item => item.id !== itemId);

    const updatedChecklists = {
      ...checklists,
      [category]: updatedItems
    };
    saveChecklistsToLocalStorage(updatedChecklists);
  };

  // Computed helper statistical attributes
  const p1Count = patients.filter((p) => p.prio === "P1").length;
  
  // Calculate average waiting time dynamically or simple placeholder
  const mockStats: ProjectStats = {
    activeCount: patients.length,
    p1Count,
    avgWaitMinutes: patients.length > 0 ? "47 Min" : "0 Min",
    dischargedCount: dischargedStat,
    bedOccupancyPercent: Math.round((patients.length / 12) * 100)
  };

  // Dynamic date representation
  const todayGermanOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const currentDateGerman = new Date().toLocaleDateString('de-DE', todayGermanOptions);

  return (
    <div className="h-full bg-slate-50 font-sans antialiased text-slate-900 selection:bg-indigo-100">
      
      {/* 1. MARKETING / LANDING VIEW CONTROLS */}
      {viewMode === "landing" ? (
        <LandingPage 
          onEnterApp={() => setViewState("app")} 
          mockPatients={patients}
        />
      ) : (
        /* 2. CORE WORKSPACE APPLICATION VIEWS */
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
          
          {/* SIDEBAR NAVIGATION Panel */}
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              // reset open patients draw
              setSelectedPatientId(null);
            }} 
            patientCount={patients.length}
            onBackToLanding={() => setViewState("landing")}
            onMockInfoClick={() => setShowSettings(true)}
          />

          {/* MAIN COLUMN WRAPPER */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* TOP BAR BRAND CRUMBS */}
            <header className="bg-white border-b border-slate-200 px-8 py-4.5 flex items-center justify-between flex-shrink-0 z-20">
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight" id="applet-topbar-title">
                  {activeTab === "dashboard" && "Dashboard / Triagen-Board"}
                  {activeTab === "patienten" && (selectedPatientId ? `Fallakten / Patient ${patients.find(p => p.id === selectedPatientId)?.lastName}` : "Befunde & Fallscheine")}
                  {activeTab === "neu" && "Patienten-Neuaufnahme"}
                  {activeTab === "checklist" && "Klinische Stationschecklisten"}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Notaufnahme · Station A · {currentDateGerman}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full border border-emerald-200/50 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> App Online
                </span>
              </div>
            </header>

            {/* SCROLLABLE MAIN CONTENT CANVAS AREA */}
            <main className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
              <div className="max-w-[960px] mx-auto w-full pb-10">
                
                {/* Board View Tab */}
                {activeTab === "dashboard" && (
                  <DashboardTab 
                    patients={patients}
                    activities={activities}
                    stats={mockStats}
                    onNavigateToPatient={(id) => {
                      setSelectedPatientId(id);
                      setActiveTab("patienten");
                    }}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setSelectedPatientId(null);
                    }}
                  />
                )}

                {/* Patient Directory Tab */}
                {activeTab === "patienten" && (
                  <PatientsTab 
                    patients={patients}
                    selectedPatientId={selectedPatientId}
                    onSelectPatient={setSelectedPatientId}
                    onUpdatePatient={updatePatientHandler}
                    onDischargePatient={dischargePatientHandler}
                  />
                )}

                {/* Admission Wizard Tab */}
                {activeTab === "neu" && (
                  <NewPatientTab 
                    onCreatePatient={(freshData) => {
                      createPatientHandler(freshData);
                      // Navigate directly to patient screen listing to verify results
                      setActiveTab("patienten");
                      setSelectedPatientId(null);
                    }}
                  />
                )}

                {/* Checklists Category Tab */}
                {activeTab === "checklist" && (
                  <ChecklistsTab 
                    checklists={checklists}
                    onToggleCheckItem={toggleCheckItemHandler}
                    onAddingCheckItem={addCheckItemHandler}
                    onDeleteCheckItem={deleteCheckItemHandler}
                  />
                )}

              </div>
            </main>

          </div>
        </div>
      )}

      {/* Settings / Credentials Diagnostic Dialog (Modal Popup) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-[500px] p-6 shadow-2xl border border-slate-200 text-left relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 border-0 cursor-pointer text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-200">
              <Heart className="w-5 h-5 text-indigo-600 fill-indigo-50" />
              <h3 className="text-base font-bold text-slate-900">MediLog Credentials & Live Analytics</h3>
            </div>

            <div className="py-4 space-y-4">
              {/* LIVE CONVERSION KPI PATH PANEL */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Globale KPI-Auswertung (Zentraler Server)
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mb-3">
                  Hier siehst du absolut live, wie viele verschiedene Menschen auf deiner Landingpage geklickt haben – synchronisiert über alle Geräte und Browser hinweg!
                </p>

                {sessionStats ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">1. "Demo anfragen" (Navbar)</span>
                        <span className="font-extrabold text-slate-800 text-sm">{sessionStats.demoNavbar}</span>
                      </div>
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">2. "Pilot anfragen" (Hero)</span>
                        <span className="font-extrabold text-[#185FA5] text-sm">{sessionStats.pilotHero}</span>
                      </div>
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">3. "Live ausprobieren" (Hero)</span>
                        <span className="font-extrabold text-slate-800 text-sm">{sessionStats.liveHero}</span>
                      </div>
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">4. "Zum Dashboard" (Navbar)</span>
                        <span className="font-extrabold text-slate-800 text-sm">{sessionStats.dashboardNavbar}</span>
                      </div>
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">5. E-Mail eingetragen (Warteliste)</span>
                        <span className="font-extrabold text-emerald-700 text-sm">{sessionStats.waitlistSubmits}</span>
                      </div>
                      <div className="bg-slate-100/50 p-2.5 rounded-md border border-slate-100">
                        <span className="text-slate-500 block text-[10px]">6. Tablet/Simulator Klicks</span>
                        <span className="font-extrabold text-amber-700 text-sm">{sessionStats.devicePreviewClicks}</span>
                      </div>
                      <div className="col-span-2 bg-[#E6F1FB] p-2.5 rounded-md border border-[#185FA5]/10 flex justify-between items-center">
                        <span className="font-bold text-[#185FA5] text-xs">Gesamt-Interaktionen (Geräteübergreifend)</span>
                        <span className="font-extrabold text-[#185FA5] text-base">{sessionStats.total}</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm("Möchten Sie alle aufgezeichneten Interaktions-KPIs auf dem Server auf Null zurücksetzen?")) {
                          try {
                            const response = await fetch("/api/kpi/reset", { method: "POST" });
                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.stats) {
                                setSessionStats(data.stats);
                              }
                            }
                          } catch (e) {
                            console.warn("Failed to reset stats:", e);
                          }
                        }
                      }}
                      className="w-full text-center border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-[11px] font-bold transition duration-200 cursor-pointer"
                    >
                      Alle Klicks & KPIs zurücksetzen (Reset)
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-100/30 rounded-lg">
                    Keine Klicks aufgezeichnet. Geh auf die Landingpage und klicke auf die Buttons, um sie hier zu sehen!
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 p-3.5 rounded-xl border border-indigo-100/50 space-y-1.5 text-xs text-indigo-950">
                <div className="font-extrabold text-indigo-900">Echtes AI-Diktat & Scanner aktivieren:</div>
                <div className="leading-relaxed font-semibold">
                  Wir haben MediLog mit einem vollfunktionsfähigen Gemini AI Server-Proxy ausgestattet. Gehen Sie in das linke Standardmenü unter <strong>Settings &gt; Secrets</strong> und fügen Sie dort einen freien <code>GEMINI_API_KEY</code> ein. 
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold mb-1 text-[10px] uppercase">User Email</span>
                  <span className="bg-slate-100 px-2 py-1.5 rounded-md block text-slate-800 break-all font-semibold">yvonne.heid1@gmail.com</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-1 text-[10px] uppercase">Preview URL Path</span>
                  <span className="bg-slate-100 px-2 py-1.5 rounded-md block text-slate-800 break-all font-semibold select-all">https://ais-pre-rg5hurt2jogqphqzojjfjy-409420537569.europe-west2.run.app</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-1 text-[10px] uppercase">Technologie-Stack</span>
                  <span className="bg-slate-100 px-2 py-1.5 rounded-md block text-slate-800 font-semibold text-[11px]">React 19, Vite, Express, TypeScript, Gemini 3.5 Flash</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition duration-200 border-0 cursor-pointer"
            >
              Dialog schließen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
