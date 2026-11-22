import React from 'react';
import {
  Camera,
  Plus,
  CheckSquare,
  Square,
  ShieldAlert,
  ChevronDown,
  AlertTriangle,
  FileText,
  Pill,
  ArrowUpRight,
} from 'lucide-react';
import { AppState, ScreenId } from '../types';
import { COPY, formatDigits, translateRelation } from '../i18n';
import { getActivePerson, getCurrentDueBundle, getPersonTodayStats } from '../data/demoData';

interface HomeScreensProps {
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
  onTakeDose: (timeLabel: string, medicineNames: string) => void;
  onSnoozeDose: (timeLabel: string) => void;
  onAcknowledgeNotYet: () => void;
}

export const HomeEmptyScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
}> = ({ state, onNavigate }) => {
  const t = COPY[state.language];
  const lang = state.language;

  const steps = [
    {
      key: 'family',
      label: t.stepFamily,
      done: state.checklistDone.family || state.persons.length > 1,
      target: ScreenId.S3a,
    },
    {
      key: 'medicine',
      label: t.stepMedicine,
      done: state.checklistDone.medicine || state.medicines.length > 0,
      target: ScreenId.S5,
    },
    { key: 'alarms', label: t.stepAlarms, done: state.checklistDone.alarms, target: ScreenId.S11 },
    {
      key: 'erPin',
      label: t.stepErPin,
      done: state.checklistDone.erPin || Boolean(state.account.erPin),
      target: ScreenId.S10a,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium text-sm text-[#0B5E56]">{t.welcome},</p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {state.account.fullName}
        </h1>
      </div>

      {/* Frosted Glass Hero: Add first medicine */}
      <div className="glass-hero rounded-3xl p-6 text-center space-y-3.5">
        <div className="space-y-1">
          <h2 className="font-editorial text-2xl font-semibold text-[#121E1D] text-balance">
            {t.addFirstMedTitle}
          </h2>
          <p className="text-sm text-[#53615F]">{t.addFirstMedSub}</p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S8a)}
          className="w-full min-h-[52px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 flex items-center justify-center gap-2 hover:bg-[#084A43] transition-all"
        >
          <Camera className="w-5 h-5" />
          <span>{t.scanPrescription}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S5)}
          className="w-full min-h-[48px] rounded-2xl bg-white/75 border border-white font-semibold text-sm text-[#121E1D] flex items-center justify-center gap-2 hover:bg-white transition-colors"
        >
          <Plus className="w-4 h-4 text-[#0B5E56]" />
          <span>{t.addManually}</span>
        </button>
      </div>

      {/* Editorial 4-step Checklist */}
      <div className="glass-panel rounded-3xl p-5 space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#121E1D]/8 pb-2.5">
          <h3 className="font-editorial text-lg font-semibold text-[#121E1D]">{t.gettingStarted}</h3>
          <span className="text-xs font-semibold text-[#0B5E56] tabular-nums">
            {formatDigits(doneCount, lang)} / {formatDigits(4, lang)}
          </span>
        </div>
        <div className="divide-y divide-[#121E1D]/8">
          {steps.map((step) => (
            <button
              key={step.key}
              type="button"
              onClick={() => onNavigate(step.target)}
              className="w-full min-h-[48px] py-2 flex items-center justify-between gap-3 text-left hover:bg-white/50 -mx-2 px-2 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-[#121E1D]">
                {step.done ? (
                  <CheckSquare className="w-5 h-5 text-[#0B5E56] shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-[#0B5E56]/70 shrink-0" />
                )}
                <span className={step.done ? 'line-through text-[#53615F]' : ''}>{step.label}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#0B5E56] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S17)}
        className="w-full min-h-[50px] px-5 py-3 rounded-2xl glass-panel flex items-center justify-between text-left text-sm font-semibold text-[#0B5E56] hover:bg-white transition-all"
      >
        <span>{t.subscribeBanner}</span>
        <ArrowUpRight className="w-4 h-4 shrink-0" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S10a)}
        className="w-full min-h-[50px] rounded-2xl bg-[#FDF4F4]/80 backdrop-blur-md border border-[#8C1D24]/25 text-[#8C1D24] font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#FCE8E9] transition-colors"
      >
        <ShieldAlert className="w-5 h-5" />
        <span>{t.emergencyCard}</span>
      </button>
    </div>
  );
};

