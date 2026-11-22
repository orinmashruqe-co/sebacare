import React, { useRef, useState } from 'react';
import { Mic, MicOff, Printer, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppState } from '../types';
import { COPY, translateRelation } from '../i18n';
import { getActivePerson } from '../data/demoData';

export const ProblemNoteScreen: React.FC<{
  state: AppState;
  onSaveProblemNote: (text: string) => void;
}> = ({ state, onSaveProblemNote }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const toggleVoiceInput = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError(
        lang === 'bn'
          ? 'এই ব্রাউজারে ভয়েস টাইপিং নেই — অনুগ্রহ করে টাইপ করুন'
          : 'Voice dictation is not supported in this browser — please type below.'
      );
      return;
    }

    const rec = new SpeechRec();
    rec.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const spoken = ev.results?.[0]?.[0]?.transcript || '';
      setText((prev) => (prev ? `${prev} ${spoken}` : spoken));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError(lang === 'bn' ? 'সমস্যার বিবরণ লিখুন' : 'Please describe the problem');
      return;
    }
    onSaveProblemNote(text.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.addProblemNote}
      </h1>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="p-5">
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.problemPlaceholder}
            className="w-full text-base bg-transparent outline-none resize-none"
          />
        </div>
        <div className="px-5 py-3 text-xs font-medium text-[#53615F] tabular-nums">
          22 Nov 2026 · 02:10 AM
        </div>
      </div>

      <button
        type="button"
        onClick={toggleVoiceInput}
        className={`w-full min-h-[48px] rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          listening
            ? 'bg-[#FDF4F4] border border-[#8C1D24] text-[#8C1D24]'
            : 'glass-panel text-[#121E1D] hover:bg-white'
        }`}
      >
        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#0B5E56]" />}
        <span>{listening ? t.listening : t.speakInstead}</span>
      </button>

      {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}

      <button
        type="submit"
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.saveNotifyCaregiver}
      </button>
    </form>
  );
};

export const EmergencyOpenScreen: React.FC<{
  state: AppState;
  onUnlock: () => void;
}> = ({ state, onUnlock }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const expectedPin = state.account.erPin || '1234';

  const qrPayload = JSON.stringify({
    name: person.name,
    bloodGroup: person.bloodGroup,
    allergy: person.allergies,
    emergencyApp: 'SebaCare',
  });

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError('');
    if (clean && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = digits.join('');
    if (entered.length < 4) {
      setError(lang === 'bn' ? '৪ সংখ্যার পিন লিখুন' : 'Enter 4-digit Doctor PIN');
      return;
    }
    if (entered !== expectedPin) {
      setError(
        lang === 'bn'
          ? `পিন মেলেনি (ডেমো পিন: ${expectedPin})`
          : `Incorrect PIN (demo PIN: ${expectedPin})`
      );
      return;
    }
    onUnlock();
  };

  return (
    <form onSubmit={handleUnlock} className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.emergencyHealthCard}
      </h1>

      {/* Matte Obsidian Medical ID Card */}
      <div className="glass-obsidian rounded-3xl p-5 text-white flex items-center gap-5">
        <div className="p-2.5 rounded-2xl bg-white shrink-0">
          <QRCodeSVG value={qrPayload} size={108} bgColor="#FFFFFF" fgColor="#121E1D" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-white/65">{t.layer1Open}</p>
          <p className="font-editorial text-4xl font-bold tracking-tight text-white">
            {person.bloodGroup}
          </p>
          <p className="text-sm font-medium text-white/90">
            {lang === 'bn' ? 'অ্যালার্জি: ' : 'Allergy: '}
            {person.allergies || 'None'}
          </p>
          <p className="text-xs text-white/65">
            {translateRelation(person.relation, person.customRelation, lang)} · {person.name}
          </p>
        </div>
      </div>

      {/* Layer 2 Doctor PIN */}
      <div className="glass-panel rounded-3xl p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#53615F] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>{t.layer2Pin}</span>
          </p>
          <button
            type="button"
            onClick={() => setDigits(expectedPin.split(''))}
            className="text-xs font-semibold text-[#0B5E56] hover:underline"
          >
            {lang === 'bn' ? `ডেমো পিন (${expectedPin})` : `Fill demo (${expectedPin})`}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              aria-label={`PIN digit ${i + 1}`}
              className="h-14 rounded-2xl bg-white/85 border border-white text-center text-2xl font-bold outline-none focus:border-[#0B5E56] tabular-nums shadow-xs"
            />
          ))}
        </div>

        <p className="text-xs text-[#53615F]">{t.pinUnlockHint}</p>
      </div>

      {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}

      <button
        type="submit"
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.unlockAndPrint}
      </button>
    </form>
  );
};

export const EmergencyUnlockedScreen: React.FC<{
  state: AppState;
}> = ({ state }) => {
  const t = COPY[state.language];
  const person = getActivePerson(state);
  const latestRx = state.prescriptions.find((p) => p.personId === person.id && !p.isManualPlaceholder);
  const emergencyMeds = state.medicines
    .filter((m) => m.personId === person.id)
    .map((m) => `${m.name}${m.strength ? ` (${m.strength})` : ''}${m.isCritical ? ' · Critical' : ''}`)
    .join(', ');

  return (
    <div className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.doctorView}
      </h1>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[#53615F]">{person.idType}</p>
          <p className="text-base font-bold text-[#121E1D] mt-0.5 tabular-nums">{person.idNumber}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[#53615F]">
            Diagnosis {latestRx?.date ? `(latest prescription, ${latestRx.date})` : ''}
          </p>
          <p className="text-base font-bold text-[#121E1D] mt-0.5">
            {latestRx?.diagnosis || '—'}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[#53615F]">Emergency medicines</p>
          <p className="text-base font-bold text-[#121E1D] mt-0.5">
            {emergencyMeds || '—'}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[#53615F]">Blood group · Allergy</p>
          <p className="text-base font-bold text-[#121E1D] mt-0.5">
            {person.bloodGroup} · {person.allergies || 'None'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 flex items-center justify-center gap-2 hover:bg-[#084A43] no-print"
      >
        <Printer className="w-5 h-5" />
        <span>{t.print}</span>
      </button>
    </div>
  );
};
