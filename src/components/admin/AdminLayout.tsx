import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Gem,
  FolderTree,
  TrendingUp,
  MessageSquareText,
  Award,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Key,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Store,
  Images
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRates } from '@/hooks/useRates';
import { formatPaiseToInr } from '@/utils/currency';
import { authApi } from '@/services/api/auth.api';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const { data: rates } = useRates();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  React.useEffect(() => {
    if (!changePasswordOpen && !sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setChangePasswordOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changePasswordOpen, sidebarOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-gold-400 border-t-burgundy-900 rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm font-semibold text-burgundy-950">
            Verifying Administrative Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Product Catalogue', path: '/admin/products', icon: Gem },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Bullion Rates', path: '/admin/rates', icon: TrendingUp },
    { label: 'Enquiry CRM', path: '/admin/enquiries', icon: MessageSquareText },
    { label: 'Savings Schemes', path: '/admin/schemes', icon: Award },
    { label: 'Homepage Banners', path: '/admin/banners', icon: Images },
    { label: 'Showrooms & CMS', path: '/admin/cms', icon: Store },
    { label: 'System Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters long');
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPwSuccess('Password successfully updated! Your account is now secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (refreshUser) await refreshUser();
      setTimeout(() => {
        setChangePasswordOpen(false);
        setPwSuccess(null);
      }, 2000);
    } catch (err: any) {
      const errorData = err?.response?.data?.error;
      if (Array.isArray(errorData?.details) && errorData.details.length > 0) {
        setPwError(errorData.details.map((d: any) => d.message).join('. '));
      } else {
        setPwError(errorData?.message || 'Failed to update password. Verify your current password.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gold-500/20 text-gold-300 font-bold border-l-4 border-gold-400 shadow-sm'
                  : 'text-gold-200/80 hover:text-white hover:bg-burgundy-900 hover:translate-x-0.5'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0 text-gold-400" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const renderAccountFooter = (closeDrawer?: () => void) => (
    <div className="shrink-0 p-3.5 border-t border-gold-800/50 bg-burgundy-900/70 space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="min-w-0">
          <span className="font-semibold text-white block truncate">{user?.name}</span>
          <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-mono">
            {user?.role}
          </span>
        </div>
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Public Site"
          className="p-1.5 rounded-lg text-gold-300 hover:text-white hover:bg-burgundy-800 transition-colors shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => {
            closeDrawer?.();
            setChangePasswordOpen(true);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-700/50 bg-burgundy-950/60 text-xs font-medium text-gold-200 hover:bg-burgundy-800 hover:text-white transition-colors"
          title="Change Administrative Password"
        >
          <Key className="w-3.5 h-3.5 text-gold-400 shrink-0" />
          <span>Change Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            closeDrawer?.();
            void handleLogout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-burgundy-800/80 border border-gold-700/35 text-xs font-semibold text-gold-100 hover:bg-burgundy-700 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 text-gold-300 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Sidebar (Desktop Sticky Full Viewport Height) */}
      <aside className="hidden md:flex flex-col w-64 md:sticky md:top-0 md:h-screen bg-burgundy-950 text-gold-100 border-r border-gold-800/40 shrink-0 select-none overflow-hidden">
        {/* Brand Header */}
        <div className="shrink-0 p-4 border-b border-gold-800/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gold-400 overflow-hidden p-0.5 bg-burgundy-900 shrink-0">
            <img
              src="/logo.jpg"
              alt="Sri Ramas Jewellery"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <span className="font-serif font-bold text-sm text-gold-100 block truncate">
              SRI RAMAS JEWELLERY
            </span>
            <span className="text-[10px] text-gold-400/80 font-medium tracking-wider uppercase block">
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        {renderNavLinks()}

        {/* User Card, Change Password & Logout */}
        {renderAccountFooter()}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif font-bold text-base text-burgundy-950 hidden sm:inline">
              Sri Ramas Administrative Suite
            </span>
          </div>

          {/* Right Header Status Bar */}
          <div className="flex items-center gap-4 text-xs">
            {rates && (
              <div className="hidden sm:flex items-center gap-2 bg-gold-50 border border-gold-300 px-3 py-1 rounded-full text-burgundy-900 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-gold-700" />
                <span>22K Gold: {formatPaiseToInr(rates.gold['22K'])}/g</span>
              </div>
            )}

            <Link
              to="/"
              className="hidden lg:flex items-center gap-1 text-stone-600 hover:text-burgundy-900 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </Link>

            <button
              onClick={() => setChangePasswordOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-300 bg-gold-50/50 text-burgundy-900 hover:bg-gold-100 font-medium transition-colors"
              title="Change Administrative Password"
            >
              <Key className="w-3.5 h-3.5 text-gold-700" />
              <span className="hidden sm:inline">Change Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSidebarOpen(false);
            }}
          >
            <div className="w-64 bg-burgundy-950 text-gold-100 h-full flex flex-col shadow-2xl animate-drawer-enter overflow-hidden">
              <div className="shrink-0 p-4 border-b border-gold-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-xs block truncate">
                      SRI RAMAS JEWELLERY
                    </span>
                    <span className="text-[10px] text-gold-400/80 uppercase tracking-wider block">
                      Admin Dashboard
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5 text-gold-300" />
                </button>
              </div>

              {renderNavLinks(() => setSidebarOpen(false))}
              {renderAccountFooter(() => setSidebarOpen(false))}
            </div>
          </div>
        )}

        {/* Security Alert Banner for Required Password Rotation */}
        {user?.requiresPasswordChange && (
          <div className="bg-amber-500 text-burgundy-950 px-4 py-3 flex items-center justify-between text-xs font-semibold shadow-inner border-b border-amber-600/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-burgundy-900" />
              <span>
                SECURITY NOTICE: You are using temporary or system-generated credentials. Please update your administrative password immediately to secure your account.
              </span>
            </div>
            <button
              onClick={() => setChangePasswordOpen(true)}
              className="px-3 py-1 bg-burgundy-900 text-gold-100 rounded-md font-bold uppercase tracking-wider text-[11px] hover:bg-burgundy-950 transition-colors shrink-0 ml-4"
            >
              Update Password
            </button>
          </div>
        )}

        {/* Change Password Modal */}
        {changePasswordOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setChangePasswordOpen(false);
                setPwError(null);
                setPwSuccess(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl max-w-md w-full border border-gold-400/40 shadow-luxury overflow-hidden animate-modal-enter">
              <div className="p-6 bg-brand-maroon-gradient text-gold-100 border-b border-gold-600/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-gold-400" />
                  <h3 className="font-serif font-bold text-lg text-gold-100">
                    Change Administrative Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setPwError(null);
                    setPwSuccess(null);
                  }}
                  className="text-gold-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                {pwError && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pwSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      className="w-full px-3 py-2 pr-10 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none p-1"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Secure Password (Min. 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 pr-10 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none p-1"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 pr-10 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none p-1"
                      aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setChangePasswordOpen(false);
                      setPwError(null);
                      setPwSuccess(null);
                    }}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="px-5 py-2 bg-brand-gold-gradient text-burgundy-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow hover:opacity-95 disabled:opacity-50"
                  >
                    {pwLoading ? 'Updating...' : 'Secure & Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
