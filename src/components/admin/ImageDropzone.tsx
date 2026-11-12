import React, { useState, useRef, useEffect, useCallback, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
  RefreshCw,
  ClipboardPaste,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { mediaApi, validateImageFile } from '@/services/api/media.api';

interface ImageDropzoneProps {
  label: string;
  altText?: string;
  value?: string;
  publicId?: string;
  onChange: (value: string) => void;
  onPublicIdChange?: (publicId: string) => void;
  uploadFolder?: 'categories' | 'products' | 'banners' | 'stores' | 'schemes' | 'digi';
  helperText?: string;
  className?: string;
}

interface DropzoneFeedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

const IMAGE_URL_EXT_REGEX = /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i;

function extractImageSrcFromHtml(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const src = doc.querySelector('img[src]')?.getAttribute('src')?.trim();
    if (src && (/^https?:\/\//i.test(src) || src.startsWith('data:image/'))) {
      return src;
    }
  } catch {
    // Ignore malformed HTML clipboard fragments
  }
  return null;
}

function isLikelyImageText(text: string, allowAnyHttpUrl: boolean): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (allowAnyHttpUrl && /^https?:\/\/\S+$/i.test(trimmed)) return true;
  return IMAGE_URL_EXT_REGEX.test(trimmed);
}

