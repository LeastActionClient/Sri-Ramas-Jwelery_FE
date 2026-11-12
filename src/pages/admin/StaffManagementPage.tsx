import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/services/api/admin.api';
import { User } from '@/types';
import { formatDate } from '@/utils/date';

const staffSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'STORE_MANAGER']),
});

type StaffFormData = z.infer<typeof staffSchema>;

export const StaffManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: adminApi.getStaffList,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      role: 'STAFF',
    },
  });

  const onSubmit = async (data: StaffFormData) => {
    try {
      await adminApi.createStaff(data);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setIsModalOpen(false);
      reset();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Error creating staff account.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await adminApi.toggleStaffStatus(id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    } catch {
      alert('Unable to toggle staff status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Administrative Team & RBAC Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage showroom managers, jewellery consultants, and administrative privileges.
          </p>
        </div>

        <button
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-maroon-gradient text-gold-200 text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95"
        >
          <Plus className="w-4 h-4 text-gold-400" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    Loading administrative accounts...
                  </td>
                </tr>
              ) : staffList.length > 0 ? (
                staffList.map((member) => (
                  <tr key={member._id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-stone-900">{member.name}</td>
                    <td className="p-4 text-stone-600 font-mono">{member.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-burgundy-900 font-bold text-[10px] uppercase">
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">{formatDate(member.createdAt)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          member.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {member.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(member._id)}
                          className="text-[11px] font-semibold text-stone-600 hover:text-burgundy-900 underline"
                        >
                          {member.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">
                    No staff records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gold-500/40 overflow-hidden">
            <div className="bg-burgundy-900 text-gold-100 p-5 border-b border-gold-600/40 flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-gold-100">
                Create Staff Account
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gold-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. S. Ramanathan"
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                />
                {errors.name && <p className="text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="staff@sriramasjewellery.com"
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-gold-500"
                />
                {errors.email && <p className="text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••••••"
                    className="w-full p-2.5 pr-10 border rounded-lg outline-none focus:border-gold-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none p-1"
                    aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-600 mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block font-semibold uppercase text-stone-700 mb-1">
                  Assigned Administrative Role
                </label>
                <select {...register('role')} className="w-full p-2.5 border rounded-lg bg-white">
                  <option value="STAFF">Showroom Staff (CRM & Leads)</option>
                  <option value="STORE_MANAGER">Store Manager (Inventory & Rates)</option>
                  <option value="ADMIN">System Administrator (Full Management)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-burgundy-900 text-gold-200 rounded-lg font-bold shadow-md hover:bg-burgundy-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
