/**
 * Reads a user-facing message from an axios/API error (or returns fallback).
 */
export function getAuthErrorMessage(err: unknown, fallback: string): string {
  const r = err as {
    response?: { data?: { message?: string }; status?: number };
    message?: string;
  };

  const msg = r.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();

  if (r.message === "Network Error") {
    return "Unable to reach the server. Check your connection and try again.";
  }

  const status = r.response?.status;
  if (status === 429) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  return fallback;
}