async function dataUrlToPngBlob(dataUrl: string): Promise<Blob> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for clipboard copy'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode PNG blob'));
    }, 'image/png');
  });
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  label,
  altText,
  value = '',
  publicId = '',
  onChange,
  onPublicIdChange,
  uploadFolder,
  helperText = 'Supported formats: PNG, JPG, WEBP up to 10MB',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<DropzoneFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onPublicIdChangeRef = useRef(onPublicIdChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPublicIdChangeRef.current = onPublicIdChange;
  }, [onPublicIdChange]);

  useEffect(() => {
    if (!feedback) return;
    const timeoutMs = feedback.type === 'error' ? 8000 : 4000;
    const timer = window.setTimeout(() => setFeedback(null), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const applyExternalUrl = useCallback((url: string, successMessage?: string) => {
    onChangeRef.current(url);
    onPublicIdChangeRef.current?.('');
    setShowUrlInput(false);
    if (successMessage) {
      setFeedback({ type: 'success', message: successMessage });
    }
  }, []);

  const processBlobOrFile = useCallback(
    async (file: Blob, successMessage?: string) => {
      try {
        validateImageFile(file);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Invalid image file.' });
        return;
      }

      if (uploadFolder) {
        setIsUploading(true);
        setFeedback({ type: 'info', message: 'Saving image to studio storage...' });
        try {
          const uploaded = await mediaApi.uploadImageToCloudinary(
            file,
            uploadFolder,
            altText || label
          );
          onPublicIdChangeRef.current?.(uploaded.publicId);
          onChangeRef.current(uploaded.secureUrl);
          setShowUrlInput(false);
          setFeedback({
            type: 'success',
            message: successMessage
              ? `${successMessage} Kept in ${uploaded.storageProvider === 'local' ? 'backend studio storage' : 'Cloudinary'}.`
              : `Image saved and kept in ${uploaded.storageProvider === 'local' ? 'backend studio storage' : 'Cloudinary'}.`,
          });
        } catch (err: any) {
          setFeedback({
            type: 'error',
            message: err?.message || 'Image upload failed. Please try again.',
          });
        } finally {
          setIsUploading(false);
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onChangeRef.current(result);
          onPublicIdChangeRef.current?.('');
          setShowUrlInput(false);
          if (successMessage) {
            setFeedback({ type: 'success', message: successMessage });
          } else {
            setFeedback(null);
          }
        }
      };
      reader.readAsDataURL(file);
    },
    [altText, label, uploadFolder]
  );

  const handleClipboardData = useCallback(
    (clipboardData: DataTransfer | null, allowAnyHttpUrl: boolean): boolean => {
      if (!clipboardData) return false;

      // 1. Prefer raw image bytes (e.g. browser "Copy image", Snipping Tool, or copied file)
      const items = Array.from(clipboardData.items || []);
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processBlobOrFile(file, 'Image pasted from clipboard.');
            return true;
          }
        }
      }

      if (clipboardData.files && clipboardData.files.length > 0) {
        const imageFile = Array.from(clipboardData.files).find((f) => f.type.startsWith('image/'));
        if (imageFile) {
          processBlobOrFile(imageFile, 'Image pasted from clipboard.');
          return true;
        }
      }

      // 2. Fallback: webpage HTML containing <img src="...">
      const html = clipboardData.getData('text/html');
      if (html) {
        const imgSrc = extractImageSrcFromHtml(html);
        if (imgSrc) {
          applyExternalUrl(imgSrc, 'Page image link pasted from clipboard.');
          return true;
        }
      }

      // 3. Fallback: direct image URL or data URI in plain text
      const text = clipboardData.getData('text/plain')?.trim();
      if (text && isLikelyImageText(text, allowAnyHttpUrl)) {
        applyExternalUrl(text, 'Image link pasted from clipboard.');
        return true;
      }

      return false;
    },
    [applyExternalUrl, processBlobOrFile]
  );

  // Allow Ctrl+V / Cmd+V anywhere in the open admin modal when not typing in another field
  useEffect(() => {
    const handleWindowPaste = (e: globalThis.ClipboardEvent) => {
      if (e.defaultPrevented || showUrlInput) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      ) {
        return;
      }

      const handled = handleClipboardData(e.clipboardData, false);
      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [handleClipboardData, showUrlInput]);

  const handleDropzonePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const handled = handleClipboardData(e.clipboardData, true);
    if (handled) {
      e.preventDefault();
    } else {
      setFeedback({
        type: 'info',
        message: 'No image found in clipboard. Right-click any web image → Copy image, then press Ctrl+V.',
      });
    }
  };

  const handlePasteButtonClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!navigator.clipboard) {
      setFeedback({
        type: 'info',
        message: 'Press Ctrl+V to paste your copied image directly into the Dropbox.',
      });
      return;
    }

    try {
      if (typeof navigator.clipboard.read === 'function') {
        const clipboardItems = await navigator.clipboard.read();

        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            processBlobOrFile(blob, 'Image pasted from clipboard.');
            return;
          }
        }

        for (const item of clipboardItems) {
          if (item.types.includes('text/html')) {
            const htmlBlob = await item.getType('text/html');
            const imgSrc = extractImageSrcFromHtml(await htmlBlob.text());
            if (imgSrc) {
              applyExternalUrl(imgSrc, 'Page image link pasted from clipboard.');
              return;
            }
          }
          if (item.types.includes('text/plain')) {
            const textBlob = await item.getType('text/plain');
            const text = (await textBlob.text()).trim();
            if (isLikelyImageText(text, true)) {
              applyExternalUrl(text, 'Image URL pasted from clipboard.');
              return;
            }
          }
        }
      } else if (typeof navigator.clipboard.readText === 'function') {
        const text = (await navigator.clipboard.readText()).trim();
        if (isLikelyImageText(text, true)) {
          applyExternalUrl(text, 'Image URL pasted from clipboard.');
          return;
        }
      }

      setFeedback({
        type: 'info',
        message: 'No image found in clipboard. Right-click any image → Copy image, then click Paste Image or press Ctrl+V.',
      });
    } catch {
      setFeedback({
        type: 'info',
        message: 'Clipboard permission required — click inside the Dropbox and press Ctrl+V to paste.',
      });
    }
  };

  const handleCopyImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || !navigator.clipboard) return;

    try {
      if (value.startsWith('data:image/') && typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const pngBlob = await dataUrlToPngBlob(value);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      } else {
        await navigator.clipboard.writeText(value);
      }

      setCopied(true);
      setFeedback({ type: 'success', message: 'Image copied to clipboard.' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setFeedback({ type: 'success', message: 'Image data copied to clipboard.' });
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setFeedback({ type: 'error', message: 'Unable to copy image to clipboard.' });
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processBlobOrFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processBlobOrFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    onPublicIdChange?.('');
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block font-semibold uppercase text-stone-700 text-xs tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePasteButtonClick}
            className="text-[11px] text-gold-700 hover:text-burgundy-900 font-semibold flex items-center gap-1 transition-colors"
            title="Paste copied image or link from clipboard (Ctrl+V)"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>Paste Image</span>
          </button>
          <span className="text-stone-300 text-[10px]">|</span>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-burgundy-900 hover:text-burgundy-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Use Dropbox' : 'Paste URL'}</span>
          </button>
        </div>
      </div>

      {showUrlInput ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                onPublicIdChange?.('');
              }}
              placeholder="https://res.cloudinary.com/.../jewellery-piece.jpg"
              className="flex-1 p-2.5 text-xs border border-stone-300 rounded-lg outline-none focus:border-gold-500 font-mono"
            />
            <button
              type="button"
              onClick={handlePasteButtonClick}
              disabled={isUploading}
              className="px-3 py-2 text-[11px] font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 rounded-lg flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>
          </div>
          <p className="text-[10px] text-stone-400">Direct image link from web or Cloudinary</p>
        </div>
      ) : isUploading ? (
        <div className="border-2 border-dashed border-gold-500/60 rounded-xl p-6 text-center bg-gold-50/30">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-burgundy-900 animate-spin" />
            <p className="text-xs font-bold text-burgundy-950">Saving Studio Image...</p>
            <p className="text-[10px] text-stone-500">Validating & persisting asset to media storage</p>
          </div>
        </div>
      ) : value ? (
        <div
          tabIndex={0}
          onPaste={handleDropzonePaste}
          className="relative border-2 border-gold-500/40 rounded-xl p-3 bg-stone-50/70 flex items-center gap-4 outline-none focus:border-gold-500"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gold-500/30 bg-stone-200 shrink-0 shadow-sm relative group">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f5f4"/><text x="50" y="50" font-size="12" text-anchor="middle" fill="%23a8a29e">No Preview</text></svg>';
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-burgundy-950 truncate flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span>Image Attached</span>
            </p>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">
              {value.startsWith('data:') ? 'Image attached via Dropbox / Clipboard' : value}
            </p>
            {publicId && (
              <p className="text-[10px] font-mono text-gold-800 truncate mt-0.5">
                {publicId.startsWith('local/') ? `Studio Asset: ${publicId}` : `Cloudinary ID: ${publicId}`}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleCopyImage}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 flex items-center gap-1 shadow-xs transition-colors"
                title="Copy attached image to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-stone-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePasteButtonClick}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 flex items-center gap-1 shadow-xs transition-colors"
                title="Replace with image from clipboard (Ctrl+V)"
              >
                <ClipboardPaste className="w-3 h-3 text-gold-600" />
                <span>Paste</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-100 flex items-center gap-1 shadow-xs transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-stone-500" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 text-[11px] font-semibold bg-red-50 border border-red-200 text-red-700 rounded-md hover:bg-red-100 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handleDropzonePaste}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all outline-none focus:border-gold-500 ${
            isDragging
              ? 'border-gold-600 bg-gold-50/50 scale-[1.01]'
              : 'border-stone-300 hover:border-gold-500 hover:bg-stone-50/70 bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gold-100/70 flex items-center justify-center text-gold-700 border border-gold-300/50 shadow-inner">
              <UploadCloud className="w-5 h-5 text-burgundy-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-burgundy-950">
                Drag & drop image here,{' '}
                <span className="text-gold-700 underline font-extrabold">Browse</span>, or press{' '}
                <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 text-[10px] font-mono text-stone-700">
                  Ctrl+V
                </span>
              </p>
              <p className="text-[10px] text-stone-500 mt-1">{helperText}</p>
            </div>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-50 hover:bg-gold-100 border border-gold-300/70 text-[11px] font-semibold text-burgundy-900 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-gold-700" />
              <span>Paste Copied Image</span>
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-start gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-1.5 ${
            feedback.type === 'error'
              ? 'text-red-700 bg-red-50 border border-red-200'
              : feedback.type === 'success'
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                : 'text-amber-800 bg-amber-50 border border-amber-200'
          }`}
        >
          {feedback.type === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};
