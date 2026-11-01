import React, { useState, useContext } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";

export default function LoginScreen() {
    const { paleta } = useThemeContext();
    const auth = useContext(AuthContext);
    const navigation = useNavigation<any>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const handleLogin = async () => {
        try {
            await auth?.iniciarSesion(email, password);
            navigation.goBack();
        } catch (error) {
            alert("Error al iniciar sesión. Verifique sus credenciales.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: paleta.fondoApp }]}>
            <View style={[styles.card, { backgroundColor: paleta.fondoApp, borderColor: paleta.borde || "#ddd" }]}>
                <Text style={[styles.title, { color: paleta.textoAlto }]}>Iniciar Sesión</Text>

                <TextInput
                    style={[styles.input, { color: paleta.textoAlto, borderColor: paleta.borde || "#ddd" }]}
                    placeholder="Correo electrónico"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                {/* Campo de contraseña bloqueado por defecto (oculto) */}
                <View style={[styles.passwordContainer, { borderColor: paleta.borde || "#ddd" }]}>
                    <TextInput
                        style={[styles.passwordInput, { color: paleta.textoAlto }]}
                        placeholder="Contraseña"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!mostrarPassword} // Bloqueado/oculto por defecto
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setMostrarPassword(!mostrarPassword)} // Se desbloquea solo si el usuario lo presiona
                    >
                        <Ionicons
                            name={mostrarPassword ? "eye" : "eye-off"}
                            size={22}
                            color={paleta.textoMedio || "#666"}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.boton} onPress={handleLogin}>
                    <Text style={styles.botonTexto}>Ingresar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20
    },
    card: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    eyeButton: {
        padding: 8,
    },
    boton: {
        backgroundColor: "#1B6CA8",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    botonTexto: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});