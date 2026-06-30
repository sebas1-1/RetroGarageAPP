export type UsernameRequirement = {
  key: string;
  label: string;
  isValid: boolean;
};

export const getUsernameRequirements = (
  username: string,
): UsernameRequirement[] => [
  {
    key: "length",
    label: "Entre 4 y 50 caracteres",
    isValid: username.length >= 4 && username.length <= 50,
  },
  {
    key: "start",
    label: "Empieza con letra o número",
    isValid: /^[A-Za-z0-9]/.test(username),
  },
  {
    key: "characters",
    label: "Solo letras, números, punto o guion bajo",
    isValid: /^[A-Za-z0-9._]+$/.test(username),
  },
  {
    key: "spaces",
    label: "Sin espacios",
    isValid: !/\s/.test(username),
  },
];

export const getMissingUsernameRequirements = (username: string) =>
  getUsernameRequirements(username).filter(
    (requirement) => !requirement.isValid,
  );

export const isValidUsername = (username: string) =>
  getMissingUsernameRequirements(username).length === 0;
