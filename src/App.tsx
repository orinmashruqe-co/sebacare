/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Language,
  Medicine,
  PauseWindow,
  Prescription,
  ScanDraft,
  ScreenId,
} from './types';
import {
  createDemoState,
  getActivePerson,
} from './data/demoData';
import { AppShell } from './components/AppShell';
import { SignInScreen, RegisterScreen } from './components/AuthScreens';
import { HomeEmptyScreen, HomeActiveScreen } from './components/HomeScreens';
import {
  FamilyListScreen,
  AddFamilyMemberScreen,
  PersonMenuScreen,
} from './components/FamilyScreens';
import {
  AddMedicineScreen,
  PauseScheduleScreen,
  PauseDatesScreen,
} from './components/MedicineAndScheduleScreens';
import { HistoryScreen } from './components/HistoryScreen';
import {
  ScanScreen,
  ScanResultScreen,
  PrescriptionsListScreen,
  PrescriptionDetailScreen,
} from './components/ScanAndPrescriptionScreens';
import {
  ProblemNoteScreen,
  EmergencyOpenScreen,
  EmergencyUnlockedScreen,
} from './components/CareAndEmergencyScreens';
import {
  SettingsScreen,
  SupportChatScreen,
  CaregiverInboxScreen,
  PlansScreen,
} from './components/SettingsSupportAndPlansScreens';
import {
  AiCallScreen,
  AlarmRingingScreen,
  HealthCheckCallsScreen,
} from './components/LiveCallAndAlarmScreens';
import { COPY } from './i18n';

function loadInitialUnauthedState(): AppState {
  const demo = createDemoState('bn');
  return { ...demo, isAuthenticated: false };
}

