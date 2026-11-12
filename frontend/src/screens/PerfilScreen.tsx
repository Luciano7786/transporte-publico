import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerLineas } from "../services/lineas.service";
import { obtenerParadas } from "../services/paradas.service";
import type { Linea, Parada, Tema } from "../types";

const OPCIONES_TEMA: Array<{
  id: Tema;
  label: string;
  icono: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "sistema", label: "Sistema", icono: "phone-portrait-outline" },
  { id: "claro", label: "Claro", icono: "sunny-outline" },
  { id: "oscuro", label: "Oscuro", icono: "moon-outline" },
];

export function PerfilScreen() {
  const { paleta, temaPreferido, setTemaUsuario } = useThemeContext();
  const auth = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const [lineasCatalogo, setLineasCatalogo] = useState<Linea[]>([]);
  const [paradasCatalogo, setParadasCatalogo] = useState<Parada[]>([]);
  const [avisosActivosLocal, setAvisosActivosLocal] = useState<boolean>(
    auth?.usuario?.avisosActivos ?? true,
  );

  useEffect(() => {
    if (auth?.usuario) {
      setAvisosActivosLocal(auth.usuario.avisosActivos);
    }
  }, [auth?.usuario]);

  useEffect(() => {
    let activo = true;
    async function cargarCatalogos() {
      try {
        const [resLineas, resParadas] = await Promise.allSettled([
          obtenerLineas(),
          obtenerParadas(),
        ]);
        if (activo) {
          if (resLineas.status === "fulfilled" && resLineas.value.datos) {
            setLineasCatalogo(resLineas.value.datos);
          }
          if (resParadas.status === "fulfilled" && resParadas.value.datos) {
            setParadasCatalogo(resParadas.value.datos);
          }
        }
      } catch {
      }
    }
    cargarCatalogos();
    return () => {
      activo = false;
    };
  }, []);

  const handleCambiarTema = async (nuevoTema: Tema) => {
    setTemaUsuario(nuevoTema);
    if (auth?.usuario) {
      await auth.actualizarPreferenciasUsuario({ tema: nuevoTema });
    }
  };

  const handleToggleAvisos = async (valor: boolean) => {
    setAvisosActivosLocal(valor);
    if (auth?.usuario) {
      await auth.actualizarPreferenciasUsuario({ avisosActivos: valor });
    }
  };

  const handleToggleBiometria = async (valor: boolean) => {
    if (!auth?.usuario) return;
    if (valor) {
      const ok = await auth?.autenticarConBiometria();
      if (!ok) {
        Alert.alert(
          "Huella no verificada",
          "No se pudo verificar tu huella digital para activar el acceso rápido.",
        );
        return;
      }
    }
    await auth?.setBiometriaHabilitada(valor);
  };

  const lineasFavObjetos = (auth?.lineasFavoritas ?? []).map((id) => {
    const encontrada = lineasCatalogo.find((l) => l.id === id);
    return (
      encontrada ?? {
        id,
        numero: id.replace("lin-0", "").replace("lin-", ""),
        nombre: `Línea ${id.replace("lin-0", "").replace("lin-", "")}`,
        color: "#1B6CA8",
      }
    );
  });

  const paradasFavObjetos = (auth?.paradasFavoritas ?? []).map((id) => {
    const encontrada = paradasCatalogo.find((p) => p.id === id);
    return (
      encontrada ?? {
        id,
        nombre: id === "par-101" ? "Alameda y Urquiza" : id,
      }
    );
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: paleta.textoAlto }]}>
          Mi Perfil
        </Text>
        <Text style={[styles.subtitle, { color: paleta.textoBajo }]}>
          Cuenta, favoritos y preferencias de la aplicación
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
            },
          ]}
        >
          {auth?.usuario ? (
            <>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: paleta.acento },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: paleta.textoSobreAcento },
                    ]}
                  >
                    {(auth.usuario.nombre || auth.usuario.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text
                    style={[styles.userName, { color: paleta.textoAlto }]}
                    numberOfLines={1}
                  >
                    {auth.usuario.nombre || "Pasajero"}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: paleta.textoMedio }]}
                    numberOfLines={1}
                  >
                    {auth.usuario.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.botonCerrarSesion}
                onPress={() => auth.cerrarSesion()}
              >
                <Ionicons name="log-out-outline" size={18} color="#c53030" />
                <Text style={styles.botonCerrarSesionTexto}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.userRow}>
                <View
                  style={[
                    styles.avatarContainer,
                    { backgroundColor: paleta.superficie2 },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={26}
                    color={paleta.textoMedio}
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: paleta.textoAlto }]}>
                    Modo Invitado
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: paleta.textoMedio }]}
                  >
                    Iniciá sesión para sincronizar tus favoritos, enviar
                    reportes y recibir avisos.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.botonPrimario,
                  { backgroundColor: paleta.acento },
                ]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text
                  style={[
                    styles.botonPrimarioTexto,
                    { color: paleta.textoSobreAcento },
                  ]}
                >
                  Iniciar Sesión o Crear Cuenta
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: paleta.textoAlto }]}>
            Apariencia
          </Text>
          <Text style={[styles.sectionDesc, { color: paleta.textoMedio }]}>
            Elegí cómo ver la aplicación en la calle o de noche
          </Text>

          <View style={styles.temaRow}>
            {OPCIONES_TEMA.map((op) => {
              const seleccionado = temaPreferido === op.id;
              return (
                <TouchableOpacity
                  key={op.id}
                  activeOpacity={0.75}
                  onPress={() => handleCambiarTema(op.id)}
                  style={[
                    styles.chipTema,
                    seleccionado
                      ? {
                          backgroundColor: paleta.acento,
                          borderColor: paleta.acento,
                        }
                      : {
                          backgroundColor: paleta.fondoApp,
                          borderColor: paleta.borde,
                        },
                  ]}
                >
                  <Ionicons
                    name={op.icono}
                    size={16}
                    color={
                      seleccionado
                        ? paleta.textoSobreAcento
                        : paleta.textoMedio
                    }
                  />
                  <Text
                    style={[
                      styles.chipTemaTexto,
                      {
                        color: seleccionado
                          ? paleta.textoSobreAcento
                          : paleta.textoAlto,
                      },
                    ]}
                  >
                    {op.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {auth?.usuario ? (
          <>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: paleta.textoAlto }]}>
                Avisos y Seguridad
              </Text>

              <View style={styles.switchRow}>
                <View style={styles.switchTexts}>
                  <Text style={[styles.switchLabel, { color: paleta.textoAlto }]}>
                    Notificaciones de mis líneas
                  </Text>
                  <Text style={[styles.switchSub, { color: paleta.textoMedio }]}>
                    Recibir alertas cuando una línea favorita tiene un desvío nuevo
                  </Text>
                </View>
                <Switch
                  value={avisosActivosLocal}
                  onValueChange={handleToggleAvisos}
                  trackColor={{ false: paleta.borde, true: paleta.acento }}
                />
              </View>

              <View
                style={[
                  styles.switchRow,
                  {
                    borderTopWidth: 1,
                    borderTopColor: paleta.borde,
                    paddingTop: 12,
                    marginTop: 12,
                  },
                ]}
              >
                <View style={styles.switchTexts}>
                  <Text style={[styles.switchLabel, { color: paleta.textoAlto }]}>
                    Reingreso con huella digital
                  </Text>
                  <Text style={[styles.switchSub, { color: paleta.textoMedio }]}>
                    {auth?.biometriaDisponible
                      ? "Desbloqueo rápido con huella digital para tu cuenta"
                      : "Configurá una huella digital en tu dispositivo para usarla"}
                  </Text>
                </View>
                <Switch
                  value={Boolean(auth?.biometriaHabilitada)}
                  onValueChange={handleToggleBiometria}
                  disabled={!auth?.biometriaDisponible}
                  trackColor={{ false: paleta.borde, true: paleta.acento }}
                />
              </View>
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: paleta.textoAlto }]}>
                Mis Líneas Favoritas ({lineasFavObjetos.length})
              </Text>

              {lineasFavObjetos.length === 0 ? (
                <Text style={[styles.emptyFavText, { color: paleta.textoMedio }]}>
                  Todavía no marcaste líneas como favoritas. Tocá la estrella en el
                  detalle de cualquier línea.
                </Text>
              ) : (
                <View style={styles.favList}>
                  {lineasFavObjetos.map((l) => (
                    <TouchableOpacity
                      key={l.id}
                      activeOpacity={0.75}
                      onPress={() =>
                        navigation.navigate("LineaDetalle", { lineaId: l.id })
                      }
                      style={[
                        styles.favItem,
                        {
                          backgroundColor: paleta.fondoApp,
                          borderColor: paleta.borde,
                        },
                      ]}
                    >
                      <View style={styles.favItemLeft}>
                        <View
                          style={[
                            styles.lineaBadge,
                            { backgroundColor: l.color || "#1B6CA8" },
                          ]}
                        >
                          <Text style={styles.lineaBadgeTexto}>{l.numero}</Text>
                        </View>
                        <Text
                          style={[styles.favItemTitle, { color: paleta.textoAlto }]}
                          numberOfLines={1}
                        >
                          {l.nombre}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => auth?.alternarLineaFavorita(l.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="star" size={20} color="#F59E0B" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: paleta.textoAlto }]}>
                Mis Paradas Favoritas ({paradasFavObjetos.length})
              </Text>

              {paradasFavObjetos.length === 0 ? (
                <Text style={[styles.emptyFavText, { color: paleta.textoMedio }]}>
                  Todavía no guardaste paradas favoritas. Tocá la estrella al abrir
                  una parada en el mapa.
                </Text>
              ) : (
                <View style={styles.favList}>
                  {paradasFavObjetos.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.75}
                      onPress={() =>
                        navigation.navigate("ParadaDetalle", { paradaId: p.id })
                      }
                      style={[
                        styles.favItem,
                        {
                          backgroundColor: paleta.fondoApp,
                          borderColor: paleta.borde,
                        },
                      ]}
                    >
                      <View style={styles.favItemLeft}>
                        <Ionicons
                          name="location-outline"
                          size={20}
                          color={paleta.acento}
                        />
                        <Text
                          style={[styles.favItemTitle, { color: paleta.textoAlto }]}
                          numberOfLines={1}
                        >
                          {p.nombre}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => auth?.alternarParadaFavorita(p.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="star" size={20} color="#F59E0B" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    lineHeight: 18,
  },
  botonPrimario: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botonPrimarioTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  botonCerrarSesion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#c53030",
  },
  botonCerrarSesionTexto: {
    color: "#c53030",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
  },
  temaRow: {
    flexDirection: "row",
    gap: 8,
  },
  chipTema: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipTemaTexto: {
    fontSize: 13,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6,
  },
  switchTexts: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  switchSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyFavText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  favList: {
    marginTop: 10,
    gap: 8,
  },
  favItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  favItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  lineaBadge: {
    minWidth: 34,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  lineaBadgeTexto: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  favItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
});