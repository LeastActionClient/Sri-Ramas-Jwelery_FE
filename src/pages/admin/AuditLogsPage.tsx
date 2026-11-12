import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Filter, Clock, User, Globe } from 'lucide-react';
import { adminApi } from '@/services/api/admin.api';
import { formatDateTime } from '@/utils/date';

export const AuditLogsPage: React.FC = () => {
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', moduleFilter, page],
    queryFn: () => adminApi.getAuditLogs({ module: moduleFilter || undefined, page, limit: 25 }),
  });

  const logs = data?.logs || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            System Security & Audit Trail
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Immutable log of administrative rate overrides, inventory modifications, and staff actions.
          </p>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter audit logs by module"
          className="px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none bg-white text-stone-800"
        >
          <option value="">All Functional Modules</option>
          <option value="RATES">Bullion Rates Module</option>
          <option value="PRODUCT">Jewellery Inventory</option>
          <option value="ENQUIRY">Customer Enquiry CRM</option>
          <option value="CATEGORY">Categories</option>
          <option value="AUTH">Authentication & Staff</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Module</th>
                <th className="p-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-stone-50 font-mono text-[11px]">
                    <td className="p-4 text-stone-600">{formatDateTime(log.timestamp)}</td>
                    <td className="p-4 font-bold text-burgundy-900">
                      {log.user?.name || log.user?.email || 'SYSTEM'}
                    </td>
                    <td className="p-4 font-bold text-stone-800">{log.action}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-4 text-stone-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No audit records logged for this filter.
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
