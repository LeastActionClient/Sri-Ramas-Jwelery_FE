import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  MessageCircle,
  Sparkles,
  Move,
  RotateCcw,
  Eye,
  EyeOff,
  Type,
  Palette,
  Layers,
  Smartphone,
  Monitor,
  X
} from 'lucide-react';
import { SchemePlan, SchemeLayoutConfig, SchemeLayoutElement } from '@/types';
import { formatPaiseToInr } from '@/utils/currency';
import { useStoreWhatsApp } from '@/hooks/useStoreWhatsApp';

export interface SchemeBannerCardProps {
  scheme: SchemePlan;
  previewOnly?: boolean;
  compact?: boolean;
  editable?: boolean;
  onLayoutChange?: (layout: SchemeLayoutConfig) => void;
  mobileView?: boolean;
  onToggleMobileView?: () => void;
}

export function getDefaultSchemeLayout(isRightAligned = true): SchemeLayoutConfig {
  const baseX = isRightAligned ? 75 : 25;
  return {
    version: 1,
    elements: {
      logo: {
        id: 'logo',
        x: baseX,
        y: 18,
        textAlign: 'center',
        visible: true,
        zIndex: 10
      },
      title: {
        id: 'title',
        x: baseX,
        y: 38,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F6DFA4',
        textAlign: 'center',
        visible: true,
        zIndex: 10
      },
      description: {
        id: 'description',
        x: baseX,
        y: 56,
        fontSize: 13,
        fontWeight: 'normal',
        color: '#FCE7B2',
        textAlign: 'center',
        visible: true,
        zIndex: 10
      },
      durationBadge: {
        id: 'durationBadge',
        x: isRightAligned ? 70 : 20,
        y: 72,
        fontSize: 11,
        color: '#FFE28A',
        bgColor: '#260309',
        borderColor: '#D4AF37',
        visible: true,
        zIndex: 10
      },
      amountBadge: {
        id: 'amountBadge',
        x: isRightAligned ? 82 : 32,
        y: 72,
        fontSize: 11,
        color: '#FFE28A',
        bgColor: '#260309',
        borderColor: '#D4AF37',
        visible: true,
        zIndex: 10
      },
      primaryBtn: {
        id: 'primaryBtn',
        x: isRightAligned ? 68 : 20,
        y: 87,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FCE7B2',
        bgColor: '#2A040B',
        borderColor: '#D4AF37',
        visible: true,
        zIndex: 11
      },
      whatsappBtn: {
        id: 'whatsappBtn',
        x: isRightAligned ? 84 : 35,
        y: 87,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        bgColor: '#25D366',
        borderColor: '#20BD5A',
        visible: true,
        zIndex: 11
      }
    }
  };
}

