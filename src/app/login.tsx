import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MessageDialog } from "../components/shared/MessageDialog";
import { Colors } from "../constants/colors";
import { fs, sp } from "../constants/responsive";
import { setCurrentUserId } from "../services/authSession";
import { usuariosService } from "../services/usuariosService";
import {
  getRetroAuthenticatorSecret,
  saveRetroAuthenticatorSecret,
} from "../utils/retroAuthenticatorStore";
import {
  hasRetroAuthenticatorPin,
  setupRetroAuthenticatorPin,
  verifyRetroAuthenticatorPin,
} from "../utils/retroAuthenticatorPin";
import { generateTotp, getTotpSecondsRemaining } from "../utils/totp";
import {
  getMissingPasswordRequirements,
  getPasswordRequirements,
} from "../utils/passwordValidation";
import {
  getMissingUsernameRequirements,
  getUsernameRequirements,
} from "../utils/usernameValidation";

type OtpMethod = "google" | "retrogarage";
type RetroPinStatus = "checking" | "setup" | "locked" | "unlocked";

// Pantalla inicial: login real y solicitud de cuenta sin rol asignado.
export default function LoginScreen() {
  const router = useRouter();

  const [modo, setModo] = useState<"login" | "registro" | "recuperacion">(
    "login",
  );
  const [cargando, setCargando] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [loginBlockedSeconds, setLoginBlockedSeconds] = useState(0);
  const [otpPendiente, setOtpPendiente] = useState<{
    tempToken: string;
    setupRequired: boolean;
    googleSetupRequired?: boolean;
    retroSetupRequired?: boolean;
    methods?: OtpMethod[];
    accountKey?: string;
    accountLabel?: string;
    googleSecret?: string;
    retroSecret?: string;
    otpauthUrl?: string;
  } | null>(null);
  const [selectedOtpMethod, setSelectedOtpMethod] =
    useState<OtpMethod>("google");
  const [retroSecret, setRetroSecret] = useState<string | null>(null);
  const [retroCode, setRetroCode] = useState("");
  const [retroSecondsRemaining, setRetroSecondsRemaining] = useState(30);
  const [retroPinStatus, setRetroPinStatus] =
    useState<RetroPinStatus>("checking");
  const [retroPin, setRetroPin] = useState("");
  const [retroPinConfirm, setRetroPinConfirm] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [respuesta1, setRespuesta1] = useState("");
  const [respuesta2, setRespuesta2] = useState("");
  const [preguntaRecuperacion, setPreguntaRecuperacion] = useState<1 | 2>(1);
  const [respuestaRecuperacion, setRespuestaRecuperacion] = useState("");
  const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
  const [recuperacionSolicitada, setRecuperacionSolicitada] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarNuevaContrasena, setConfirmarNuevaContrasena] = useState("");
  const [focused, setFocused] = useState("");
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (loginBlockedSeconds <= 0) return;

    const interval = setInterval(() => {
      setLoginBlockedSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [loginBlockedSeconds]);

  useEffect(() => {
    let active = true;

    const loadRetroSecret = async () => {
      if (!otpPendiente || selectedOtpMethod !== "retrogarage") return;

      if (otpPendiente.retroSecret) {
        setRetroSecret(otpPendiente.retroSecret);
        return;
      }

      if (!otpPendiente.accountKey) {
        setRetroSecret(null);
        return;
      }

      const savedSecret = await getRetroAuthenticatorSecret(
        otpPendiente.accountKey,
      );
      if (active) setRetroSecret(savedSecret);
    };

    loadRetroSecret();

    return () => {
      active = false;
    };
  }, [otpPendiente, selectedOtpMethod]);

  useEffect(() => {
    let active = true;

    const loadPinStatus = async () => {
      if (
        !otpPendiente?.accountKey ||
        selectedOtpMethod !== "retrogarage" ||
        !retroSecret
      ) {
        setRetroPinStatus("checking");
        return;
      }

      const hasPin = await hasRetroAuthenticatorPin(otpPendiente.accountKey);
      if (active) setRetroPinStatus(hasPin ? "locked" : "setup");
    };

    loadPinStatus();

    return () => {
      active = false;
    };
  }, [otpPendiente?.accountKey, retroSecret, selectedOtpMethod]);

  useEffect(() => {
    if (
      !otpPendiente ||
      selectedOtpMethod !== "retrogarage" ||
      !retroSecret ||
      retroPinStatus !== "unlocked"
    ) {
      return;
    }

    const refreshCode = () => {
      const timestamp = Date.now();
      const code = generateTotp(retroSecret, timestamp);
      setRetroSecondsRemaining(getTotpSecondsRemaining(timestamp));

      if (code) {
        setRetroCode(code);
        setCodigoOtp(code);
      }
    };

    refreshCode();
    const interval = setInterval(refreshCode, 1000);

    return () => clearInterval(interval);
  }, [otpPendiente, retroPinStatus, retroSecret, selectedOtpMethod]);

  const loginBloqueado = loginBlockedSeconds > 0;
  const loginBlockMessage = loginBloqueado
    ? `Demasiados intentos fallidos. Intente nuevamente en ${Math.floor(
        loginBlockedSeconds / 60,
      )}:${String(loginBlockedSeconds % 60).padStart(2, "0")}.`
    : "";
  const retroAuthenticatorUnavailable =
    selectedOtpMethod === "retrogarage" &&
    (!retroSecret || retroPinStatus !== "unlocked");

  const limpiar = () => {
    setUsuario("");
    setContrasena("");
    setCodigoOtp("");
    setOtpPendiente(null);
    setSelectedOtpMethod("google");
    setRetroSecret(null);
    setRetroCode("");
    setRetroSecondsRemaining(30);
    setRetroPinStatus("checking");
    setRetroPin("");
    setRetroPinConfirm("");
    setNombreUsuario("");
    setNombreCompleto("");
    setCorreo("");
    setTelefono("");
    setConfirmar("");
    setRespuesta1("");
    setRespuesta2("");
    setPreguntaRecuperacion(1);
    setRespuestaRecuperacion("");
    setCodigoRecuperacion("");
    setRecuperacionSolicitada(false);
    setNuevaContrasena("");
    setConfirmarNuevaContrasena("");
    setFocused("");
  };

  const cambiarModo = (nuevoModo: "login" | "registro" | "recuperacion") => {
    setModo(nuevoModo);
    limpiar();
  };

  const handleLogin = async () => {
    if (otpPendiente) {
      await handleVerificarOtp();
      return;
    }

    if (loginBloqueado) {
      setMessageDialog({
        title: "Acceso bloqueado",
        message: loginBlockMessage,
      });
      return;
    }

    if (!usuario.trim() || !contrasena) {
      setMessageDialog({
        title: "Datos incompletos",
        message: "Ingrese usuario/correo y contraseña.",
      });
      return;
    }

    try {
      setCargando(true);
      const response = await usuariosService.login({
        usuario: usuario.trim(),
        contrasena,
      });

      if (response.requiresOtp) {
        const pendingOtp = {
          tempToken: response.tempToken,
          setupRequired: Boolean(response.setupRequired),
          googleSetupRequired: Boolean(response.googleSetupRequired),
          retroSetupRequired: Boolean(response.retroSetupRequired),
          methods: response.methods || ["google", "retrogarage"],
          accountKey: response.accountKey,
          accountLabel: response.accountLabel,
          googleSecret: response.googleSecret,
          retroSecret: response.retroSecret,
          otpauthUrl: response.otpauthUrl,
        };

        setOtpPendiente({
          ...pendingOtp,
        });
        setSelectedOtpMethod("google");
        setRetroSecret(response.retroSecret || null);
        setRetroCode("");
        setRetroPinStatus("checking");
        setRetroPin("");
        setRetroPinConfirm("");
        setCodigoOtp("");

        if (response.retroSecret && response.accountKey) {
          await saveRetroAuthenticatorSecret(
            response.accountKey,
            response.retroSecret,
          );
        }

        setMessageDialog({
          title: response.googleSetupRequired
            ? "Configura Google Authenticator"
            : "Verificación requerida",
          message: response.googleSetupRequired
            ? "Escanea el QR o ingresa la clave manual en Google Authenticator. Luego escribe el código de 6 dígitos."
            : "Ingrese el código de 6 dígitos de Google Authenticator.",
        });
        return;
      }

      setCurrentUserId(response.usuario?.id_usuario);
      setLoginBlockedSeconds(0);
      router.replace("/dashboard" as any);
    } catch (e: any) {
      if (e.status === 423 || e.blockedUntil) {
        setLoginBlockedSeconds(Number(e.remainingSeconds || 180));
      }

      setMessageDialog({
        title:
          e.status === 423 || e.blockedUntil
            ? "Acceso bloqueado"
            : "No se pudo iniciar sesión",
        message: e.message || "Revise sus credenciales.",
      });
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarOtp = async () => {
    if (selectedOtpMethod === "retrogarage" && !retroSecret) {
      setMessageDialog({
        title: "Autenticador no configurado",
        message:
          "Configure el Autenticador RetroGarage en este dispositivo antes de usar esta opción.",
      });
      return;
    }

    if (selectedOtpMethod === "retrogarage" && retroPinStatus !== "unlocked") {
      setMessageDialog({
        title: "PIN requerido",
        message: "Desbloquee el Autenticador RetroGarage con su PIN.",
      });
      return;
    }

    if (!otpPendiente || codigoOtp.trim().length !== 6) {
      setMessageDialog({
        title: "Código incompleto",
        message:
          selectedOtpMethod === "retrogarage"
            ? "Espere a que se genere el código de 6 dígitos."
            : "Ingrese el código de 6 dígitos de Google Authenticator.",
      });
      return;
    }

    try {
      setCargando(true);
      const response = await usuariosService.verificarOtp({
        tempToken: otpPendiente.tempToken,
        codigo: codigoOtp.trim(),
        metodo: selectedOtpMethod,
      });
      setCurrentUserId(response.usuario?.id_usuario);
      setOtpPendiente(null);
      setCodigoOtp("");
      router.replace("/dashboard" as any);
    } catch (e: any) {
      setMessageDialog({
        title: "No se pudo verificar",
        message: e.message || "Revise el código e intente nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };


  const handleCrearRetroPin = async () => {
    if (!otpPendiente?.accountKey) return;
    if (!/^\d{4,8}$/.test(retroPin)) {
      setMessageDialog({
        title: "PIN inválido",
        message: "Use un PIN numérico de 4 a 8 dígitos.",
      });
      return;
    }
    if (retroPin !== retroPinConfirm) {
      setMessageDialog({
        title: "PIN distinto",
        message: "La confirmación debe coincidir con el PIN.",
      });
      return;
    }

    await setupRetroAuthenticatorPin(otpPendiente.accountKey, retroPin);
    setRetroPin("");
    setRetroPinConfirm("");
    setRetroPinStatus("unlocked");
  };

  const handleDesbloquearRetroPin = async () => {
    if (!otpPendiente?.accountKey) return;

    const isValid = await verifyRetroAuthenticatorPin(
      otpPendiente.accountKey,
      retroPin,
    );

    if (!isValid) {
      setMessageDialog({
        title: "PIN incorrecto",
        message: "Revise el PIN e intente nuevamente.",
      });
      return;
    }

    setRetroPin("");
    setRetroPinStatus("unlocked");
  };


  const handleRegistro = async () => {
    if (
      !nombreUsuario.trim() ||
      !nombreCompleto.trim() ||
      !correo.trim() ||
      !contrasena ||
      !respuesta1.trim() ||
      !respuesta2.trim()
    ) {
      setMessageDialog({
        title: "Datos incompletos",
        message: "Complete los campos obligatorios.",
      });
      return;
    }

    const missingUsernameRequirements = getMissingUsernameRequirements(
      nombreUsuario.trim(),
    );
    if (missingUsernameRequirements.length > 0) {
      setMessageDialog({
        title: "Nombre de usuario inválido",
        message: `Falta: ${missingUsernameRequirements
          .map((requirement) => requirement.label)
          .join(", ")}.`,
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setMessageDialog({
        title: "Correo inválido",
        message: "Ingrese un correo electrónico válido.",
      });
      return;
    }

    const missingPasswordRequirements =
      getMissingPasswordRequirements(contrasena);
    if (missingPasswordRequirements.length > 0) {
      setMessageDialog({
        title: "Contraseña inválida",
        message: `Falta: ${missingPasswordRequirements
          .map((requirement) => requirement.label)
          .join(", ")}.`,
      });
      return;
    }

    if (contrasena !== confirmar) {
      setMessageDialog({
        title: "Contraseñas distintas",
        message: "La confirmación debe coincidir con la contraseña.",
      });
      return;
    }

    try {
      setCargando(true);
      await usuariosService.crear({
        id_rol: null,
        nombre_usuario: nombreUsuario.trim(),
        nombre_completo: nombreCompleto.trim(),
        correo: correo.trim(),
        telefono: telefono.trim() || null,
        contrasena,
        respuesta1: respuesta1.trim(),
        respuesta2: respuesta2.trim(),
      });
      limpiar();
      setModo("login");
      setMessageDialog({
        title: "Cuenta creada",
        message: "Un administrador debe asignarle un rol antes de ingresar.",
      });
    } catch (e: any) {
      setMessageDialog({
        title: "No se pudo crear la cuenta",
        message: e.message || "Intente nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };

  const handleSolicitarRecuperacion = async () => {
    if (!correo.trim() || !respuestaRecuperacion.trim()) {
      setMessageDialog({
        title: "Datos incompletos",
        message: "Ingrese el correo y la respuesta de seguridad.",
      });
      return;
    }

    try {
      setCargando(true);
      const response = await usuariosService.solicitarRecuperacion({
        correo: correo.trim(),
        pregunta: preguntaRecuperacion,
        respuesta: respuestaRecuperacion.trim(),
      });
      setRecuperacionSolicitada(true);
      setMessageDialog({
        title: "Solicitud recibida",
        message: response.message,
      });
    } catch (e: any) {
      setMessageDialog({
        title: "No se pudo solicitar recuperación",
        message: e.message || "Intente nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarRecuperacion = async () => {
    if (!correo.trim() || !codigoRecuperacion.trim() || !nuevaContrasena) {
      setMessageDialog({
        title: "Datos incompletos",
        message: "Ingrese correo, código y nueva contraseña.",
      });
      return;
    }

    const missingPasswordRequirements =
      getMissingPasswordRequirements(nuevaContrasena);
    if (missingPasswordRequirements.length > 0) {
      setMessageDialog({
        title: "Contraseña inválida",
        message: `Falta: ${missingPasswordRequirements
          .map((requirement) => requirement.label)
          .join(", ")}.`,
      });
      return;
    }

    if (nuevaContrasena !== confirmarNuevaContrasena) {
      setMessageDialog({
        title: "Contraseñas distintas",
        message: "La confirmación debe coincidir con la nueva contraseña.",
      });
      return;
    }

    try {
      setCargando(true);
      await usuariosService.confirmarRecuperacion({
        correo: correo.trim(),
        codigo: codigoRecuperacion.trim(),
        nueva_contrasena: nuevaContrasena,
      });
      limpiar();
      setModo("login");
      setMessageDialog({
        title: "Contraseña actualizada",
        message: "Ya puede ingresar con su nueva contraseña.",
      });
    } catch (e: any) {
      setMessageDialog({
        title: "No se pudo actualizar",
        message: e.message || "Revise el código e intente nuevamente.",
      });
    } finally {
      setCargando(false);
    }
  };

  const inputStyle = (key: string) => [
    styles.input,
    focused === key && styles.inputFocused,
  ];
  const usernameRequirements = getUsernameRequirements(nombreUsuario.trim());
  const passwordRequirements = getPasswordRequirements(contrasena);
  const recoveryPasswordRequirements = getPasswordRequirements(nuevaContrasena);
  const canCreateAccount = Boolean(
    modo === "registro" &&
      nombreUsuario.trim() &&
      usernameRequirements.every((requirement) => requirement.isValid) &&
      nombreCompleto.trim() &&
      correo.trim() &&
      contrasena &&
      confirmar &&
      respuesta1.trim() &&
      respuesta2.trim() &&
      passwordRequirements.every((requirement) => requirement.isValid) &&
      contrasena === confirmar,
  );
  const canRequestRecovery = Boolean(
    modo === "recuperacion" &&
      !recuperacionSolicitada &&
      correo.trim() &&
      respuestaRecuperacion.trim(),
  );
  const canResetPassword = Boolean(
    modo === "recuperacion" &&
      recuperacionSolicitada &&
      correo.trim() &&
      codigoRecuperacion.trim() &&
      nuevaContrasena &&
      confirmarNuevaContrasena &&
      recoveryPasswordRequirements.every((requirement) => requirement.isValid) &&
      nuevaContrasena === confirmarNuevaContrasena,
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RETRO GARAGE</Text>
          <Text style={styles.headerSub}>CLASSIC CAR SHOP</Text>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.body}>
          <Text style={styles.titulo}>
            {modo === "login"
              ? "Acceso administrativo"
              : modo === "registro"
                ? "Crear usuario"
                : "Recuperar contraseña"}
          </Text>
          <Text style={styles.subtitulo}>
            {modo === "login"
              ? "Ingresa tus credenciales para continuar"
              : modo === "registro"
                ? "Solicita una cuenta para que el admin asigne tu rol"
                : "Verifica tu identidad y crea una nueva contraseña"}
          </Text>
          {modo === "login" && loginBloqueado ? (
            <Text style={styles.loginBlockNotice}>{loginBlockMessage}</Text>
          ) : null}

          {modo !== "recuperacion" ? (
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  modo === "login" && styles.modeBtnActive,
                ]}
                onPress={() => cambiarModo("login")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.modeText,
                    modo === "login" && styles.modeTextActive,
                  ]}
                >
                  ENTRAR
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  modo === "registro" && styles.modeBtnActive,
                ]}
                onPress={() => cambiarModo("registro")}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.modeText,
                    modo === "registro" && styles.modeTextActive,
                  ]}
                >
                  CREAR
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {modo === "recuperacion" && (
            <>
              <Text style={styles.sectionLabel}>CORREO ELECTRÓNICO</Text>
              <TextInput
                style={inputStyle("correoRecuperacion")}
                placeholder="usuario@retrogarage.com"
                placeholderTextColor={Colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={correo}
                onChangeText={setCorreo}
                onFocus={() => setFocused("correoRecuperacion")}
                onBlur={() => setFocused("")}
                editable={!recuperacionSolicitada}
              />

              {!recuperacionSolicitada ? (
                <>
                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    PREGUNTA DE SEGURIDAD
                  </Text>
                  <View style={styles.modeRow}>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        preguntaRecuperacion === 1 && styles.modeBtnActive,
                      ]}
                      onPress={() => setPreguntaRecuperacion(1)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.modeText,
                          preguntaRecuperacion === 1 && styles.modeTextActive,
                        ]}
                      >
                        MASCOTA
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeBtn,
                        preguntaRecuperacion === 2 && styles.modeBtnActive,
                      ]}
                      onPress={() => setPreguntaRecuperacion(2)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.modeText,
                          preguntaRecuperacion === 2 && styles.modeTextActive,
                        ]}
                      >
                        CIUDAD
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.securityQuestion}>
                    {preguntaRecuperacion === 1
                      ? "¿Cuál es el nombre de tu primera mascota?"
                      : "¿En qué ciudad o pueblo naciste?"}
                  </Text>
                  <TextInput
                    style={inputStyle("respuestaRecuperacion")}
                    placeholder={
                      preguntaRecuperacion === 1 ? "Ej. Rocky" : "Ej. Cartago"
                    }
                    placeholderTextColor={Colors.gray}
                    value={respuestaRecuperacion}
                    onChangeText={setRespuestaRecuperacion}
                    onFocus={() => setFocused("respuestaRecuperacion")}
                    onBlur={() => setFocused("")}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    CÓDIGO DE RECUPERACIÓN
                  </Text>
                  <TextInput
                    style={inputStyle("codigoRecuperacion")}
                    placeholder="Código temporal"
                    placeholderTextColor={Colors.gray}
                    keyboardType="number-pad"
                    value={codigoRecuperacion}
                    onChangeText={setCodigoRecuperacion}
                    onFocus={() => setFocused("codigoRecuperacion")}
                    onBlur={() => setFocused("")}
                  />

                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    NUEVA CONTRASEÑA
                  </Text>
                  <TextInput
                    style={inputStyle("nuevaContrasena")}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.gray}
                    secureTextEntry
                    value={nuevaContrasena}
                    onChangeText={setNuevaContrasena}
                    onFocus={() => setFocused("nuevaContrasena")}
                    onBlur={() => setFocused("")}
                  />

                  <View style={styles.passwordRules}>
                    <Text style={styles.passwordRulesTitle}>
                      Tu contraseña debe cumplir:
                    </Text>
                    {recoveryPasswordRequirements.map((requirement) => (
                      <Text
                        key={requirement.key}
                        style={[
                          styles.passwordRule,
                          requirement.isValid && styles.passwordRuleValid,
                        ]}
                      >
                        {requirement.isValid ? "✓" : "•"} {requirement.label}
                      </Text>
                    ))}
                  </View>

                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    CONFIRMAR NUEVA CONTRASEÑA
                  </Text>
                  <TextInput
                    style={inputStyle("confirmarNuevaContrasena")}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.gray}
                    secureTextEntry
                    value={confirmarNuevaContrasena}
                    onChangeText={setConfirmarNuevaContrasena}
                    onFocus={() => setFocused("confirmarNuevaContrasena")}
                    onBlur={() => setFocused("")}
                  />
                  <Text
                    style={[
                      styles.passwordMatch,
                      confirmarNuevaContrasena &&
                        nuevaContrasena === confirmarNuevaContrasena &&
                        styles.passwordRuleValid,
                    ]}
                  >
                    {confirmarNuevaContrasena &&
                    nuevaContrasena === confirmarNuevaContrasena
                      ? "✓"
                      : "•"}{" "}
                    Las contraseñas coinciden
                  </Text>
                </>
              )}
            </>
          )}

          {modo === "registro" && (
            <>
              <Text style={styles.sectionLabel}>NOMBRE DE USUARIO</Text>
              <TextInput
                style={inputStyle("nombreUsuario")}
                placeholder="jperez"
                placeholderTextColor={Colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
                value={nombreUsuario}
                onChangeText={setNombreUsuario}
                onFocus={() => setFocused("nombreUsuario")}
                onBlur={() => setFocused("")}
              />
              <View style={styles.passwordRules}>
                <Text style={styles.passwordRulesTitle}>
                  Tu nombre de usuario debe cumplir:
                </Text>
                {usernameRequirements.map((requirement) => (
                  <Text
                    key={requirement.key}
                    style={[
                      styles.passwordRule,
                      requirement.isValid && styles.passwordRuleValid,
                    ]}
                  >
                    {requirement.isValid ? "✓" : "•"} {requirement.label}
                  </Text>
                ))}
              </View>

              <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                NOMBRE COMPLETO
              </Text>
              <TextInput
                style={inputStyle("nombreCompleto")}
                placeholder="Juan Pérez"
                placeholderTextColor={Colors.gray}
                value={nombreCompleto}
                onChangeText={setNombreCompleto}
                onFocus={() => setFocused("nombreCompleto")}
                onBlur={() => setFocused("")}
              />
            </>
          )}

          {modo !== "recuperacion" && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  modo === "registro" && styles.fieldSpacing,
                ]}
              >
                {modo === "login" ? "USUARIO O CORREO" : "CORREO ELECTRÓNICO"}
              </Text>
              <TextInput
                style={inputStyle(modo === "login" ? "usuario" : "correo")}
                placeholder={
                  modo === "login" ? "jperez" : "usuario@retrogarage.com"
                }
                placeholderTextColor={Colors.gray}
                keyboardType={modo === "login" ? "default" : "email-address"}
                autoCapitalize="none"
                autoCorrect={false}
                value={modo === "login" ? usuario : correo}
                onChangeText={(value) => {
                  if (modo === "login") {
                    setUsuario(value);
                    setOtpPendiente(null);
                    setCodigoOtp("");
                  } else {
                    setCorreo(value);
                  }
                }}
                onFocus={() =>
                  setFocused(modo === "login" ? "usuario" : "correo")
                }
                onBlur={() => setFocused("")}
                editable={modo !== "login" || !otpPendiente}
              />

              {modo === "registro" && (
                <>
                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    TELÉFONO
                  </Text>
                  <TextInput
                    style={inputStyle("telefono")}
                    placeholder="8888-8888"
                    placeholderTextColor={Colors.gray}
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                    onFocus={() => setFocused("telefono")}
                    onBlur={() => setFocused("")}
                  />
                </>
              )}

              {modo === "registro" && (
                <>
                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    ¿CUÁL ES EL NOMBRE DE TU PRIMERA MASCOTA?
                  </Text>
                  <TextInput
                    style={inputStyle("respuesta1")}
                    placeholder="Ej. Rocky"
                    placeholderTextColor={Colors.gray}
                    value={respuesta1}
                    onChangeText={setRespuesta1}
                    onFocus={() => setFocused("respuesta1")}
                    onBlur={() => setFocused("")}
                  />

                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    ¿EN QUÉ CIUDAD O PUEBLO NACISTE?
                  </Text>
                  <TextInput
                    style={inputStyle("respuesta2")}
                    placeholder="Ej. Cartago"
                    placeholderTextColor={Colors.gray}
                    value={respuesta2}
                    onChangeText={setRespuesta2}
                    onFocus={() => setFocused("respuesta2")}
                    onBlur={() => setFocused("")}
                  />
                </>
              )}

              <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                CONTRASEÑA
              </Text>
              <TextInput
                style={inputStyle("contrasena")}
                placeholder="••••••••"
                placeholderTextColor={Colors.gray}
                secureTextEntry
                value={contrasena}
                onChangeText={(value) => {
                  setContrasena(value);
                  setOtpPendiente(null);
                  setCodigoOtp("");
                }}
                onFocus={() => setFocused("contrasena")}
                onBlur={() => setFocused("")}
                editable={!otpPendiente}
              />

              {modo === "login" && otpPendiente && (
                <View style={styles.otpBox}>
                  <View style={styles.otpMethodRow}>
                    <TouchableOpacity
                      style={[
                        styles.otpMethodBtn,
                        selectedOtpMethod === "google" &&
                          styles.otpMethodBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedOtpMethod("google");
                        setCodigoOtp("");
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.otpMethodText,
                          selectedOtpMethod === "google" &&
                            styles.otpMethodTextActive,
                        ]}
                      >
                        GOOGLE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.otpMethodBtn,
                        selectedOtpMethod === "retrogarage" &&
                          styles.otpMethodBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedOtpMethod("retrogarage");
                        setCodigoOtp(
                          retroSecret && retroPinStatus === "unlocked"
                            ? retroCode
                            : "",
                        );
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.otpMethodText,
                          selectedOtpMethod === "retrogarage" &&
                            styles.otpMethodTextActive,
                        ]}
                      >
                        RETROGARAGE
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {otpPendiente.googleSetupRequired && (
                    <>
                      <Text style={styles.otpText}>
                        Escanea este QR con Google Authenticator o usa la clave
                        manual.
                      </Text>
                      {otpPendiente.otpauthUrl ? (
                        <Image
                          style={styles.otpQr}
                          source={{
                            uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                              otpPendiente.otpauthUrl,
                            )}`,
                          }}
                          resizeMode="contain"
                        />
                      ) : null}
                      {otpPendiente.googleSecret ? (
                        <Text style={styles.otpSecret}>
                          {otpPendiente.googleSecret}
                        </Text>
                      ) : null}
                    </>
                  )}

                  {selectedOtpMethod === "retrogarage" ? (
                    <View style={styles.retroOtpPanel}>
                      <Text style={styles.retroOtpLabel}>
                        AUTENTICADOR RETROGARAGE
                      </Text>
                      {retroSecret ? (
                        retroPinStatus === "unlocked" ? (
                          <>
                            <Text style={styles.retroOtpCode}>
                              {retroCode || "------"}
                            </Text>
                            <Text style={styles.retroOtpTimer}>
                              Cambia en {retroSecondsRemaining}s
                            </Text>
                          </>
                        ) : (
                          <View style={styles.retroPinBox}>
                            <Text style={styles.retroOtpMissing}>
                              {retroPinStatus === "setup"
                                ? "Cree un PIN local para proteger este autenticador."
                                : "Ingrese su PIN RetroGarage para ver el codigo."}
                            </Text>
                            <TextInput
                              style={[styles.input, styles.retroPinInput]}
                              placeholder="PIN"
                              placeholderTextColor={Colors.gray}
                              keyboardType="number-pad"
                              secureTextEntry
                              maxLength={8}
                              value={retroPin}
                              onChangeText={(value) =>
                                setRetroPin(value.replace(/\D/g, "").slice(0, 8))
                              }
                            />
                            {retroPinStatus === "setup" ? (
                              <TextInput
                                style={[styles.input, styles.retroPinInput]}
                                placeholder="Confirmar PIN"
                                placeholderTextColor={Colors.gray}
                                keyboardType="number-pad"
                                secureTextEntry
                                maxLength={8}
                                value={retroPinConfirm}
                                onChangeText={(value) =>
                                  setRetroPinConfirm(
                                    value.replace(/\D/g, "").slice(0, 8),
                                  )
                                }
                              />
                            ) : null}
                            <TouchableOpacity
                              style={styles.retroPinButton}
                              onPress={
                                retroPinStatus === "setup"
                                  ? handleCrearRetroPin
                                  : handleDesbloquearRetroPin
                              }
                              activeOpacity={0.85}
                            >
                              <Text style={styles.retroPinButtonText}>
                                {retroPinStatus === "setup"
                                  ? "CREAR PIN"
                                  : "DESBLOQUEAR"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      ) : (
                        <Text style={styles.retroOtpMissing}>
                          Esta cuenta no tiene RetroGarage configurado en este
                          dispositivo. Use Google Authenticator o reinicie la
                          configuración OTP.
                        </Text>
                      )}
                    </View>
                  ) : null}

                  <Text style={styles.sectionLabel}>
                    {selectedOtpMethod === "retrogarage"
                      ? "CÓDIGO RETROGARAGE"
                      : "CÓDIGO AUTHENTICATOR"}
                  </Text>
                  <TextInput
                    style={inputStyle("codigoOtp")}
                    placeholder="123456"
                    placeholderTextColor={Colors.gray}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={
                      selectedOtpMethod === "retrogarage"
                        ? retroPinStatus === "unlocked"
                          ? retroCode
                          : ""
                        : codigoOtp
                    }
                    onChangeText={(value) =>
                      setCodigoOtp(value.replace(/\D/g, "").slice(0, 6))
                    }
                    onFocus={() => setFocused("codigoOtp")}
                    onBlur={() => setFocused("")}
                    editable={selectedOtpMethod === "google"}
                  />
                </View>
              )}

              {modo === "registro" && (
                <View style={styles.passwordRules}>
                  <Text style={styles.passwordRulesTitle}>
                    Tu contraseña debe cumplir:
                  </Text>
                  {passwordRequirements.map((requirement) => (
                    <Text
                      key={requirement.key}
                      style={[
                        styles.passwordRule,
                        requirement.isValid && styles.passwordRuleValid,
                      ]}
                    >
                      {requirement.isValid ? "✓" : "•"} {requirement.label}
                    </Text>
                  ))}
                </View>
              )}

              {modo === "registro" && (
                <>
                  <Text style={[styles.sectionLabel, styles.fieldSpacing]}>
                    CONFIRMAR CONTRASEÑA
                  </Text>
                  <TextInput
                    style={inputStyle("confirmar")}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.gray}
                    secureTextEntry
                    value={confirmar}
                    onChangeText={setConfirmar}
                    onFocus={() => setFocused("confirmar")}
                    onBlur={() => setFocused("")}
                  />
                  <Text
                    style={[
                      styles.passwordMatch,
                      confirmar &&
                        contrasena === confirmar &&
                        styles.passwordRuleValid,
                    ]}
                  >
                    {confirmar && contrasena === confirmar ? "✓" : "•"} Las
                    contraseñas coinciden
                  </Text>
                </>
              )}
            </>
          )}


          <TouchableOpacity
            style={[
              styles.boton,
              (cargando ||
                (modo === "login" && loginBloqueado) ||
                (modo === "login" && retroAuthenticatorUnavailable) ||
                (modo === "login" &&
                  otpPendiente !== null &&
                  codigoOtp.trim().length !== 6) ||
                (modo === "registro" && !canCreateAccount) ||
                (modo === "recuperacion" &&
                  !(canRequestRecovery || canResetPassword))) &&
                styles.botonDisabled,
            ]}
            onPress={
              modo === "login"
                ? handleLogin
                : modo === "registro"
                  ? handleRegistro
                  : recuperacionSolicitada
                    ? handleConfirmarRecuperacion
                    : handleSolicitarRecuperacion
            }
            activeOpacity={0.85}
            disabled={
              cargando ||
              (modo === "login" && loginBloqueado) ||
              (modo === "login" && retroAuthenticatorUnavailable) ||
              (modo === "login" &&
                otpPendiente !== null &&
                codigoOtp.trim().length !== 6) ||
              (modo === "registro" && !canCreateAccount) ||
              (modo === "recuperacion" &&
                !(canRequestRecovery || canResetPassword))
            }
          >
            {cargando ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text style={styles.botonTexto}>
                {modo === "login"
                  ? otpPendiente
                    ? "VERIFICAR CÓDIGO"
                    : "ENTRAR AL TALLER"
                  : modo === "registro"
                    ? "CREAR CUENTA"
                    : recuperacionSolicitada
                      ? "ACTUALIZAR CONTRASEÑA"
                      : "SOLICITAR CÓDIGO"}
              </Text>
            )}
          </TouchableOpacity>

          {modo === "login" && (
            <TouchableOpacity
              onPress={() => cambiarModo("recuperacion")}
              activeOpacity={0.7}
              style={styles.olvidasteBtn}
            >
              <Text style={styles.olvidaste}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          )}

          {modo === "recuperacion" && (
            <TouchableOpacity
              onPress={() => cambiarModo("login")}
              activeOpacity={0.7}
              style={styles.olvidasteBtn}
            >
              <Text style={styles.olvidaste}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
      </ScrollView>

      <MessageDialog
        visible={messageDialog !== null}
        title={messageDialog?.title ?? ""}
        message={messageDialog?.message ?? ""}
        onClose={() => setMessageDialog(null)}
      />
    </KeyboardAvoidingView>
  );
}

// Estilos visuales del login.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: sp(56),
    paddingBottom: sp(36),
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: fs(22),
    fontWeight: "700",
    letterSpacing: 6,
  },
  headerSub: {
    color: "#B8B4D4",
    fontSize: fs(11),
    letterSpacing: 4,
    marginTop: sp(6),
  },
  headerDivider: {
    marginTop: sp(20),
    width: sp(32),
    height: 1.5,
    backgroundColor: "#5c5878",
  },
  body: {
    flex: 1,
    paddingHorizontal: sp(20),
    paddingTop: sp(36),
    paddingBottom: sp(24),
  },
  titulo: {
    fontSize: fs(24),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(6),
  },
  subtitulo: {
    fontSize: fs(13),
    color: Colors.gray,
    marginBottom: sp(20),
  },
  loginBlockNotice: {
    backgroundColor: "#FFF3E8",
    borderColor: "#D9742F",
    borderRadius: sp(10),
    borderWidth: 1,
    color: "#993C1D",
    fontSize: fs(12),
    fontWeight: "600",
    marginBottom: sp(16),
    paddingHorizontal: sp(12),
    paddingVertical: sp(10),
  },
  modeRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    padding: sp(4),
    marginBottom: sp(28),
  },
  modeBtn: {
    flex: 1,
    borderRadius: sp(8),
    paddingVertical: sp(10),
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    color: Colors.gray,
    fontSize: fs(12),
    fontWeight: "700",
    letterSpacing: 2,
  },
  modeTextActive: {
    color: Colors.cream,
  },
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1.5,
    marginBottom: sp(8),
  },
  fieldSpacing: {
    marginTop: sp(20),
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    fontSize: fs(15),
    color: Colors.primary,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  passwordRules: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    paddingHorizontal: sp(12),
    paddingVertical: sp(10),
    marginTop: sp(10),
  },
  passwordRulesTitle: {
    color: Colors.primary,
    fontSize: fs(12),
    fontWeight: "700",
    marginBottom: sp(8),
  },
  passwordRule: {
    color: "#993C1D",
    fontSize: fs(12),
    marginBottom: sp(4),
  },
  passwordRuleValid: {
    color: "#0F6E56",
  },
  passwordMatch: {
    color: "#993C1D",
    fontSize: fs(12),
    marginTop: sp(6),
    marginLeft: sp(4),
  },
  otpBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    padding: sp(14),
    marginTop: sp(20),
  },
  otpMethodRow: {
    flexDirection: "row",
    gap: sp(8),
    marginBottom: sp(12),
  },
  otpMethodBtn: {
    flex: 1,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: sp(8),
    alignItems: "center",
  },
  otpMethodBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  otpMethodText: {
    fontSize: fs(11),
    fontWeight: "700",
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  otpMethodTextActive: {
    color: Colors.cream,
  },
  otpText: {
    color: Colors.primary,
    fontSize: fs(12),
    marginBottom: sp(10),
  },
  otpQr: {
    width: sp(190),
    height: sp(190),
    alignSelf: "center",
    marginBottom: sp(12),
  },
  otpSecret: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: sp(14),
  },
  retroOtpPanel: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    paddingHorizontal: sp(12),
    paddingVertical: sp(12),
    marginBottom: sp(14),
    alignItems: "center",
  },
  retroOtpLabel: {
    color: Colors.gray,
    fontSize: fs(10),
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: sp(8),
  },
  retroOtpCode: {
    color: Colors.primary,
    fontSize: fs(28),
    fontWeight: "700",
    letterSpacing: 5,
  },
  retroOtpTimer: {
    color: Colors.gray,
    fontSize: fs(12),
    marginTop: sp(4),
  },
  retroOtpMissing: {
    color: "#993C1D",
    fontSize: fs(12),
    textAlign: "center",
  },
  retroPinBox: {
    alignSelf: "stretch",
    gap: sp(10),
  },
  retroPinInput: {
    alignSelf: "stretch",
    textAlign: "center",
  },
  retroPinButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    paddingVertical: sp(11),
  },
  retroPinButtonText: {
    color: Colors.cream,
    fontSize: fs(11),
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  securityQuestion: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "600",
    marginBottom: sp(8),
  },
  boton: {
    backgroundColor: Colors.primary,
    borderRadius: sp(10),
    paddingVertical: sp(16),
    alignItems: "center",
    marginTop: sp(32),
    marginBottom: sp(20),
  },
  botonDisabled: {
    opacity: 0.75,
  },
  botonTexto: {
    color: Colors.cream,
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 3,
  },
  olvidasteBtn: {
    alignItems: "center",
  },
  olvidaste: {
    fontSize: fs(13),
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginTop: sp(24),
    marginBottom: sp(32),
    paddingHorizontal: sp(20),
  },
});
