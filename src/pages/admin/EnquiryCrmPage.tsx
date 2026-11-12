import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquareText,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { enquiriesApi, EnquiryFilterParams } from '@/services/api/enquiries.api';
import { Enquiry, EnquiryStatus, EnquiryType } from '@/types';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { getWhatsAppEnquiryUrl } from '@/utils/whatsapp';

export const EnquiryCrmPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  const filterParams: EnquiryFilterParams = {
    status: (statusFilter as EnquiryStatus) || undefined,
    type: (typeFilter as EnquiryType) || undefined,
    search: search || undefined,
    limit: 50,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'enquiries', filterParams],
    queryFn: () => enquiriesApi.adminGetEnquiries(filterParams),
  });

  const enquiries = data?.enquiries || [];

  const handleStatusChange = async (enquiryId: string, status: EnquiryStatus) => {
    try {
      const updated = await enquiriesApi.adminUpdateStatus(enquiryId, status);
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
        setSelectedEnquiry(updated);
      }
    } catch {
      alert('Unable to update enquiry status.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const updated = await enquiriesApi.adminAddNote(selectedEnquiry._id, newNote.trim());
      setSelectedEnquiry(updated);
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
    } catch {
      alert('Unable to save internal note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await enquiriesApi.adminExportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sri-ramas-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Customer Enquiry CRM
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage inbound customer leads, track follow-up timelines, and connect via WhatsApp.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:bg-stone-50 shadow-sm"
        >
          <Download className="w-4 h-4 text-stone-600" />
          <span>Export Enquiries to CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or reference number..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter enquiries by status"
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none bg-white text-stone-800"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter enquiries by type"
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none bg-white text-stone-800"
          >
            <option value="">All Types</option>
            <option value="PRODUCT">PRODUCT</option>
            <option value="SCHEME">SAVINGS SCHEME</option>
            <option value="DIGIGOLD">DIGIGOLD</option>
            <option value="DIGISILVER">DIGISILVER</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Reference #</th>
                <th className="p-4">Customer Name & Phone</th>
                <th className="p-4">Type</th>
                <th className="p-4">Preferred Channel</th>
                <th className="p-4">Status</th>
                <th className="p-4">Received</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Loading customer leads...
                  </td>
                </tr>
              ) : enquiries.length > 0 ? (
                enquiries.map((enquiry) => (
                  <tr
                    key={enquiry._id}
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className="hover:bg-gold-50/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-burgundy-900">
                      {enquiry.enquiryNumber}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-stone-900 block">{enquiry.customerName}</span>
                      <span className="text-[11px] text-stone-500 font-mono">{enquiry.customerPhone}</span>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 font-semibold text-[10px] uppercase text-stone-700">
                        {enquiry.enquiryType}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-stone-600">
                      {enquiry.preferredContactMethod || 'WHATSAPP'}
                    </td>

                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={enquiry.status}
                        onChange={(e) => handleStatusChange(enquiry._id, e.target.value as EnquiryStatus)}
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

                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={getWhatsAppEnquiryUrl({
                          type: enquiry.enquiryType,
                          referenceId: enquiry.enquiryNumber,
                          customerName: enquiry.customerName,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    No matching enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enquiry Detail Drawer */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="bg-burgundy-900 text-gold-100 p-5 border-b border-gold-600/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">
                    {selectedEnquiry.enquiryType} Lead
                  </span>
                  <h2 className="font-serif font-bold text-lg text-gold-100">
                    {selectedEnquiry.enquiryNumber}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-gold-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 text-xs text-stone-700">
                {/* Status Switcher */}
                <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-700">Lead Progression:</span>
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) =>
                      handleStatusChange(selectedEnquiry._id, e.target.value as EnquiryStatus)
                    }
                    className="font-bold text-xs p-1.5 rounded-md border border-stone-300 bg-white"
                  >
                    <option value="NEW">NEW LEAD</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* Customer Details */}
                <div className="space-y-3 border-b border-stone-200 pb-4">
                  <span className="font-bold text-stone-900 uppercase block">Customer Information</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-400 block">Name</span>
                      <span className="font-bold text-stone-900">{selectedEnquiry.customerName}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">Phone</span>
                      <a
                        href={`tel:${selectedEnquiry.customerPhone}`}
                        className="font-bold text-burgundy-900 font-mono hover:underline"
                      >
                        {selectedEnquiry.customerPhone}
                      </a>
                    </div>

                    {selectedEnquiry.customerEmail && (
                      <div>
                        <span className="text-stone-400 block">Email</span>
                        <span>{selectedEnquiry.customerEmail}</span>
                      </div>
                    )}

                    {selectedEnquiry.city && (
                      <div>
                        <span className="text-stone-400 block">City</span>
                        <span>{selectedEnquiry.city}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-stone-400 block">Preferred Mode</span>
                      <span className="font-medium">{selectedEnquiry.preferredContactMethod || 'WHATSAPP'}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block">Preferred Slot</span>
                      <span>{selectedEnquiry.preferredContactTime || 'ANYTIME'}</span>
                    </div>
                  </div>
                </div>

                {/* Associated Item / Message */}
                {selectedEnquiry.message && (
                  <div className="bg-ivory-50 p-3.5 rounded-xl border border-gold-300/50 space-y-1">
                    <span className="font-bold text-burgundy-900 uppercase text-[11px] block">
                      Customer Message:
                    </span>
                    <p className="italic text-stone-700 leading-relaxed font-light">
                      "{selectedEnquiry.message}"
                    </p>
                  </div>
                )}

                {/* Notes Timeline */}
                <div className="space-y-3">
                  <span className="font-bold text-stone-900 uppercase block">
                    Internal Staff Notes ({selectedEnquiry.notes?.length || 0})
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedEnquiry.notes && selectedEnquiry.notes.length > 0 ? (
                      selectedEnquiry.notes.map((note, idx) => (
                        <div key={idx} className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                          <p className="text-stone-800">{note.note}</p>
                          <div className="flex justify-between text-[10px] text-stone-400 pt-1">
                            <span>{note.createdBy?.name || 'Staff Member'}</span>
                            <span>{formatDateTime(note.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-stone-400 italic">No internal notes added yet.</p>
                    )}
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2 pt-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal follow-up note..."
                      className="w-full p-2 border rounded-lg outline-none focus:border-gold-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isAddingNote || !newNote.trim()}
                        className="px-3 py-1.5 rounded-lg bg-burgundy-900 text-gold-200 font-semibold disabled:opacity-50"
                      >
                        {isAddingNote ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
              <a
                href={getWhatsAppEnquiryUrl({
                  type: selectedEnquiry.enquiryType,
                  referenceId: selectedEnquiry.enquiryNumber,
                  customerName: selectedEnquiry.customerName,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </a>

              <a
                href={`tel:${selectedEnquiry.customerPhone}`}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Phone className="w-4 h-4 text-stone-600" />
                <span>Call</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
