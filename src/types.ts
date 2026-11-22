export enum ScreenId {
  S1a = 'S1a',
  S1b = 'S1b',
  S2a = 'S2a',
  S2b = 'S2b',
  S3a = 'S3a',
  S3b = 'S3b',
  S4 = 'S4',
  S5 = 'S5',
  S6a = 'S6a',
  S6b = 'S6b',
  S7 = 'S7',
  S8a = 'S8a',
  S8b = 'S8b',
  S9 = 'S9',
  S10a = 'S10a',
  S10b = 'S10b',
  S11 = 'S11',
  S12 = 'S12',
  S13 = 'S13',
  S14 = 'S14',
  S15a = 'S15a',
  S15b = 'S15b',
  S16 = 'S16',
  S17 = 'S17',
  S18 = 'S18',
}

export type Language = 'bn' | 'en';
export type PlanTier = 'free' | 'subscribed';
export type RelationType = 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
export type ReminderMethod = 'alarm' | 'call' | 'silent';
export type RepeatPattern =
  | 'Every day'
  | 'Every 8 hours'
  | 'Every 12 hours'
  | 'Every other day'
  | 'Weekdays'
  | 'Weekly'
  | 'Only if needed';
export type FoodRelation = 'Before food' | 'After food' | 'With food' | 'Anytime';
export type DoseOutcome = 'taken' | 'late' | 'missed' | 'paused' | 'snoozed';
export type DoseSource = 'alarm' | 'call' | 'manual';
export type FieldSource = 'AI' | 'Edited' | 'Empty';

export interface Account {
  id: string;
  fullName: string;
  mobile: string;
  nid: string;
  age: string;
  gender: string;
  bloodGroup: string;
  plan: PlanTier;
  erPin: string;
  appLockEnabled: boolean;
  largeFontMode: boolean;
  payingForPersonIds: string[];
}

export interface PauseWindow {
  fromDate: string;
  untilDate: string;
  reason: 'Hospital' | 'Travel' | 'Doctor';
  active: boolean;
}

export interface TemporarySchedule {
  active: boolean;
  shiftMinutes: number;
  untilDate: string;
}

export interface OneTimeReminder {
  id: string;
  title: string;
  dateTimeLabel: string;
  completed: boolean;
}

export interface ReminderSettings {
  voiceLanguage: Language;
  alarmSound: string;
  alarmVolume: number;
  ringtone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  caregivers: string[];
  patientAgreedToCalls: boolean;
}

export interface PersonProfile {
  id: string;
  name: string;
  relation: RelationType;
  customRelation?: string;
  age: number;
  idNumber: string;
  idType: 'NID' | 'Birth registration';
  bloodGroup: string;
  allergies: string;
  reminderSettings: ReminderSettings;
  pauseWindow?: PauseWindow;
  tempSchedule?: TemporarySchedule;
  oneTimeReminders: OneTimeReminder[];
  skippedSlot?: string;
}

export interface PrescriptionFieldMeta {
  doctorName: FieldSource;
  hospitalName: FieldSource;
  hospitalPhone: FieldSource;
  date: FieldSource;
  diagnosis: FieldSource;
  medicines: FieldSource;
  suggestedTests: FieldSource;
}

export interface PrescriptionEditRecord {
  id: string;
  timestamp: string;
  field: string;
  previousValue: string;
  newValue: string;
}

export interface Prescription {
  id: string;
  personId: string;
  isManualPlaceholder?: boolean;
  doctorName: string;
  doctorSpecialty: string;
  doctorRegNo?: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  date: string;
  followUpDate: string;
  vitals?: string;
  diagnosis: string;
  advice: string;
  medicinesSummary: string;
  suggestedTestsSummary: string;
  scanImageUrl?: string;
  extraFields: Array<{ label: string; value: string }>;
  fieldSources: PrescriptionFieldMeta;
  editHistory: PrescriptionEditRecord[];
}

export interface Medicine {
  id: string;
  personId: string;
  prescriptionId: string;
  name: string;
  strength?: string;
  times: string[];
  repeat: RepeatPattern;
  durationDays: number | null; // null = ongoing
  endDateLabel?: string;
  foodRelation: FoodRelation;
  reminderMethod: ReminderMethod;
  isCritical: boolean;
  snoozedSlots?: Record<string, string>; // slot -> new time label
}

export interface SuggestedTest {
  id: string;
  personId: string;
  prescriptionId: string;
  name: string;
  dueDate: string;
  completed: boolean;
}

export interface DoseLogEntry {
  id: string;
  personId: string;
  dayLabel: string;
  dateISO: string;
  timeLabel: string;
  medicineNames: string;
  outcome: DoseOutcome;
  lateMinutes?: number;
  source: DoseSource;
  note?: string;
  entryType: 'dose' | 'call' | 'health_check' | 'prescription' | 'problem' | 'test';
}

export interface CaregiverAlert {
  id: string;
  personId: string;
  personName: string;
  title: string;
  subtitle: string;
  timestamp: string;
  urgent?: boolean;
  resolved: boolean;
}

export interface HealthCheckCallPlan {
  id: string;
  personId: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Every N days';
  everyNDays?: number;
  startDate: string;
  time: string;
  payer: 'Me' | 'The patient' | 'Other person';
}

export interface SupportMessage {
  id: string;
  role: 'support' | 'user';
  text: string;
  timestamp: string;
}

export interface ScanDraft {
  imageDataUrl?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorRegNo: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  date: string;
  followUpDate: string;
  vitals: string;
  diagnosis: string;
  advice: string;
  medicines: Array<{
    name: string;
    strength: string;
    times: string[];
    repeat: RepeatPattern;
    durationDays: number | null;
    foodRelation: FoodRelation;
    isCritical: boolean;
  }>;
  suggestedTests: Array<{ name: string; dueDate: string }>;
  extraFields: Array<{ label: string; value: string }>;
  sources: PrescriptionFieldMeta;
}

export interface AppState {
  isAuthenticated: boolean;
  language: Language;
  account: Account;
  persons: PersonProfile[];
  activePersonId: string;
  prescriptions: Prescription[];
  medicines: Medicine[];
  tests: SuggestedTest[];
  doseLogs: DoseLogEntry[];
  alerts: CaregiverAlert[];
  healthCheckPlans: HealthCheckCallPlan[];
  supportMessages: SupportMessage[];
  supportPermissionAsked: boolean;
  supportPermissionGranted: boolean | null;
  consecutiveMissedCalls: number;
  checklistDone: {
    family: boolean;
    medicine: boolean;
    alarms: boolean;
    erPin: boolean;
  };
}
