import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppColors,
  HighContrastColors,
  StandardColors,
} from "../constants/colors";
import { accessibilityPreferences } from "../services/accessibilityPreferences";

type AccessibilityThemeContextValue = {
  colors: AppColors;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
};

const AccessibilityThemeContext =
  createContext<AccessibilityThemeContextValue | null>(null);

export function AccessibilityThemeProvider({ children }: PropsWithChildren) {
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    let mounted = true;

    void accessibilityPreferences.getHighContrast().then((enabled) => {
      if (mounted) setHighContrastState(enabled);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    void accessibilityPreferences.setHighContrast(enabled).catch(() => {
      // La interfaz puede continuar aunque el dispositivo rechace el guardado.
    });
  };

  const value = useMemo<AccessibilityThemeContextValue>(
    () => ({
      colors: highContrast ? HighContrastColors : StandardColors,
      highContrast,
      setHighContrast,
      toggleHighContrast: () => setHighContrast(!highContrast),
    }),
    [highContrast],
  );

  return (
    <AccessibilityThemeContext.Provider value={value}>
      {children}
    </AccessibilityThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AccessibilityThemeContext);

  if (!context) {
    throw new Error(
      "useAppTheme debe utilizarse dentro de AccessibilityThemeProvider",
    );
  }

  return context;
}

export function useThemedStyles<T>(factory: (colors: AppColors) => T) {
  const theme = useAppTheme();
  const styles = useMemo(() => factory(theme.colors), [factory, theme.colors]);

  return { ...theme, styles };
}
