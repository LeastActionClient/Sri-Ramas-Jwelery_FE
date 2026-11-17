import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  MessageSquareText,
  Gem,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '@/services/api/admin.api';
import { enquiriesApi } from '@/services/api/enquiries.api';
import { formatPaiseToInr } from '@/utils/currency';
import { formatDate, getRelativeTime } from '@/utils/date';
import { getAdminCustomerWhatsAppUrl } from '@/utils/whatsapp';

export const DashboardOverviewPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const { data: enquiriesData, refetch: refetchEnquiries } = useQuery({
    queryKey: ['admin', 'recent-enquiries'],
    queryFn: () => enquiriesApi.adminGetEnquiries({ limit: 5 }),
  });

  const handleStatusChange = async (enquiryId: string, newStatus: any) => {
    try {
      await enquiriesApi.adminUpdateStatus(enquiryId, newStatus);
      refetchEnquiries();
    } catch {
      alert('Failed to update enquiry status.');
    }
  };

  const recentEnquiries = enquiriesData?.enquiries || [];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-burgundy-950 leading-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-1 leading-normal">
            Sri Ramas Jewellery (Estd. 1987) • Real-time overview of bullion, inventory, and customer leads.
          </p>
        </div>

        <div className="flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            to="/admin/enquiries"
            className="px-4 py-2 sm:py-2.5 rounded-lg bg-burgundy-900 text-gold-200 text-xs font-semibold hover:bg-burgundy-800 transition-colors text-center shadow-sm"
          >
            Open Enquiry CRM
          </Link>
          <Link
            to="/admin/rates"
            className="px-4 py-2 sm:py-2.5 rounded-lg border border-gold-600 bg-white text-burgundy-900 text-xs font-semibold hover:bg-gold-50 transition-colors text-center shadow-sm"
          >
            Update Live Rates
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Bullion 22K Rate */}
        <div className="bg-white rounded-2xl p-5 border border-gold-400/60 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Gold 22K (916) Today
            </span>
            <div className="p-2 rounded-lg bg-gold-100 text-gold-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-burgundy-950">
            {statsLoading ? (
              <span className="text-stone-300 animate-pulse text-lg">Loading...</span>
            ) : stats?.currentRates?.gold?.['22K'] && stats.currentRates.gold['22K'] > 0 ? (
              <>
                {formatPaiseToInr(stats.currentRates.gold['22K'])}
                <span className="text-xs font-sans font-normal text-stone-500 ml-1">/ gram</span>
              </>
            ) : (
              <span className="text-stone-400 text-lg">Rate Awaits Publish</span>
            )}
          </div>
          <p className="text-[11px] text-stone-500">
            Standard jewellery hallmark benchmark
          </p>
        </div>

        {/* Active Enquiries */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Active Customer Leads
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <MessageSquareText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-burgundy-950">
            {statsLoading ? (
              <span className="text-stone-300 animate-pulse text-lg">...</span>
            ) : (
              stats?.activeEnquiries ?? 0
            )}
          </div>
          <p className="text-[11px] text-stone-500">
            Pending response &amp; follow-up
          </p>
        </div>

        {/* Total Showcase Products */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Catalogue Pieces
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-burgundy-950">
            {statsLoading ? (
              <span className="text-stone-300 animate-pulse text-lg">...</span>
            ) : (
              stats?.totalProducts ?? 0
            )}
          </div>
          <p className="text-[11px] text-stone-500">
            Active jewellery items on public site
          </p>
        </div>

        {/* New Today */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              New Enquiries Today
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-burgundy-950">
            {statsLoading ? (
              <span className="text-stone-300 animate-pulse text-lg">...</span>
            ) : (
              stats?.newEnquiriesToday ?? 0
            )}
          </div>
          <p className="text-[11px] text-stone-500">
            Received in current business day
          </p>
        </div>
      </div>

      {/* Recent Enquiries CRM Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-burgundy-950">
              Recent Customer Enquiries
            </h2>
            <p className="text-xs text-stone-500">
              Follow up with customers via phone, email or direct WhatsApp dialogue.
            </p>
          </div>
          <Link
            to="/admin/enquiries"
            className="text-xs font-bold text-burgundy-900 hover:text-burgundy-700 flex items-center gap-1"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Ref #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Enquiry Type</th>
                <th className="p-4">Preferred Mode</th>
                <th className="p-4">Status</th>
                <th className="p-4">Received</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentEnquiries.length > 0 ? (
                recentEnquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-burgundy-900">
                      {enquiry.enquiryNumber}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-stone-900 block">{enquiry.customerName}</span>
                      <span className="text-[11px] text-stone-500 font-mono">{enquiry.customerPhone}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 font-semibold text-[10px] uppercase text-stone-700">
                        {enquiry.enquiryType}
                      </span>
                    </td>
                    <td className="p-4 text-stone-600 font-medium">
                      {enquiry.preferredContactMethod || 'WHATSAPP'}
                    </td>
                    <td className="p-4">
                      <select
                        value={enquiry.status}
                        onChange={(e) => handleStatusChange(enquiry._id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border outline-none ${
                          enquiry.status === 'NEW'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : enquiry.status === 'CONTACTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : enquiry.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="p-4 text-stone-500">
                      {getRelativeTime(enquiry.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      {(() => {
                        const targetPhone = (enquiry as any).customerMobile || (enquiry as any).customerPhone;
                        const chatUrl = getAdminCustomerWhatsAppUrl({
                          customerPhone: targetPhone,
                          customerName: enquiry.customerName,
                          enquiryNumber: enquiry.enquiryNumber,
                          enquiryType: enquiry.enquiryType,
                        });

                        return chatUrl ? (
                          <a
                            href={chatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                          >
                            <span>WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">No WhatsApp</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No customer enquiries registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
