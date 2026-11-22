import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, Send } from 'lucide-react';
import { AppState, HealthCheckCallPlan, ScreenId } from '../types';
import { COPY, formatDigits, translateRelation } from '../i18n';
import { getActivePerson, getCurrentDueBundle } from '../data/demoData';

export const AiCallScreen: React.FC<{
  state: AppState;
  authToken: string | null;
  onTaken: (timeLabel: string, medNames: string) => void;
  onSnooze: (timeLabel: string) => void;
  onReportProblem: (summary: string, urgent: boolean) => void;
  onDeclineCall: () => void;
}> = ({ state, authToken, onTaken, onSnooze, onReportProblem, onDeclineCall }) => {
  const t = COPY[state.language];
  const person = getActivePerson(state);
  const voiceLang = person.reminderSettings.voiceLanguage;
  const dueBundle = getCurrentDueBundle(state, person.id);
  const timeLabel = dueBundle?.timeLabel || '02:00 AM';
  const medNames = dueBundle?.medicines.map((m) => m.name).join(', ') || 'Insulin, Omeprazole';

  const initialPrompt =
    voiceLang === 'bn'
      ? `স্যার, আপনি কি ${formatDigits(timeLabel, 'bn')}-এর ওষুধ (${medNames}) খেয়েছেন?`
      : `Sir, did you take your ${timeLabel} medicine (${medNames})?`;

  const [answered, setAnswered] = useState(false);
  const [aiLine, setAiLine] = useState(initialPrompt);
  const [replyInput, setReplyInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const speakLine = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voiceLang === 'bn' ? 'bn-BD' : 'en-US';
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAnswer = () => {
    setAnswered(true);
    speakLine(initialPrompt);
  };

  const handleSendReply = async (transcript: string) => {
    if (!transcript.trim() || processing) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/ai-call/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          transcript,
          language: voiceLang,
          mode: 'medicine_reminder',
          medicineSummary: medNames,
          timeSlot: timeLabel,
          personName: person.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Call understanding failed');

      const { intent, isUrgent, problemSummary, replyText } = json.result || {};
      if (replyText) {
        setAiLine(replyText);
        speakLine(replyText);
      }

      setTimeout(() => {
        if (intent === 'taken') {
          onTaken(timeLabel, medNames);
        } else if (intent === 'later') {
          onSnooze(timeLabel);
        } else if (intent === 'problem') {
          onReportProblem(problemSummary || transcript, Boolean(isUrgent));
        }
      }, 1100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to process reply');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-5 py-10 max-w-md mx-auto w-full">
      <div className="space-y-6 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <h1 className="font-editorial text-2xl font-semibold text-[#121E1D]">{t.incomingCall}</h1>
          <span className="text-xs font-semibold text-[#8C5314]">· {t.subscribers}</span>
        </div>

        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0B5E56] to-[#1D8A7E] text-white flex items-center justify-center mx-auto shadow-2xl shadow-[#0B5E56]/30 ring-8 ring-white/60">
          <Phone className="w-11 h-11" />
        </div>

        <div className="space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-[#121E1D]">
            {t.medicineReminder}
          </h2>
          <div className="glass-hero rounded-3xl p-5 text-base font-medium text-[#121E1D]">
            “{aiLine}”
          </div>
        </div>

        {!answered ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAnswer}
              className="min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43]"
            >
              {t.answer}
            </button>
            <button
              type="button"
              onClick={onDeclineCall}
              className="min-h-[54px] rounded-2xl glass-panel text-[#121E1D] font-semibold text-base hover:bg-white"
            >
              {t.decline}
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleSendReply(voiceLang === 'bn' ? 'হ্যাঁ খেয়েছি' : 'Yes, taken')}
                className="min-h-[46px] rounded-2xl bg-[#0B5E56] text-white text-xs font-bold shadow-sm"
              >
                {voiceLang === 'bn' ? '১ · খেয়েছি' : '1 · Taken'}
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() =>
                  handleSendReply(voiceLang === 'bn' ? '৩০ মিনিট পরে খাবো' : 'Later in 30 min')
                }
                className="min-h-[46px] rounded-2xl glass-panel text-[#0B5E56] text-xs font-bold"
              >
                {voiceLang === 'bn' ? '২ · পরে' : '2 · Later'}
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleSendReply(voiceLang === 'bn' ? 'মাথা ঘুরছে' : 'I feel dizzy')}
                className="min-h-[46px] rounded-2xl glass-amber text-[#724C12] text-xs font-bold"
              >
                {voiceLang === 'bn' ? 'সমস্যা' : 'Problem'}
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply(replyInput);
              }}
              className="glass-panel rounded-2xl px-3.5 py-2 flex items-center gap-2"
            >
              <Mic className="w-4 h-4 text-[#0B5E56] shrink-0" />
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder={
                  voiceLang === 'bn'
                    ? 'উত্তর লিখুন বা চাপুন (যেমন: খেয়েছি / মাথা ঘুরছে)'
                    : 'Type voice reply (e.g. taken / feeling dizzy)'
                }
                className="flex-1 text-sm bg-transparent outline-none min-h-[40px]"
              />
              <button
                type="submit"
                disabled={processing || !replyInput.trim()}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-[#0B5E56] text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {error && <p className="text-sm font-medium text-[#8C1D24]">{error}</p>}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-3xl p-4 text-xs text-[#53615F] space-y-1.5">
        <p>Said taken: logged → Home</p>
        <p>Said later: call again in 30 min</p>
        <p>Reported a problem: alert → Caregiver inbox</p>
      </div>
    </div>
  );
};