export const SchemeBannerCard: React.FC<SchemeBannerCardProps> = ({
  scheme,
  previewOnly = false,
  compact = false,
  editable = false,
  onLayoutChange,
  mobileView = false,
  onToggleMobileView
}) => {
  const { buildWhatsAppUrl } = useStoreWhatsApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const isRightAligned = scheme.textAlignment !== 'left';

  // Initialize layout from scheme.layoutConfig or fallback default
  const [layout, setLayout] = useState<SchemeLayoutConfig>(() => {
    if (scheme.layoutConfig?.elements && Object.keys(scheme.layoutConfig.elements).length > 0) {
      return scheme.layoutConfig;
    }
    return getDefaultSchemeLayout(isRightAligned);
  });

  // Keep local layout in sync when scheme changes externally
  useEffect(() => {
    if (scheme.layoutConfig?.elements && Object.keys(scheme.layoutConfig.elements).length > 0) {
      setLayout(scheme.layoutConfig);
    }
  }, [scheme.layoutConfig]);

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragTargetRef = useRef<string | null>(null);

  const bannerSrc = scheme.bannerImageUrl || '';
  const logoSrc = scheme.logoImageUrl || '/logo.jpg';
  const ctaLabel = scheme.buttonName?.trim() || scheme.ctaText?.trim() || 'Enquire Now';
  const destination =
    scheme.navigationDestination?.trim() ||
    `/contact?type=SCHEME&scheme=${encodeURIComponent(scheme.name)}`;
  const summaryText = scheme.shortDescription || scheme.tagline || scheme.description;

  const minAmount = scheme.minMonthlyAmountPaise ?? scheme.minimumMonthlyAmountPaise;
  const hasMinAmount = typeof minAmount === 'number' && minAmount > 0;
  const durationBadge =
    scheme.durationLabel ||
    (scheme.tenureMonths && scheme.tenureMonths > 0 ? `${scheme.tenureMonths} Months` : '');

  const whatsappUrl = buildWhatsAppUrl({
    type: 'SCHEME',
    schemeName: scheme.name,
    customMessage: scheme.whatsappMessage
  });

  const updateElement = useCallback(
    (id: string, updates: Partial<SchemeLayoutElement>) => {
      setLayout((prev) => {
        const current = prev.elements[id] || { id, x: 50, y: 50 };
        const updatedLayout: SchemeLayoutConfig = {
          ...prev,
          elements: {
            ...prev.elements,
            [id]: {
              ...current,
              ...updates
            }
          }
        };
        if (onLayoutChange) {
          onLayoutChange(updatedLayout);
        }
        return updatedLayout;
      });
    },
    [onLayoutChange]
  );

  const handleResetLayout = () => {
    const defaultLayout = getDefaultSchemeLayout(isRightAligned);
    setLayout(defaultLayout);
    setSelectedElementId(null);
    if (onLayoutChange) {
      onLayoutChange(defaultLayout);
    }
  };

  // Dragging event handlers
  const handleMouseDownOnElement = (e: React.MouseEvent, elementId: string) => {
    if (!editable) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(elementId);
    setIsDragging(true);
    dragTargetRef.current = elementId;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragTargetRef.current || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.round(Math.max(5, Math.min(95, rawX)));
      const clampedY = Math.round(Math.max(5, Math.min(95, rawY)));

      updateElement(dragTargetRef.current, { x: clampedX, y: clampedY });
    },
    [isDragging, updateElement]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragTargetRef.current = null;
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Selected element for the toolbar controls
  const selectedEl = selectedElementId ? layout.elements[selectedElementId] : null;

  const elements = layout.elements;
  const hasCustomLayout = Boolean(elements && Object.keys(elements).length > 0);

  // Render individual positioned elements
  const renderLogo = () => {
    const el = elements.logo;
    if (!el || el.visible === false) return null;
    const isSelected = editable && selectedElementId === 'logo';

    return (
      <div
        id="scheme-el-logo"
        onMouseDown={(e) => handleMouseDownOnElement(e, 'logo')}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: el.zIndex || 10,
          cursor: editable ? 'grab' : 'default'
        }}
        className={`flex flex-col items-center gap-1 select-none transition-shadow ${
          isSelected ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-black/40 rounded-xl p-1 bg-black/30' : ''
        }`}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gold-400/90 overflow-hidden bg-burgundy-950 p-0.5 shadow-luxury-gold">
          <img src={logoSrc} alt="Sri Ramas Crest" className="w-full h-full object-cover rounded-full" />
        </div>
        <span className="text-[10px] font-serif text-gold-300/90 tracking-wider whitespace-nowrap">
          ஸ்ரீ ராமாஸ் • Since 1987
        </span>
        {isSelected && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold-500 text-burgundy-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            Logo (Drag)
          </span>
        )}
      </div>
    );
  };

  const renderTitle = () => {
    const el = elements.title;
    if (!el || el.visible === false) return null;
    const isSelected = editable && selectedElementId === 'title';

    return (
      <div
        id="scheme-el-title"
        onMouseDown={(e) => handleMouseDownOnElement(e, 'title')}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: el.zIndex || 10,
          cursor: editable ? 'grab' : 'default',
          textAlign: el.textAlign || 'center'
        }}
        className={`select-none max-w-[85%] transition-shadow ${
          isSelected ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-black/40 rounded-xl p-2 bg-black/40' : ''
        }`}
      >
        <h2
          style={{
            color: el.color || '#F6DFA4',
            fontSize: el.fontSize ? `${Math.max(16, el.fontSize)}px` : undefined,
            fontWeight: el.fontWeight || 'bold'
          }}
          className="font-serif tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-tight"
        >
          {scheme.name}
        </h2>
        {isSelected && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold-500 text-burgundy-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            Title (Drag)
          </span>
        )}
      </div>
    );
  };

  const renderDescription = () => {
    const el = elements.description;
    if (!el || el.visible === false || !summaryText) return null;
    const isSelected = editable && selectedElementId === 'description';

    return (
      <div
        id="scheme-el-description"
        onMouseDown={(e) => handleMouseDownOnElement(e, 'description')}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: el.zIndex || 10,
          cursor: editable ? 'grab' : 'default',
          textAlign: el.textAlign || 'center'
        }}
        className={`select-none max-w-sm transition-shadow ${
          isSelected ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-black/40 rounded-xl p-2 bg-black/40' : ''
        }`}
      >
        <p
          style={{
            color: el.color || '#FCE7B2',
            fontSize: el.fontSize ? `${Math.max(11, el.fontSize)}px` : undefined,
            fontWeight: el.fontWeight || 'normal'
          }}
          className="leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] line-clamp-2"
        >
          {summaryText}
        </p>
        {isSelected && (
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gold-500 text-burgundy-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
            Description (Drag)
          </span>
        )}
      </div>
    );
  };

  const renderDurationBadge = () => {
    const el = elements.durationBadge;
    if (!el || el.visible === false || !durationBadge) return null;
    const isSelected = editable && selectedElementId === 'durationBadge';

    return (
      <div
        id="scheme-el-duration"
        onMouseDown={(e) => handleMouseDownOnElement(e, 'durationBadge')}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm select-none transition-shadow ${
          isSelected ? 'ring-2 ring-gold-400' : ''
        }`}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: el.zIndex || 10,
          backgroundColor: el.bgColor || 'rgba(38, 3, 9, 0.85)',
          borderColor: el.borderColor || 'rgba(212, 175, 55, 0.5)',
          color: el.color || '#FFE28A',
          cursor: editable ? 'grab' : 'default'
        }}
      >
        <Clock className="w-3 h-3 text-gold-400" />
        <span className="text-[11px] font-medium">{durationBadge}</span>
      </div>
    );
  };

  const renderAmountBadge = () => {
    const el = elements.amountBadge;
    if (!el || el.visible === false || !hasMinAmount) return null;
    const isSelected = editable && selectedElementId === 'amountBadge';

    return (
      <div
        id="scheme-el-amount"
        onMouseDown={(e) => handleMouseDownOnElement(e, 'amountBadge')}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm select-none transition-shadow ${
          isSelected ? 'ring-2 ring-gold-400' : ''
        }`}
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: el.zIndex || 10,
          backgroundColor: el.bgColor || 'rgba(38, 3, 9, 0.85)',
          borderColor: el.borderColor || 'rgba(212, 175, 55, 0.5)',
          color: el.color || '#FFE28A',
          cursor: editable ? 'grab' : 'default'
        }}
      >
        <Sparkles className="w-3 h-3 text-gold-400" />
        <span className="text-[11px] font-medium">From {formatPaiseToInr(minAmount!)}</span>
      </div>
    );
  };

  const renderPrimaryBtn = () => {
    const el = elements.primaryBtn;
    if (!el || el.visible === false) return null;
    const isSelected = editable && selectedElementId === 'primaryBtn';

    const btnStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}%`,
      top: `${el.y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: el.zIndex || 11,
      backgroundColor: el.bgColor || 'rgba(42, 4, 11, 0.85)',
      borderColor: el.borderColor || '#D4AF37',
      color: el.color || '#FCE7B2',
      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
      cursor: editable ? 'grab' : 'pointer'
    };

    if (previewOnly || editable) {
      return (
        <div
          id="scheme-el-primaryBtn"
          onMouseDown={(e) => handleMouseDownOnElement(e, 'primaryBtn')}
          style={btnStyle}
          className={`relative group/btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-bold uppercase tracking-wider select-none shadow-lg transition-transform ${
            isSelected ? 'ring-2 ring-gold-400 ring-offset-2' : ''
          }`}
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateElement('primaryBtn', { visible: false });
              }}
              title="Remove / Hide Button"
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-transform hover:scale-110 z-20"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }

    return destination.startsWith('http') ? (
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        style={btnStyle}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    ) : (
      <Link
        to={destination}
        style={btnStyle}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
      >
        <span>{ctaLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  };

  const renderWhatsappBtn = () => {
    const el = elements.whatsappBtn;
    if (!el || el.visible === false) return null;
    const isSelected = editable && selectedElementId === 'whatsappBtn';

    const btnStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}%`,
      top: `${el.y}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: el.zIndex || 11,
      backgroundColor: el.bgColor || '#25D366',
      borderColor: el.borderColor || '#20BD5A',
      color: el.color || '#FFFFFF',
      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
      cursor: editable ? 'grab' : 'pointer'
    };

    if (previewOnly || editable) {
      return (
        <div
          id="scheme-el-whatsappBtn"
          onMouseDown={(e) => handleMouseDownOnElement(e, 'whatsappBtn')}
          style={btnStyle}
          className={`relative group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider select-none shadow-md transition-transform ${
            isSelected ? 'ring-2 ring-gold-400 ring-offset-2' : ''
          }`}
        >
          <MessageCircle className="w-4 h-4 fill-current text-white" />
          <span>Chat with Scheme Advisor</span>
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateElement('whatsappBtn', { visible: false });
              }}
              title="Remove / Hide Button"
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md border border-white cursor-pointer transition-transform hover:scale-110 z-20"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }

    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={btnStyle}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform"
      >
        <MessageCircle className="w-4 h-4 fill-current text-white" />
        <span>Chat with Scheme Advisor</span>
      </a>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Visual Editor Toolbar (Admin Mode Only) */}
      {editable && (
        <div className="p-3 bg-stone-900 text-gold-100 rounded-xl border border-gold-500/40 text-xs space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-gold-400" />
              <span className="font-bold uppercase tracking-wider text-gold-200">
                Visual Layout Editor (Live Drag-and-Drop)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onToggleMobileView && (
                <button
                  type="button"
                  onClick={onToggleMobileView}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
                    mobileView
                      ? 'bg-gold-500 text-burgundy-950 border-gold-500'
                      : 'border-stone-700 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {mobileView ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  <span>{mobileView ? 'Mobile View (375px)' : 'Desktop View'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetLayout}
                className="flex items-center gap-1 px-3 py-1 rounded-md border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Layout</span>
              </button>
            </div>
          </div>

          {/* Quick Element Selection and Properties */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 uppercase text-[10px] font-bold">Element:</span>
              <select
                value={selectedElementId || ''}
                onChange={(e) => setSelectedElementId(e.target.value || null)}
                className="p-1.5 rounded bg-stone-800 border border-stone-700 text-gold-200 outline-none text-xs"
              >
                <option value="">Select Element to Adjust</option>
                <option value="logo">Logo &amp; Brand Crest</option>
                <option value="title">Scheme Title</option>
                <option value="description">Description Copy</option>
                <option value="durationBadge">Duration Badge</option>
                <option value="amountBadge">Amount Badge</option>
                <option value="primaryBtn">Primary Button (Enquire)</option>
                <option value="whatsappBtn">WhatsApp Button</option>
              </select>
            </div>

            {selectedEl && (
              <>
                {/* Font Size */}
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-gold-400" />
                  <span className="text-stone-400 text-[10px]">Size:</span>
                  <input
                    type="number"
                    min="10"
                    max="64"
                    value={selectedEl.fontSize || 14}
                    onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                    className="w-14 p-1 rounded bg-stone-800 border border-stone-700 text-gold-200 text-xs"
                  />
                  <span className="text-stone-500 text-[10px]">px</span>
                </div>

                {/* Font Weight */}
                <div className="flex items-center gap-1">
                  <span className="text-stone-400 text-[10px]">Weight:</span>
                  <select
                    value={selectedEl.fontWeight || 'bold'}
                    onChange={(e) => updateElement(selectedEl.id, { fontWeight: e.target.value as any })}
                    className="p-1 rounded bg-stone-800 border border-stone-700 text-gold-200 text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">Extra Bold</option>
                  </select>
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-gold-400" />
                  <span className="text-stone-400 text-[10px]">Color:</span>
                  {['#F6DFA4', '#FFFFFF', '#FCE7B2', '#D4AF37', '#25D366'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateElement(selectedEl.id, { color: c })}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border border-stone-700 hover:scale-110 transition-transform ${
                        selectedEl.color === c ? 'ring-2 ring-white' : ''
                      }`}
                      title={c}
                    />
                  ))}
                </div>

                {/* Visibility */}
                <button
                  type="button"
                  onClick={() => updateElement(selectedEl.id, { visible: selectedEl.visible === false ? true : false })}
                  className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-gold-200"
                >
                  {selectedEl.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{selectedEl.visible === false ? 'Hidden' : 'Visible'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Card */}
      <div
        className={`mx-auto transition-all duration-300 ${
          mobileView ? 'max-w-[375px]' : 'w-full'
        }`}
      >
        <div
          ref={cardRef}
          className={`group relative w-full overflow-hidden rounded-2xl border border-gold-500/55 bg-burgundy-950 shadow-luxury transition-all duration-500 ${
            compact ? 'min-h-[220px] sm:min-h-[260px]' : 'min-h-[280px] sm:min-h-[340px] lg:min-h-[380px]'
          }`}
          style={{
            aspectRatio: mobileView ? '16/11' : undefined
          }}
        >
          {/* Background Artwork */}
          {bannerSrc ? (
            <img
              src={bannerSrc}
              alt={scheme.name}
              loading="lazy"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#4D0B14] via-[#34060D] to-[#1D0206] pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Directional Vignette Scrim */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 pointer-events-none ${
              bannerSrc
                ? isRightAligned
                  ? 'bg-gradient-to-t sm:bg-gradient-to-l from-[#1C0206]/90 via-[#2E050B]/60 to-transparent'
                  : 'bg-gradient-to-t sm:bg-gradient-to-r from-[#1C0206]/90 via-[#2E050B]/60 to-transparent'
                : 'bg-gradient-to-r from-[#260309]/90 to-[#470B15]/70'
            }`}
          />

          {/* Delicate Antique Gold Inner Frame */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 sm:inset-3.5 rounded-xl border border-gold-400/30 group-hover:border-gold-300/50 transition-colors"
          />

          {/* Render Positioned Elements */}
          {hasCustomLayout ? (
            <div className="absolute inset-0 w-full h-full">
              {renderLogo()}
              {renderTitle()}
              {renderDescription()}
              {renderDurationBadge()}
              {renderAmountBadge()}
              {renderPrimaryBtn()}
              {renderWhatsappBtn()}
            </div>
          ) : (
            /* Fallback Classic Static Layout for Schemes without Custom Layout */
            <div
              className={`relative z-10 h-full w-full flex flex-col justify-center px-6 py-7 sm:px-10 sm:py-9 lg:px-14 ${
                isRightAligned ? 'sm:items-end sm:text-center' : 'sm:items-start sm:text-center'
              }`}
            >
              <div className="w-full sm:w-[54%] lg:w-[50%] flex flex-col items-center text-center space-y-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-gold-400/80 overflow-hidden bg-burgundy-950 p-0.5 shadow-luxury-gold">
                    <img src={logoSrc} alt="Sri Ramas Crest" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <span className="text-[10px] font-serif text-gold-300/90 tracking-wider">
                    ஸ்ரீ ராமாஸ் • Since 1987
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide text-[#F6DFA4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] leading-tight">
                  {scheme.name}
                </h2>
                {summaryText && !compact && (
                  <p className="text-xs sm:text-sm text-gold-100/85 max-w-md leading-relaxed line-clamp-2">
                    {summaryText}
                  </p>
                )}
                {(durationBadge || hasMinAmount) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                    {durationBadge && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-950/75 border border-gold-500/40 text-[11px] font-medium text-gold-200">
                        <Clock className="w-3 h-3 text-gold-400" />
                        <span>{durationBadge}</span>
                      </span>
                    )}
                    {hasMinAmount && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-950/75 border border-gold-500/40 text-[11px] font-medium text-gold-200">
                        <Sparkles className="w-3 h-3 text-gold-400" />
                        <span>From {formatPaiseToInr(minAmount)}</span>
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gold-300/75 bg-burgundy-950/60 text-[#FCE7B2] text-xs font-bold uppercase tracking-[0.2em] shadow-sm">
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform"
                  >
                    <MessageCircle className="w-4 h-4 text-white fill-current" />
                    <span>Chat with Scheme Advisor</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
