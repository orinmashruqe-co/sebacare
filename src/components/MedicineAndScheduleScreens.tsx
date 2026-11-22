import React, { useState } from 'react';
import { Plus, X, ChevronRight, CalendarClock } from 'lucide-react';
import {
  AppState,
  FoodRelation,
  Medicine,
  PauseWindow,
  ReminderMethod,
  RepeatPattern,
  ScreenId,
} from '../types';
import { COPY, formatDigits, translateRelation } from '../i18n';
import { getActivePerson } from '../data/demoData';

export const AddMedicineScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
  onSaveMedicine: (med: Omit<Medicine, 'id'>) => void;
}> = ({ state, onNavigate, onSaveMedicine }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const personRx = state.prescriptions.filter((p) => p.personId === person.id);

  const [prescriptionId, setPrescriptionId] = useState(
    personRx[0]?.id || 'no-prescription'
  );
  const [name, setName] = useState('Insulin');
  const [strength, setStrength] = useState('12 units');
  const [times, setTimes] = useState<string[]>(['02:00 AM', '05:30 AM']);
  const [newTimeInput, setNewTimeInput] = useState('20:00');
  const [addingTime, setAddingTime] = useState(false);
  const [repeat, setRepeat] = useState<RepeatPattern>('Every day');
  const [durationDays, setDurationDays] = useState<number | null>(7);
  const [foodRelation, setFoodRelation] = useState<FoodRelation>('Before food');
  const [reminderMethod, setReminderMethod] = useState<ReminderMethod>('alarm');
  const [isCritical, setIsCritical] = useState(true);
  const [error, setError] = useState('');

  const handleAddTime = () => {
    const [hhStr, mmStr] = newTimeInput.split(':');
    const hh = Number(hhStr);
    const mm = Number(mmStr);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    const formatted = `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;
    if (!times.includes(formatted)) {
      setTimes([...times, formatted]);
    }
    setAddingTime(false);
  };

  const handleSelectReminder = (method: ReminderMethod) => {
    setReminderMethod(method);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'bn' ? 'ওষুধের নাম লিখুন' : 'Please enter medicine name');
      return;
    }
    if (times.length === 0) {
      setError(lang === 'bn' ? 'কমপক্ষে একটি সময় যোগ করুন' : 'Add at least one exact time');
      return;
    }
    onSaveMedicine({
      personId: person.id,
      prescriptionId,
      name: name.trim(),
      strength: strength.trim() || undefined,
      times,
      repeat,
      durationDays,
      endDateLabel: durationDays ? `${durationDays} days` : 'Ongoing',
      foodRelation,
      reminderMethod,
      isCritical,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="font-medium text-xs text-[#0B5E56]">
          {translateRelation(person.relation, person.customRelation, lang)} · {person.name}
        </p>
        <h1 className="font-editorial text-3xl font-semibold text-[#121E1D]">{t.addMedicine}</h1>
      </div>

      {/* Medicine & exact times glass panel */}
      <div className="glass-hero rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#121E1D]/8">
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-medium text-[#53615F]">{t.fromPrescription}</label>
            <select
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              className="mt-1 w-full text-sm font-semibold text-[#121E1D] bg-transparent outline-none"
            >
              {personRx.map((rx) => (
                <option key={rx.id} value={rx.id}>
                  {rx.doctorName} {rx.date ? `· ${rx.date}` : ''}
                </option>
              ))}
              {personRx.length === 0 && (
                <option value="no-prescription">
                  {lang === 'bn' ? 'প্রেসক্রিপশন ছাড়া' : 'No prescription'}
                </option>
              )}
            </select>
          </div>
          {personRx.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.S15b)}
              className="text-xs font-semibold text-[#0B5E56] hover:underline shrink-0"
            >
              {lang === 'bn' ? 'বিস্তারিত' : 'View'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 pb-3 border-b border-[#121E1D]/8">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#53615F]">{t.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full text-lg font-bold text-[#121E1D] bg-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#53615F]">
              {lang === 'bn' ? 'মাত্রা' : 'Strength'}
            </label>
            <input
              type="text"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="20 mg"
              className="mt-1 w-full text-base font-semibold text-[#121E1D] bg-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#53615F] mb-2.5">{t.exactTimes}</label>
          <div className="flex flex-wrap gap-2">
            {times.map((tm) => (
              <span
                key={tm}
                className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 rounded-2xl bg-[#0B5E56] text-white text-sm font-semibold tabular-nums shadow-sm"
              >
                <span>{formatDigits(tm, lang)}</span>
                <button
                  type="button"
                  onClick={() => setTimes(times.filter((x) => x !== tm))}
                  className="p-0.5 rounded-full hover:bg-white/20"
                  aria-label={`Remove ${tm}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {!addingTime ? (
              <button
                type="button"
                onClick={() => setAddingTime(true)}
                className="min-h-[42px] px-4 rounded-2xl bg-white/75 border border-dashed border-[#0B5E56]/40 text-[#0B5E56] text-sm font-semibold flex items-center gap-1 hover:bg-white"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addTime.replace(/^\+\s*/, '')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-2xl border border-white shadow-xs">
                <input
                  type="time"
                  value={newTimeInput}
                  onChange={(e) => setNewTimeInput(e.target.value)}
                  className="text-sm font-semibold bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTime}
                  className="px-3 py-1 rounded-xl bg-[#0B5E56] text-white text-xs font-semibold"
                >
                  {lang === 'bn' ? 'যোগ' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repeat, Duration & Food timing */}
      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">{t.repeat}</label>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as RepeatPattern)}
            className="mt-1 w-full text-base font-semibold text-[#121E1D] bg-transparent outline-none"
          >
            {[
              'Every day',
              'Every 8 hours',
              'Every 12 hours',
              'Every other day',
              'Weekdays',
              'Weekly',
              'Only if needed',
            ].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#53615F]">{t.duration}</label>
            <select
              value={durationDays === null ? 'ongoing' : String(durationDays)}
              onChange={(e) =>
                setDurationDays(e.target.value === 'ongoing' ? null : Number(e.target.value))
              }
              className="mt-1 w-full text-sm font-semibold text-[#121E1D] bg-transparent outline-none"
            >
              <option value="7">7 days, ends 29 Nov</option>
              <option value="14">14 days, ends 6 Dec</option>
              <option value="30">30 days, ends 22 Dec</option>
              <option value="ongoing">Ongoing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#53615F]">{t.foodRelation}</label>
            <select
              value={foodRelation}
              onChange={(e) => setFoodRelation(e.target.value as FoodRelation)}
              className="mt-1 w-full text-sm font-semibold text-[#121E1D] bg-transparent outline-none"
            >
              <option value="Before food">Before food</option>
              <option value="After food">After food</option>
              <option value="With food">With food</option>
              <option value="Anytime">Anytime</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminder preference & Critical toggle */}
      <div className="glass-panel rounded-3xl p-5 space-y-3.5">
        <p className="text-xs font-medium text-[#53615F]">{t.howRemind}</p>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'alarm', label: t.alarm },
              { id: 'call', label: t.callPro },
              { id: 'silent', label: t.silent },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectReminder(opt.id)}
              className={`min-h-[46px] px-2 rounded-2xl text-sm font-semibold transition-all ${
                reminderMethod === opt.id
                  ? 'bg-[#0B5E56] text-white shadow-md shadow-[#0B5E56]/20'
                  : 'bg-white/75 border border-white text-[#121E1D] hover:bg-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-[#53615F]">
          <span>{t.alarmFreeNote}</span>
        </div>

        <div className="pt-3.5 border-t border-[#121E1D]/8 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#121E1D]">{t.criticalMedicine}</p>
            <p className="text-xs text-[#53615F]">{t.criticalMedicineSub}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isCritical}
            onClick={() => setIsCritical((v) => !v)}
            className={`w-13 h-7 rounded-full p-1 transition-colors shrink-0 ${
              isCritical ? 'bg-[#0B5E56]' : 'bg-[#121E1D]/20'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                isCritical ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}

      <button
        type="submit"
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.saveMedicine}
      </button>
    </form>
  );
};

