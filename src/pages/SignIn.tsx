import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useLanguage } from '../context/LanguageContext';
import { ErrorMessage } from '../components/ErrorMessage';

export const SignIn: React.FC = () => {
  const { loginWithOtp, requestOtp, user, isAuthenticated } = useAuth();
  const { navigate, queryParams, setMeta } = useRouter();
  const { t } = useLanguage();

  const redirectPath = queryParams.get('redirect') || '/';

  // Step 1: phone input, Step 2: 6-digit code verification
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [detectedNetwork, setDetectedNetwork] = useState<'Ethio Telecom' | 'Safaricom Ethiopia' | null>(null);

  // 6 digit code inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Resend countdown
  const [resendSeconds, setResendSeconds] = useState<number>(60);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMeta('Sign In to Cone - Addis Ababa Classifieds', 'Sign in with your Ethiopian mobile phone number.');

    if (isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, redirectPath]);

  // Network detection as user types
  useEffect(() => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (/^(?:\+251|0)?9\d*$/.test(cleaned)) {
      setDetectedNetwork('Ethio Telecom');
    } else if (/^(?:\+251|0)?7\d*$/.test(cleaned)) {
      setDetectedNetwork('Safaricom Ethiopia');
    } else {
      setDetectedNetwork(null);
    }
  }, [phone]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any;
    if (step === 'verify' && resendSeconds > 0) {
      timer = setInterval(() => {
        setResendSeconds((s) => s - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  // Step 1: Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const isValid = /^(?:\+251|0)?(9|7)\d{8}$/.test(cleaned);

    if (!isValid) {
      setError({
        code: 'INVALID_PHONE',
        message: 'Please enter a valid Ethiopian mobile number (09.. or 07..)',
        fields: { phone: 'Must be a 9-digit Ethiopian mobile number' },
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await requestOtp(phone);
      setInfoMessage(res.message);
      setStep('verify');
      setResendSeconds(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Take last char if pasted
    setOtpDigits(newDigits);

    // Auto advance focus
    if (value && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const newDigits = [...otpDigits];
      pasted.split('').forEach((char, idx) => {
        if (idx < 6) newDigits[idx] = char;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(5, pasted.length);
      digitInputRefs.current[nextFocus]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join('');

    if (code.length !== 6) {
      setError({
        code: 'INCOMPLETE_CODE',
        message: 'Please enter all 6 digits of the verification code.',
        fields: { code: '6 digits required' },
      });
      return;
    }

    if (!privacyConsent) {
      setError({
        code: 'CONSENT_REQUIRED',
        message: t.auth.privacyError,
        fields: { privacy_consent: 'Required for account registration' },
      });
      return;
    }

    try {
      setIsLoading(true);
      await loginWithOtp(phone, code, privacyConsent);
      navigate(redirectPath);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick autofill mock code for easy testing
  const handleUseMockCode = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2.5 cursor-pointer mb-6"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-2xl shadow-sm">
            ▲
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-950">CONE</span>
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {step === 'phone' ? t.auth.signInTitle : t.auth.verifyTitle}
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500 max-w-sm mx-auto">
          {step === 'phone'
            ? t.auth.signInSub
            : t.auth.verifySub.replace('{phone}', phone)}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* Error Banner */}
          <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-4" />

          {/* Info Toast */}
          {infoMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            /* STEP 1: Phone input */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  {t.auth.phoneLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-28 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {detectedNetwork && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                        {detectedNetwork}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">{t.auth.phoneHint}</p>
              </div>

              {/* Privacy consent checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    {t.auth.privacyConsent}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3 px-4 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{isLoading ? t.auth.sendingCode : t.auth.sendCode}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Quick sample phone buttons for fast demo */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quick demo phone:
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhone('0911234567')}
                    className="flex-1 rounded-lg bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-mono font-medium text-slate-700"
                  >
                    091 123 4567
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhone('0712345678')}
                    className="flex-1 rounded-lg bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-mono font-medium text-slate-700"
                  >
                    071 234 5678
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-digit code */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2 text-center">
                  {t.auth.codeLabel}
                </label>

                {/* 6 input boxes */}
                <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handlePasteOtp}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-12 w-11 rounded-xl border border-slate-300 bg-slate-50 text-center font-mono text-xl font-black text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              {/* Mock hint button */}
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Mock Code: <strong>123456</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleUseMockCode}
                  className="font-bold underline text-emerald-900 hover:text-emerald-950"
                >
                  Autofill
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 py-3 px-4 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{isLoading ? t.auth.verifying : t.auth.verifyButton}</span>
                <CheckCircle className="h-4 w-4" />
              </button>

              {/* Resend and change number controls */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="hover:text-slate-800 font-medium"
                >
                  &larr; {t.auth.changePhone}
                </button>

                {resendSeconds > 0 ? (
                  <span className="text-slate-400 font-mono">
                    {t.auth.resendIn.replace('{seconds}', String(resendSeconds))}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{t.auth.resendCode}</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Safe authentication badge */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Encrypted Ethiopian SMS verification • No password needed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
