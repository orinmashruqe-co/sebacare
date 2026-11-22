import React, { useState } from 'react';
import { Send, MessageCircle, BellRing, PhoneCall, Check, LogOut } from 'lucide-react';
import { AppState, Language, ScreenId } from '../types';
import { COPY, translateRelation } from '../i18n';
import { getActivePerson } from '../data/demoData';

export const SettingsScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
  onSetLanguage: (lang: Language) => void;
  onToggleLargeFont: () => void;
  onToggleAppLock: () => void;
  onUpdateErPin: (pin: string) => void;
  onUpdatePersonVoiceLang: (lang: Language) => void;
  onUpdateAlarmVolume: (vol: number) => void;
  onSignOut: () => void;
}> = ({
  state,
  onNavigate,
  onSetLanguage,
  onToggleLargeFont,
  onToggleAppLock,
  onUpdateErPin,
  onUpdatePersonVoiceLang,
  onUpdateAlarmVolume,
  onSignOut,
}) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const relLabel = translateRelation(person.relation, person.customRelation, lang);

  const [editingPin, setEditingPin] = useState(false);
  const [pinDraft, setPinDraft] = useState(state.account.erPin || '1234');

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#0B5E56]">
            {state.account.fullName} · {state.account.mobile}
          </p>
          <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
            {t.settings}
          </h1>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="min-h-[40px] px-3.5 rounded-xl glass-panel text-xs font-semibold text-[#8C1D24] flex items-center gap-1.5 hover:bg-[#FDF4F4]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.signOut}</span>
        </button>
      </div>

      {/* App section */}
      <div className="glass-panel rounded-3xl p-5 space-y-3">
        <p className="text-base font-bold text-[#121E1D]">{t.appSection}</p>

        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          <span className="text-sm text-[#121E1D]">{t.languageLabel}</span>
          <div className="flex gap-1.5">
            {(['bn', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onSetLanguage(l)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  state.language === l
                    ? 'bg-[#0B5E56] text-white shadow-xs'
                    : 'bg-white/75 text-[#121E1D] hover:bg-white'
                }`}
              >
                {l === 'bn' ? 'বাংলা' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 min-h-[44px] border-t border-[#121E1D]/8 pt-2">
          <span className="text-sm text-[#121E1D]">{t.largeFontMode}</span>
          <button
            type="button"
            role="switch"
            aria-checked={state.account.largeFontMode}
            onClick={onToggleLargeFont}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              state.account.largeFontMode ? 'bg-[#0B5E56]' : 'bg-[#121E1D]/20'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                state.account.largeFontMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-[#121E1D]/8 pt-2 space-y-2">
          <div className="flex items-center justify-between gap-2 min-h-[44px]">
            <span className="text-sm text-[#121E1D]">{t.appLockErPin}</span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setEditingPin((v) => !v)}
                className="text-xs font-semibold text-[#0B5E56] hover:underline tabular-nums"
              >
                PIN: {state.account.erPin || 'Set'}
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={state.account.appLockEnabled}
                onClick={onToggleAppLock}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  state.account.appLockEnabled ? 'bg-[#0B5E56]' : 'bg-[#121E1D]/20'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    state.account.appLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {editingPin && (
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ''))}
                className="w-28 min-h-[40px] px-3 rounded-xl bg-white/85 border border-white text-sm font-bold tabular-nums"
                placeholder="1234"
              />
              <button
                type="button"
                onClick={() => {
                  if (pinDraft.length === 4) {
                    onUpdateErPin(pinDraft);
                    setEditingPin(false);
                  }
                }}
                className="min-h-[40px] px-4 rounded-xl bg-[#0B5E56] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'সংরক্ষণ' : 'Save PIN'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Per-person reminders */}
      <div className="glass-panel rounded-3xl p-5 space-y-3">
        <p className="text-base font-bold text-[#121E1D]">{t.remindersFor(relLabel)}</p>

        <div className="flex items-center justify-between gap-2 min-h-[40px]">
          <span className="text-sm text-[#121E1D]">{t.voiceLanguage}</span>
          <div className="flex gap-1.5">
            {(['bn', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onUpdatePersonVoiceLang(l)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                  person.reminderSettings.voiceLanguage === l
                    ? 'bg-[#0B5E56] text-white'
                    : 'bg-white/75 text-[#121E1D]'
                }`}
              >
                {l === 'bn' ? 'বাংলা' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#121E1D]/8 pt-2.5">
          <span className="text-sm text-[#121E1D]">
            {t.alarmSoundVolume} ({person.reminderSettings.alarmSound})
          </span>
          <input
            type="range"
            min={20}
            max={100}
            value={person.reminderSettings.alarmVolume}
            onChange={(e) => onUpdateAlarmVolume(Number(e.target.value))}
            aria-label="Alarm volume"
            className="w-24 accent-[#0B5E56]"
          />
        </div>

        <div className="text-sm text-[#53615F] border-t border-[#121E1D]/8 pt-2.5 space-y-1.5">
          <p>
            {t.callSettingsSub} · {person.reminderSettings.ringtone}
          </p>
          <p className="tabular-nums">
            {t.quietHours}: {person.reminderSettings.quietHoursStart} to{' '}
            {person.reminderSettings.quietHoursEnd}
          </p>
          <p>
            {t.caregivers}: {person.reminderSettings.caregivers.join(', ') || 'None'}
          </p>
        </div>
      </div>

      {/* Free All-Access Plan */}
      <div className="glass-hero rounded-3xl p-5 space-y-3">
        <p className="text-base font-bold text-[#121E1D]">{t.planSection}</p>
        <p className="text-sm text-[#53615F]">{t.subscribedPlanDesc}</p>
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S17)}
          className="w-full min-h-[48px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-sm shadow-md shadow-[#0B5E56]/20 hover:bg-[#084A43]"
        >
          {t.plansSubscribe}
        </button>
      </div>

      {/* Contact support */}
      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S12)}
        className="w-full min-h-[54px] px-5 rounded-2xl glass-panel font-semibold text-base text-[#121E1D] flex items-center justify-between hover:bg-white transition-colors"
      >
        <span>{t.contactSupport}</span>
        <span className="text-sm font-semibold text-[#0B5E56]">→</span>
      </button>

      {/* Mobile Demo Triggers */}
      <div className="lg:hidden grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S16)}
          className="min-h-[46px] px-3 rounded-2xl glass-panel text-xs font-semibold text-[#121E1D] flex items-center justify-center gap-1.5"
        >
          <BellRing className="w-4 h-4 text-[#0B5E56]" />
          <span>{t.testAlarmBtn}</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(ScreenId.S14)}
          className="min-h-[46px] px-3 rounded-2xl glass-panel text-xs font-semibold text-[#121E1D] flex items-center justify-center gap-1.5"
        >
          <PhoneCall className="w-4 h-4 text-[#0B5E56]" />
          <span>{t.testCallBtn}</span>
        </button>
      </div>
    </div>
  );
};

