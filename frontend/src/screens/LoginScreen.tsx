import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";

export default function LoginScreen() {
  const { paleta } = useThemeContext();
  const auth = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    const emailLimpio = email.trim();
    if (!emailLimpio || !password) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completá tu correo electrónico y contraseña.",
      );
      return;
    }

    if (modoRegistro && !nombre.trim()) {
      Alert.alert("Campos incompletos", "Por favor ingresá tu nombre.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña corta",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    try {
      setCargando(true);
      if (modoRegistro) {
        await auth?.registrarse(nombre.trim(), emailLimpio, password);
      } else {
        await auth?.iniciarSesion(emailLimpio, password);
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace("MainTabs");
      }
    } catch (error: any) {
      Alert.alert(
        modoRegistro ? "Error al registrarse" : "Error de inicio de sesión",
        error?.message || "Verifique sus datos e intente de nuevo.",
      );
    } finally {
      setCargando(false);
    }
  };

  const handleIngresoBiometrico = async () => {
    try {
      setCargando(true);
      const exito = await auth?.iniciarSesionConHuella();
      if (exito) {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace("MainTabs");
        }
      } else {
        Alert.alert(
          "Autenticación cancelada",
          "No se pudo verificar tu huella digital. Ingresá con tu correo y contraseña.",
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const handleAutocompletarDemo = () => {
    setModoRegistro(false);
    setEmail("julian@mail.com");
    setPassword("demo1234");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: paleta.fondoApp }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace("MainTabs");
              }
            }}
            style={styles.backRow}
          >
            <Ionicons name="chevron-back" size={20} color={paleta.textoAlto} />
            <Text style={[styles.backText, { color: paleta.textoAlto }]}>
              Volver
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.card,
              {
                backgroundColor: paleta.superficie1,
                borderColor: paleta.borde,
              },
            ]}
          >
            <Text style={[styles.title, { color: paleta.textoAlto }]}>
              {modoRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
            </Text>
            <Text style={[styles.subtitle, { color: paleta.textoMedio }]}>
              {modoRegistro
                ? "Registrate para sincronizar tus líneas favoritas y enviar reportes."
                : "Accedé a tus favoritos sincronizados y avisos personalizados."}
            </Text>

            {modoRegistro ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: paleta.textoAlto,
                    borderColor: paleta.borde,
                    backgroundColor: paleta.fondoApp,
                  },
                ]}
                placeholder="Tu nombre (ej: Lucía Pérez)"
                placeholderTextColor={paleta.textoBajo}
                value={nombre}
                onChangeText={setNombre}
              />
            ) : null}

            <TextInput
              style={[
                styles.input,
                {
                  color: paleta.textoAlto,
                  borderColor: paleta.borde,
                  backgroundColor: paleta.fondoApp,
                },
              ]}
              placeholder="Correo electrónico"
              placeholderTextColor={paleta.textoBajo}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View
              style={[
                styles.passwordContainer,
                {
                  borderColor: paleta.borde,
                  backgroundColor: paleta.fondoApp,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: paleta.textoAlto }]}
                placeholder="Contraseña (mínimo 6 caracteres)"
                placeholderTextColor={paleta.textoBajo}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarPassword(!mostrarPassword)}
              >
                <Ionicons
                  name={mostrarPassword ? "eye" : "eye-off"}
                  size={22}
                  color={paleta.textoMedio}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.boton, { backgroundColor: paleta.acento }]}
              onPress={handleSubmit}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color={paleta.textoSobreAcento} />
              ) : (
                <Text
                  style={[
                    styles.botonTexto,
                    { color: paleta.textoSobreAcento },
                  ]}
                >
                  {modoRegistro ? "Registrarme" : "Ingresar"}
                </Text>
              )}
            </TouchableOpacity>

            {!modoRegistro &&
            auth?.biometriaDisponible &&
            auth?.biometriaHabilitada &&
            auth?.tieneSesionBiometricaGuardada ? (
              <TouchableOpacity
                style={[
                  styles.botonBiometria,
                  { borderColor: paleta.borde, backgroundColor: paleta.fondoApp },
                ]}
                onPress={handleIngresoBiometrico}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={paleta.acento}
                />
                <Text
                  style={[styles.botonBiometriaTexto, { color: paleta.textoAlto }]}
                >
                  Ingresar con huella digital
                </Text>
              </TouchableOpacity>
            ) : null}

            {!modoRegistro ? (
              <TouchableOpacity
                onPress={handleAutocompletarDemo}
                style={styles.demoBtn}
              >
                <Text style={[styles.demoText, { color: paleta.textoMedio }]}>
                  Usar cuenta de prueba (julian@mail.com · demo1234)
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setModoRegistro((prev) => !prev)}
              style={styles.switchModeBtn}
            >
              <Text style={[styles.switchModeText, { color: paleta.acento }]}>
                {modoRegistro
                  ? "¿Ya tenés cuenta? Iniciá sesión"
                  : "¿No tenés cuenta? Registrate gratis"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
  },
  card: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    marginBottom: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
  },
  eyeButton: {
    padding: 6,
  },
  boton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
  botonBiometria: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  botonBiometriaTexto: {
    fontSize: 14,
    fontWeight: "600",
  },
  demoBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 4,
  },
  demoText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
  switchModeBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: "700",
  },
});