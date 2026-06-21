import React from "react";
import { 
  Heart, 
  LayoutGrid, 
  Users, 
  UserPlus, 
  ListTodo, 
  Home, 
  Settings 
} from "lucide-react";

type ActiveTab = "dashboard" | "patienten" | "neu" | "checklist";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  patientCount: number;
  onBackToLanding: () => void;
  onMockInfoClick: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  patientCount, 
  onBackToLanding, 
  onMockInfoClick 
}: SidebarProps) {
  
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    { 
      id: "dashboard", 
      label: "Board", 
      icon: <LayoutGrid className="w-5 h-5" /> 
    },
    { 
      id: "patienten", 
      label: "Fälle", 
      icon: <Users className="w-5 h-5" />, 
      badgeCount: patientCount 
    },
    { 
      id: "neu", 
      label: "Neu", 
      icon: <UserPlus className="w-5 h-5" /> 
    },
    { 
      id: "checklist", 
      label: "Liste", 
      icon: <ListTodo className="w-5 h-5" /> 
    }
  ];

  return (
    <aside className="w-[200px] bg-slate-900 border-r border-slate-800 flex flex-col items-stretch p-[18px] pb-4 gap-1 flex-shrink-0 z-30 select-none">
      {/* Brand logo */}
      <button
        type="button"
        onClick={() => onTabChange("dashboard")}
        className="flex items-center gap-2.5 px-2.5 pb-6 text-left rounded-lg cursor-pointer hover:opacity-90 transition"
      >
        <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
          <Heart className="w-4 h-4 fill-white text-white" />
        </span>
        <span className="text-white font-semibold text-lg tracking-tight">
          Medi<span className="text-indigo-400">Log</span>
        </span>
      </button>

      {/* Main Tab Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-${item.id}`}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full rounded-lg border-0 cursor-pointer flex items-center justify-start gap-3 py-2.5 px-3 transition-colors relative text-slate-300 hover:bg-slate-800 hover:text-white ${
                isActive ? "bg-slate-800 text-white font-medium" : ""
              }`}
            >
              <span className={`flex-shrink-0 ${isActive ? "text-indigo-400" : "opacity-70"}`}>{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span className="absolute top-1/2 right-[11px] -translate-y-1/2 min-w-[20px] h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-sm">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Navations */}
      <div className="border-t border-slate-800 pt-4 space-y-1">
        <button
          onClick={onBackToLanding}
          className="w-full rounded-lg border-0 cursor-pointer flex items-center justify-start gap-3 py-2.5 px-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5 flex-shrink-0 opacity-70" />
          <span className="text-sm font-semibold">Startseite</span>
        </button>

        <button
          onClick={onMockInfoClick}
          className="w-full rounded-lg border-0 cursor-pointer flex items-center justify-start gap-3 py-2.5 px-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0 opacity-70" />
          <span className="text-sm font-semibold">Settings</span>
        </button>
      </div>
    </aside>
  );
}
