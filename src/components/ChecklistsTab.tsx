import React, { useState } from "react";
import { Plus, Check, Trash2, CalendarRange } from "lucide-react";
import { ChecklistItem } from "../types";

interface ChecklistsTabProps {
  checklists: Record<string, ChecklistItem[]>;
  onToggleCheckItem: (category: string, itemId: string) => void;
  onAddingCheckItem: (category: string, text: string) => void;
  onDeleteCheckItem: (category: string, itemId: string) => void;
}

export default function ChecklistsTab({
  checklists,
  onToggleCheckItem,
  onAddingCheckItem,
  onDeleteCheckItem
}: ChecklistsTabProps) {

  // Inputs state for adding tasks individually per category
  const [inputs, setInputs] = useState<Record<string, string>>({
    aufnahme: "",
    diagnostik: "",
    behandlung: "",
    entlassung: ""
  });

  const handleInputChange = (category: string, val: string) => {
    setInputs(prev => ({ ...prev, [category]: val }));
  };

  const handleAddItemSubmit = (category: string) => {
    const text = inputs[category]?.trim();
    if (!text) return;

    onAddingCheckItem(category, text);
    // clear input
    setInputs(prev => ({ ...prev, [category]: "" }));
  };

  const categories: { id: string; title: string }[] = [
    { id: "aufnahme", title: "Aufnahme" },
    { id: "diagnostik", title: "Diagnostik" },
    { id: "behandlung", title: "Behandlung" },
    { id: "entlassung", title: "Entlassung" }
  ];

  return (
    <div id="tab-checklist" className="space-y-6">
      <div className="text-[10px] font-bold text-[#A0A09A] uppercase tracking-widest flex items-center gap-1.5 mb-1 select-none">
        <CalendarRange className="w-4 h-4 text-[#6B6B65]" /> Stationsinterne Checklisten & ToDos
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {categories.map((cat) => {
          const items = checklists[cat.id] || [];
          const completedCount = items.filter(i => i.done).length;
          const totalCount = items.length;

          return (
            <div key={cat.id} className="bg-white border border-[#1A1A18]/8 rounded-xl p-4.5 space-y-3.5 shadow-xs">
              {/* Category Board Header with Progress */}
              <div className="flex items-center justify-between border-b border-[#1A1A18]/5 pb-2.5">
                <span className="font-bold text-neutral-900 text-sm tracking-tight">{cat.title}</span>
                <span className="text-[11px] font-bold text-[#A0A09A] font-mono whitespace-nowrap bg-[#EEECE8]/60 px-2 py-0.5 rounded-sm">
                  {completedCount}/{totalCount} erledigt
                </span>
              </div>

              {/* Checklist Tasks vertical stack */}
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="text-xs text-[#6B6B65] py-4 text-center">Keine Aufgaben in dieser Kategorie.</p>
                ) : (
                  items.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => onToggleCheckItem(cat.id, item.id)}
                      className={`flex items-center justify-between gap-3 p-2.5 bg-[#EEECE8]/15 hover:bg-[#EEECE8]/30 border border-black/5 rounded-lg cursor-pointer transition select-none group ${
                        item.done ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0 ${
                          item.done 
                            ? "bg-[#0F6E56] border-[#0F6E56] text-white" 
                            : "bg-white border-[#1A1A18]/25"
                        }`}>
                          {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        
                        <span className={`text-[12.5px] font-medium truncate text-neutral-800 ${
                          item.done ? "line-through text-neutral-400" : ""
                        }`}>
                          {item.text}
                        </span>
                      </div>

                      {/* Pill priorities tags / Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!item.done ? (
                          item.urgent ? (
                            <span className="text-[9px] font-extrabold bg-[#FCEBEB] text-[#A32D2D] px-1.5 py-0.5 rounded-full select-none uppercase">Dringend</span>
                          ) : (
                            <span className="text-[9px] font-semibold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full select-none uppercase">Offen</span>
                          )
                        ) : null}

                        {/* Delete single item trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCheckItem(cat.id, item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#FCEBEB] text-neutral-400 hover:text-[#A32D2D] rounded-md border-0 cursor-pointer transition"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist input form wrapper */}
              <div className="flex gap-1.5 pt-1.5">
                <input
                  type="text"
                  value={inputs[cat.id] || ""}
                  onChange={(e) => handleInputChange(cat.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItemSubmit(cat.id);
                  }}
                  placeholder="Aufgabe hinzufügen..."
                  className="flex-1 px-3 py-1.5 text-xs bg-[#EEECE8]/50 border border-black/10 rounded-lg outline-none focus:border-[#185FA5]"
                />
                <button
                  onClick={() => handleAddItemSubmit(cat.id)}
                  className="p-1.5 px-3 rounded-lg border-0 bg-[#185FA5] hover:bg-[#0C447C] text-white flex items-center justify-center cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
