import { AppState, Language, PersonProfile } from '../types';

export const DEMO_STATE_STORAGE_KEY = 'sebacare_state_v1';

export function createDemoState(language: Language = 'bn'): AppState {
  const selfId = 'person-rahim';
  const motherId = 'person-mother';
  const fatherId = 'person-father';

  return {
    isAuthenticated: false,
    language,
    account: {
      id: 'acc-rahim',
      fullName: 'রহিম স্যার',
      mobile: '01711223344',
      nid: '1984269012345',
      age: '42',
      gender: 'Male',
      bloodGroup: 'O+',
      plan: 'subscribed',
      erPin: '1234',
      appLockEnabled: false,
      largeFontMode: false,
      payingForPersonIds: [motherId, selfId, fatherId],
    },
    persons: [
      {
        id: motherId,
        name: 'Mother',
        relation: 'Mother',
        age: 68,
        idNumber: '1958269087654',
        idType: 'NID',
        bloodGroup: 'A+',
        allergies: 'penicillin',
        reminderSettings: {
          voiceLanguage: 'bn',
          alarmSound: 'Gentle Chime',
          alarmVolume: 85,
          ringtone: 'Classic Bell',
          quietHoursStart: '10:00 PM',
          quietHoursEnd: '06:00 AM',
          caregivers: ['Rahim', 'Karim'],
          patientAgreedToCalls: true,
        },
        oneTimeReminders: [
          {
            id: 'otr-1',
            title: 'Fasting blood sugar test',
            dateTimeLabel: '23 Nov · 07:30 AM',
            completed: false,
          },
        ],
      },
      {
        id: selfId,
        name: 'Rahim',
        relation: 'Self',
        age: 42,
        idNumber: '1984269012345',
        idType: 'NID',
        bloodGroup: 'O+',
        allergies: 'None known',
        reminderSettings: {
          voiceLanguage: 'bn',
          alarmSound: 'Morning Bell',
          alarmVolume: 80,
          ringtone: 'Warm Tone',
          quietHoursStart: '11:00 PM',
          quietHoursEnd: '06:00 AM',
          caregivers: ['Spouse'],
          patientAgreedToCalls: true,
        },
        oneTimeReminders: [],
      },
      {
        id: fatherId,
        name: 'Father',
        relation: 'Father',
        age: 74,
        idNumber: '1952269044321',
        idType: 'NID',
        bloodGroup: 'B+',
        allergies: 'Sulfa drugs',
        reminderSettings: {
          voiceLanguage: 'bn',
          alarmSound: 'Clear Chime',
          alarmVolume: 90,
          ringtone: 'Classic Bell',
          quietHoursStart: '10:00 PM',
          quietHoursEnd: '06:00 AM',
          caregivers: ['Rahim', 'Karim'],
          patientAgreedToCalls: true,
        },
        oneTimeReminders: [],
      },
    ],
    activePersonId: motherId,
    prescriptions: [
      {
        id: 'rx-1',
        personId: motherId,
        doctorName: 'Dr. Mahmudul Hasan',
        doctorSpecialty: 'Endocrinology & Medicine',
        doctorRegNo: 'BMDC A-41892',
        hospitalName: 'City Hospital',
        hospitalAddress: 'Dhanmondi 27, Dhaka',
        hospitalPhone: '+880 2 5501 2200',
        date: '22 Nov 2026',
        followUpDate: '29 Nov 2026',
        vitals: 'BP 132/84 · Fasting Sugar 9.2 mmol/L',
        diagnosis: 'Diabetes · low sugar diet',
        advice: 'Low sugar diet, 20 min light walk after dinner',
        medicinesSummary: 'Insulin, Omeprazole, Calcium',
        suggestedTestsSummary: 'Blood sugar, in 7 days',
        extraFields: [
          { label: 'Vitals', value: 'BP 132/84 mmHg · Weight 61 kg' },
          { label: 'Diet advice', value: 'Avoid sweets, take 3 small meals' },
        ],
        fieldSources: {
          doctorName: 'AI',
          hospitalName: 'AI',
          hospitalPhone: 'Edited',
          date: 'AI',
          diagnosis: 'AI',
          medicines: 'AI',
          suggestedTests: 'AI',
        },
        editHistory: [
          {
            id: 'edit-1',
            timestamp: '22 Nov 2026 · 01:15 AM',
            field: 'Hospital phone',
            previousValue: 'Not found',
            newValue: '+880 2 5501 2200',
          },
        ],
      },
      {
        id: 'rx-2',
        personId: motherId,
        doctorName: 'Dr. Farhana Sultana',
        doctorSpecialty: 'Cardiology',
        hospitalName: 'Popular Clinic',
        hospitalAddress: 'Mirpur Road, Dhaka',
        hospitalPhone: '+880 1711 009988',
        date: '3 Oct 2026',
        followUpDate: '3 Dec 2026',
        diagnosis: 'Blood pressure',
        advice: 'Reduce salt intake',
        medicinesSummary: 'Amlodipine 5mg',
        suggestedTestsSummary: 'ECG in 2 months',
        extraFields: [],
        fieldSources: {
          doctorName: 'AI',
          hospitalName: 'AI',
          hospitalPhone: 'AI',
          date: 'AI',
          diagnosis: 'AI',
          medicines: 'AI',
          suggestedTests: 'AI',
        },
        editHistory: [],
      },
      {
        id: 'rx-manual-mother',
        personId: motherId,
        isManualPlaceholder: true,
        doctorName: 'No prescription',
        doctorSpecialty: 'Medicines added by hand',
        hospitalName: '',
        hospitalAddress: '',
        hospitalPhone: '',
        date: '',
        followUpDate: '',
        diagnosis: 'Self-tracked supplements',
        advice: '',
        medicinesSummary: 'Vitamin D3',
        suggestedTestsSummary: '',
        extraFields: [],
        fieldSources: {
          doctorName: 'Edited',
          hospitalName: 'Empty',
          hospitalPhone: 'Empty',
          date: 'Empty',
          diagnosis: 'Edited',
          medicines: 'Edited',
          suggestedTests: 'Empty',
        },
        editHistory: [],
      },
      {
        id: 'rx-rahim-1',
        personId: selfId,
        doctorName: 'Dr. Tariq Ahmed',
        doctorSpecialty: 'Internal Medicine',
        hospitalName: 'Square Hospital',
        hospitalAddress: 'Panthapath, Dhaka',
        hospitalPhone: '10616',
        date: '15 Nov 2026',
        followUpDate: '15 Dec 2026',
        diagnosis: 'Mild Gastric Reflux',
        advice: 'Avoid late dinners',
        medicinesSummary: 'Esomeprazole 20mg',
        suggestedTestsSummary: '',
        extraFields: [],
        fieldSources: {
          doctorName: 'AI',
          hospitalName: 'AI',
          hospitalPhone: 'AI',
          date: 'AI',
          diagnosis: 'AI',
          medicines: 'AI',
          suggestedTests: 'Empty',
        },
        editHistory: [],
      },
    ],
    medicines: [
      {
        id: 'med-1',
        personId: motherId,
        prescriptionId: 'rx-1',
        name: 'Insulin',
        strength: '12 units',
        times: ['02:00 AM', '05:30 AM'],
        repeat: 'Every day',
        durationDays: 7,
        endDateLabel: '29 Nov',
        foodRelation: 'Before food',
        reminderMethod: 'alarm',
        isCritical: true,
      },
      {
        id: 'med-2',
        personId: motherId,
        prescriptionId: 'rx-1',
        name: 'Omeprazole',
        strength: '20 mg',
        times: ['02:00 AM'],
        repeat: 'Every day',
        durationDays: 14,
        endDateLabel: '6 Dec',
        foodRelation: 'Before food',
        reminderMethod: 'alarm',
        isCritical: false,
      },
      {
        id: 'med-3',
        personId: motherId,
        prescriptionId: 'rx-1',
        name: 'Calcium',
        strength: '500 mg',
        times: ['02:00 PM'],
        repeat: 'Every day',
        durationDays: 30,
        endDateLabel: '22 Dec',
        foodRelation: 'After food',
        reminderMethod: 'alarm',
        isCritical: false,
      },
      {
        id: 'med-rahim-1',
        personId: selfId,
        prescriptionId: 'rx-rahim-1',
        name: 'Esomeprazole',
        strength: '20 mg',
        times: ['07:30 AM', '08:00 PM'],
        repeat: 'Every day',
        durationDays: 14,
        foodRelation: 'Before food',
        reminderMethod: 'alarm',
        isCritical: false,
      },
      {
        id: 'med-rahim-2',
        personId: selfId,
        prescriptionId: 'rx-rahim-1',
        name: 'Vitamin B Complex',
        strength: '1 tab',
        times: ['01:30 PM'],
        repeat: 'Every day',
        durationDays: null,
        foodRelation: 'After food',
        reminderMethod: 'alarm',
        isCritical: false,
      },
      {
        id: 'med-father-1',
        personId: fatherId,
        prescriptionId: 'rx-2',
        name: 'Metformin',
        strength: '500 mg',
        times: ['08:00 AM', '08:00 PM'],
        repeat: 'Every day',
        durationDays: null,
        foodRelation: 'After food',
        reminderMethod: 'alarm',
        isCritical: true,
      },
    ],
    tests: [
      {
        id: 'test-1',
        personId: motherId,
        prescriptionId: 'rx-1',
        name: 'Blood sugar (Fasting & PP)',
        dueDate: '29 Nov 2026',
        completed: false,
      },
    ],
    doseLogs: [
      {
        id: 'log-old-1',
        personId: motherId,
        dayLabel: '19 Nov',
        dateISO: '2026-11-19',
        timeLabel: '08:00 AM',
        medicineNames: 'Omeprazole',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-old-2',
        personId: motherId,
        dayLabel: '20 Nov',
        dateISO: '2026-11-20',
        timeLabel: '05:30 AM',
        medicineNames: 'Insulin',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-1',
        personId: motherId,
        dayLabel: 'Yest.',
        dateISO: '2026-11-21',
        timeLabel: '—',
        medicineNames: 'Prescription added · Dr. Mahmudul Hasan, City Hospital',
        outcome: 'taken',
        source: 'manual',
        entryType: 'prescription',
      },
      {
        id: 'log-2',
        personId: motherId,
        dayLabel: 'Yest.',
        dateISO: '2026-11-21',
        timeLabel: '08:00',
        medicineNames: 'Omeprazole',
        outcome: 'missed',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-3',
        personId: motherId,
        dayLabel: 'Yest.',
        dateISO: '2026-11-21',
        timeLabel: '09:00',
        medicineNames: 'Health check call: mild headache noted',
        outcome: 'taken',
        source: 'call',
        entryType: 'health_check',
      },
      {
        id: 'log-4',
        personId: motherId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '02:00 AM',
        medicineNames: 'Insulin · call answered',
        outcome: 'taken',
        source: 'call',
        entryType: 'dose',
      },
      {
        id: 'log-5',
        personId: motherId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '05:30 AM',
        medicineNames: 'Insulin',
        outcome: 'late',
        lateMinutes: 40,
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-rahim-1',
        personId: selfId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '07:30 AM',
        medicineNames: 'Esomeprazole',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-rahim-2',
        personId: selfId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '01:30 PM',
        medicineNames: 'Vitamin B Complex',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-father-1',
        personId: fatherId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '08:00 AM',
        medicineNames: 'Metformin',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
      {
        id: 'log-father-2',
        personId: fatherId,
        dayLabel: 'Today',
        dateISO: '2026-11-22',
        timeLabel: '08:00 PM',
        medicineNames: 'Metformin',
        outcome: 'taken',
        source: 'alarm',
        entryType: 'dose',
      },
    ],
    alerts: [
      {
        id: 'alert-1',
        personId: motherId,
        personName: 'Mother',
        title: 'Mother reported dizziness',
        subtitle: '02:10 AM · from voice call',
        timestamp: '2026-11-22T02:10:00',
        urgent: false,
        resolved: false,
      },
      {
        id: 'alert-2',
        personId: fatherId,
        personName: 'Father',
        title: '3 calls missed · Father',
        subtitle: 'Yesterday',
        timestamp: '2026-11-21T20:00:00',
        urgent: false,
        resolved: false,
      },
    ],
    healthCheckPlans: [],
    supportMessages: [
      {
        id: 'sup-1',
        role: 'support',
        text: 'Hello, how can we help?',
        timestamp: '02:05 AM',
      },
      {
        id: 'sup-2',
        role: 'user',
        text: 'Calls stopped for my father.',
        timestamp: '02:06 AM',
      },
      {
        id: 'sup-3',
        role: 'support',
        text: 'Can we view his call settings for this chat?',
        timestamp: '02:06 AM',
      },
    ],
    supportPermissionAsked: true,
    supportPermissionGranted: null,
    consecutiveMissedCalls: 0,
    checklistDone: {
      family: true,
      medicine: true,
      alarms: true,
      erPin: true,
    },
  };
}

export function createFreshAccountState(params: {
  fullName: string;
  mobile: string;
  nid: string;
  age: string;
  gender: string;
  bloodGroup: string;
  language: Language;
}): AppState {
  const selfId = 'person-self-' + Date.now();
  return {
    isAuthenticated: true,
    language: params.language,
    account: {
      id: 'acc-' + Date.now(),
      fullName: params.fullName || 'New User',
      mobile: params.mobile,
      nid: params.nid,
      age: params.age || '35',
      gender: params.gender || 'Male',
      bloodGroup: params.bloodGroup || 'O+',
      plan: 'subscribed',
      erPin: '1234',
      appLockEnabled: false,
      largeFontMode: false,
      payingForPersonIds: [selfId],
    },
    persons: [
      {
        id: selfId,
        name: params.fullName || 'Self',
        relation: 'Self',
        age: Number(params.age) || 35,
        idNumber: params.nid || '—',
        idType: 'NID',
        bloodGroup: params.bloodGroup || 'O+',
        allergies: 'None noted',
        reminderSettings: {
          voiceLanguage: params.language,
          alarmSound: 'Gentle Chime',
          alarmVolume: 85,
          ringtone: 'Classic Bell',
          quietHoursStart: '10:00 PM',
          quietHoursEnd: '06:00 AM',
          caregivers: [],
          patientAgreedToCalls: true,
        },
        oneTimeReminders: [],
      },
    ],
    activePersonId: selfId,
    prescriptions: [],
    medicines: [],
    tests: [],
    doseLogs: [],
    alerts: [],
    healthCheckPlans: [],
    supportMessages: [
      {
        id: 'sup-welcome',
        role: 'support',
        text: 'Hello, how can we help?',
        timestamp: 'Now',
      },
    ],
    supportPermissionAsked: false,
    supportPermissionGranted: null,
    consecutiveMissedCalls: 0,
    checklistDone: {
      family: false,
      medicine: false,
      alarms: false,
      erPin: false,
    },
  };
}

export function getPersonTodayStats(state: AppState, personId: string): { taken: number; total: number; alertsCount: number } {
  const meds = state.medicines.filter((m) => m.personId === personId);
  const allSlots = meds.flatMap((m) => m.times.map((t) => `${m.id}::${t}`));
  const total = allSlots.length || 0;

  const todayLogs = state.doseLogs.filter(
    (l) =>
      l.personId === personId &&
      l.dateISO === '2026-11-22' &&
      l.entryType === 'dose' &&
      (l.outcome === 'taken' || l.outcome === 'late' || l.outcome === 'paused')
  );

  const takenCount = Math.min(total, todayLogs.length);
  const alertsCount = state.alerts.filter((a) => a.personId === personId && !a.resolved).length;

  return { taken: takenCount, total, alertsCount };
}

export interface DueSlotBundle {
  timeLabel: string;
  medicines: Array<{
    id: string;
    name: string;
    strength?: string;
    foodRelation: string;
    doctorName: string;
    reminderMethod: string;
    isCritical: boolean;
  }>;
  isSnoozed: boolean;
}

export function getCurrentDueBundle(state: AppState, personId: string): DueSlotBundle | null {
  const personMeds = state.medicines.filter((m) => m.personId === personId);
  if (personMeds.length === 0) return null;

  const person = state.persons.find((p) => p.id === personId);
  if (person?.pauseWindow?.active) {
    return null;
  }

  const byTime = new Map<string, typeof personMeds>();
  for (const med of personMeds) {
    for (const t of med.times) {
      const effectiveTime = med.snoozedSlots?.[t] || t;
      if (person?.skippedSlot === effectiveTime) continue;
      const list = byTime.get(effectiveTime) || [];
      list.push(med);
      byTime.set(effectiveTime, list);
    }
  }

  if (byTime.size === 0) return null;

  const todayTakenLabels = new Set(
    state.doseLogs
      .filter(
        (l) =>
          l.personId === personId &&
          l.dateISO === '2026-11-22' &&
          l.entryType === 'dose' &&
          (l.outcome === 'taken' || l.outcome === 'late' || l.outcome === 'paused')
      )
      .map((l) => l.timeLabel)
  );

  const slots = Array.from(byTime.entries());
  const pending = slots.find(([slot]) => !todayTakenLabels.has(slot)) || slots[0];
  if (!pending) return null;

  const anyUnlogged = slots.some(([slot]) => !todayTakenLabels.has(slot));
  if (!anyUnlogged) return null;

  const [timeLabel, meds] = pending;
  const isSnoozed = meds.some((m) => Object.values(m.snoozedSlots || {}).includes(timeLabel));

  return {
    timeLabel,
    isSnoozed,
    medicines: meds.map((m) => {
      const rx = state.prescriptions.find((p) => p.id === m.prescriptionId);
      return {
        id: m.id,
        name: m.name,
        strength: m.strength,
        foodRelation: m.foodRelation,
        doctorName: rx?.doctorName || 'No prescription',
        reminderMethod: m.reminderMethod,
        isCritical: m.isCritical,
      };
    }),
  };
}

export function getActivePerson(state: AppState): PersonProfile {
  return state.persons.find((p) => p.id === state.activePersonId) || state.persons[0];
}
