/**
 * Extracts a clean, user-actionable error message from Axios/API responses
 * (including Zod validation `error.details` arrays) or thrown Error instances.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const anyErr = err as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        error?: {
          code?: string;
          message?: string;
          details?: Array<{ field?: string; message?: string }>;
        };
      };
    };
  };

  const status = anyErr.response?.status;
  const apiError = anyErr.response?.data?.error;
  const details = Array.isArray(apiError?.details) ? apiError.details : [];

  if (details.length > 0) {
    const formattedDetails = details
      .map((item) => {
        const msg = (item?.message || '').trim();
        if (!msg) return '';
        const cleanField = (item?.field || '')
          .replace(/^body\./, '')
          .replace(/^query\./, '')
          .replace(/^params\./, '')
          .trim();
        return cleanField ? `${cleanField}: ${msg}` : msg;
      })
      .filter(Boolean);

    if (formattedDetails.length > 0) {
      return formattedDetails.join(' • ');
    }
  }

  if (status === 401) {
    return (
      apiError?.message ||
      'Your administrative session has expired. Please sign in again to continue.'
    );
  }

  return (
    apiError?.message ||
    anyErr.response?.data?.message ||
    (anyErr instanceof Error ? anyErr.message : '') ||
    anyErr.message ||
    fallback
  );
}