const ROOT_SCREENS = new Set<ScreenId>([
  ScreenId.S1a,
  ScreenId.S2a,
  ScreenId.S2b,
  ScreenId.S3a,
  ScreenId.S7,
  ScreenId.S11,
]);

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(loadInitialUnauthedState);
  const [screen, setScreen] = useState<ScreenId>(ScreenId.S1a);
  const [historyStack, setHistoryStack] = useState<ScreenId[]>([]);
  const [scanDraft, setScanDraft] = useState<ScanDraft | null>(null);
  const [selectedRxId, setSelectedRxId] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  const skipNextSyncRef = useRef(false);

  // Persist authenticated state changes back to server DB per user ID
  useEffect(() => {
    if (!authToken || !state.isAuthenticated) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ state }),
      }).catch(() => {
        // silent retry on next state mutation
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [authToken, state]);

  useEffect(() => {
    if (state.account.largeFontMode) {
      document.documentElement.classList.add('large-font');
    } else {
      document.documentElement.classList.remove('large-font');
    }
  }, [state.account.largeFontMode]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? '' : curr));
    }, 2800);
  };

  const navigate = (next: ScreenId) => {
    if (next === screen) return;
    if (ROOT_SCREENS.has(next)) {
      setHistoryStack([]);
    } else {
      setHistoryStack((prev) => [...prev, screen]);
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((h) => h.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen(
        state.isAuthenticated
          ? state.medicines.length > 0
            ? ScreenId.S2b
            : ScreenId.S2a
          : ScreenId.S1a
      );
    }
  };

  const toggleLanguage = () => {
    setState((prev) => ({
      ...prev,
      language: prev.language === 'bn' ? 'en' : 'bn',
    }));
  };

  const setLanguage = (language: Language) => {
    setState((prev) => ({ ...prev, language }));
  };

  const t = COPY[state.language];
  const activePerson = getActivePerson(state);

  const handleAuthSuccess = (token: string, nextState: AppState) => {
    skipNextSyncRef.current = true;
    setAuthToken(token);
    setState({ ...nextState, isAuthenticated: true });
    setHistoryStack([]);
    setScreen(nextState.medicines.length > 0 ? ScreenId.S2b : ScreenId.S2a);
  };

  const handleSignOut = () => {
    setAuthToken(null);
    setScanDraft(null);
    setSelectedRxId(null);
    setHistoryStack([]);
    setState({ ...createDemoState(state.language), isAuthenticated: false });
    setScreen(ScreenId.S1a);
    showToast(state.language === 'bn' ? 'সাইন আউট হয়েছে' : 'Signed out');
  };

  const handleTakeDose = (timeLabel: string, medicineNames: string) => {
    setState((prev) => ({
      ...prev,
      doseLogs: [
        ...prev.doseLogs,
        {
          id: 'log-' + Date.now(),
          personId: prev.activePersonId,
          dayLabel: 'Today',
          dateISO: '2026-11-22',
          timeLabel,
          medicineNames,
          outcome: 'taken',
          source: 'manual',
          entryType: 'dose',
        },
      ],
    }));
    showToast(
      state.language === 'bn' ? `${medicineNames} খাওয়া হয়েছে` : `${medicineNames} marked taken`
    );
    setHistoryStack([]);
    setScreen(ScreenId.S2b);
  };

  const handleSnoozeDose = (timeLabel: string) => {
    setState((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) =>
        m.personId === prev.activePersonId && m.times.includes(timeLabel)
          ? {
              ...m,
              snoozedSlots: {
                ...(m.snoozedSlots || {}),
                [timeLabel]: `${timeLabel} (+30m)`,
              },
            }
          : m
      ),
    }));
    showToast(
      state.language === 'bn' ? '৩০ মিনিটের জন্য স্নুজ করা হয়েছে' : 'Snoozed for 30 minutes'
    );
    setHistoryStack([]);
    setScreen(ScreenId.S2b);
  };

  const handleSaveMedicine = (med: Omit<Medicine, 'id'>) => {
    const created: Medicine = { ...med, id: 'med-' + Date.now() };
    setState((prev) => ({
      ...prev,
      medicines: [...prev.medicines, created],
      checklistDone: { ...prev.checklistDone, medicine: true, alarms: true },
    }));
    showToast(state.language === 'bn' ? 'ওষুধ ও অ্যালার্ম সংরক্ষিত হয়েছে' : 'Medicine & alarm saved');
    setHistoryStack([]);
    setScreen(ScreenId.S2b);
  };

  const handleSavePrescriptionFromScan = (draft: ScanDraft) => {
    const rxId = 'rx-' + Date.now();
    const personId = state.activePersonId;

    const newRx: Prescription = {
      id: rxId,
      personId,
      doctorName: draft.doctorName || 'Doctor',
      doctorSpecialty: draft.doctorSpecialty || 'Medicine',
      doctorRegNo: draft.doctorRegNo,
      hospitalName: draft.hospitalName || 'Clinic',
      hospitalAddress: draft.hospitalAddress || '',
      hospitalPhone: draft.hospitalPhone || '',
      date: draft.date || '22 Nov 2026',
      followUpDate: draft.followUpDate || '',
      vitals: draft.vitals,
      diagnosis: draft.diagnosis || '',
      advice: draft.advice || '',
      medicinesSummary: draft.medicines.map((m) => m.name).join(', '),
      suggestedTestsSummary: draft.suggestedTests
        .map((tst) => `${tst.name}${tst.dueDate ? `, ${tst.dueDate}` : ''}`)
        .join(', '),
      scanImageUrl: draft.imageDataUrl,
      extraFields: draft.extraFields,
      fieldSources: draft.sources,
      editHistory: [],
    };

    const newMeds: Medicine[] = draft.medicines.map((m, idx) => ({
      id: `med-scan-${Date.now()}-${idx}`,
      personId,
      prescriptionId: rxId,
      name: m.name,
      strength: m.strength,
      times: m.times,
      repeat: m.repeat,
      durationDays: m.durationDays,
      foodRelation: m.foodRelation,
      reminderMethod: 'alarm',
      isCritical: m.isCritical,
    }));

    const newTests = draft.suggestedTests.map((tst, idx) => ({
      id: `test-${Date.now()}-${idx}`,
      personId,
      prescriptionId: rxId,
      name: tst.name,
      dueDate: tst.dueDate,
      completed: false,
    }));

    setState((prev) => ({
      ...prev,
      prescriptions: [newRx, ...prev.prescriptions],
      medicines: [...prev.medicines, ...newMeds],
      tests: [...prev.tests, ...newTests],
      doseLogs: [
        ...prev.doseLogs,
        {
          id: 'log-rx-' + Date.now(),
          personId,
          dayLabel: 'Today',
          dateISO: '2026-11-22',
          timeLabel: '—',
          medicineNames: `Prescription added · ${newRx.doctorName}, ${newRx.hospitalName}`,
          outcome: 'taken',
          source: 'manual',
          entryType: 'prescription',
        },
      ],
      checklistDone: { ...prev.checklistDone, medicine: true, alarms: true },
    }));

    showToast(
      state.language === 'bn'
        ? 'প্রেসক্রিপশন ও অ্যালার্ম তৈরি হয়েছে'
        : 'Prescription saved & alarms scheduled'
    );
    setSelectedRxId(rxId);
    setScreen(ScreenId.S15a);
  };

  const handleSaveProblemNote = (text: string, urgent = false) => {
    const person = activePerson;
    setState((prev) => ({
      ...prev,
      doseLogs: [
        ...prev.doseLogs,
        {
          id: 'log-prob-' + Date.now(),
          personId: person.id,
          dayLabel: 'Today',
          dateISO: '2026-11-22',
          timeLabel: '02:10 AM',
          medicineNames: `Problem note: ${text}`,
          outcome: 'taken',
          source: 'manual',
          entryType: 'problem',
        },
      ],
      alerts: [
        {
          id: 'alert-' + Date.now(),
          personId: person.id,
          personName: person.name,
          title: urgent ? `URGENT: ${person.name} — ${text}` : `${person.name}: ${text}`,
          subtitle: '02:10 AM · problem note',
          timestamp: new Date().toISOString(),
          urgent,
          resolved: false,
        },
        ...prev.alerts,
      ],
    }));
    showToast(
      state.language === 'bn' ? 'কেয়ারগিভারকে জানানো হয়েছে' : 'Problem saved & caregiver notified'
    );
    setHistoryStack([]);
    setScreen(ScreenId.S2b);
  };

  const screenTitles: Partial<Record<ScreenId, string>> = {
    [ScreenId.S3b]: t.addFamilyMember.replace(/^\+\s*/, ''),
    [ScreenId.S4]: activePerson.name,
    [ScreenId.S5]: t.addMedicine,
    [ScreenId.S6a]: t.pauseSchedule,
    [ScreenId.S6b]: t.pauseAlarmsCalls,
    [ScreenId.S8a]: t.scanPrescription,
    [ScreenId.S8b]: t.prescriptionFound,
    [ScreenId.S9]: t.addProblemNote,
    [ScreenId.S10a]: t.emergencyHealthCard,
    [ScreenId.S10b]: t.doctorView,
    [ScreenId.S12]: t.support,
    [ScreenId.S13]: t.caregiverInbox,
    [ScreenId.S15a]: t.prescriptions,
    [ScreenId.S15b]: t.prescriptions,
    [ScreenId.S17]: t.plans,
    [ScreenId.S18]: t.healthCheckCalls,
  };

  const showBack = !ROOT_SCREENS.has(screen) && screen !== ScreenId.S1b && screen !== ScreenId.S14 && screen !== ScreenId.S16;

  const activeRx =
    state.prescriptions.find((p) => p.id === selectedRxId) ||
    state.prescriptions.find((p) => p.personId === state.activePersonId) ||
    state.prescriptions[0];

  return (
    <>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#182226] text-white text-sm font-semibold shadow-lg pointer-events-none no-print">
          {toast}
        </div>
      )}

      <AppShell
        state={state}
        screen={screen}
        title={screenTitles[screen]}
        showBack={showBack}
        onBack={goBack}
        onNavigate={navigate}
        onToggleLanguage={toggleLanguage}
        onSwitchPerson={(personId) => {
          setState((prev) => ({ ...prev, activePersonId: personId }));
        }}
        onSignOut={handleSignOut}
      >
        {screen === ScreenId.S1a && (
          <SignInScreen
            language={state.language}
            onToggleLanguage={toggleLanguage}
            onAuthSuccess={handleAuthSuccess}
            onGoRegister={() => navigate(ScreenId.S1b)}
            onEmergencyNoLogin={() => navigate(ScreenId.S10a)}
          />
        )}

        {screen === ScreenId.S1b && (
          <RegisterScreen
            language={state.language}
            onBack={goBack}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {screen === ScreenId.S2a && (
          <HomeEmptyScreen state={state} onNavigate={navigate} />
        )}

        {screen === ScreenId.S2b && (
          <HomeActiveScreen
            state={state}
            onNavigate={navigate}
            onTakeDose={handleTakeDose}
            onSnoozeDose={handleSnoozeDose}
            onAcknowledgeNotYet={() =>
              showToast(
                state.language === 'bn'
                  ? 'রিমাইন্ডার খোলা রাখা হয়েছে'
                  : 'Kept open — we will remind you gently'
              )
            }
          />
        )}

        {screen === ScreenId.S3a && (
          <FamilyListScreen
            state={state}
            onSelectPerson={(personId) => {
              setState((prev) => ({ ...prev, activePersonId: personId }));
              navigate(ScreenId.S4);
            }}
            onNavigate={navigate}
          />
        )}

        {screen === ScreenId.S3b && (
          <AddFamilyMemberScreen
            state={state}
            onSaveMember={(member) => {
              const id = 'person-' + Date.now();
              setState((prev) => ({
                ...prev,
                persons: [
                  ...prev.persons,
                  {
                    ...member,
                    id,
                    reminderSettings: {
                      voiceLanguage: prev.language,
                      alarmSound: 'Gentle Chime',
                      alarmVolume: 85,
                      ringtone: 'Classic Bell',
                      quietHoursStart: '10:00 PM',
                      quietHoursEnd: '06:00 AM',
                      caregivers: [prev.account.fullName],
                      patientAgreedToCalls: true,
                    },
                    oneTimeReminders: [],
                  },
                ],
                checklistDone: { ...prev.checklistDone, family: true },
              }));
              showToast(state.language === 'bn' ? 'সদস্য যোগ করা হয়েছে' : 'Family member added');
              goBack();
            }}
          />
        )}

        {screen === ScreenId.S4 && (
          <PersonMenuScreen state={state} onNavigate={navigate} />
        )}

        {screen === ScreenId.S5 && (
          <AddMedicineScreen
            state={state}
            onNavigate={navigate}
            onSaveMedicine={handleSaveMedicine}
          />
        )}

        {screen === ScreenId.S6a && (
          <PauseScheduleScreen
            state={state}
            onNavigate={navigate}
            onResumeNow={() => {
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId ? { ...p, pauseWindow: undefined } : p
                ),
              }));
              showToast(state.language === 'bn' ? 'বিরতি শেষ হয়েছে' : 'Reminders resumed');
            }}
            onSkipNext={(slot) => {
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId ? { ...p, skippedSlot: slot } : p
                ),
              }));
              showToast(
                state.language === 'bn'
                  ? `পরবর্তী রিমাইন্ডার (${slot}) বাদ দেওয়া হয়েছে`
                  : `Skipped next reminder (${slot})`
              );
            }}
            onSetTempSchedule={(shiftMinutes, untilDate) => {
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId
                    ? { ...p, tempSchedule: { active: true, shiftMinutes, untilDate } }
                    : p
                ),
              }));
              showToast(
                state.language === 'bn' ? 'সাময়িক সময়সূচি চালু হয়েছে' : 'Temporary schedule applied'
              );
            }}
            onAddOneTimeReminder={(title, dateTimeLabel) => {
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId
                    ? {
                        ...p,
                        oneTimeReminders: [
                          ...p.oneTimeReminders,
                          { id: 'otr-' + Date.now(), title, dateTimeLabel, completed: false },
                        ],
                      }
                    : p
                ),
              }));
              showToast(
                state.language === 'bn' ? 'এককালীন রিমাইন্ডার যোগ হয়েছে' : 'One-time reminder saved'
              );
            }}
          />
        )}

        {screen === ScreenId.S6b && (
          <PauseDatesScreen
            state={state}
            onConfirmPause={(pause: PauseWindow) => {
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId ? { ...p, pauseWindow: pause } : p
                ),
                doseLogs: [
                  ...prev.doseLogs,
                  {
                    id: 'log-pause-' + Date.now(),
                    personId: prev.activePersonId,
                    dayLabel: 'Today',
                    dateISO: '2026-11-22',
                    timeLabel: 'All day',
                    medicineNames: `Paused (${pause.reason}) until ${pause.untilDate}`,
                    outcome: 'paused',
                    source: 'manual',
                    entryType: 'dose',
                  },
                ],
              }));
              showToast(
                state.language === 'bn' ? 'বিরতি নিশ্চিত করা হয়েছে' : 'Alarms & calls paused'
              );
              goBack();
            }}
          />
        )}

        {screen === ScreenId.S7 && <HistoryScreen state={state} />}

        {screen === ScreenId.S8a && (
          <ScanScreen
            state={state}
            authToken={authToken}
            onScanComplete={(draft) => {
              setScanDraft(draft);
              navigate(ScreenId.S8b);
            }}
          />
        )}

        {screen === ScreenId.S8b && scanDraft && (
          <ScanResultScreen
            state={state}
            draft={scanDraft}
            onSavePrescription={handleSavePrescriptionFromScan}
          />
        )}

        {screen === ScreenId.S9 && (
          <ProblemNoteScreen
            state={state}
            onSaveProblemNote={(text) => handleSaveProblemNote(text, false)}
          />
        )}

        {screen === ScreenId.S10a && (
          <EmergencyOpenScreen
            state={state}
            onUnlock={() => {
              setState((prev) => ({
                ...prev,
                checklistDone: { ...prev.checklistDone, erPin: true },
              }));
              navigate(ScreenId.S10b);
            }}
          />
        )}

        {screen === ScreenId.S10b && <EmergencyUnlockedScreen state={state} />}

        {screen === ScreenId.S11 && (
          <SettingsScreen
            state={state}
            onNavigate={navigate}
            onSetLanguage={setLanguage}
            onToggleLargeFont={() =>
              setState((prev) => ({
                ...prev,
                account: { ...prev.account, largeFontMode: !prev.account.largeFontMode },
              }))
            }
            onToggleAppLock={() =>
              setState((prev) => ({
                ...prev,
                account: { ...prev.account, appLockEnabled: !prev.account.appLockEnabled },
              }))
            }
            onUpdateErPin={(pin) => {
              setState((prev) => ({
                ...prev,
                account: { ...prev.account, erPin: pin },
                checklistDone: { ...prev.checklistDone, erPin: true },
              }));
              showToast(state.language === 'bn' ? 'ER PIN সংরক্ষিত হয়েছে' : 'ER PIN updated');
            }}
            onUpdatePersonVoiceLang={(voiceLang) =>
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId
                    ? { ...p, reminderSettings: { ...p.reminderSettings, voiceLanguage: voiceLang } }
                    : p
                ),
              }))
            }
            onUpdateAlarmVolume={(alarmVolume) =>
              setState((prev) => ({
                ...prev,
                persons: prev.persons.map((p) =>
                  p.id === prev.activePersonId
                    ? { ...p, reminderSettings: { ...p.reminderSettings, alarmVolume } }
                    : p
                ),
                checklistDone: { ...prev.checklistDone, alarms: true },
              }))
            }
            onSignOut={handleSignOut}
          />
        )}

        {screen === ScreenId.S12 && (
          <SupportChatScreen
            state={state}
            authToken={authToken}
            onSetPermission={(granted) =>
              setState((prev) => ({ ...prev, supportPermissionGranted: granted }))
            }
            onAddMessages={(userText, supportReply) =>
              setState((prev) => ({
                ...prev,
                supportMessages: [
                  ...prev.supportMessages,
                  ...(userText
                    ? [
                        {
                          id: 'u-' + Date.now(),
                          role: 'user' as const,
                          text: userText,
                          timestamp: 'Now',
                        },
                      ]
                    : []),
                  {
                    id: 's-' + (Date.now() + 1),
                    role: 'support' as const,
                    text: supportReply,
                    timestamp: 'Now',
                  },
                ],
              }))
            }
          />
        )}

        {screen === ScreenId.S13 && (
          <CaregiverInboxScreen
            state={state}
            onOpenHistoryForPerson={(personId) => {
              setState((prev) => ({ ...prev, activePersonId: personId }));
              navigate(ScreenId.S7);
            }}
            onResolveAlert={(alertId) =>
              setState((prev) => ({
                ...prev,
                alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
              }))
            }
          />
        )}

        {screen === ScreenId.S14 && (
          <AiCallScreen
            state={state}
            authToken={authToken}
            onTaken={handleTakeDose}
            onSnooze={handleSnoozeDose}
            onReportProblem={(summary, urgent) => {
              handleSaveProblemNote(summary, urgent);
              navigate(ScreenId.S13);
            }}
            onDeclineCall={() => {
              const nextMissed = state.consecutiveMissedCalls + 1;
              setState((prev) => ({
                ...prev,
                consecutiveMissedCalls: nextMissed,
                alerts:
                  nextMissed >= 3
                    ? [
                        {
                          id: 'alert-missed-' + Date.now(),
                          personId: activePerson.id,
                          personName: activePerson.name,
                          title: `3 calls missed · ${activePerson.name}`,
                          subtitle: 'Just now · automatic escalation',
                          timestamp: new Date().toISOString(),
                          urgent: true,
                          resolved: false,
                        },
                        ...prev.alerts,
                      ]
                    : prev.alerts,
              }));
              showToast(
                nextMissed >= 3
                  ? '3 calls missed — caregiver alerted'
                  : `Call declined (${nextMissed}/3 before caregiver alert)`
              );
              setScreen(ScreenId.S2b);
            }}
          />
        )}

        {screen === ScreenId.S15a && (
          <PrescriptionsListScreen
            state={state}
            onSelectPrescription={(rxId) => {
              setSelectedRxId(rxId);
              navigate(ScreenId.S15b);
            }}
            onNavigate={navigate}
          />
        )}

        {screen === ScreenId.S15b && activeRx && (
          <PrescriptionDetailScreen
            state={state}
            prescription={activeRx}
            onSaveChanges={(updated) => {
              setState((prev) => ({
                ...prev,
                prescriptions: prev.prescriptions.map((p) =>
                  p.id === updated.id ? updated : p
                ),
              }));
              showToast(state.language === 'bn' ? 'পরিবর্তন সংরক্ষিত হয়েছে' : 'Changes saved');
              goBack();
            }}
          />
        )}

        {screen === ScreenId.S16 && (
          <AlarmRingingScreen
            state={state}
            onTaken={handleTakeDose}
            onSnooze={handleSnoozeDose}
            onNotYet={() => {
              setHistoryStack([]);
              setScreen(ScreenId.S2b);
            }}
          />
        )}

        {screen === ScreenId.S17 && (
          <PlansScreen
            state={state}
            onSubscribe={(coveredIds) => {
              setState((prev) => ({
                ...prev,
                account: {
                  ...prev.account,
                  plan: 'subscribed',
                  payingForPersonIds: coveredIds,
                },
              }));
              showToast(
                state.language === 'bn'
                  ? 'সাবস্ক্রিপশন সক্রিয় হয়েছে!'
                  : 'Subscribed — Pro AI voice calls unlocked!'
              );
              setHistoryStack([]);
              setScreen(state.medicines.length > 0 ? ScreenId.S2b : ScreenId.S2a);
            }}
          />
        )}

        {screen === ScreenId.S18 && (
          <HealthCheckCallsScreen
            state={state}
            onNavigate={navigate}
            onSavePlan={(plan) => {
              setState((prev) => ({
                ...prev,
                healthCheckPlans: [
                  ...prev.healthCheckPlans,
                  { ...plan, id: 'hcp-' + Date.now() },
                ],
                doseLogs: [
                  ...prev.doseLogs,
                  {
                    id: 'log-hcp-' + Date.now(),
                    personId: plan.personId,
                    dayLabel: 'Today',
                    dateISO: '2026-11-22',
                    timeLabel: plan.time,
                    medicineNames: `Health check calls scheduled (${plan.frequency})`,
                    outcome: 'taken',
                    source: 'call',
                    entryType: 'health_check',
                  },
                ],
              }));
              showToast(
                state.language === 'bn' ? 'স্বাস্থ্য খোঁজ কল সেটআপ হয়েছে' : 'Health check calls scheduled'
              );
              setHistoryStack([]);
              setScreen(ScreenId.S7);
            }}
          />
        )}
      </AppShell>
    </>
  );
}
