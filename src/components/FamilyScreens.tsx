import React, { useState } from 'react';
import { ChevronRight, Inbox, Plus } from 'lucide-react';
import { AppState, PersonProfile, RelationType, ScreenId } from '../types';
import { COPY, formatDigits, translateRelation } from '../i18n';
import { getActivePerson, getPersonTodayStats } from '../data/demoData';

export const FamilyListScreen: React.FC<{
  state: AppState;
  onSelectPerson: (personId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}> = ({ state, onSelectPerson, onNavigate }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const unresolvedAlerts = state.alerts.filter((a) => !a.resolved).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium text-sm text-[#0B5E56]">
          {lang === 'bn' ? 'যত্নের তালিকা' : 'Care circle'}
        </p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {t.family}
        </h1>
      </div>

      {/* Unified Glass Roster with Editorial Hairline Dividers */}
      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        {state.persons.map((person) => {
          const stats = getPersonTodayStats(state, person.id);
          const relLabel = translateRelation(person.relation, person.customRelation, lang);
          let statusText = '';
          if (stats.alertsCount > 0) {
            statusText =
              lang === 'bn'
                ? `${formatDigits(stats.alertsCount, lang)}টি সতর্কবার্তা`
                : `${stats.alertsCount} alert`;
          } else if (stats.total > 0 && stats.taken >= stats.total) {
            statusText = lang === 'bn' ? 'সব খাওয়া হয়েছে' : 'all done';
          } else {
            statusText = t.takenCountOf(stats.taken, stats.total);
          }

          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelectPerson(person.id)}
              className="w-full min-h-[72px] px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/60 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#0B5E56]/10 border border-[#0B5E56]/15 text-[#0B5E56] font-editorial font-semibold text-lg flex items-center justify-center shrink-0">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-editorial text-lg font-semibold text-[#121E1D] truncate">
                    {person.name} · {relLabel}
                  </p>
                  <p
                    className={`text-xs mt-0.5 tabular-nums ${
                      stats.alertsCount > 0 ? 'text-[#8C5314] font-semibold' : 'text-[#53615F]'
                    }`}
                  >
                    {person.bloodGroup} · {statusText}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S3b)}
        className="w-full min-h-[54px] px-4 rounded-2xl bg-white/45 backdrop-blur-md border border-dashed border-[#0B5E56]/40 text-[#0B5E56] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/75 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>{t.addFamilyMember.replace(/^\+\s*/, '')}</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate(ScreenId.S13)}
        className="w-full min-h-[56px] px-5 rounded-2xl glass-panel font-semibold text-base text-[#121E1D] flex items-center justify-between hover:bg-white transition-colors"
      >
        <span className="flex items-center gap-3">
          <Inbox className="w-5 h-5 text-[#0B5E56]" />
          <span>
            {t.caregiverInbox} · {t.newAlerts(unresolvedAlerts)}
          </span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#0B5E56]" />
      </button>
    </div>
  );
};

export const AddFamilyMemberScreen: React.FC<{
  state: AppState;
  onSaveMember: (member: Omit<PersonProfile, 'id' | 'reminderSettings' | 'oneTimeReminders'>) => void;
}> = ({ state, onSaveMember }) => {
  const t = COPY[state.language];
  const lang = state.language;
  const relations: RelationType[] = ['Father', 'Mother', 'Spouse', 'Child', 'Other'];

  const [relation, setRelation] = useState<RelationType>('Father');
  const [customRelation, setCustomRelation] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [allergies, setAllergies] = useState('');
  const [error, setError] = useState('');

  const numericAge = Number(age) || 0;
  const isChild = relation === 'Child' || (numericAge > 0 && numericAge < 18);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(lang === 'bn' ? 'সদস্যের নাম লিখুন' : 'Please enter full name');
      return;
    }
    onSaveMember({
      name: name.trim(),
      relation,
      customRelation: relation === 'Other' ? customRelation.trim() : undefined,
      age: numericAge || 30,
      idNumber: idNumber.trim() || '—',
      idType: isChild ? 'Birth registration' : 'NID',
      bloodGroup,
      allergies: allergies.trim() || 'None known',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="font-medium text-sm text-[#0B5E56]">
          {lang === 'bn' ? 'নতুন প্রোফাইল' : 'New care profile'}
        </p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {lang === 'bn' ? 'পরিবারের সদস্য যোগ করুন' : 'Add family member'}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {relations.map((rel) => (
          <button
            key={rel}
            type="button"
            onClick={() => setRelation(rel)}
            className={`min-h-[44px] px-4 rounded-2xl text-sm font-semibold transition-all ${
              relation === rel
                ? 'bg-[#0B5E56] text-white shadow-md shadow-[#0B5E56]/20'
                : 'glass-panel text-[#121E1D] hover:bg-white'
            }`}
          >
            {translateRelation(rel, undefined, lang)}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        {relation === 'Other' && (
          <div className="px-5 py-3.5">
            <label className="block text-xs font-medium text-[#53615F]">{t.otherRelationPrompt}</label>
            <input
              type="text"
              value={customRelation}
              onChange={(e) => setCustomRelation(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: ভাই, সন্তান ২' : 'Brother, Child 2…'}
              className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
            />
          </div>
        )}

        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">{t.fullName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === 'bn' ? 'সদস্যের পূর্ণ নাম' : 'Member full name'}
            className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
          />
        </div>

        <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#53615F]">{t.age}</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="65"
              className="mt-1 w-full text-base font-semibold outline-none bg-transparent tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#53615F]">{t.bloodGroup}</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
            >
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">
            {isChild
              ? lang === 'bn'
                ? 'জন্ম নিবন্ধন নম্বর (শিশু)'
                : 'Birth registration (child)'
              : lang === 'bn'
                ? 'এনআইডি নম্বর (প্রাপ্তবয়স্ক)'
                : 'NID (adult)'}
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="XXXXXXXXXX"
            className="mt-1 w-full text-base font-semibold outline-none bg-transparent tabular-nums"
          />
        </div>

        <div className="px-5 py-3.5">
          <label className="block text-xs font-medium text-[#53615F]">
            {lang === 'bn' ? 'অ্যালার্জি' : 'Allergies'}
          </label>
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: পেনিসিলিন' : 'e.g. penicillin'}
            className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
          />
        </div>
      </div>

      {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}

      <button
        type="submit"
        className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] transition-all"
      >
        {t.saveMember}
      </button>
    </form>
  );
};

export const PersonMenuScreen: React.FC<{
  state: AppState;
  onNavigate: (screen: ScreenId) => void;
}> = ({ state, onNavigate }) => {
  const t = COPY[state.language];
  const person = getActivePerson(state);
  const relTitle = translateRelation(person.relation, person.customRelation, state.language);

  const rows: Array<{ label: string; screen: ScreenId; isPro?: boolean }> = [
    { label: t.prescriptions, screen: ScreenId.S15a },
    { label: t.medicines, screen: ScreenId.S5 },
    { label: t.pauseSchedule, screen: ScreenId.S6a },
    { label: t.historyReports, screen: ScreenId.S7 },
    { label: t.scanPrescription, screen: ScreenId.S8a },
    { label: t.reminderPrefs, screen: ScreenId.S11 },
    { label: t.healthCheckCalls, screen: ScreenId.S18, isPro: true },
    { label: t.healthCard, screen: ScreenId.S10a },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="font-medium text-sm text-[#0B5E56]">
          {person.name} · {formatDigits(person.age, state.language)}{' '}
          {state.language === 'bn' ? 'বছর' : 'yrs'} · {person.bloodGroup}
        </p>
        <h1 className="font-editorial text-3xl font-semibold tracking-tight text-[#121E1D]">
          {relTitle}
        </h1>
      </div>

      {/* Unified Glass Directory */}
      <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onNavigate(row.screen)}
            className="w-full min-h-[58px] px-5 flex items-center justify-between gap-3 text-left hover:bg-white/60 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-base font-semibold text-[#121E1D]">
              <span>{row.label}</span>
              {row.isPro && (
                <span className="text-xs font-semibold text-[#8C5314]">
                  · {t.pro}
                </span>
              )}
            </span>
            <ChevronRight className="w-5 h-5 text-[#0B5E56] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
