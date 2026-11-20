import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Phone,
  X,
  MessageSquare,
} from 'lucide-react';
import { enquiriesApi, EnquiryFilterParams } from '@/services/api/enquiries.api';
import { Enquiry, EnquiryStatus, EnquiryType } from '@/types';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { getAdminCustomerWhatsAppUrl } from '@/utils/whatsapp';
import { AdminModalPortal } from '@/components/admin/AdminModalPortal';

const formatEnquiryTypeLabel = (type?: string): string => {
  switch (type) {
    case 'PRODUCT':
      return 'Product Enquiry';
    case 'SCHEME':
      return 'Savings Scheme Enquiry';
    case 'DIGI_GOLD':
    case 'DIGIGOLD':
      return 'DigiGold Enquiry';
    case 'DIGI_SILVER':
    case 'DIGISILVER':
      return 'DigiSilver Enquiry';
    case 'GENERAL':
      return 'General Enquiry';
    default:
      return type ? type.replace(/_/g, ' ') : 'General Enquiry';
  }
};

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
            <option value="PRODUCT">Product</option>
            <option value="SCHEME">Savings Scheme</option>
            <option value="DIGI_GOLD">DigiGold</option>
            <option value="DIGI_SILVER">DigiSilver</option>
            <option value="GENERAL">General</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Desktop Table Presentation */}
        <div className="hidden md:block overflow-x-auto">
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
                      <span className="text-[11px] text-stone-500 font-mono block">
                        {(enquiry as any).customerMobile || enquiry.customerPhone || '—'}
                      </span>
                      {enquiry.city && (
                        <span className="text-[10px] text-stone-400 block">
                          📍 {enquiry.city}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 font-semibold text-[10px] uppercase text-stone-700 block w-fit mb-1">
                        {formatEnquiryTypeLabel(enquiry.enquiryType)}
                      </span>
                      {(enquiry.productName || enquiry.product?.title || enquiry.productSku || enquiry.product?.sku) && (
                        <div className="text-[11px] text-burgundy-900 font-medium truncate max-w-[180px]">
                          {enquiry.productName || enquiry.product?.title}
                          {(enquiry.productSku || enquiry.product?.sku) && (
                            <span className="text-[10px] text-stone-500 font-mono block">
                              SKU: {enquiry.productSku || enquiry.product?.sku}
                            </span>
                          )}
                        </div>
                      )}
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
                      {(() => {
                        const targetPhone = (enquiry as any).customerMobile || enquiry.customerPhone;
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
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
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
                    No matching enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile App-Style Enquiry Cards */}
        <div className="block md:hidden p-3.5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              Loading customer leads...
            </div>
          ) : enquiries.length > 0 ? (
            enquiries.map((enquiry) => {
              const targetPhone = (enquiry as any).customerMobile || enquiry.customerPhone;
              const chatUrl = getAdminCustomerWhatsAppUrl({
                customerPhone: targetPhone,
                customerName: enquiry.customerName,
                enquiryNumber: enquiry.enquiryNumber,
                enquiryType: enquiry.enquiryType,
              });

              return (
                <div
                  key={enquiry._id}
                  onClick={() => setSelectedEnquiry(enquiry)}
                  className="bg-[#FCFAF6] border border-stone-200/90 rounded-xl p-3.5 space-y-3 shadow-xs cursor-pointer hover:border-gold-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-burgundy-900 break-all">
                      {enquiry.enquiryNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 font-bold text-[9px] uppercase text-stone-700">
                      {formatEnquiryTypeLabel(enquiry.enquiryType)}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-sm text-stone-900 block">
                      {enquiry.customerName}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-500 font-mono">
                        📞 {targetPhone || '—'}
                      </span>
                      {enquiry.city && (
                        <span className="text-[10px] text-stone-400">
                          📍 {enquiry.city}
                        </span>
                      )}
                    </div>

                    {(enquiry.productName || enquiry.product?.title || enquiry.productSku || enquiry.product?.sku) && (
                      <div className="text-[11px] text-burgundy-900 font-medium truncate mt-1 bg-burgundy-50/70 p-1.5 rounded-lg border border-gold-200/60">
                        <span>Piece: {enquiry.productName || enquiry.product?.title}</span>
                        {(enquiry.productSku || enquiry.product?.sku) && (
                          <span className="text-[10px] text-stone-500 font-mono block">
                            SKU: {enquiry.productSku || enquiry.product?.sku}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Channel & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                    <span className="font-medium text-stone-600">
                      Via {enquiry.preferredContactMethod || 'WHATSAPP'}
                    </span>
                    <span>{getRelativeTime(enquiry.createdAt)}</span>
                  </div>

                  {/* Status Dropdown and WhatsApp Action */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={enquiry.status}
                      onChange={(e) => handleStatusChange(enquiry._id, e.target.value as EnquiryStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border outline-none ${
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

                    {chatUrl ? (
                      <a
                        href={chatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">No WhatsApp</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs">
              No matching enquiries found.
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Detail Drawer */}
      {selectedEnquiry && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[9999] flex justify-end bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
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
                          href={`tel:${(selectedEnquiry as any).customerMobile || selectedEnquiry.customerPhone}`}
                          className="font-bold text-burgundy-900 font-mono hover:underline"
                        >
                          {(selectedEnquiry as any).customerMobile || selectedEnquiry.customerPhone}
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

                      <div>
                        <span className="text-stone-400 block">Received Date</span>
                        <span>{formatDateTime(selectedEnquiry.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Associated Product Information */}
                  {(selectedEnquiry.productName || selectedEnquiry.productSku || selectedEnquiry.product || (selectedEnquiry as any).productId) && (
                    <div className="bg-[#FCF7EC] p-3.5 rounded-xl border border-gold-300/60 space-y-2">
                      <span className="font-bold text-burgundy-950 uppercase text-[11px] block">
                        Associated Product Details
                      </span>
                      <div className="space-y-1 text-xs">
                        <p>
                          <strong className="text-stone-600">Product Name:</strong>{' '}
                          <span className="font-bold text-burgundy-950">
                            {selectedEnquiry.productName || selectedEnquiry.product?.title || selectedEnquiry.product?.name || 'Jewellery Piece'}
                          </span>
                        </p>
                        {(selectedEnquiry.productSku || selectedEnquiry.product?.sku) && (
                          <p>
                            <strong className="text-stone-600">Product SKU:</strong>{' '}
                            <span className="font-mono font-bold text-burgundy-900">
                              {selectedEnquiry.productSku || selectedEnquiry.product?.sku}
                            </span>
                          </p>
                        )}
                        {selectedEnquiry.productUrl && (
                          <p>
                            <strong className="text-stone-600">Product Link:</strong>{' '}
                            <a
                              href={selectedEnquiry.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-burgundy-800 underline font-mono text-[11px]"
                            >
                              View Product Page →
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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
              {(() => {
                const targetPhone = (selectedEnquiry as any).customerMobile || selectedEnquiry.customerPhone;
                const chatUrl = getAdminCustomerWhatsAppUrl({
                  customerPhone: targetPhone,
                  customerName: selectedEnquiry.customerName,
                  enquiryNumber: selectedEnquiry.enquiryNumber,
                  enquiryType: selectedEnquiry.enquiryType,
                });

                return chatUrl ? (
                  <a
                    href={chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open in WhatsApp</span>
                  </a>
                ) : (
                  <div className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center">
                    No WhatsApp Provided
                  </div>
                );
              })()}

              <a
                href={`tel:${(selectedEnquiry as any).customerMobile || selectedEnquiry.customerPhone}`}
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
      </AdminModalPortal>
      )}
    </div>
  );
};