export const SupportChatScreen: React.FC<{
  state: AppState;
  authToken: string | null;
  onSetPermission: (granted: boolean) => void;
  onAddMessages: (userText: string, supportReply: string) => void;
}> = ({ state, authToken, onSetPermission, onAddMessages }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const person = getActivePerson(state);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sendMessageToServer = async (userText: string, overridePerm?: boolean) => {
    setSending(true);
    setError('');
    const perm = overridePerm ?? Boolean(state.supportPermissionGranted);
    const nextHistory = [
      ...state.supportMessages.map((m) => ({ role: m.role, text: m.text })),
      ...(userText ? [{ role: 'user', text: userText }] : []),
    ];

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          messages: nextHistory,
          permissionGranted: perm,
          personName: person.name,
          callSettingsSummary: perm
            ? {
                plan: 'Free All-Access',
                quietHours: `${person.reminderSettings.quietHoursStart} - ${person.reminderSettings.quietHoursEnd}`,
                paused: Boolean(person.pauseWindow?.active),
                voiceLanguage: person.reminderSettings.voiceLanguage,
              }
            : null,
          language: lang,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Support reply failed');
      onAddMessages(userText, json.reply);
      setInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to contact support');
    } finally {
      setSending(false);
    }
  };

  const handlePermissionChoice = (allowed: boolean) => {
    onSetPermission(allowed);
    sendMessageToServer(allowed ? 'Allow' : 'No', allowed);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    sendMessageToServer(input.trim());
  };

  return (
    <div className="flex flex-col min-h-[75vh] justify-between space-y-4">
      <div className="space-y-4">
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.support}
        </h1>

        <div className="space-y-2.5">
          {state.supportMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0B5E56] text-white shadow-md shadow-[#0B5E56]/20'
                    : 'glass-panel text-[#121E1D]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {state.supportPermissionGranted === null && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={sending}
              onClick={() => handlePermissionChoice(true)}
              className="min-h-[48px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-sm hover:bg-[#084A43]"
            >
              {t.allow}
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => handlePermissionChoice(false)}
              className="min-h-[48px] rounded-2xl glass-panel font-semibold text-sm text-[#121E1D] hover:bg-white"
            >
              {t.no}
            </button>
          </div>
        )}

        {!authToken && (
          <p className="text-xs font-medium text-[#8C5314] px-1">
            {lang === 'bn'
              ? 'লাইভ এআই সাপোর্ট ব্যবহার করতে অনুগ্রহ করে আগে সাইন ইন বা ডেমো লগইন করুন।'
              : 'Please sign in or use Demo login first to chat with live AI support.'}
          </p>
        )}

        {error && <p className="text-sm font-medium text-[#8C1D24]">{error}</p>}
      </div>

      <form
        onSubmit={handleSend}
        className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.typeMessage}
          className="flex-1 text-sm bg-transparent outline-none min-h-[40px] px-1"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="min-h-[42px] min-w-[42px] rounded-xl bg-[#0B5E56] text-white flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const CaregiverInboxScreen: React.FC<{
  state: AppState;
  onOpenHistoryForPerson: (personId: string) => void;
  onResolveAlert: (alertId: string) => void;
}> = ({ state, onOpenHistoryForPerson, onResolveAlert }) => {
  const t = COPY[state.language];
  const lang = state.language;

  const handleWhatsApp = (personName: string, title: string) => {
    const msg = encodeURIComponent(
      lang === 'bn'
        ? `হ্যালো ${personName}, সেবা কেয়ার রিমাইন্ডার: ${title}। অনুগ্রহ করে ওষুধ ও স্বাস্থ্যের খোঁজ জানান।`
        : `Hi ${personName}, SebaCare reminder: ${title}. Please confirm how you are feeling.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-2.5">
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.alerts}
        </h1>
        <span className="text-xs font-semibold text-[#0B5E56]">· {t.subscribers}</span>
      </div>

      {state.alerts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-6 text-center text-sm text-[#53615F]">
          {lang === 'bn' ? 'কোনো সতর্কবার্তা নেই' : 'No alerts right now'}
        </div>
      ) : (
        <div className="space-y-3">
          {state.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-3xl p-5 space-y-3.5 ${
                alert.urgent
                  ? 'bg-[#FDF4F4]/90 backdrop-blur-xl border border-[#8C1D24]/30'
                  : 'glass-panel'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-[#121E1D]">{alert.title}</p>
                  <p className="text-xs text-[#53615F] mt-0.5 tabular-nums">{alert.subtitle}</p>
                </div>
                {!alert.resolved && (
                  <button
                    type="button"
                    onClick={() => onResolveAlert(alert.id)}
                    className="text-xs font-semibold text-[#0B5E56] hover:underline"
                  >
                    {lang === 'bn' ? 'সমাধান হয়েছে' : 'Mark seen'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleWhatsApp(alert.personName, alert.title)}
                  className="min-h-[46px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#084A43]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.whatsapp}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenHistoryForPerson(alert.personId)}
                  className="min-h-[46px] rounded-2xl bg-white/80 border border-white font-semibold text-sm text-[#121E1D] hover:bg-white"
                >
                  {t.history} →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlansScreen: React.FC<{
  state: AppState;
  onSubscribe: (coveredPersonIds: string[]) => void;
}> = ({ state, onSubscribe }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const [selectedIds, setSelectedIds] = useState<string[]>(
    state.account.payingForPersonIds.length > 0
      ? state.account.payingForPersonIds
      : state.persons.map((p) => p.id)
  );

  const togglePerson = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
        {t.plans}
      </h1>

      <div className="glass-hero rounded-3xl p-6 space-y-4 border-[#0B5E56]/25">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#0B5E56]">
            {lang === 'bn' ? 'গুগল জেমিনি এআই দ্বারা চালিত' : 'Powered by Google Gemini API'}
          </p>
          <p className="text-2xl font-bold text-[#121E1D]">
            {lang === 'bn' ? 'সব সুবিধা ১০০% ফ্রি (৳০)' : 'All Features Unlocked · Free (৳0)'}
          </p>
        </div>

        <ul className="space-y-2 text-sm text-[#121E1D]">
          <li>· {lang === 'bn' ? 'অফলাইন ওষুধের অ্যালার্ম' : 'Offline medicine alarms'}</li>
          <li>· {lang === 'bn' ? 'এআই প্রেসক্রিপশন আপলোড ও স্ক্যান' : 'AI prescription upload & extraction'}</li>
          <li>· {lang === 'bn' ? 'বাংলা ও ইংরেজিতে এআই ভয়েস কল' : 'AI voice calls in Bangla & English'}</li>
          <li>· {lang === 'bn' ? '৩টি মিসড কলে কেয়ারগিভার সতর্কবার্তা' : 'Missed-call caregiver escalation'}</li>
          <li>· {lang === 'bn' ? 'নিয়মিত স্বাস্থ্য খোঁজ কল ও জরুরি কার্ড' : 'Scheduled health check calls & emergency card'}</li>
        </ul>

        <div className="pt-3 border-t border-[#121E1D]/8 space-y-2">
          <p className="text-xs font-medium text-[#53615F]">
            {lang === 'bn' ? 'যাদের জন্য এআই কল চালু থাকবে:' : 'Enable AI calls for family members:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {state.persons.map((p) => {
              const active = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePerson(p.id)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#0B5E56] text-white shadow-xs'
                      : 'bg-white/75 border border-white text-[#121E1D]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  <span>{translateRelation(p.relation, p.customRelation, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSubscribe(selectedIds)}
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43]"
      >
        {t.subscribe}
      </button>
    </div>
  );
};
