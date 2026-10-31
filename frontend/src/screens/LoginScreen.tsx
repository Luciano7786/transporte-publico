import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [contrasenia, setContrasenia] = useState('');
    const [cargando, setCargando] = useState(false);

    // Consumimos la función iniciarSesion del contexto global
    const auth = useContext(AuthContext);

    const handleIngresar = async () => {
        if (!email.trim() || !contrasenia.trim()) {
            Alert.alert('Atención', 'Por favor completa todos los campos.');
            return;
        }

        if (!auth) return;

        setCargando(true);
        try {
            await auth.iniciarSesion(email, contrasenia);
            // Nota: Si el inicio de sesión es exitoso, el contexto actualiza el estado 'usuario',
            // lo cual automáticamente hace que tu navegador detecte que estás logueado y te lleve al Home.
        } catch (err: any) {
            Alert.alert('Error al ingresar', err.message || 'Verificá tus credenciales.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Transporte Público</Text>
            <Text style={styles.subtitulo}>Paraná</Text>

            <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#888"
                value={contrasenia}
                onChangeText={setContrasenia}
                secureTextEntry
            />

            <TouchableOpacity style={styles.boton} onPress={handleIngresar} disabled={cargando}>
                {cargando ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.botonTexto}>Iniciar Sesión</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1B6CA8',
    },
    subtitulo: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    boton: {
        backgroundColor: '#1B6CA8',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    botonTexto: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});