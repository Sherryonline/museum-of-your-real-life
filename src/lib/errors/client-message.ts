export const authProviderUnavailableMessage =
  "The auth service is not reachable. Check your Supabase environment values and try again.";

export function getClientErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    error instanceof TypeError ||
    message.includes("fetch") ||
    message.includes("network") ||
    name.includes("fetch")
  ) {
    return authProviderUnavailableMessage;
  }

  return fallback;
}
