import React from 'react';
import {
  Home,
  Users,
  Clock,
  Settings,
  ArrowLeft,
  ShieldAlert,
  BellRing,
  PhoneCall,
  HeartPulse,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { AppState, ScreenId } from '../types';
import { COPY, translateRelation } from '../i18n';
import { getActivePerson, getPersonTodayStats } from '../data/demoData';

interface AppShellProps {
  state: AppState;
  screen: ScreenId;
  title?: string;
  showBack?: boolean;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
  onToggleLanguage: () => void;
  onSwitchPerson: (personId: string) => void;
  onSignOut?: () => void;
  children: React.ReactNode;
}

const MAIN_TAB_SCREENS = new Set<ScreenId>([
  ScreenId.S2a,
  ScreenId.S2b,
  ScreenId.S3a,
  ScreenId.S7,
  ScreenId.S11,
]);

const FULLSCREEN_NO_CHROME = new Set<ScreenId>([
  ScreenId.S1a,
  ScreenId.S1b,
  ScreenId.S14,
  ScreenId.S16,
]);

export const AppShell: React.FC<AppShellProps> = ({
  state,
  screen,
  title,
  showBack,
  onBack,
  onNavigate,
  onToggleLanguage,
  onSwitchPerson,
  onSignOut,
  children,
}) => {
  const t = COPY[state.language];
  const activePerson = getActivePerson(state);
  const hasMedicines = state.medicines.length > 0;
  const homeScreen = hasMedicines ? ScreenId.S2b : ScreenId.S2a;
  const showBottomTabs = MAIN_TAB_SCREENS.has(screen);
  const isFullscreen = FULLSCREEN_NO_CHROME.has(screen);

  if (isFullscreen) {
    return (
      <div className="min-h-screen text-[#121E1D] flex flex-col">
        {children}
      </div>
    );
  }

  const activeStats = getPersonTodayStats(state, activePerson.id);

  return (
    <div className="min-h-screen text-[#121E1D]">
      {/* Mobile Frosted Sticky Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#F3EFE7]/75 backdrop-blur-2xl border-b border-white/75 px-4 flex items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[#121E1D] hover:bg-white/60 active:scale-95 transition-all"
              aria-label={t.back}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#0B5E56] text-white flex items-center justify-center shadow-sm shadow-[#0B5E56]/25 shrink-0">
                <HeartPulse className="w-4 h-4" />
              </span>
              <span className="font-editorial font-semibold text-lg tracking-tight whitespace-nowrap">
                {t.appName}
              </span>
            </div>
          )}
          {showBack && title && (
            <h1 className="font-editorial font-semibold text-lg truncate">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="min-h-[36px] px-3 rounded-xl bg-white/75 backdrop-blur-md border border-white/90 text-xs font-semibold text-[#121E1D] hover:bg-white transition-colors whitespace-nowrap shadow-xs"
          >
            {state.language === 'bn' ? 'বাং | EN' : 'EN | বাং'}
          </button>
        </div>
      </header>

      {/* Desktop Multi-Column Editorial Glass Shell (>= lg) */}
      <div className="max-w-6xl mx-auto lg:px-8 lg:py-8 lg:grid lg:grid-cols-[248px_minmax(0,1fr)_284px] lg:gap-7 items-start">
        {/* Desktop Left Frosted Rail */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-8 no-print">
          <div className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#121E1D]/8">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#0B5E56] text-white flex items-center justify-center shadow-md shadow-[#0B5E56]/20">
                  <HeartPulse className="w-4.5 h-4.5" />
                </span>
                <span className="font-editorial font-semibold text-xl tracking-tight">
                  {t.appName}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleLanguage}
                className="px-2.5 py-1.5 rounded-xl bg-white/70 border border-[#121E1D]/10 text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap"
              >
                {state.language === 'bn' ? 'বাং | EN' : 'EN | বাং'}
              </button>
            </div>

            <nav className="mt-3 flex flex-col gap-1" aria-label="Main navigation">
              {[
                {
                  id: homeScreen,
                  label: t.navHome,
                  icon: Home,
                  active: screen === ScreenId.S2a || screen === ScreenId.S2b,
                },
                {
                  id: ScreenId.S3a,
                  label: t.navFamily,
                  icon: Users,
                  active: screen === ScreenId.S3a || screen === ScreenId.S3b || screen === ScreenId.S4,
                },
                {
                  id: ScreenId.S7,
                  label: t.navHistory,
                  icon: Clock,
                  active: screen === ScreenId.S7,
                },
                {
                  id: ScreenId.S11,
                  label: t.navSettings,
                  icon: Settings,
                  active: screen === ScreenId.S11,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`w-full min-h-[44px] px-3.5 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
                      item.active
                        ? 'bg-[#0B5E56] text-white shadow-md shadow-[#0B5E56]/20'
                        : 'text-[#42504E] hover:bg-white/70 hover:text-[#121E1D]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-[#121E1D]/8 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate(ScreenId.S10a)}
                className="w-full min-h-[44px] px-3.5 rounded-2xl border border-[#8C1D24]/25 bg-[#FDF4F4]/80 text-[#8C1D24] text-sm font-semibold flex items-center gap-2.5 hover:bg-[#FCE8E9] transition-colors"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.emergencyCard}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(ScreenId.S12)}
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-white/55 border border-white text-[#121E1D] text-sm font-medium flex items-center gap-2.5 hover:bg-white transition-colors"
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-[#0B5E56]" />
                <span className="truncate">{t.support}</span>
              </button>
            </div>
          </div>

          {state.isAuthenticated && (
            <div className="glass-panel rounded-3xl p-4 flex flex-col gap-2">
              <p className="font-medium text-xs text-[#53615F]">
                {state.language === 'bn' ? 'দ্রুত পরীক্ষা' : 'Live simulations'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate(ScreenId.S16)}
                className="w-full min-h-[40px] px-3 rounded-xl bg-white/60 border border-white text-xs font-semibold text-[#121E1D] flex items-center gap-2 hover:bg-white transition-colors"
              >
                <BellRing className="w-3.5 h-3.5 text-[#0B5E56]" />
                <span className="truncate">{t.testAlarmBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate(ScreenId.S14)}
                className="w-full min-h-[40px] px-3 rounded-xl bg-white/60 border border-white text-xs font-semibold text-[#121E1D] flex items-center gap-2 hover:bg-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#0B5E56]" />
                <span className="truncate">{t.testCallBtn}</span>
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-1 w-full min-h-[40px] px-3 rounded-xl bg-[#FDF4F4]/70 border border-[#8C1D24]/15 text-xs font-semibold text-[#8C1D24] flex items-center gap-2 hover:bg-[#FCE8E9] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="truncate">{t.signOut}</span>
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Main Active Screen Canvas */}
        <main className={`min-w-0 px-4 pt-5 lg:pt-0 ${showBottomTabs ? 'pb-24 lg:pb-10' : 'pb-12'}`}>
          {showBack && (
            <div className="hidden lg:flex items-center gap-3 mb-5 no-print">
              <button
                type="button"
                onClick={onBack}
                className="min-h-[44px] px-3.5 rounded-2xl glass-panel flex items-center gap-2 text-sm font-semibold text-[#121E1D] hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.back}</span>
              </button>
              {title && (
                <h2 className="font-editorial text-2xl font-semibold tracking-tight text-[#121E1D]">
                  {title}
                </h2>
              )}
            </div>
          )}
          <div className="max-w-xl mx-auto lg:max-w-none">{children}</div>
        </main>

        {/* Desktop Right Editorial Context Rail */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-8 no-print">
          {state.isAuthenticated && (
            <div className="glass-panel rounded-3xl p-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#121E1D]/8">
                <span className="font-medium text-xs text-[#53615F]">
                  {state.language === 'bn' ? 'সক্রিয় প্রোফাইল' : 'Care profile'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(ScreenId.S4)}
                  className="text-xs font-semibold text-[#0B5E56] hover:underline"
                >
                  {state.language === 'bn' ? 'মেনু' : 'Open hub'} →
                </button>
              </div>
              <div className="mt-3.5">
                <p className="font-editorial text-xl font-semibold text-[#121E1D] leading-snug">
                  {translateRelation(activePerson.relation, activePerson.customRelation, state.language)} · {activePerson.name}
                </p>
                <p className="text-xs text-[#53615F] mt-1 tabular-nums">
                  {activePerson.bloodGroup} · {t.takenCountOf(activeStats.taken, activeStats.total)}
                </p>
              </div>

              {state.persons.length > 1 && (
                <div className="mt-4 pt-3.5 border-t border-[#121E1D]/8">
                  <p className="text-xs text-[#53615F] mb-2">
                    {state.language === 'bn' ? 'সদস্য পরিবর্তন' : 'Switch member'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.persons.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSwitchPerson(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          p.id === activePerson.id
                            ? 'bg-[#0B5E56] text-white shadow-sm'
                            : 'bg-white/65 border border-white text-[#121E1D] hover:bg-white'
                        }`}
                      >
                        {translateRelation(p.relation, p.customRelation, state.language)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="glass-panel rounded-3xl p-5">
            <p className="font-editorial text-base font-semibold text-[#121E1D]">
              {t.subscribedPlanDesc}
            </p>
            <p className="text-xs text-[#53615F] mt-1.5 leading-relaxed">
              {state.language === 'bn'
                ? 'ফোন বন্ধ থাকলেও অফলাইন অ্যালার্ম বাজে, সাথে প্রেসক্রিপশন স্ক্যান ও এআই কল ফ্রি।'
                : 'Offline alarms, AI prescription upload, and Bangla voice calls are all unlocked free.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(ScreenId.S8a)}
              className="mt-3.5 w-full min-h-[42px] rounded-2xl bg-[#0B5E56]/10 border border-[#0B5E56]/20 text-[#0B5E56] text-xs font-bold hover:bg-[#0B5E56]/15 transition-all"
            >
              {t.scanPrescription}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Frosted Bottom Tab Bar (< lg) */}
      {showBottomTabs && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F3EFE7]/80 backdrop-blur-2xl border-t border-white/85 pb-safe no-print"
          aria-label="Bottom tabs"
        >
          <div className="grid grid-cols-4 h-16 max-w-xl mx-auto">
            {[
              {
                id: homeScreen,
                label: t.navHome,
                icon: Home,
                active: screen === ScreenId.S2a || screen === ScreenId.S2b,
              },
              {
                id: ScreenId.S3a,
                label: t.navFamily,
                icon: Users,
                active: screen === ScreenId.S3a || screen === ScreenId.S3b || screen === ScreenId.S4,
              },
              {
                id: ScreenId.S7,
                label: t.navHistory,
                icon: Clock,
                active: screen === ScreenId.S7,
              },
              {
                id: ScreenId.S11,
                label: t.navSettings,
                icon: Settings,
                active: screen === ScreenId.S11,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  className={`flex flex-col items-center justify-center min-h-[44px] relative transition-colors ${
                    tab.active ? 'text-[#0B5E56]' : 'text-[#53615F] hover:text-[#121E1D]'
                  }`}
                >
                  {tab.active && (
                    <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#0B5E56]" />
                  )}
                  <Icon className={`w-5 h-5 ${tab.active ? 'stroke-[2.25]' : 'stroke-[1.65]'}`} />
                  <span className="text-[11px] font-semibold mt-1 tracking-tight whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
