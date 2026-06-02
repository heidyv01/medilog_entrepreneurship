import React, { useState, useRef } from "react";
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Mic, 
  MicOff, 
  UserSquare2, 
  Activity, 
  Stethoscope, 
  Plus, 
  Loader2, 
  FileCheck,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Patient } from "../types";

interface NewPatientTabProps {
  onCreatePatient: (newPatient: Omit<Patient, "id" | "admittedAt">) => void;
}

export default function NewPatientTab({ onCreatePatient }: NewPatientTabProps) {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields State
  // Step 1: Stammdaten
  const [lastName, setLastName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [birthday, setBirthday] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [insurance, setInsurance] = useState<string>("");
  const [prio, setPrio] = useState<"P1" | "P2" | "P3">("P3");
  const [bed, setBed] = useState<string>("");

  // Step 2: Beschwerden
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [onset, setOnset] = useState<string>("");
  const [painLevel, setPainLevel] = useState<number>(0);
  const [symptomDetails, setSymptomDetails] = useState<string>("");

  // Step 3: Vorgeschichte
  const [selectedHistoryChips, setSelectedHistoryChips] = useState<string[]>([]);
  const [medicationList, setMedicationList] = useState<string>("");
  const [allergiesItem, setAllergiesItem] = useState<string>("");
  const [smoking, setSmoking] = useState<string>("");
  const [drinking, setDrinking] = useState<string>("");

  // Step 4: Vitalparameter
  const [vitalBP, setVitalBP] = useState<string>("");
  const [vitalPulse, setVitalPulse] = useState<string>("");
  const [vitalTemp, setVitalTemp] = useState<string>("");
  const [vitalSpO2, setVitalSpO2] = useState<string>("");
  const [vitalRespRate, setVitalRespRate] = useState<string>("");
  const [vitalGCS, setVitalGCS] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  // System status
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanResultDesc, setScanResultDesc] = useState<string>("");
  const [voiceField, setVoiceField] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [refiningField, setRefiningField] = useState<"symptomDetails" | "medicationList" | "adminNotes" | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any | null>(null);

  const handleRefineFieldWithGemini = async (fieldId: "symptomDetails" | "medicationList" | "adminNotes") => {
    const rawText = 
      fieldId === "symptomDetails" ? symptomDetails :
      fieldId === "medicationList" ? medicationList : adminNotes;

    if (!rawText.trim()) {
      setRefineError("Bitte schreiben oder diktieren Sie zuerst einen Text, den Sie verfeinern möchten.");
      setTimeout(() => setRefineError(null), 4000);
      return;
    }

    setRefiningField(fieldId);
    setRefineError(null);

    const contextMap = {
      symptomDetails: "Symptombeschreibung und Verlauf - Notaufnahme",
      medicationList: "Medikamente / Dauermedikation des Patienten",
      adminNotes: "Pflegehinweise und administrative Anmerkungen"
    };

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: rawText, 
          context: contextMap[fieldId]
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Verfeinern auf dem Server");
      }

      const data = await response.json();
      if (data.text) {
        if (fieldId === "symptomDetails") setSymptomDetails(data.text);
        else if (fieldId === "medicationList") setMedicationList(data.text);
        else setAdminNotes(data.text);
      }
    } catch (error: any) {
      console.error(error);
      setRefineError("Fehler beim Veredeln: " + error.message);
      setTimeout(() => setRefineError(null), 5000);
    } finally {
      setRefiningField(null);
    }
  };

  // Computed Checklist tasks representation
  const isNameFilled = lastName.trim() !== "";
  const isSymptomChecked = selectedSymptoms.length > 0;
  const isVitalBPorHrEntered = vitalBP.trim() !== "" || vitalPulse.trim() !== "";
  const isFullyQualifying = isNameFilled && isSymptomChecked && isVitalBPorHrEntered;

  const symptomsListOptions = [
    "Chest Pain", "Dyspnoe", "Schwindel", "Übelkeit", 
    "Bauchschmerz", "Kopfschmerz", "Bewusstlosigkeit", 
    "Trauma", "Fieber", "Sonstiges"
  ];

  const historyChipsOptions = [
    "Diabetes", "Hypertonie", "KHK", "COPD", 
    "Herzinsuffizienz", "Niereninsuffizienz", 
    "Schlaganfall", "Tumor", "Keine"
  ];

  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleHistoryChipToggle = (chip: string) => {
    if (chip === "Keine") {
      setSelectedHistoryChips(["Keine"]);
      return;
    }
    const filtered = selectedHistoryChips.filter(c => c !== "Keine");
    if (filtered.includes(chip)) {
      setSelectedHistoryChips(filtered.filter(c => c !== chip));
    } else {
      setSelectedHistoryChips([...filtered, chip]);
    }
  };

  // Web Speech recognition helpers
  const handleVoiceToggle = (fieldId: "symptomDetails" | "medicationList" | "adminNotes") => {
    if (isRecording && voiceField === fieldId) {
      stopVoice();
      return;
    }
    if (isRecording) {
      stopVoice();
    }
    startVoice(fieldId);
  };

  const startVoice = (fieldId: "symptomDetails" | "medicationList" | "adminNotes") => {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceStatus("Browser unterstützt keine native Spracheingabe.");
      setTimeout(() => setVoiceStatus(""), 3000);
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.lang = "de-DE";
      rec.continuous = true;
      rec.interimResults = true;

      const baseText = 
        fieldId === "symptomDetails" ? symptomDetails :
        fieldId === "medicationList" ? medicationList : adminNotes;

      rec.onstart = () => {
        setIsRecording(true);
        setVoiceField(fieldId);
        setVoiceStatus("Diktiere...");
      };

      rec.onresult = (event: any) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + " ";
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        const combined = `${baseText}${baseText && finalTrans ? "\n" : ""}${finalTrans}${interimTrans}`;
        
        if (fieldId === "symptomDetails") setSymptomDetails(combined.trimStart());
        else if (fieldId === "medicationList") setMedicationList(combined.trimStart());
        else setAdminNotes(combined.trimStart());
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        stopVoice();
      };

      rec.onend = () => {
        setIsRecording(false);
        setVoiceField(null);
        setVoiceStatus("");
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setVoiceField(null);
    setVoiceStatus("");
  };

  // Form camera/disk image scan upload
  const triggerImageScan = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanLoading(true);
    setScanResultDesc("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const resultData = event.target?.result as string;
      if (!resultData) {
        setScanLoading(false);
        return;
      }

      // Extract raw base64 payload from data URL
      const base64Payload = resultData.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: base64Payload, mimeType }),
        });

        if (!response.ok) {
          throw new Error("Fehler bei der Dokumenten-Analyse auf dem Server");
        }

        const data = await response.json();
        
        // Auto pre-fill Form Fields with parsed vision results
        if (data.nachname) setLastName(data.nachname);
        if (data.vorname) setFirstName(data.vorname);
        if (data.geburtsdatum) setBirthday(data.geburtsdatum);
        if (data.geschlecht) {
          const matchedGen = ["Männlich", "Weiblich", "Divers"].find(g => g.toLowerCase() === data.geschlecht.toLowerCase());
          if (matchedGen) setGender(matchedGen);
        }
        if (data.krankenkasse) setInsurance(data.krankenkasse);
        if (data.hauptbeschwerde) {
          // Check matching checkboxes if present in text
          const symptomsText = data.hauptbeschwerde.toLowerCase();
          const matchedSymptoms: string[] = [];
          symptomsListOptions.forEach(opt => {
            if (symptomsText.includes(opt.toLowerCase())) {
              matchedSymptoms.push(opt);
            }
          });
          if (matchedSymptoms.length > 0) {
            setSelectedSymptoms((prev) => Array.from(new Set([...prev, ...matchedSymptoms])));
          } else {
            // Default to Sonstiges if specific checkboxes aren't highlighted
            setSelectedSymptoms((prev) => Array.from(new Set([...prev, "Sonstiges"])));
            setSymptomDetails((prev) => `${data.hauptbeschwerde}\n${prev}`.trim());
          }
        }
        if (data.verlauf) {
          setSymptomDetails((prev) => `${prev ? prev + "\n" : ""}${data.verlauf}`.trim());
        }
        if (data.vorerkrankungen) {
          const histText = data.vorerkrankungen.toLowerCase();
          const matchedChips: string[] = [];
          historyChipsOptions.forEach(chip => {
            if (histText.includes(chip.toLowerCase())) {
              matchedChips.push(chip);
            }
          });
          if (matchedChips.length > 0) {
            setSelectedHistoryChips((prev) => Array.from(new Set([...prev, ...matchedChips])));
          }
        }
        if (data.medikamente) {
          setMedicationList((prev) => `${prev ? prev + "\n" : ""}${data.medikamente}`.trim());
        }
        if (data.allergien) {
          setAllergiesItem(data.allergien);
        }
        if (data.blutdruck) setVitalBP(data.blutdruck);
        if (data.puls) setVitalPulse(data.puls);
        if (data.temperatur) setVitalTemp(data.temperatur);

        if (data.warning) {
          setScanResultDesc(data.warning);
        } else {
          setScanResultDesc("Formular erfolgreich eingescannt und übertragen! Überprüfen Sie bitte die übernommenen Daten.");
        }
      } catch (error: any) {
        console.error(error);
        setScanResultDesc("Konnte das Formular nicht automatisch befüllen: " + error.message);
      } finally {
        setScanLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStepNavigation = (stepNum: number) => {
    setCurrentStep(stepNum);
  };

  // Reset all state variables inside the wizard
  const resetForm = () => {
    setLastName("");
    setFirstName("");
    setBirthday("");
    setGender("");
    setInsurance("");
    setPrio("P3");
    setBed("");
    setSelectedSymptoms([]);
    setOnset("");
    setPainLevel(0);
    setSymptomDetails("");
    setSelectedHistoryChips([]);
    setMedicationList("");
    setAllergiesItem("");
    setSmoking("");
    setDrinking("");
    setVitalBP("");
    setVitalPulse("");
    setVitalTemp("");
    setVitalSpO2("");
    setVitalRespRate("");
    setVitalGCS("");
    setAdminNotes("");
    setScanResultDesc("");
  };

  const handleCreatePatient = () => {
    if (!lastName) {
      setCurrentStep(1);
      return;
    }

    const diagnosesText = selectedSymptoms.join(", ") || "Unklare Beschwerde";
    const historyText = selectedHistoryChips.join(", ") || "Keine bekannt";

    onCreatePatient({
      lastName,
      firstName,
      birthday,
      gender,
      insurance,
      prio,
      bed,
      diagnoses: diagnosesText,
      history: historyText,
      medication: medicationList,
      allergies: allergiesItem,
      notes: `${symptomDetails}\n\nBegleitnotizen: ${adminNotes}`.trim(),
      vitalBP,
      vitalPulse,
      vitalTemp,
      vitalSpO2,
      vitalRespRate,
      vitalGCS
    });

    // Reset Form inputs and go back to step 1
    resetForm();
    setCurrentStep(1);
  };

  return (
    <div id="tab-neu" className="space-y-5">
      {/* Dynamic wizard checklist banner */}
      {!isFullyQualifying && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-900 space-y-2.5">
          <div className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 text-amber-850">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Für ein qualifiziertes Anlegen noch ausstehend:
          </div>
          <div className="space-y-1.5 ml-2.5">
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${isNameFilled ? "line-through opacity-50" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isNameFilled ? "bg-emerald-600" : "bg-amber-600"}`}></span>
              Nachname des Patienten eintragen
            </div>
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${isSymptomChecked ? "line-through opacity-50" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSymptomChecked ? "bg-emerald-600" : "bg-amber-600"}`}></span>
              Mindestens eine Hauptbeschwerde anhaken (Schritt 2)
            </div>
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${isVitalBPorHrEntered ? "line-through opacity-50" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isVitalBPorHrEntered ? "bg-emerald-600" : "bg-amber-600"}`}></span>
              Mindestens eine RR-Messung oder Puls eintragen (Schritt 4)
            </div>
          </div>
        </div>
      )}

      {/* Stepper Progress bar */}
      <div className="flex items-center justify-between px-2 select-none">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <button
              onClick={() => handleStepNavigation(step)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer border transition-all ${
                currentStep === step 
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : currentStep > step 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" 
                    : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              {step}
            </button>
            {step < 4 && (
              <div className={`flex-1 h-0.5 mx-2 bg-slate-200 ${currentStep > step ? "bg-emerald-500" : ""}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Wizard Step Blocks */}
      {/* STEP 1: Stammdaten */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stammdaten des Patienten</div>
          
          {/* Form Scanner Box */}
          <div className="bg-white border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition relative" onClick={triggerImageScan}>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleScanFileChange} 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
            />
            {scanLoading ? (
              <div className="py-4 space-y-2 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-semibold text-indigo-600">Kameraaufnahme wird per Gemini analysiert...</p>
              </div>
            ) : (
              <div className="space-y-1.5 text-slate-800">
                <Camera className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold">Einweisung, Notarztprotokoll o.ä. fotografieren</p>
                <p className="text-[10px] text-slate-500">Die KI liest handschriftliche Formulare sofort aus und füllt alle Felder</p>
              </div>
            )}
          </div>

          {scanResultDesc && (
            <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-900 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{scanResultDesc}</span>
            </div>
          )}

          {/* Standard attributes inputs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3.5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nachname <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={lastName} 
                  required
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nachname"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vorname</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Geburtsdatum</label>
                <input 
                  type="date" 
                  value={birthday} 
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Geschlecht</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="">wählen—</option>
                  <option value="Männlich">Männlich</option>
                  <option value="Weiblich">Weiblich</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Krankenkasse</label>
              <input 
                type="text" 
                value={insurance} 
                onChange={(e) => setInsurance(e.target.value)}
                placeholder="z.B. Techniker Krankenkasse, AOK Hessen"
                className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sicherheits-Prio</label>
                <select 
                  value={prio} 
                  onChange={(e) => setPrio(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg cursor-pointer outline-none focus:border-indigo-500"
                >
                  <option value="P1">P1 - Rote Zone (Sofort)</option>
                  <option value="P2">P2 - Gelbe Zone (Dringend)</option>
                  <option value="P3">P3 - Routine (Grün)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bett / Liegestand</label>
                <input 
                  type="text" 
                  value={bed} 
                  onChange={(e) => setBed(e.target.value)}
                  placeholder="z.B. Bett 3 / Raum 10"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setCurrentStep(2)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition"
          >
            Weiter zu Hauptbeschwerden <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Hauptbeschwerden */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktuelle Beschwerde</div>

          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-xs">
            {/* Checked symptoms checklists */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hauptbeschwerden (Mehrfachauswahl)</label>
              <div className="grid grid-cols-2 gap-2">
                {symptomsListOptions.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym);
                  return (
                    <label 
                      key={sym} 
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition text-xs ${
                        isChecked 
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" 
                          : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleSymptomToggle(sym)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span>{sym}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Beschwerdebeginn</label>
                <select 
                  value={onset} 
                  onChange={(e) => setOnset(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg cursor-pointer outline-none focus:border-indigo-500"
                >
                  <option value="">wählen—</option>
                  <option value="Gerade eben">Gerade eben</option>
                  <option value="< 1 Std.">&lt; 1 Std.</option>
                  <option value="1-6 Std.">1-6 Std.</option>
                  <option value="6-24 Std.">6-24 Std.</option>
                  <option value="Mehrere Tage">Mehrere Tage</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Schmerzstärke (NRS 0–10): <strong className="text-slate-900">{painLevel}</strong></label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={painLevel} 
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Audio transcription detail description */}
            <div className="space-y-1 pt-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Symptomverlauf details</label>
              <textarea 
                value={symptomDetails}
                onChange={(e) => setSymptomDetails(e.target.value)}
                placeholder="Genauerer Verlauf, Lokalisation o.ä..."
                className="w-full min-h-[75px] bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 resize-none text-slate-800"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoiceToggle("symptomDetails")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                      voiceField === "symptomDetails" 
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {voiceField === "symptomDetails" ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-indigo-500" />}
                    {voiceField === "symptomDetails" ? "Diktat stoppen" : "Spracheingabe"}
                  </button>
                  {voiceField === "symptomDetails" && <span className="text-[10.5px] text-rose-600 font-mono animate-pulse">{voiceStatus}</span>}
                </div>

                <button
                  type="button"
                  disabled={refiningField !== null || isRecording}
                  onClick={() => handleRefineFieldWithGemini("symptomDetails")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  {refiningField === "symptomDetails" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  )}
                  KI verbessern
                </button>
              </div>
              {refineError && refiningField === "symptomDetails" && (
                <div className="text-[11px] text-rose-600 pt-1 font-semibold">{refineError}</div>
              )}
            </div>

          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setCurrentStep(1)}
              className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={() => setCurrentStep(3)}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition"
            >
              Weiter zu Vorgeschichte <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Vorgeschichte */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klinische Vorgeschichte & Anamnese</div>

          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-xs">
            {/* History Chips toggle panels */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Vorerkrankungen (Chips wählen)</label>
              <div className="flex flex-wrap gap-1.5">
                {historyChipsOptions.map((chip) => {
                  const isChecked = selectedHistoryChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleHistoryChipToggle(chip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${
                        isChecked 
                          ? "bg-indigo-50 border-indigo-505 text-indigo-700 font-bold"
                          : "bg-slate-50/40 border-slate-200 hover:border-slate-350 text-slate-600"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Med List box */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Medikamente (Dauermedikation)</label>
              <textarea 
                value={medicationList}
                onChange={(e) => setMedicationList(e.target.value)}
                placeholder="Aktuelle Medikamente..."
                className="w-full min-h-[60px] bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 resize-none text-slate-800"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoiceToggle("medicationList")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                      voiceField === "medicationList" 
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {voiceField === "medicationList" ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-indigo-500" />}
                    {voiceField === "medicationList" ? "Diktat stoppen" : "Spracheingabe"}
                  </button>
                  {voiceField === "medicationList" && <span className="text-[10.5px] text-rose-600 font-mono animate-pulse">{voiceStatus}</span>}
                </div>

                <button
                  type="button"
                  disabled={refiningField !== null || isRecording}
                  onClick={() => handleRefineFieldWithGemini("medicationList")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  {refiningField === "medicationList" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  )}
                  KI verbessern
                </button>
              </div>
              {refineError && refiningField === "medicationList" && (
                <div className="text-[11px] text-rose-600 pt-1 font-semibold">{refineError}</div>
              )}
            </div>

            {/* Allergies and lifestyle dropdowns */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Überempfindlichkeiten / Allergien</label>
              <input 
                type="text" 
                value={allergiesItem}
                onChange={(e) => setAllergiesItem(e.target.value)}
                placeholder="z.B. Penicillin, Pollen, Keine"
                className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Noxen: Raucher</label>
                <select 
                  value={smoking} 
                  onChange={(e) => setSmoking(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="">wählen—</option>
                  <option value="Nein">Nein</option>
                  <option value="Ja">Ja</option>
                  <option value="Ex-Raucher">Ex-Raucher</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Noxen: Alkohol</label>
                <select 
                  value={drinking} 
                  onChange={(e) => setDrinking(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50/55 border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="">wählen—</option>
                  <option value="Nein">Nein</option>
                  <option value="Gelegentlich">Gelegentlich</option>
                  <option value="Regelmäßig">Regelmäßig</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setCurrentStep(2)}
              className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={() => setCurrentStep(4)}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition"
            >
              Weiter zu Vitalparametern <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vitalwerte */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gegenwärtige Vitalwerte</div>

          <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-4 shadow-xs">
            {/* Grid of raw vitals */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blutdruck (BP)</label>
                <input 
                  type="text" 
                  value={vitalBP} 
                  onChange={(e) => setVitalBP(e.target.value)}
                  placeholder="120/80"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Puls (HR)</label>
                <input 
                  type="number" 
                  value={vitalPulse} 
                  onChange={(e) => setVitalPulse(e.target.value)}
                  placeholder="72"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Temperatur (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={vitalTemp} 
                  onChange={(e) => setVitalTemp(e.target.value)}
                  placeholder="36.5"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SpO₂ (%)</label>
                <input 
                  type="number" 
                  value={vitalSpO2} 
                  onChange={(e) => setVitalSpO2(e.target.value)}
                  placeholder="98"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Atemfrequenz</label>
                <input 
                  type="number" 
                  value={vitalRespRate} 
                  onChange={(e) => setVitalRespRate(e.target.value)}
                  placeholder="16"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GCS (3–15)</label>
                <input 
                  type="number" 
                  min="3" 
                  max="15"
                  value={vitalGCS} 
                  onChange={(e) => setVitalGCS(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* General admin/clinical notes info */}
            <div className="space-y-1 pt-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Übergeordnete Pflegehinweise</label>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="z.B. Patient ist leicht desorientiert, sturzgefährdet..."
                className="w-full min-h-[60px] bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 resize-none text-slate-800"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoiceToggle("adminNotes")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                      voiceField === "adminNotes" 
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    {voiceField === "adminNotes" ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-indigo-500" />}
                    {voiceField === "adminNotes" ? "Diktat stoppen" : "Spracheingabe"}
                  </button>
                  {voiceField === "adminNotes" && <span className="text-[10.5px] text-rose-600 font-mono animate-pulse">{voiceStatus}</span>}
                </div>

                <button
                  type="button"
                  disabled={refiningField !== null || isRecording}
                  onClick={() => handleRefineFieldWithGemini("adminNotes")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                >
                  {refiningField === "adminNotes" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  )}
                  KI verbessern
                </button>
              </div>
              {refineError && refiningField === "adminNotes" && (
                <div className="text-[11px] text-rose-600 pt-1 font-semibold">{refineError}</div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setCurrentStep(3)}
              className="px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={handleCreatePatient}
              id="lp-submit-new-patient"
              className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" /> Fall in Notaufnahme anlegen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