export const HomeActiveScreen: React.FC<HomeScreensProps> = ({
  state,
  onNavigate,
  onTakeDose,
  onSnoozeDose,
  onAcknowledgeNotYet,
}) => {
  const t = COPY[state.language];
  const lang = state.language;
  const activePerson = getActivePerson(state);
  const dueBundle = getCurrentDueBundle(state, activePerson.id);
  const stats = getPersonTodayStats(state, activePerson.id);
  const activeAlerts = state.alerts.filter((a) => !a.resolved);
  const progressPct = stats.total > 0 ? Math.min(100, Math.round((stats.taken / stats.total) * 100)) : 100;

  return (
    <div className="space-y-5">
      {/* Editorial Greeting & One-Tap Profile Switcher */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-medium text-sm text-[#0B5E56]">{t.goodMorning},</p>
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D] leading-tight">
            {state.account.fullName}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S3a)}
          className="min-h-[44px] px-4 rounded-2xl glass-panel flex items-center gap-1.5 text-sm font-semibold text-[#121E1D] hover:bg-white transition-colors shrink-0"
        >
          <span>{translateRelation(activePerson.relation, activePerson.customRelation, lang)}</span>
          <ChevronDown className="w-4 h-4 text-[#0B5E56]" />
        </button>
      </div>

      {/* Luminous Frosted Hero: Now Card */}
      {dueBundle ? (
        <div className="glass-hero rounded-3xl p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#0B5E56] tabular-nums">
              <span>
                {t.now} · {formatDigits(dueBundle.timeLabel, lang)} ·{' '}
                {state.account.plan === 'subscribed' &&
                dueBundle.medicines.some((m) => m.reminderMethod === 'call')
                  ? t.aiCall
                  : t.alarm}
              </span>
              <span className="text-[#53615F] font-medium">
                {translateRelation(activePerson.relation, activePerson.customRelation, lang)}
              </span>
            </div>

            <h2 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D] leading-snug text-balance">
              {dueBundle.medicines.map((m) => m.name).join(', ')}
            </h2>

            <button
              type="button"
              onClick={() => onNavigate(ScreenId.S15a)}
              className="text-sm text-[#53615F] hover:text-[#0B5E56] hover:underline text-left inline-flex items-center gap-1"
            >
              <span>
                {dueBundle.medicines[0]?.foodRelation} · {dueBundle.medicines[0]?.doctorName}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() =>
                onTakeDose(
                  dueBundle.timeLabel,
                  dueBundle.medicines.map((m) => m.name).join(', ')
                )
              }
              className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] active:scale-[0.99] transition-all"
            >
              {t.taken}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onSnoozeDose(dueBundle.timeLabel)}
                className="min-h-[46px] rounded-2xl bg-white/80 border border-[#0B5E56]/30 font-semibold text-sm text-[#0B5E56] hover:bg-white transition-colors"
              >
                {t.snooze30}
              </button>
              <button
                type="button"
                onClick={onAcknowledgeNotYet}
                className="min-h-[46px] rounded-2xl bg-white/60 border border-white font-semibold text-sm text-[#53615F] hover:bg-white hover:text-[#121E1D] transition-colors"
              >
                {t.notYet}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-hero rounded-3xl p-6 space-y-4">
          <p className="font-medium text-sm text-[#0B5E56]">
            {activePerson.pauseWindow?.active ? t.pauseBannerTitle : t.noDueNow}
          </p>
          <h2 className="font-editorial text-2xl font-semibold text-[#121E1D] leading-snug">
            {activePerson.pauseWindow?.active
              ? `${activePerson.pauseWindow.fromDate} – ${activePerson.pauseWindow.untilDate}`
              : stats.taken >= stats.total && stats.total > 0
                ? t.allDoneToday
                : t.nextDoseAt('02:00 PM')}
          </h2>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.S5)}
              className="min-h-[44px] px-4 rounded-2xl bg-[#0B5E56] text-white text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-[#0B5E56]/20 hover:bg-[#084A43]"
            >
              <Pill className="w-4 h-4" />
              <span>{t.addMedicine}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.S7)}
              className="min-h-[44px] px-4 rounded-2xl bg-white/75 border border-white text-[#121E1D] text-sm font-semibold hover:bg-white"
            >
              {t.history}
            </button>
          </div>
        </div>
      )}

      {/* Glass Amber Alert Strip */}
      {activeAlerts.length > 0 && (
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S13)}
          className="w-full min-h-[50px] px-4 py-3 rounded-2xl glass-amber flex items-center justify-between gap-3 text-left hover:brightness-98 transition-all"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold text-[#724C12]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{activeAlerts[0].title}</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#724C12] shrink-0" />
        </button>
      )}

      {/* Editorial Progress Panel */}
      <div className="glass-panel rounded-3xl p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-[#53615F]">{t.todaysProgress}</p>
          <span className="text-xs font-bold text-[#0B5E56] tabular-nums">{progressPct}%</span>
        </div>
        <p className="font-editorial text-xl font-semibold text-[#121E1D] tabular-nums">
          {t.takenCountOf(stats.taken, stats.total)}
        </p>
        <div className="w-full h-2 rounded-full bg-[#121E1D]/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0B5E56] to-[#1D8A7E] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quick Action Glass Dock */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S8a)}
          className="min-h-[76px] px-2 py-3 rounded-2xl glass-panel flex flex-col items-center justify-center gap-1.5 hover:bg-white transition-colors"
        >
          <Camera className="w-5 h-5 text-[#0B5E56]" />
          <span className="text-xs font-semibold text-[#121E1D] text-center">{t.scan}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S9)}
          className="min-h-[76px] px-2 py-3 rounded-2xl glass-panel flex flex-col items-center justify-center gap-1.5 hover:bg-white transition-colors"
        >
          <FileText className="w-5 h-5 text-[#0B5E56]" />
          <span className="text-xs font-semibold text-[#121E1D] text-center">{t.writeProblem}</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S10a)}
          className="min-h-[76px] px-2 py-3 rounded-2xl bg-[#FDF4F4]/85 backdrop-blur-md border border-[#8C1D24]/25 flex flex-col items-center justify-center gap-1.5 hover:bg-[#FCE8E9] transition-colors"
        >
          <ShieldAlert className="w-5 h-5 text-[#8C1D24]" />
          <span className="text-xs font-bold text-[#8C1D24] text-center">{t.emergency}</span>
        </button>
      </div>
    </div>
  );
};
