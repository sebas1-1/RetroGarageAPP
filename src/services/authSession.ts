let currentUserId: number | null = null;

export const setCurrentUserId = (id: number | null | undefined) => {
  currentUserId = typeof id === "number" && Number.isFinite(id) ? id : null;
};

export const getCurrentUserId = () => currentUserId;
