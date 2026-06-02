import React from "react";
import { 
  AlertTriangle, 
  BedDouble, 
  ArrowRight, 
  Activity as ActivityIcon 
} from "lucide-react";
import { Patient, Activity, ProjectStats } from "../types";

interface DashboardTabProps {
  patients: Patient[];
  activities: Activity[];
  stats: ProjectStats;
  onNavigateToPatient: (patientId: string) => void;
  onTabChange: (tab: "dashboard" | "patienten" | "neu" | "checklist") => void;
}

export default function DashboardTab({ 
  patients, 
  activities, 
  stats, 
  onNavigateToPatient,
  onTabChange
}: DashboardTabProps) {

  // Find the P1 patient for the attention banner (defaults to Max Müller if still active)
  const criticalPatient = patients.find(p => p.prio === "P1");

  return (
    <div id="tab-dashboard" className="space-y-6">
      {/* P1 Critical Ticker Alert Banner */}
      {criticalPatient && (
        <div 
          onClick={() => onNavigateToPatient(criticalPatient.id)}
          className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3.5 text-sm text-red-900 cursor-pointer hover:bg-red-100 transition duration-150 shadow-sm animate-pulse hover:animate-none"
        >
          <span className="p-1 px-1.5 bg-red-100 rounded-lg text-red-600 flex-shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-bold">{criticalPatient.lastName}, {criticalPatient.firstName} ({criticalPatient.prio})</span> wartet auf Befundauswertung (EKG & Troponin). Klicken Sie hier, um die Doku zu bearbeiten.
          </div>
          <ArrowRight className="w-4 h-4 text-red-500 flex-shrink-0" />
        </div>
      )}

      {/* Grid of Metric Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-3xl font-bold tracking-tight text-emerald-600">{patients.length}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Aktive Fälle</div>
        </div>
        
        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-3xl font-bold tracking-tight text-red-600">
            {patients.filter(p => p.prio === "P1").length}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Dringend (P1)</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-3xl font-bold tracking-tight text-indigo-600">{stats.avgWaitMinutes}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Ø Wartezeit</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-3xl font-bold tracking-tight text-slate-600">{stats.dischargedCount}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Heute entlassen</div>
        </div>
      </div>

      {/* Bed Occupancy Tracker card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
          <BedDouble className="w-4 h-4 text-slate-500" /> Bettenbelegung
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="font-semibold text-slate-800">
            {stats.activeCount} von 12 Betten belegt
          </span>
          <span className="text-xs font-bold text-indigo-600">
            {Math.round((stats.activeCount / 12) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (stats.activeCount / 12) * 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Admitted Cases Listing */}
        <div className="space-y-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>Aktive Fälle</span>
            <button 
              onClick={() => onTabChange("patienten")}
              className="text-indigo-600 hover:text-indigo-700 normal-case text-xs font-semibold flex items-center gap-0.5 cursor-pointer pb-0.5"
            >
              Alle Fälle <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {patients.map((p) => {
              const initials = `${p.lastName[0] || ""}${p.firstName[0] || ""}`.toUpperCase();
              
              const prioMap = {
                P1: { bg: "bg-red-50", text: "text-red-700 border border-red-100", label: "P1" },
                P2: { bg: "bg-amber-50", text: "text-amber-800 border border-amber-100", label: "P2" },
                P3: { bg: "bg-emerald-50", text: "text-emerald-800 border border-emerald-100", label: "P3" }
              };
              const selection = prioMap[p.prio] || prioMap.P3;

              return (
                <div 
                  key={p.id}
                  onClick={() => onNavigateToPatient(p.id)}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs cursor-pointer hover:border-slate-300 hover:shadow-sm transition"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${selection.bg} ${selection.text} flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {p.lastName}, {p.firstName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selection.bg} ${selection.text}`}>
                        {selection.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-1">
                      {p.diagnoses || "Keine Diagnose"} {p.bed ? `· ${p.bed}` : ""}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Chronological Activity Ledger */}
        <div className="space-y-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ActivityIcon className="w-4 h-4 text-slate-500" /> Aktivität heute
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-h-[310px] overflow-y-auto divide-y divide-slate-100">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Keine Aktivitäten aufgezeichnet.</p>
            ) : (
              activities.map((act) => {
                const badgeColor = 
                  act.type === "P1" ? "bg-red-500" : 
                  act.type === "P2" ? "bg-amber-500" : 
                  act.type === "P3" ? "bg-emerald-500" : 
                  "bg-slate-450";

                return (
                  <div key={act.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full ${badgeColor} flex-shrink-0`}></div>
                    <div className="flex-1 text-xs text-slate-800 font-medium min-w-0 truncate">
                      {act.text}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {act.time}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
