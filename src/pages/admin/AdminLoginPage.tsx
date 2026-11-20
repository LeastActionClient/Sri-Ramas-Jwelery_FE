import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SEO } from '@/components/common/SEO';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid administrative email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          'Invalid credentials or administrative authorization failure.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-maroon-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <SEO noindex title="Administrative Login" description="Private administrative login portal for Sri Ramas Jewellery staff." />

      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-gold-500/40 overflow-hidden">
        {/* Header with Official Logo */}
        <div className="bg-burgundy-950 p-8 text-center border-b border-gold-600/40 relative">
          <div className="w-20 h-20 rounded-full border-2 border-gold-400 p-0.5 mx-auto mb-3 shadow-luxury-gold bg-burgundy-900">
            <img
              src="/logo.jpg"
              alt="Sri Ramas Jewellery"
              className="w-full h-full object-cover object-center rounded-full"
            />
          </div>

          <h1 className="font-serif text-xl sm:text-2xl font-bold text-gold-100 tracking-wide">
            SRI RAMAS JEWELLERY
          </h1>
          <p className="text-xs text-gold-300/80 uppercase tracking-widest mt-0.5">
            Administrative Management Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Enter administrative email"
                  autoComplete="off"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter administrative password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 text-xs focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-stone-400 hover:text-stone-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-stone-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-stone-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-brand-maroon-gradient hover:opacity-95 text-gold-200 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-gold-400" />
                  <span>Sign In to Staff Portal</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <a
              href="/"
              className="inline-flex items-center justify-center text-xs text-stone-500 hover:text-burgundy-900 transition-colors whitespace-nowrap"
            >
              ← Back To Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
