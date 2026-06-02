export interface Patient {
  id: string;
  lastName: string;
  firstName: string;
  birthday?: string;
  gender?: string;
  insurance?: string;
  prio: "P1" | "P2" | "P3";
  bed?: string;
  admittedAt: string;
  diagnoses?: string;
  history?: string;
  medication?: string;
  allergies?: string;
  notes?: string;
  vitalBP?: string;
  vitalPulse?: string;
  vitalTemp?: string;
  vitalSpO2?: string;
  vitalRespRate?: string;
  vitalGCS?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  urgent: boolean;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  type: "P1" | "P2" | "P3" | "discharge";
}

export interface ProjectStats {
  activeCount: number;
  p1Count: number;
  avgWaitMinutes: string;
  dischargedCount: number;
  bedOccupancyPercent: number;
}
