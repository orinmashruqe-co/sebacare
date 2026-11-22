import React, { useState } from 'react';
import { ShieldAlert, HeartPulse, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { AppState, Language } from '../types';
import { COPY } from '../i18n';
import { createDemoState, createFreshAccountState } from '../data/demoData';

interface SignInScreenProps {
  language: Language;
  onToggleLanguage: () => void;
  onAuthSuccess: (token: string, nextState: AppState) => void;
  onGoRegister: () => void;
  onEmergencyNoLogin: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  language,
  onToggleLanguage,
  onAuthSuccess,
  onGoRegister,
  onEmergencyNoLogin,
}) => {
  const t = COPY[language];
  const [mobileOrNid, setMobileOrNid] = useState('');
  const [password, setPassword] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [previewOtpHint, setPreviewOtpHint] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobileOrNid.trim()) {
      setError(language === 'bn' ? 'মোবাইল নম্বর বা এনআইডি লিখুন' : 'Please enter mobile number or NID');
      return;
    }

    setLoading(true);
    try {
      if (otpMode) {
        if (!otpRequested) {
          const res = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileOrNid: mobileOrNid.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not send OTP');
          setOtpRequested(true);
          if (data.previewOtp) setPreviewOtpHint(String(data.previewOtp));
        } else {
          if (otpCode.trim().length < 4) {
            throw new Error(language === 'bn' ? '৪ সংখ্যার ওটিপি লিখুন' : 'Enter 4-digit OTP');
          }
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileOrNid: mobileOrNid.trim(), code: otpCode.trim() }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid OTP');
          onAuthSuccess(data.token, { ...data.state, language });
        }
      } else {
        if (!password) {
          throw new Error(language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Please enter your password');
        }
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileOrNid: mobileOrNid.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign in failed');
        onAuthSuccess(data.token, { ...data.state, language });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDemoState: createDemoState(language) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      onAuthSuccess(data.token, { ...data.state, language });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to start demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-5 py-8 max-w-md mx-auto w-full">
      <div className="space-y-7">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-[#0B5E56] text-white flex items-center justify-center shadow-md shadow-[#0B5E56]/25">
              <HeartPulse className="w-5 h-5" />
            </span>
            <span className="font-editorial text-xl font-semibold tracking-tight">{t.appName}</span>
          </div>
          <button
            type="button"
            onClick={onToggleLanguage}
            className="min-h-[44px] px-3.5 rounded-2xl glass-panel text-xs font-semibold hover:bg-white transition-colors"
          >
            {language === 'bn' ? 'বাংলা | EN' : 'EN | বাংলা'}
          </button>
        </div>

        {/* Masthead */}
        <div className="space-y-1.5">
          <p className="font-medium text-sm text-[#0B5E56]">
            {language === 'bn' ? 'পরিবারের সুস্থতার সঙ্গী · ১০০% ফ্রি' : 'Family care, 100% free'}
          </p>
          <h1 className="font-editorial text-4xl font-semibold tracking-tight text-[#121E1D] leading-[1.12]">
            {t.signIn}
          </h1>
          <p className="text-sm text-[#53615F] leading-relaxed">
            {language === 'bn'
              ? 'নিজের আইডি খুলুন বা লগইন করুন — প্রেসক্রিপশন আপলোড, এআই কল ও অ্যালার্ম সম্পূর্ণ ফ্রি।'
              : 'Create your own ID or sign in — prescription AI scan, alarms, and Bangla voice calls included free.'}
          </p>
        </div>

        {/* Unified Frosted Form Ledger */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-hero rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
            <div className="px-5 py-3.5">
              <label htmlFor="signin-mobile" className="block text-xs font-medium text-[#53615F]">
                {t.mobileOrNid}
              </label>
              <input
                id="signin-mobile"
                type="text"
                value={mobileOrNid}
                onChange={(e) => {
                  setMobileOrNid(e.target.value);
                  setOtpRequested(false);
                }}
                placeholder="01XXXXXXXXX"
                className="mt-1 w-full text-base font-semibold text-[#121E1D] bg-transparent outline-none tabular-nums"
              />
            </div>

            {!otpMode ? (
              <div className="px-5 py-3.5">
                <label htmlFor="signin-password" className="block text-xs font-medium text-[#53615F]">
                  {t.password}
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full text-base font-semibold text-[#121E1D] bg-transparent outline-none"
                />
              </div>
            ) : (
              otpRequested && (
                <div className="px-5 py-3.5 bg-[#0B5E56]/5 space-y-1">
                  <label htmlFor="signin-otp" className="block text-xs font-semibold text-[#0B5E56]">
                    {language === 'bn' ? '৪ সংখ্যার ওটিপি লিখুন' : 'Enter 4-digit OTP'}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <KeyRound className="w-4 h-4 text-[#0B5E56]" />
                    <input
                      id="signin-otp"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1234"
                      className="w-full text-base font-bold tracking-widest text-[#121E1D] bg-transparent outline-none tabular-nums"
                    />
                  </div>
                  {previewOtpHint && (
                    <p className="text-xs text-[#0B5E56] font-medium tabular-nums">
                      {language === 'bn'
                        ? `ডেমো ওটিপি কোড: ${previewOtpHint}`
                        : `Your OTP code: ${previewOtpHint}`}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {otpMode
                ? otpRequested
                  ? language === 'bn'
                    ? 'ওটিপি যাচাই করুন'
                    : 'Verify OTP'
                  : language === 'bn'
                    ? 'ওটিপি পাঠান'
                    : 'Send OTP'
                : t.signIn}
            </span>
          </button>
        </form>

        {/* Secondary Glass Actions */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOtpMode((v) => !v);
                setOtpRequested(false);
                setError('');
              }}
              className="min-h-[48px] px-3 rounded-2xl glass-panel font-semibold text-sm text-[#121E1D] hover:bg-white transition-colors"
            >
              {otpMode
                ? language === 'bn'
                  ? 'পাসওয়ার্ড ব্যবহার'
                  : 'Use password'
                : t.signInWithOtp}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleDemoLogin}
              className="min-h-[48px] px-3 rounded-2xl glass-panel font-semibold text-sm text-[#0B5E56] hover:bg-white transition-colors"
            >
              {t.demoLogin}
            </button>
          </div>

          <button
            type="button"
            onClick={onGoRegister}
            className="w-full min-h-[48px] rounded-2xl glass-panel font-semibold text-sm text-[#121E1D] hover:bg-white transition-colors"
          >
            {t.createAccount}
          </button>

          <button
            type="button"
            onClick={onEmergencyNoLogin}
            className="w-full min-h-[48px] rounded-2xl bg-[#FDF4F4]/80 backdrop-blur-md border border-[#8C1D24]/25 font-semibold text-sm text-[#8C1D24] flex items-center justify-center gap-2 hover:bg-[#FCE8E9] transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.emergencyNoLogin}</span>
          </button>
        </div>
      </div>

      <div className="pt-8 flex items-center justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={onGoRegister}
          className="font-semibold text-[#0B5E56] hover:underline min-h-[44px] px-2"
        >
          {t.createAccount}
        </button>
        <span aria-hidden="true" className="text-[#9CA3AF]">·</span>
        <button
          type="button"
          onClick={onToggleLanguage}
          className="font-medium text-[#53615F] hover:text-[#121E1D] min-h-[44px] px-2"
        >
          বাংলা | EN
        </button>
      </div>
    </div>
  );
};

interface RegisterScreenProps {
  language: Language;
  onBack: () => void;
  onAuthSuccess: (token: string, nextState: AppState) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  language,
  onBack,
  onAuthSuccess,
}) => {
  const t = COPY[language];
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('01');
  const [nid, setNid] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || mobile.trim().length < 6 || password.length < 4) {
      setError(
        language === 'bn'
          ? 'নাম, মোবাইল নম্বর এবং কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন'
          : 'Enter full name, mobile number, and password (min 4 characters)'
      );
      return;
    }

    setLoading(true);
    try {
      const initialState = createFreshAccountState({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        nid: nid.trim(),
        age: age.trim(),
        gender,
        bloodGroup,
        language,
      });

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          nid: nid.trim(),
          age: age.trim(),
          gender,
          bloodGroup,
          password,
          initialState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onAuthSuccess(data.token, data.state);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-5 py-6 max-w-md mx-auto w-full">
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl hover:bg-white/60"
            aria-label={t.back}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="font-medium text-xs text-[#0B5E56]">
              {language === 'bn' ? 'নতুন পরিবার প্রোফাইল' : 'New personal care ID'}
            </p>
            <h1 className="font-editorial text-3xl font-semibold tracking-tight">{t.createAccount}</h1>
          </div>
        </div>

        <form id="register-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="glass-panel rounded-3xl divide-y divide-[#121E1D]/8 overflow-hidden">
            <div className="px-5 py-3.5">
              <label className="block text-xs font-medium text-[#53615F]">{t.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: রহিম মিয়া' : 'e.g. Rahim Mia'}
                className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
              />
            </div>

            <div className="px-5 py-3.5">
              <label className="block text-xs font-medium text-[#53615F]">{t.mobileNumber}</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-1 w-full text-base font-semibold outline-none bg-transparent tabular-nums"
              />
            </div>

            <div className="px-5 py-3.5">
              <label className="block text-xs font-medium text-[#53615F]">{t.nid}</label>
              <input
                type="text"
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                placeholder="19XXXXXXXXXXX"
                className="mt-1 w-full text-base font-semibold outline-none bg-transparent tabular-nums"
              />
            </div>

            <div className="px-5 py-3.5 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#53615F]">{t.age}</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="42"
                  className="mt-1 w-full text-base font-semibold outline-none bg-transparent tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#53615F]">
                  {language === 'bn' ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
                >
                  <option value="Male">{language === 'bn' ? 'পুরুষ' : 'Male'}</option>
                  <option value="Female">{language === 'bn' ? 'নারী' : 'Female'}</option>
                  <option value="Other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3.5">
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

            <div className="px-5 py-3.5">
              <label className="block text-xs font-medium text-[#53615F]">{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full text-base font-semibold outline-none bg-transparent"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-[#8C1D24] px-1">{error}</p>}
        </form>
      </div>

      <button
        type="submit"
        form="register-form"
        disabled={loading}
        className="mt-6 w-full min-h-[54px] rounded-2xl bg-[#0B5E56] text-white font-semibold text-base shadow-lg shadow-[#0B5E56]/25 hover:bg-[#084A43] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{t.createAccount}</span>
      </button>
    </div>
  );
};