export const PauseScheduleScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
  onResumeNow: () => void;
  onSkipNext: (slot: string) => void;
  onSetTempSchedule: (shiftMinutes: number, untilDate: string) => void;
  onAddOneTimeReminder: (title: string, dateTimeLabel: string) => void;
}> = ({
  state,
  onNavigate,
  onResumeNow,
  onSkipNext,
  onSetTempSchedule,
  onAddOneTimeReminder,
}) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const relLabel = translateRelation(person.relation, person.customRelation, lang);

  const [showTempEditor, setShowTempEditor] = useState(false);
  const [shiftMins, setShiftMins] = useState(60);
  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [oneTimeTitle, setOneTimeTitle] = useState('Blood sugar test');
  const [oneTimeTime, setOneTimeTime] = useState('Tomorrow · 08:00 AM');

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S4)}
          className="text-xs font-semibold text-[#0B5E56] hover:underline"
        >
          {relLabel} · {person.name} →
        </button>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D] mt-0.5">
          {t.pauseSchedule}
        </h1>
      </div>

      {person.pauseWindow?.active && (
        <div className="rounded-3xl glass-amber p-5 space-y-2">
          <p className="text-sm font-bold text-[#724C12]">
            {t.pauseBannerTitle} {person.pauseWindow.fromDate} – {person.pauseWindow.untilDate}
          </p>
          <p className="text-xs text-[#8C5314]">{t.pauseBannerSub}</p>
          <button
            type="button"
            onClick={onResumeNow}
            className="mt-1 px-4 py-2 rounded-xl bg-white/90 text-xs font-bold text-[#724C12] shadow-xs"
          >
            {lang === 'bn' ? 'এখনই চালু করুন' : 'Resume now'}
          </button>
        </div>
      )}

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S6b)}
          className="w-full min-h-[76px] px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/60 transition-colors"
        >
          <div>
            <p className="text-base font-semibold text-[#121E1D]">{t.pauseAlarmsCalls}</p>
            <p className="text-sm text-[#53615F]">{t.pauseAlarmsCallsSub}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onSkipNext('02:00 AM')}
          className="w-full min-h-[76px] px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/60 transition-colors"
        >
          <div>
            <p className="text-base font-semibold text-[#121E1D]">{t.skipNextCall}</p>
            <p className="text-sm text-[#53615F]">
              {person.skippedSlot
                ? lang === 'bn'
                  ? `বাদ দেওয়া হয়েছে: ${person.skippedSlot}`
                  : `Skipped: ${person.skippedSlot}`
                : t.skipNextCallSub}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
        </button>

        <div className="px-5 py-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowTempEditor((v) => !v)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-base font-semibold text-[#121E1D]">{t.tempSchedule}</p>
              <p className="text-sm text-[#53615F]">
                {person.tempSchedule?.active
                  ? `+${person.tempSchedule.shiftMinutes}m until ${person.tempSchedule.untilDate}`
                  : t.tempScheduleSub}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
          </button>
          {showTempEditor && (
            <div className="pt-3 border-t border-[#121E1D]/8 flex items-center gap-2">
              <select
                value={shiftMins}
                onChange={(e) => setShiftMins(Number(e.target.value))}
                className="flex-1 min-h-[42px] px-3 rounded-xl bg-white/80 border border-white text-sm font-semibold"
              >
                <option value={30}>+30 min later</option>
                <option value={60}>+1 hour later</option>
                <option value={-60}>1 hour earlier</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  onSetTempSchedule(shiftMins, '25 Nov 2026');
                  setShowTempEditor(false);
                }}
                className="min-h-[42px] px-4 rounded-xl bg-[#0B5E56] text-white text-sm font-semibold"
              >
                {lang === 'bn' ? 'চালু' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowOneTimeForm((v) => !v)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-base font-semibold text-[#121E1D]">{t.oneTimeReminder}</p>
              <p className="text-sm text-[#53615F]">{t.oneTimeReminderSub}</p>
            </div>
            <CalendarClock className="w-5 h-5 text-[#0B5E56] shrink-0" />
          </button>

          {person.oneTimeReminders.length > 0 && (
            <div className="pt-2 border-t border-[#121E1D]/8 space-y-1.5">
              {person.oneTimeReminders.map((r) => (
                <div key={r.id} className="text-xs text-[#53615F] flex justify-between">
                  <span className="font-semibold text-[#121E1D]">{r.title}</span>
                  <span className="tabular-nums">{r.dateTimeLabel}</span>
                </div>
              ))}
            </div>
          )}

          {showOneTimeForm && (
            <div className="pt-3 border-t border-[#121E1D]/8 space-y-2">
              <input
                type="text"
                value={oneTimeTitle}
                onChange={(e) => setOneTimeTitle(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl bg-white/80 border border-white text-sm"
                placeholder="Blood test / Doctor visit"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={oneTimeTime}
                  onChange={(e) => setOneTimeTime(e.target.value)}
                  className="flex-1 min-h-[42px] px-3 rounded-xl bg-white/80 border border-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (oneTimeTitle.trim()) {
                      onAddOneTimeReminder(oneTimeTitle.trim(), oneTimeTime.trim());
                      setShowOneTimeForm(false);
                    }
                  }}
                  className="min-h-[42px] px-4 rounded-xl bg-[#0B5E56] text-white text-sm font-semibold"
                >
                  {lang === 'bn' ? 'যোগ' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-[#53615F] pt-1">{t.caregiverPauseNote}</p>
    </div>
  );
};

export const PauseDatesScreen: React.FC<{
  state: AppState;
  onConfirmPause: (pause: PauseWindow) => void;
}> = ({ state, onConfirmPause }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const [fromDate, setFromDate] = useState('22 Nov 2026');
  const [untilDate, setUntilDate] = useState('25 Nov 2026');
  const [reason, setReason] = useState<'Hospital' | 'Travel' | 'Doctor'>('Hospital');

  return (
    <div className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.pauseAlarmsCalls}
      </h1>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">{t.from}</label>
          <input
            type="text"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-full text-base font-semibold bg-transparent outline-none tabular-nums"
          />
        </div>

        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">{t.until}</label>
          <input
            type="text"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
            className="mt-1 w-full text-base font-semibold bg-transparent outline-none tabular-nums"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {(
          [
            { id: 'Hospital', label: t.hospital },
            { id: 'Travel', label: t.travel },
            { id: 'Doctor', label: t.doctor },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setReason(item.id)}
            className={`min-h-[48px] rounded-2xl text-sm font-semibold transition-all ${
              reason === item.id
                ? 'bg-[#0B5E56] text-white shadow-md shadow-[#0B5E56]/20'
                : 'glass-panel text-[#121E1D] hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl p-4 text-sm text-[#53615F]">
        {lang === 'bn'
          ? `${untilDate}-এর পর স্বয়ংক্রিয়ভাবে চালু হবে। বিরতির ডোজ মিসড হিসেবে গণ্য হবে না।`
          : `Resume automatically after ${untilDate}. Paused doses are not counted as missed.`}
      </div>

      <button
        type="button"
        onClick={() =>
          onConfirmPause({
            fromDate,
            untilDate,
            reason,
            active: true,
          })
        }
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.confirmPause}
      </button>
    </div>
  );
};
