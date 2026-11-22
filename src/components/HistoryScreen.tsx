import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { AppState, DoseLogEntry } from '../types';
import { COPY, formatDigits, translateRelation } from '../i18n';
import { getActivePerson, getCurrentDueBundle } from '../data/demoData';

export const HistoryScreen: React.FC<{
  state: AppState;
}> = ({ state }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const relLabel = translateRelation(person.relation, person.customRelation, lang);

  const [fromDate, setFromDate] = useState('2026-11-15');
  const [toDate, setToDate] = useState('2026-11-22');
  const [showOlder, setShowOlder] = useState(false);

  const personLogs = state.doseLogs.filter((l) => {
    if (l.personId !== person.id) return false;
    if (l.dateISO < fromDate || l.dateISO > toDate) return false;
    if (!showOlder && l.dateISO < '2026-11-21') return false;
    return true;
  });

  const dueBundle = getCurrentDueBundle(state, person.id);

  const todayTaken = personLogs.filter(
    (l) =>
      l.dateISO === '2026-11-22' &&
      l.entryType === 'dose' &&
      (l.outcome === 'taken' || l.outcome === 'late')
  ).length;

  const weekData = [
    { day: lang === 'bn' ? 'সোম' : 'Mon', pct: 80, ok: true },
    { day: lang === 'bn' ? 'মঙ্গল' : 'Tue', pct: 95, ok: true },
    { day: lang === 'bn' ? 'বুধ' : 'Wed', pct: 45, ok: false },
    { day: lang === 'bn' ? 'বৃহ' : 'Thu', pct: 85, ok: true },
    { day: lang === 'bn' ? 'শুক্র' : 'Fri', pct: 95, ok: true },
    { day: lang === 'bn' ? 'শনি' : 'Sat', pct: 75, ok: true },
    { day: lang === 'bn' ? 'আজ' : 'Today', pct: Math.max(45, Math.min(100, todayTaken * 35)), ok: todayTaken >= 2 },
  ];

  const renderOutcomeText = (entry: DoseLogEntry) => {
    if (entry.entryType === 'prescription') {
      return (
        <span className="text-xs font-semibold text-[#53615F]">
          {lang === 'bn' ? 'প্রেসক্রিপশন' : 'Prescription'}
        </span>
      );
    }
    if (entry.entryType === 'health_check') {
      return (
        <span className="text-xs font-semibold text-[#0B5E56]">
          {lang === 'bn' ? 'কল' : 'Call'}
        </span>
      );
    }
    if (entry.entryType === 'problem') {
      return (
        <span className="text-xs font-semibold text-[#8C5314]">
          {lang === 'bn' ? 'সমস্যা' : 'Problem'}
        </span>
      );
    }
    if (entry.outcome === 'missed') {
      return (
        <span className="text-xs font-semibold text-[#8C1D24]">
          {lang === 'bn' ? 'মিসড' : 'Missed'}
        </span>
      );
    }
    if (entry.outcome === 'late') {
      return (
        <span className="text-xs font-semibold text-[#8C5314] tabular-nums">
          {lang === 'bn'
            ? `বিলম্ব ${formatDigits(entry.lateMinutes ?? 30, lang)}মি.`
            : `Late ${entry.lateMinutes ?? 30}m`}
        </span>
      );
    }
    if (entry.outcome === 'paused') {
      return (
        <span className="text-xs font-semibold text-[#53615F]">
          {lang === 'bn' ? 'বিরতি' : 'Paused'}
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-[#0B5E56]">
        {lang === 'bn' ? 'সময়মতো' : 'On time'}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium text-xs text-[#0B5E56]">{relLabel} · {person.name}</p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.history}
        </h1>
      </div>

      {/* Date-to-date search */}
      <div className="glass-panel rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#121E1D] tabular-nums">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
            className="bg-transparent outline-none"
          />
          <span className="text-[#53615F]">–</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
            className="bg-transparent outline-none"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5E56]">
          <Search className="w-4 h-4" />
          <span>{t.search}</span>
        </span>
      </div>

      {/* 7-day On-time chart */}
      <div className="glass-hero rounded-3xl p-5 space-y-3">
        <p className="text-xs font-semibold text-[#53615F]">{t.onTimeDosesPerDay}</p>
        <div className="grid grid-cols-7 gap-2.5 items-end h-24 pt-2">
          {weekData.map((bar) => (
            <div key={bar.day} className="flex flex-col items-center justify-end h-full gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    bar.ok
                      ? 'bg-gradient-to-t from-[#0B5E56] to-[#1D8A7E]'
                      : 'bg-gradient-to-t from-[#B45309] to-[#D97706]'
                  }`}
                  style={{ height: `${bar.pct}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-[#53615F]">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowOlder((v) => !v)}
          className="text-xs font-semibold text-[#0B5E56] hover:underline py-1"
        >
          {showOlder
            ? lang === 'bn'
              ? 'সাম্প্রতিক দিনগুলো দেখুন'
              : 'Show recent days only'
            : t.loadOlderDays}
        </button>
      </div>

      {/* Frosted Feed Ledger */}
      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        {personLogs.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#53615F]">
            {lang === 'bn' ? 'এই তারিখে কোনো তথ্য পাওয়া যায়নি' : 'No history entries in this date range'}
          </div>
        ) : (
          personLogs.map((entry) => (
            <div key={entry.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-16 shrink-0 text-xs font-bold text-[#121E1D] tabular-nums leading-tight">
                  <div>{entry.dayLabel}</div>
                  {entry.timeLabel !== '—' && (
                    <div className="text-[#53615F] font-medium mt-0.5">
                      {formatDigits(entry.timeLabel, lang)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#121E1D] leading-snug">
                    {entry.medicineNames}
                  </p>
                  {entry.note && <p className="text-xs text-[#53615F] mt-0.5">{entry.note}</p>}
                </div>
              </div>
              <div className="shrink-0 pt-0.5">{renderOutcomeText(entry)}</div>
            </div>
          ))
        )}
      </div>

      {/* NOW marker */}
      <div className="pt-1">
        <div className="h-0.5 bg-gradient-to-r from-[#0B5E56] to-transparent rounded-full" />
        <p className="text-sm font-bold text-[#0B5E56] mt-2.5 tabular-nums">
          {lang === 'bn' ? 'এখন' : 'NOW'} ·{' '}
          {dueBundle
            ? `${lang === 'bn' ? 'পরবর্তী' : 'next'}: ${dueBundle.medicines[0]?.name} ${formatDigits(dueBundle.timeLabel, lang)}`
            : lang === 'bn'
              ? 'পরবর্তী: ক্যালসিয়াম ০২:০০ PM'
              : 'next: Calcium 02:00 PM'}
        </p>
      </div>
    </div>
  );
};
