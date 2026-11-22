import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, FileCheck2, ChevronRight, X, Sparkles, Loader2 } from 'lucide-react';
import {
  AppState,
  FieldSource,
  Prescription,
  ScanDraft,
  ScreenId,
} from '../types';
import { COPY, formatDigits } from '../i18n';
import { getActivePerson } from '../data/demoData';

function buildSamplePrescriptionImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 720, 920);
  ctx.fillStyle = '#0B5E56';
  ctx.fillRect(0, 0, 720, 96);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('City Specialized Hospital', 36, 48);
  ctx.font = '18px sans-serif';
  ctx.fillText('Dr. Mahmudul Hasan · Endocrinology · Reg: BMDC A-41892', 36, 78);

  ctx.fillStyle = '#121E1D';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Date: 22 Nov 2026     Follow-up: 29 Nov 2026', 36, 145);
  ctx.fillText('Diagnosis: Type 2 Diabetes · Advice: Low sugar diet', 36, 185);
  ctx.fillText('Vitals: BP 130/82 mmHg · Fasting Sugar 8.8 mmol/L', 36, 225);

  ctx.strokeStyle = '#D1D5DB';
  ctx.beginPath();
  ctx.moveTo(36, 255);
  ctx.lineTo(684, 255);
  ctx.stroke();

  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Rx', 36, 305);
  ctx.font = '22px sans-serif';
  ctx.fillText('1. Insulin Glargine 12 units — 02:00 AM & 05:30 AM (Before food) · 7 days', 36, 360);
  ctx.fillText('2. Omeprazole 20 mg — 02:00 AM (Before food) · 14 days', 36, 415);
  ctx.fillText('3. Calcium Carbonate 500 mg — 02:00 PM (After food) · 30 days', 36, 470);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Suggested Test: Blood sugar (Fasting & PP) in 7 days', 36, 560);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#53615F';
  ctx.fillText('Address: Dhanmondi 27, Dhaka', 36, 620);
  return canvas.toDataURL('image/png');
}

