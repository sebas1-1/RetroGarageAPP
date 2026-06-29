export type PasswordRequirement = {
  key: string;
  label: string;
  isValid: boolean;
};

export const getPasswordRequirements = (
  password: string,
): PasswordRequirement[] => {
  const numberMatches = password.match(/\d/g) ?? [];

  return [
    {
      key: "length",
      label: "Mínimo 12 caracteres",
      isValid: password.length >= 12,
    },
    {
      key: "uppercase",
      label: "Al menos 1 letra mayúscula",
      isValid: /[A-Z]/.test(password),
    },
    {
      key: "special",
      label: "Al menos 1 carácter especial",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
    {
      key: "numbers",
      label: "Al menos 2 números",
      isValid: numberMatches.length >= 2,
    },
  ];
};

export const getMissingPasswordRequirements = (password: string) =>
  getPasswordRequirements(password).filter((requirement) => !requirement.isValid);

export const isSecurePassword = (password: string) =>
  getMissingPasswordRequirements(password).length === 0;

export const getPasswordErrorMessage = (password: string) => {
  const missing = getMissingPasswordRequirements(password);

  if (missing.length === 0) return "";

  return `Falta: ${missing.map((requirement) => requirement.label).join(", ")}`;
};
