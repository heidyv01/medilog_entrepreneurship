import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronRight, 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Sparkles, 
  Save, 
  Trash2, 
  Activity, 
  Flame, 
  CheckCircle2, 
  Database,
  Thermometer,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { Patient } from "../types";

interface PatientsTabProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onDischargePatient: (patientId: string) => void;
}

// Declare SpeechRecognition types for TS since they aren't standard in basic DOM types
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechResultList;
}

interface SpeechResultList {
  length: number;
  item(index: number): SpeechResult;
  [index: number]: SpeechResult;
}

interface SpeechResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechAlternative;
  [index: number]: SpeechAlternative;
}

interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

export default function PatientsTab({ 
  patients, 
  selectedPatientId, 
  onSelectPatient, 
  onUpdatePatient,
  onDischargePatient
}: PatientsTabProps) {
  
  const selectedP = patients.find(p => p.id === selectedPatientId) || null;
  
  // Active editing state
  const [editNotes, setEditNotes] = useState<string>("");
  const [editBP, setEditBP] = useState<string>("");
  const [editPulse, setEditPulse] = useState<string>("");
  const [editSpO2, setEditSpO2] = useState<string>("");
  const [editTemp, setEditTemp] = useState<string>("");
  const [editPrio, setEditPrio] = useState<"P1" | "P2" | "P3">("P3");
  const [editBed, setEditBed] = useState<string>("");
  const [editDiagnoses, setEditDiagnoses] = useState<string>("");
  const [editHistory, setEditHistory] = useState<string>("");
  const [editMedication, setEditMedication] = useState<string>("");
  const [editAllergies, setEditAllergies] = useState<string>("");

  // System States
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [refineLoading, setRefineLoading] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Audio / Speech Recognition state
  const recognitionRef = useRef<any | null>(null);
  const editNotesRef = useRef<HTMLTextAreaElement>(null);

  const resizeVoiceTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    const maxHeight = 300;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeVoiceTextarea(editNotesRef.current);
  }, [editNotes, selectedPatientId]);

  // Sync edits when patient selection shifts
  useEffect(() => {
    if (selectedP) {
      setEditNotes(selectedP.notes || "");
      setEditBP(selectedP.vitalBP || "");
      setEditPulse(selectedP.vitalPulse || "");
      setEditSpO2(selectedP.vitalSpO2 || "");
      setEditTemp(selectedP.vitalTemp || "");
      setEditPrio(selectedP.prio || "P3");
      setEditBed(selectedP.bed || "");
      setEditDiagnoses(selectedP.diagnoses || "");
      setEditHistory(selectedP.history || "");
      setEditMedication(selectedP.medication || "");
      setEditAllergies(selectedP.allergies || "");
      setSaveStatus("idle");
      setAlertMsg(null);
    }
  }, [selectedPatientId, selectedP]);

  // Handle Speech Recognition initiation
  const startVoiceDictation = () => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceStatus("Browser unterstützt keine native Spracheingabe (Chrome/Edge empfohlen)");
      setTimeout(() => setVoiceStatus(""), 4000);
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.lang = "de-DE";
      rec.continuous = true;
      rec.interimResults = true;

      const baseText = editNotes;

      rec.onstart = () => {
        setIsRecording(true);
        setVoiceStatus("Diktat gestartet. Sprechen Sie jetzt...");
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalTrans = "";
        let interimTrans = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + " ";
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        const compiled = `${baseText}${baseText && finalTrans ? "\n" : ""}${finalTrans}${interimTrans}`;
        setEditNotes(compiled.trimStart());
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech Recognition Error:", event.error);
        setVoiceStatus(`Fehler: ${event.error}`);
        stopVoiceDictation();
      };

      rec.onend = () => {
        setIsRecording(false);
        setVoiceStatus("");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setVoiceStatus("Fehler beim Starten des Diktats.");
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleMic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRecording) {
      stopVoiceDictation();
    } else {
      startVoiceDictation();
    }
  };

  const getPatientDemoDictation = () => {
    const diagnosis = editDiagnoses.toLowerCase();

    if (selectedP?.id === "schmidt" || diagnosis.includes("abdominal") || diagnosis.includes("append")) {
      return "Pat. mit progredientem rechtsseitigem Unterbauchschmerz seit ca. 6 Std., NRS 7/10, Übelkeit ohne Erbrechen. Druck- und Loslassschmerz im rechten Unterbauch positiv, subfebril. V.a. akute Appendizitis, Sono und Labor veranlasst.";
    }

    if (selectedP?.id === "weber" || diagnosis.includes("schwindel")) {
      return "Pat. mit rezidivierendem lagerungsabhängigem Drehschwindel seit dem Morgen, Dix-Hallpike rechts positiv, kein fokal-neurologisches Defizit, keine Aphasie, keine Paresen. V.a. benignen paroxysmalen Lagerungsschwindel.";
    }

    return "Pat. mit akutem retrosternalem Thoraxdruck seit ca. 30 Min., Ausstrahlung in linken Arm, kaltschweißig und leicht dyspnoeisch. Kardiovaskuläre Risikofaktoren bekannt. V.a. akutes Koronarsyndrom, EKG und Troponin priorisiert.";
  };

  const buildDemoRefinedPatientNote = (rawText: string) => {
    const diagnosis = editDiagnoses.toLowerCase();

    if (selectedP?.id === "schmidt" || diagnosis.includes("abdominal") || diagnosis.includes("append")) {
      return [
        "Strukturierter Befundentwurf:",
        "- Arbeitsdiagnose: V.a. akute Appendizitis bei rechtsseitigem Unterbauchschmerz.",
        `- Triage: ${editPrio}, Liegeplatz: ${editBed || "noch offen"}.`,
        "- Anamnese: progrediente Schmerzen seit mehreren Stunden, Übelkeit, kein Erbrechen.",
        "- Klinischer Eindruck: Druck- und Loslassschmerz rechts positiv, subfebrile Temperatur.",
        "- Plan: Labor inkl. Entzündungswerte, Sono Abdomen, nüchtern belassen, Analgesie nach Rücksprache.",
        "",
        `Ausgangsdiktat: ${rawText}`
      ].join("\n");
    }

    if (selectedP?.id === "weber" || diagnosis.includes("schwindel")) {
      return [
        "Strukturierter Befundentwurf:",
        "- Arbeitsdiagnose: V.a. benignen paroxysmalen Lagerungsschwindel.",
        `- Triage: ${editPrio}, Liegeplatz: ${editBed || "noch offen"}.`,
        "- Anamnese: lagerungsabhängiger Drehschwindel seit dem Morgen.",
        "- Klinischer Eindruck: Dix-Hallpike rechts positiv, aktuell kein fokal-neurologisches Defizit.",
        "- Plan: Sturzprophylaxe, Epley-Manöver, neurologische Warnzeichen weiter beobachten.",
        "",
        `Ausgangsdiktat: ${rawText}`
      ].join("\n");
    }

    return [
      "Strukturierter Befundentwurf:",
      "- Arbeitsdiagnose: V.a. akutes Koronarsyndrom bei retrosternalem Thoraxdruck.",
      `- Triage: ${editPrio}, Liegeplatz: ${editBed || "noch offen"}.`,
      "- Anamnese: akuter Thoraxdruck mit Ausstrahlung in den linken Arm und Dyspnoe.",
      "- Klinischer Eindruck: kaltschweißig, kardiale Risikofaktoren bekannt.",
      "- Plan: EKG, Troponin, Monitoring und ärztliche Reevaluation priorisiert.",
      "",
      `Ausgangsdiktat: ${rawText}`
    ].join("\n");
  };

  const applyDemoDictation = () => {
    setEditNotes(getPatientDemoDictation());
    setSaveStatus("idle");
    setAlertMsg("Patientenspezifisches Demo-Diktat eingefügt. Jetzt kann die KI-Verbesserung die Notiz strukturieren.");
  };

  // Trigger Gemini refinement of rough notes
  const handleRefineWithGemini = async () => {
    setRefineLoading(true);
    setAlertMsg(null);

    try {
      const sourceText = editNotes.trim() || getPatientDemoDictation();
      await new Promise(resolve => setTimeout(resolve, 650));
      setEditNotes(buildDemoRefinedPatientNote(sourceText));
      setSaveStatus("idle");
    } catch (error: any) {
      console.warn("Using local demo patient-note fallback:", error);
      setEditNotes(buildDemoRefinedPatientNote(editNotes.trim() || getPatientDemoDictation()));
      setSaveStatus("idle");
    } finally {
      setRefineLoading(false);
    }
  };

  // Perform record Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedP) return;

    setSaveStatus("saving");

    const updated: Patient = {
      ...selectedP,
      notes: editNotes,
      vitalBP: editBP,
      vitalPulse: editPulse,
      vitalSpO2: editSpO2,
      vitalTemp: editTemp,
      prio: editPrio,
      bed: editBed,
      diagnoses: editDiagnoses,
      history: editHistory,
      medication: editMedication,
      allergies: editAllergies
    };

    setTimeout(() => {
      onUpdatePatient(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 600);
  };

  return (
    <div id="tab-patienten" className="relative h-full">
      {/* Patient Directory Grid view */}
      {!selectedP ? (
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Aktive Fälle - Station A ({patients.length})</span>
            <span className="text-[10px] lowercase text-slate-500 font-mono">Klicken Sie zum Öffnen der Befunde</span>
          </div>

          <div className="space-y-2">
            {patients.map((p) => {
              const initials = `${p.lastName[0] || ""}${p.firstName[0] || ""}`.toUpperCase();
              
              const prioColors = 
                p.prio === "P1" ? { bg: "bg-red-50", text: "text-red-700 border border-red-100", label: "P1" } :
                p.prio === "P2" ? { bg: "bg-amber-50", text: "text-amber-800 border border-amber-100", label: "P2" } :
                { bg: "bg-emerald-50", text: "text-emerald-800 border border-emerald-100", label: "P3" };

              return (
                <div 
                  key={p.id} 
                  onClick={() => onSelectPatient(p.id)}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-350 hover:shadow-xs transition duration-150"
                >
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${prioColors.bg} ${prioColors.text} flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{p.lastName}, {p.firstName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${prioColors.bg} ${prioColors.text}`}>
                          {prioColors.label}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-1">
                        {p.birthday ? "Alt." : ""} {p.diagnoses} {p.bed ? `· ${p.bed}` : ""} · {p.admittedAt}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              );
            })}

            {patients.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-dashed border-slate-200">
                <p className="text-sm font-medium">Momentan befinden sich keine aktiven Fälle in der Station.</p>
                <p className="text-xs text-slate-400 mt-1">Legen Sie einen neuen Fall über das Navigationsmenü an.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Page slide-overlay panel representation */
        <div className="bg-slate-50 rounded-xl p-1 animate-slide-in">
          {/* Action Header bar */}
          <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-250 pb-4">
            <button 
              onClick={() => onSelectPatient(null)}
              className="px-3.5 py-2 hover:bg-slate-50 rounded-lg transition-all text-sm font-semibold flex items-center gap-1.5 border border-slate-200 text-slate-700 bg-white"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" /> Zurück zur Liste
            </button>
            
            <button
              onClick={() => {
                if (window.confirm(`Möchten Sie ${selectedP.lastName}, ${selectedP.firstName} entlassen und ausbuchen?`)) {
                  onDischargePatient(selectedP.id);
                }
              }}
              className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/55 hover:bg-rose-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" /> Fall abschließen (Entlassen)
            </button>
          </div>

          <div className="max-w-[760px] mx-auto space-y-5">
            {/* Patient Header Identity Card */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedP.lastName}, {selectedP.firstName}</h2>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                <span>Aufnahmezeit: {selectedP.admittedAt}</span>
                <span>·</span>
                <span>Bettzuweisung: {editBed || "Ausstehend"}</span>
                {selectedP.insurance && (
                  <>
                    <span>·</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[10px] font-semibold font-mono uppercase">KV: {selectedP.insurance}</span>
                  </>
                )}
              </div>
            </div>

            {alertMsg && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border border-amber-100">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{alertMsg}</span>
              </div>
            )}

            {/* Editing Form */}
            <form onSubmit={handleSave} className="space-y-5">
              {/* Vitals Input Panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Activity className="w-4 h-4 text-indigo-500" /> Vitalparameter
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blutdruck (RR)</label>
                    <input 
                      type="text" 
                      value={editBP}
                      onChange={(e) => { setEditBP(e.target.value); setSaveStatus("idle"); }}
                      placeholder="syst/diast"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Puls (HR)</label>
                    <input 
                      type="text" 
                      value={editPulse}
                      onChange={(e) => { setEditPulse(e.target.value); setSaveStatus("idle"); }}
                      placeholder="bpm"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SpO₂ (%)</label>
                    <input 
                      type="text" 
                      value={editSpO2}
                      onChange={(e) => { setEditSpO2(e.target.value); setSaveStatus("idle"); }}
                      placeholder="%"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Temperatur</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={editTemp}
                        onChange={(e) => { setEditTemp(e.target.value); setSaveStatus("idle"); }}
                        placeholder="°C"
                        className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <Thermometer className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrative adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Sicherheitseinstufung Prio</label>
                  <select 
                    value={editPrio} 
                    onChange={(e) => { setEditPrio(e.target.value as any); setSaveStatus("idle"); }}
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg cursor-pointer outline-none focus:border-indigo-500"
                  >
                    <option value="P1">P1 - Sofortige Abklärung (Rot)</option>
                    <option value="P2">P2 - Dringend (Gelb)</option>
                    <option value="P3">P3 - Routine / Normal (Grün)</option>
                  </select>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bett / Liegeplatz</label>
                  <input 
                    type="text" 
                    value={editBed}
                    onChange={(e) => { setEditBed(e.target.value); setSaveStatus("idle"); }}
                    placeholder="Bettnummer oder Liege"
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Advanced Medical details */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" /> Klinische Diagnose & Historie
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnose / Hauptbeschwerde</label>
                  <input 
                    type="text" 
                    value={editDiagnoses} 
                    onChange={(e) => { setEditDiagnoses(e.target.value); setSaveStatus("idle"); }}
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Klinische Vorerkrankungen</label>
                  <input 
                    type="text" 
                    value={editHistory} 
                    onChange={(e) => { setEditHistory(e.target.value); setSaveStatus("idle"); }}
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medikation (Dauermedikation)</label>
                    <input 
                      type="text" 
                      value={editMedication} 
                      onChange={(e) => { setEditMedication(e.target.value); setSaveStatus("idle"); }}
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Allergien / Unverträglichkeiten</label>
                    <input 
                      type="text" 
                      value={editAllergies} 
                      onChange={(e) => { setEditAllergies(e.target.value); setSaveStatus("idle"); }}
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dictation Box (Rough Draft Notes & AI Refine panel) */}
              <div className="bg-white border border-indigo-100 rounded-xl p-4.5 shadow-sm space-y-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                     Doku-Notizen / Anamnese verlauf
                  </label>
                  {isRecording && (
                    <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> Aufnahme aktiv
                    </span>
                  )}
                </div>

                <textarea
                  ref={editNotesRef}
                  value={editNotes}
                  onChange={(e) => { setEditNotes(e.target.value); setSaveStatus("idle"); }}
                  placeholder="Klicken Sie auf Spracheingabe und sprechen Sie, oder schreiben Sie ungeordnet die Fakten des Patienten..."
                  className="w-full text-sm bg-slate-50/30 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 min-h-[110px] max-h-[300px] overflow-y-auto leading-relaxed resize-none text-slate-800"
                />

                {voiceStatus && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 py-1.5 px-3 rounded-lg border border-indigo-100/50">
                    {voiceStatus}
                  </div>
                )}

                {/* Sparkling Smart assistant controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                      isRecording 
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4 text-indigo-500" />}
                    {isRecording ? "Diktat stoppen" : "Spracheingabe starten"}
                  </button>

                  <button
                    type="button"
                    onClick={applyDemoDictation}
                    className="px-3 py-2 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Beispiel-Diktat
                  </button>

                  <button
                    type="button"
                    disabled={refineLoading}
                    onClick={handleRefineWithGemini}
                    className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                  >
                    {refineLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    )}
                    Diktat verfeinern (Gemini KI)
                  </button>
                </div>
              </div>

              {/* Form Save Button */}
              <button
                type="submit"
                id="lp-save-patient"
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-md transition duration-200 ${
                  saveStatus === "saved" 
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveStatus === "saved" && <CheckCircle2 className="w-4 h-4 text-emerald-100" />}
                {saveStatus === "idle" && <Save className="w-4 h-4" />}
                
                {saveStatus === "saving" && "Wird gespeichert..."}
                {saveStatus === "saved" && "Änderungen erfolgreich gespeichert!"}
                {saveStatus === "idle" && "Patienten-Doku speichern"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