export const ScanScreen: React.FC<{
  state: AppState;
  authToken: string | null;
  onScanComplete: (draft: ScanDraft) => void;
}> = ({ state, authToken, onScanComplete }) => {
  const t = COPY[state.language];
  const lang = state.language;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [lastDraft, setLastDraft] = useState<ScanDraft | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch {
      setError(
        lang === 'bn'
          ? 'ক্যামেরা চালু করা যায়নি — সরাসরি ছবি আপলোড করুন'
          : 'Camera unavailable here — tap Upload prescription photo below.'
      );
    }
  };

  const runAiExtraction = async (dataUrl: string, mimeType: string) => {
    setPreviewDataUrl(dataUrl);
    setScanning(true);
    setError('');

    try {
      const res = await fetch('/api/scan-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          language: lang,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to read prescription');
      }

      const r = json.result || {};
      const src = (val: string | undefined): FieldSource => (val && val.trim() ? 'AI' : 'Empty');

      const meds = Array.isArray(r.medicines)
        ? r.medicines.map((m: Record<string, unknown>) => ({
            name: String(m.name || 'Medicine'),
            strength: String(m.strength || ''),
            times:
              Array.isArray(m.times) && m.times.length > 0
                ? m.times.map(String)
                : ['08:00 AM'],
            repeat: 'Every day' as const,
            durationDays: typeof m.durationDays === 'number' ? m.durationDays : 7,
            foodRelation:
              m.foodRelation === 'Before food' ||
              m.foodRelation === 'After food' ||
              m.foodRelation === 'With food'
                ? m.foodRelation
                : ('After food' as const),
            isCritical: Boolean(m.isCritical),
          }))
        : [];

      const tests = Array.isArray(r.suggestedTests)
        ? r.suggestedTests.map((tst: Record<string, unknown>) => ({
            name: String(tst.name || ''),
            dueDate: String(tst.dueDate || 'in 7 days'),
          }))
        : [];

      const extraFields = Array.isArray(r.extraFields)
        ? r.extraFields
            .filter((ef: Record<string, unknown>) => ef?.label && ef?.value)
            .map((ef: Record<string, unknown>) => ({
              label: String(ef.label),
              value: String(ef.value),
            }))
        : [];

      const draft: ScanDraft = {
        imageDataUrl: dataUrl,
        doctorName: String(r.doctorName || ''),
        doctorSpecialty: String(r.doctorSpecialty || ''),
        doctorRegNo: String(r.doctorRegNo || ''),
        hospitalName: String(r.hospitalName || ''),
        hospitalAddress: String(r.hospitalAddress || ''),
        hospitalPhone: String(r.hospitalPhone || ''),
        date: String(r.date || '22 Nov 2026'),
        followUpDate: String(r.followUpDate || ''),
        vitals: String(r.vitals || ''),
        diagnosis: String(r.diagnosis || ''),
        advice: String(r.advice || ''),
        medicines: meds,
        suggestedTests: tests,
        extraFields,
        sources: {
          doctorName: src(r.doctorName),
          hospitalName: src(r.hospitalName),
          hospitalPhone: src(r.hospitalPhone),
          date: src(r.date),
          diagnosis: src(r.diagnosis),
          medicines: meds.length > 0 ? 'AI' : 'Empty',
          suggestedTests: tests.length > 0 ? 'AI' : 'Empty',
        },
      };

      setLastDraft(draft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      setCameraActive(false);
    }
    runAiExtraction(dataUrl, 'image/jpeg');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        runAiExtraction(reader.result, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium text-xs text-[#0B5E56]">
          {lang === 'bn' ? 'সম্পূর্ণ ফ্রি · গুগল জেমিনি এআই' : '100% Free · Powered by Google Gemini AI'}
        </p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.scanPrescription}
        </h1>
      </div>

      {/* Interactive Upload / Camera Preview Frame */}
      <div
        onClick={() => {
          if (!cameraActive && !scanning) fileInputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !cameraActive && !scanning) {
            fileInputRef.current?.click();
          }
        }}
        className="glass-hero rounded-3xl overflow-hidden min-h-[250px] flex flex-col items-center justify-center p-4 relative border-dashed border-[#0B5E56]/35 cursor-pointer hover:brightness-98 transition-all"
      >
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-72 rounded-2xl object-cover" />
        ) : previewDataUrl ? (
          <img
            src={previewDataUrl}
            alt="Prescription scan preview"
            referrerPolicy="no-referrer"
            className="w-full max-h-72 rounded-2xl object-contain"
          />
        ) : (
          <div className="text-center space-y-2.5 py-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0B5E56]/10 text-[#0B5E56] flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-[#121E1D]">
              {lang === 'bn' ? 'প্রেসক্রিপশনের ছবি আপলোড করতে ট্যাপ করুন' : 'Tap here to upload prescription photo'}
            </p>
            <p className="text-xs text-[#53615F]">
              {lang === 'bn' ? 'JPG, PNG বা WEBP ছবি সমর্থিত' : 'Supports JPG, PNG, or WEBP photos'}
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="w-full min-h-[52px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 flex items-center justify-center gap-2 hover:bg-[#084A43] transition-all disabled:opacity-60"
        >
          <Upload className="w-5 h-5" />
          <span>{t.uploadPhoto}</span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          {cameraActive ? (
            <button
              type="button"
              onClick={captureFromCamera}
              disabled={scanning}
              className="min-h-[48px] px-3 rounded-2xl bg-[#0B5E56] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ক্যাপচার' : 'Capture'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={scanning}
              className="min-h-[48px] px-3 rounded-2xl glass-panel text-sm font-semibold text-[#121E1D] flex items-center justify-center gap-1.5 hover:bg-white transition-colors"
            >
              <Camera className="w-4 h-4 text-[#0B5E56]" />
              <span className="truncate">{t.takePhoto}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const sampleUrl = buildSamplePrescriptionImage();
              if (sampleUrl) runAiExtraction(sampleUrl, 'image/png');
            }}
            disabled={scanning}
            className="min-h-[48px] px-3 rounded-2xl glass-panel text-sm font-semibold text-[#121E1D] flex items-center justify-center gap-1.5 hover:bg-white transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#0B5E56]" />
            <span className="truncate">{t.useSamplePhoto}</span>
          </button>
        </div>
      </div>

      {scanning && (
        <div className="glass-panel rounded-2xl p-4 text-sm font-semibold text-[#0B5E56] flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            {lang === 'bn' ? 'গুগল জেমিনি এআই দিয়ে প্রেসক্রিপশন পড়া হচ্ছে…' : 'Reading prescription with Google Gemini AI…'}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-[#FDF4F4] border border-[#8C1D24]/25 rounded-2xl p-4 text-sm font-medium text-[#8C1D24]">
          {error}
        </div>
      )}

      {lastDraft && !scanning && (
        <div className="space-y-3">
          <div className="glass-panel rounded-2xl p-4 text-sm text-[#121E1D]">
            <span className="font-bold">{lang === 'bn' ? 'পাওয়া গেছে: ' : 'Found: '}</span>
            {lastDraft.doctorName || 'Doctor'}, {lastDraft.diagnosis || 'diagnosis'},{' '}
            {formatDigits(lastDraft.medicines.length, lang)}{' '}
            {lang === 'bn' ? 'টি ওষুধ' : 'medicines'},{' '}
            {formatDigits(lastDraft.suggestedTests.length, lang)}{' '}
            {lang === 'bn' ? 'টি পরীক্ষা' : 'suggested tests'}
          </div>

          <button
            type="button"
            onClick={() => onScanComplete(lastDraft)}
            className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 flex items-center justify-center gap-2 hover:bg-[#084A43]"
          >
            <FileCheck2 className="w-5 h-5" />
            <span>{t.reviewResult}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const ScanResultScreen: React.FC<{
  state: AppState;
  draft: ScanDraft;
  onSavePrescription: (draft: ScanDraft) => void;
}> = ({ state, draft, onSavePrescription }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const [form, setForm] = useState<ScanDraft>(draft);

  const updateField = <K extends keyof ScanDraft>(
    key: K,
    value: ScanDraft[K],
    sourceKey?: keyof ScanDraft['sources']
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      sources: sourceKey
        ? {
            ...prev.sources,
            [sourceKey]: typeof value === 'string' && !value.trim() ? 'Empty' : 'Edited',
          }
        : prev.sources,
    }));
  };

  const renderSourceTag = (source: FieldSource) => {
    if (source === 'Empty') {
      return <span className="text-xs font-semibold text-[#8C5314]">Empty</span>;
    }
    if (source === 'Edited') {
      return <span className="text-xs font-semibold text-[#8C5314]">Edited</span>;
    }
    return <span className="text-xs font-semibold text-[#0B5E56]">AI</span>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.prescriptionFound}
        </h1>
        <p className="text-sm text-[#53615F] mt-0.5">{t.tapFieldEdit}</p>
      </div>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#53615F]">Doctor · specialty</label>
            <input
              type="text"
              value={form.doctorName}
              onChange={(e) => updateField('doctorName', e.target.value, 'doctorName')}
              className="mt-0.5 w-full text-base font-semibold bg-transparent outline-none"
              placeholder="Dr. name"
            />
            <input
              type="text"
              value={form.doctorSpecialty}
              onChange={(e) => updateField('doctorSpecialty', e.target.value)}
              className="w-full text-xs text-[#53615F] bg-transparent outline-none"
              placeholder="Specialty"
            />
          </div>
          {renderSourceTag(form.sources.doctorName)}
        </div>

        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#53615F]">Hospital · place</label>
            <input
              type="text"
              value={form.hospitalName}
              onChange={(e) => updateField('hospitalName', e.target.value, 'hospitalName')}
              className="mt-0.5 w-full text-base font-semibold bg-transparent outline-none"
              placeholder="Hospital name"
            />
            <input
              type="text"
              value={form.hospitalAddress}
              onChange={(e) => updateField('hospitalAddress', e.target.value)}
              className="w-full text-xs text-[#53615F] bg-transparent outline-none"
              placeholder="Address"
            />
          </div>
          {renderSourceTag(form.sources.hospitalName)}
        </div>

        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#53615F]">Date</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value, 'date')}
                className="mt-0.5 w-full text-sm font-semibold bg-transparent outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#53615F]">Follow-up</label>
              <input
                type="text"
                value={form.followUpDate}
                onChange={(e) => updateField('followUpDate', e.target.value)}
                placeholder="Not specified"
                className="mt-0.5 w-full text-sm font-semibold bg-transparent outline-none tabular-nums"
              />
            </div>
          </div>
          {renderSourceTag(form.sources.date)}
        </div>

        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-[#53615F]">Diagnosis · advice</label>
            <input
              type="text"
              value={form.diagnosis}
              onChange={(e) => updateField('diagnosis', e.target.value, 'diagnosis')}
              className="mt-0.5 w-full text-base font-semibold bg-transparent outline-none"
              placeholder="Diagnosis"
            />
            <input
              type="text"
              value={form.advice}
              onChange={(e) => updateField('advice', e.target.value)}
              className="w-full text-xs text-[#53615F] bg-transparent outline-none"
              placeholder="Diet / lifestyle advice"
            />
          </div>
          {renderSourceTag(form.sources.diagnosis)}
        </div>

        <div className="px-5 py-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#53615F]">
              Medicines ({formatDigits(form.medicines.length, lang)})
            </span>
            {renderSourceTag(form.sources.medicines)}
          </div>
          {form.medicines.map((m, idx) => (
            <div key={idx} className="pt-2 border-t border-[#121E1D]/8 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={m.name}
                onChange={(e) => {
                  const next = [...form.medicines];
                  next[idx] = { ...next[idx], name: e.target.value };
                  updateField('medicines', next, 'medicines');
                }}
                className="text-sm font-bold bg-transparent outline-none"
              />
              <input
                type="text"
                value={m.times.join(', ')}
                onChange={(e) => {
                  const next = [...form.medicines];
                  next[idx] = {
                    ...next[idx],
                    times: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  updateField('medicines', next, 'medicines');
                }}
                className="text-xs font-semibold text-[#0B5E56] bg-transparent outline-none tabular-nums"
              />
            </div>
          ))}
        </div>

        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#53615F]">Suggested test</label>
            <input
              type="text"
              value={form.suggestedTests.map((tst) => `${tst.name}${tst.dueDate ? `, ${tst.dueDate}` : ''}`).join(' · ')}
              onChange={(e) =>
                updateField(
                  'suggestedTests',
                  e.target.value ? [{ name: e.target.value, dueDate: 'in 7 days' }] : [],
                  'suggestedTests'
                )
              }
              placeholder="None"
              className="mt-0.5 w-full text-sm font-semibold bg-transparent outline-none"
            />
          </div>
          {renderSourceTag(form.sources.suggestedTests)}
        </div>

        <div className="px-5 py-3.5 flex items-start justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#53615F]">Hospital phone</label>
            <input
              type="text"
              value={form.hospitalPhone}
              onChange={(e) => updateField('hospitalPhone', e.target.value, 'hospitalPhone')}
              placeholder={lang === 'bn' ? 'পাওয়া যায়নি — লিখে দিন' : 'Not found — tap to enter'}
              className="mt-0.5 w-full text-sm font-semibold bg-transparent outline-none tabular-nums"
            />
          </div>
          {renderSourceTag(form.sources.hospitalPhone)}
        </div>

        {form.extraFields.length > 0 && (
          <div className="px-5 py-3.5 space-y-1.5">
            <span className="block text-xs font-medium text-[#53615F]">Additional notes preserved</span>
            {form.extraFields.map((ef, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{ef.label}: </span>
                <span className="text-[#53615F]">{ef.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSavePrescription(form)}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.savePrescription}
      </button>
    </div>
  );
};

export const PrescriptionsListScreen: React.FC<{
  state: AppState;
  onSelectPrescription: (rxId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}> = ({ state, onSelectPrescription, onNavigate }) => {
  const t = COPY[state.language];
  const person = getActivePerson(state);
  const rxList = state.prescriptions.filter((p) => p.personId === person.id);

  return (
    <div className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.prescriptions}
      </h1>

      {rxList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-6 text-center text-sm text-[#53615F]">
          {state.language === 'bn'
            ? 'এখনো কোনো প্রেসক্রিপশন আপলোড করা হয়নি'
            : 'No prescriptions uploaded yet'}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
          {rxList.map((rx) => (
            <button
              key={rx.id}
              type="button"
              onClick={() => onSelectPrescription(rx.id)}
              className="w-full min-h-[72px] px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/60 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-[#121E1D] truncate">
                  {rx.doctorName}
                  {rx.hospitalName ? ` · ${rx.hospitalName}` : ''}
                </p>
                <p className="text-sm text-[#53615F] truncate mt-0.5 tabular-nums">
                  {rx.isManualPlaceholder
                    ? rx.doctorSpecialty
                    : `${rx.date} · ${rx.diagnosis || rx.medicinesSummary}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S8a)}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.scanNewPrescription}
      </button>
    </div>
  );
};

export const PrescriptionDetailScreen: React.FC<{
  state: AppState;
  prescription: Prescription;
  onSaveChanges: (updated: Prescription) => void;
}> = ({ state, prescription, onSaveChanges }) => {
  const t = COPY[state.language];
  const [doctorName, setDoctorName] = useState(prescription.doctorName);
  const [hospitalName, setHospitalName] = useState(prescription.hospitalName);
  const [hospitalPhone, setHospitalPhone] = useState(prescription.hospitalPhone);
  const [diagnosis, setDiagnosis] = useState(prescription.diagnosis);
  const [medicinesSummary, setMedicinesSummary] = useState(prescription.medicinesSummary);
  const [suggestedTestsSummary, setSuggestedTestsSummary] = useState(
    prescription.suggestedTestsSummary
  );
  const [showOriginalModal, setShowOriginalModal] = useState(false);

  const handleSave = () => {
    const edits = [...prescription.editHistory];
    const nowLabel = '22 Nov 2026 · Now';
    if (hospitalPhone !== prescription.hospitalPhone) {
      edits.unshift({
        id: 'ed-' + Date.now(),
        timestamp: nowLabel,
        field: 'Hospital phone',
        previousValue: prescription.hospitalPhone || 'Empty',
        newValue: hospitalPhone,
      });
    }
    if (diagnosis !== prescription.diagnosis) {
      edits.unshift({
        id: 'ed-diag-' + Date.now(),
        timestamp: nowLabel,
        field: 'Diagnosis',
        previousValue: prescription.diagnosis || 'Empty',
        newValue: diagnosis,
      });
    }

    onSaveChanges({
      ...prescription,
      doctorName,
      hospitalName,
      hospitalPhone,
      diagnosis,
      medicinesSummary,
      suggestedTestsSummary,
      fieldSources: {
        ...prescription.fieldSources,
        doctorName: doctorName !== prescription.doctorName ? 'Edited' : prescription.fieldSources.doctorName,
        hospitalName:
          hospitalName !== prescription.hospitalName ? 'Edited' : prescription.fieldSources.hospitalName,
        hospitalPhone:
          hospitalPhone !== prescription.hospitalPhone ? 'Edited' : prescription.fieldSources.hospitalPhone,
        diagnosis: diagnosis !== prescription.diagnosis ? 'Edited' : prescription.fieldSources.diagnosis,
        medicines:
          medicinesSummary !== prescription.medicinesSummary
            ? 'Edited'
            : prescription.fieldSources.medicines,
        suggestedTests:
          suggestedTestsSummary !== prescription.suggestedTestsSummary
            ? 'Edited'
            : prescription.fieldSources.suggestedTests,
      },
      editHistory: edits,
    });
  };

  return (
    <div className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        Prescription {prescription.date ? `· ${prescription.date}` : ''}
      </h1>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        {[
          {
            label: 'Doctor',
            val: doctorName,
            setVal: setDoctorName,
            src: prescription.fieldSources.doctorName,
          },
          {
            label: 'Hospital',
            val: hospitalName,
            setVal: setHospitalName,
            src: prescription.fieldSources.hospitalName,
          },
          {
            label: 'Hospital phone',
            val: hospitalPhone,
            setVal: setHospitalPhone,
            src: prescription.fieldSources.hospitalPhone,
          },
          {
            label: 'Diagnosis',
            val: diagnosis,
            setVal: setDiagnosis,
            src: prescription.fieldSources.diagnosis,
          },
          {
            label: 'Medicines',
            val: medicinesSummary,
            setVal: setMedicinesSummary,
            src: prescription.fieldSources.medicines,
          },
          {
            label: 'Test due',
            val: suggestedTestsSummary,
            setVal: setSuggestedTestsSummary,
            src: prescription.fieldSources.suggestedTests,
          },
        ].map((row) => (
          <div key={row.label} className="px-5 py-3.5 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-[#53615F]">{row.label}</label>
              <input
                type="text"
                value={row.val}
                onChange={(e) => row.setVal(e.target.value)}
                className="mt-0.5 w-full text-base font-semibold bg-transparent outline-none"
              />
            </div>
            <span
              className={`text-xs font-semibold ${
                row.src === 'AI' ? 'text-[#0B5E56]' : 'text-[#8C5314]'
              }`}
            >
              {row.src}
            </span>
          </div>
        ))}
      </div>

      {prescription.editHistory.length > 0 && (
        <div className="glass-panel rounded-3xl p-4 space-y-2">
          <p className="text-xs font-semibold text-[#53615F]">Edit history</p>
          {prescription.editHistory.map((ed) => (
            <p key={ed.id} className="text-xs text-[#121E1D] tabular-nums">
              {ed.timestamp} · {ed.field}: {ed.previousValue} → {ed.newValue}
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowOriginalModal(true)}
        className="w-full min-h-[48px] rounded-2xl glass-panel font-semibold text-sm text-[#121E1D] hover:bg-white"
      >
        {t.viewOriginalScan}
      </button>

      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43]"
      >
        {t.saveChanges}
      </button>

      {showOriginalModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-hero rounded-3xl max-w-lg w-full p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">{t.viewOriginalScan}</h3>
              <button
                type="button"
                onClick={() => setShowOriginalModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-white/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {prescription.scanImageUrl ? (
              <img
                src={prescription.scanImageUrl}
                alt="Original scanned prescription"
                referrerPolicy="no-referrer"
                className="w-full max-h-[65vh] object-contain rounded-2xl border border-white"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-white/80 text-sm text-[#53615F] space-y-1">
                <p className="font-bold text-[#121E1D]">{prescription.hospitalName || 'Prescription Record'}</p>
                <p>{prescription.doctorName} · {prescription.doctorSpecialty}</p>
                <p>{prescription.vitals}</p>
                <p>Diagnosis: {prescription.diagnosis}</p>
                <p>Medicines: {prescription.medicinesSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