export const AlarmRingingScreen: React.FC<{
  state: AppState;
  onTaken: (timeLabel: string, medNames: string) => void;
  onSnooze: (timeLabel: string) => void;
  onNotYet: () => void;
}> = ({ state, onTaken, onSnooze, onNotYet }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const dueBundle = getCurrentDueBundle(state, person.id);
  const timeLabel = dueBundle?.timeLabel || '02:00 AM';
  const [hourMin, ampm] = timeLabel.split(' ');
  const medNames = dueBundle?.medicines.map((m) => m.name).join(', ') || 'Insulin, Omeprazole';
  const subInfo = `${dueBundle?.medicines[0]?.foodRelation || 'Before food'} · ${
    dueBundle?.medicines[0]?.doctorName || 'Dr. Mahmudul Hasan'
  }`;

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      const ringChime = () => {
        if (ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      };

      ringChime();
      const timer = window.setInterval(ringChime, 2600);
      return () => {
        window.clearInterval(timer);
        ctx.close().catch(() => {});
      };
    } catch {
      return undefined;
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-10 max-w-md mx-auto w-full space-y-6 text-center">
      <div>
        <p className="font-editorial text-7xl font-bold tracking-tight text-[#121E1D] tabular-nums">
          {formatDigits(hourMin || '02:00', lang)}
        </p>
        <p className="text-sm text-[#53615F] mt-2">
          {ampm || 'AM'} · {t.freeAlarmPhone}
        </p>
      </div>

      <div className="glass-hero rounded-3xl p-6 space-y-1">
        <p className="font-editorial text-2xl font-semibold text-[#121E1D]">{medNames}</p>
        <p className="text-sm text-[#53615F]">{subInfo}</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onTaken(timeLabel, medNames)}
          className="w-full min-h-[56px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-lg shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] active:scale-[0.99] transition-all"
        >
          {t.taken}
        </button>

        <button
          type="button"
          onClick={() => onSnooze(timeLabel)}
          className="w-full min-h-[52px] rounded-2xl glass-panel font-semibold text-base text-[#121E1D] hover:bg-white"
        >
          {t.snooze30}
        </button>

        <button
          type="button"
          onClick={onNotYet}
          className="w-full min-h-[52px] rounded-2xl glass-panel font-semibold text-base text-[#53615F] hover:bg-white flex items-center justify-center gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{t.notYet}</span>
        </button>
      </div>
    </div>
  );
};

