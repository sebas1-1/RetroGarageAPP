export type PasswordRequirement = {
  key: string;
  label: string;
  isValid: boolean;
};

export const getPasswordRequirements = (
  password: string,
): PasswordRequirement[] => {
  return [
    {
      key: "length",
      label: "Mínimo 8 caracteres",
      isValid: password.length >= 8,
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
      label: "Al menos 1 número",
      isValid: /\d/.test(password),
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
