import { getCurrentUserId } from "./authSession";

export const apiFetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  const currentUserId = getCurrentUserId();

  if (currentUserId) {
    headers.set("x-user-id", String(currentUserId));
  }

  return fetch(input, {
    ...init,
    headers,
  });
};