export const HealthCheckCallsScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
  onSavePlan: (plan: Omit<HealthCheckCallPlan, 'id'>) => void;
}> = ({ state, onNavigate, onSavePlan }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const [targetPersonId, setTargetPersonId] = useState(state.activePersonId);
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Every N days'>(
    'Every N days'
  );
  const [everyNDays, setEveryNDays] = useState(3);
  const [startDate, setStartDate] = useState('25 Nov 2026');
  const [time, setTime] = useState('09:00 AM');
  const [payer, setPayer] = useState<'Me' | 'The patient' | 'Other person'>('Me');

  const handleSave = () => {
    onSavePlan({
      personId: targetPersonId,
      frequency,
      everyNDays: frequency === 'Every N days' ? everyNDays : undefined,
      startDate,
      time,
      payer,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2.5">
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.healthCheckCalls}
        </h1>
        <span className="text-xs font-semibold text-[#8C5314]">· {t.pro}</span>
      </div>

      <p className="text-sm text-[#53615F]">
        {lang === 'bn'
          ? 'এআই ভয়েস কল করে শারীরিক অবস্থার খোঁজ নেয়। উত্তরগুলো ইতিহাসে সংরক্ষিত হয়।'
          : 'An AI voice call asks how they feel. The answers are saved in History.'}
      </p>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-medium text-[#53615F]">{t.whoIsItFor}</p>
          <div className="flex flex-wrap gap-2">
            {state.persons.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTargetPersonId(p.id)}
                className={`min-h-[42px] px-4 rounded-2xl text-sm font-semibold transition-all ${
                  targetPersonId === p.id
                    ? 'bg-[#0B5E56] text-white shadow-sm'
                    : 'bg-white/75 text-[#121E1D] hover:bg-white'
                }`}
              >
                {translateRelation(p.relation, p.customRelation, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <p className="text-xs font-medium text-[#53615F]">{t.howOften}</p>
          <div className="flex flex-wrap gap-2">
            {(['Daily', 'Weekly', 'Monthly', 'Every N days'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFrequency(freq)}
                className={`min-h-[42px] px-4 rounded-2xl text-sm font-semibold transition-all ${
                  frequency === freq
                    ? 'bg-[#0B5E56] text-white shadow-sm'
                    : 'bg-white/75 text-[#121E1D] hover:bg-white'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
          {frequency === 'Every N days' && (
            <div className="pt-2 flex items-center gap-2 text-sm">
              <span>Every</span>
              <input
                type="number"
                min={1}
                max={30}
                value={everyNDays}
                onChange={(e) => setEveryNDays(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 rounded-xl bg-white/85 border border-white font-bold tabular-nums text-center"
              />
              <span>days</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-2">
          <p className="text-xs font-medium text-[#53615F]">{t.startsTime}</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-32 text-sm font-semibold bg-white/80 px-3 py-2 rounded-xl tabular-nums outline-none"
            />
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-28 text-sm font-semibold bg-white/80 px-3 py-2 rounded-xl tabular-nums outline-none"
            />
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <p className="text-xs font-medium text-[#53615F]">{t.whoPays}</p>
          <div className="flex flex-wrap gap-2">
            {(['Me', 'The patient', 'Other person'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPayer(opt)}
                className={`min-h-[42px] px-4 rounded-2xl text-sm font-semibold transition-all ${
                  payer === opt
                    ? 'bg-[#0B5E56] text-white shadow-sm'
                    : 'bg-white/75 text-[#121E1D] hover:bg-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43]"
      >
        {t.setUpCalls}
      </button>
    </div>
  );
};
