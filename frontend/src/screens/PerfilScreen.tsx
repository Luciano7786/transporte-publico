import React, { useContext } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";

export function PerfilScreen() {
  const { paleta } = useThemeContext();
  const auth = useContext(AuthContext);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paleta.fondoApp }]}>
      <Text style={[styles.title, { color: paleta.textoAlto }]}>
        Mi Perfil
      </Text>

      <View style={styles.content}>
        {auth?.usuario ? (
          // --- CASO 1: USUARIO LOGUEADO ---
          <View style={[styles.card, { backgroundColor: paleta.fondoApp, borderColor: paleta.borde || "#ddd" }]}>
            {/* Avatar con la inicial del correo */}
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {auth.usuario.email ? auth.usuario.email.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>

            <Text style={[styles.welcomeText, { color: paleta.textoAlto }]}>¡Hola de nuevo!</Text>
            <Text style={[styles.email, { color: "#1B6CA8" }]}>
              {auth.usuario.email || "Usuario"}
            </Text>

            {/* Botón de Cerrar Sesión */}
            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={() => auth.cerrarSesion()}
            >
              <Text style={styles.botonSecundarioTexto}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // NAVEGANDO COMO INVITADO
          <View style={[styles.card, { backgroundColor: paleta.fondoApp, borderColor: paleta.borde || "#ddd" }]}>
            <View style={styles.guestIconContainer}>
              <Text style={styles.guestIcon}>👤</Text>
            </View>
            <Text style={[styles.textoInfo, { color: paleta.textoAlto }]}>
              Estás navegando como invitado. Inicia sesión para acceder a tus favoritos y más funciones.
            </Text>

            <TouchableOpacity
              style={[styles.boton, { backgroundColor: "#1B6CA8" }]}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.botonTexto}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20 
  },
  content: { 
    flex: 1, 
    justifyContent: "center", 
    width: "100%", 
    paddingHorizontal: 10 
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1B6CA8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  textoInfo: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
  },
  guestIconContainer: {
    marginBottom: 12,
  },
  guestIcon: {
    fontSize: 40,
    textAlign: "center",
  },
  boton: {
    width: "100%",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  botonTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  botonSecundario: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#c53030",
    backgroundColor: "transparent",
  },
  botonSecundarioTexto: {
    color: "#c53030",
    fontSize: 15,
    fontWeight: "600",
  },
});