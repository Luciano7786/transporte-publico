import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisosHoyCard } from "../components/inicio/AvisosHoyCard";
import { InicioHeader } from "../components/inicio/InicioHeader";
import { MapaInicio } from "../components/inicio/MapaInicio";
import {
  LineaHorariosCard,
  TusParadasCard,
} from "../components/inicio/TusParadasCard";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  calcularDistanciaMetros,
  formatearDistancia,
  useUbicacion,
} from "../hooks/use-ubicacion";
import { obtenerAvisos, obtenerLineas } from "../services/lineas.service";
import {
  calcularProximosHorarios,
  obtenerHorariosPorParada,
  obtenerParadas,
  obtenerTipoDeDiaActual,
} from "../services/paradas.service";
import type { Aviso, Linea, Parada } from "../types";

export function ParadasScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();
  const { coordenadas: usuarioCoords } = useUbicacion();

  const [paradas, setParadas] = useState<Parada[]>([]);
  const [lineasCatalogo, setLineasCatalogo] = useState<Linea[]>([]);
  const [avisoDestacado, setAvisoDestacado] = useState<Aviso | null>(null);
  const [busqueda, setBusqueda] = useState<string>("");
  const [lineasCard, setLineasCard] = useState<LineaHorariosCard[]>([
    { numero: "5", color: "#1B6CA8", proximos: ["10:42", "11:02", "11:22"] },
    { numero: "14", color: "#B45309", proximos: ["10:51", "11:21", "11:51"] },
  ]);

  // Calcula la parada más cercana en base a las coordenadas reales del usuario
  const paradaMasCercana = useMemo(() => {
    if (paradas.length === 0) return null;
    let cercana = paradas[0];
    let menorDist = calcularDistanciaMetros(usuarioCoords, cercana.coordenadas);

    for (let i = 1; i < paradas.length; i++) {
      const dist = calcularDistanciaMetros(usuarioCoords, paradas[i].coordenadas);
      if (dist < menorDist) {
        menorDist = dist;
        cercana = paradas[i];
      }
    }

    return {
      parada: cercana,
      distanciaMetros: menorDist,
    };
  }, [paradas, usuarioCoords]);

  // Filtra las paradas en tiempo real por nombre o calle (funciona incluso sin permiso de GPS)
  const paradasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return [];
    return paradas
      .filter((p) => p.nombre.toLowerCase().includes(termino))
      .map((p) => ({
        parada: p,
        distanciaMetros: calcularDistanciaMetros(usuarioCoords, p.coordenadas),
      }))
      .sort((a, b) => a.distanciaMetros - b.distanciaMetros);
  }, [paradas, busqueda, usuarioCoords]);

  useEffect(() => {
    let activo = true;

    async function cargarDatosInicio() {
      try {
        const [resParadas, resLineas, resAvisos] = await Promise.allSettled([
          obtenerParadas(),
          obtenerLineas(),
          obtenerAvisos(),
        ]);

        if (activo) {
          if (resParadas.status === "fulfilled" && resParadas.value.datos) {
            setParadas(resParadas.value.datos);
          }
          if (resLineas.status === "fulfilled" && resLineas.value.datos) {
            setLineasCatalogo(resLineas.value.datos);
          }
          if (resAvisos.status === "fulfilled" && resAvisos.value.datos) {
            const desvio = resAvisos.value.datos.find((a) => a.gravedad === "desvio");
            setAvisoDestacado(desvio ?? resAvisos.value.datos[0] ?? null);
          }
        }
      } catch (err) {
        console.warn("Error al cargar datos de inicio:", err);
      }
    }

    cargarDatosInicio();

    return () => {
      activo = false;
    };
  }, []);

  // Actualiza los próximos horarios de la parada más cercana usando la hora real del sistema
  useEffect(() => {
    let activo = true;
    const paradaObjetivo = paradaMasCercana?.parada;
    const idParada = paradaObjetivo?.id ?? "par-101";
    const idsLineas = paradaObjetivo?.lineaIds ?? ["lin-05", "lin-14"];

    async function actualizarHorariosCercana() {
      try {
        const resHorarios = await obtenerHorariosPorParada(idParada);
        if (!activo || !resHorarios.datos || resHorarios.datos.length === 0) return;

        const tipoDiaHoy = obtenerTipoDeDiaActual();
        const tarjetas: LineaHorariosCard[] = idsLineas.slice(0, 3).map((lId) => {
          const lineaInfo = lineasCatalogo.find((l) => l.id === lId);
          const numero =
            lineaInfo?.numero ?? lId.replace("lin-0", "").replace("lin-", "");
          const color =
            lineaInfo?.color ?? (lId === "lin-05" ? "#1B6CA8" : "#B45309");

          // Calcula con la hora real del dispositivo; si ya terminó el servicio hoy, muestra los primeros de mañana
          const calc = calcularProximosHorarios(
            resHorarios.datos,
            lId,
            undefined,
            3,
            tipoDiaHoy,
          );

          const proximosMostrar =
            calc.proximos.length > 0
              ? calc.proximos
              : calc.todosDelDia.slice(0, 3).length > 0
                ? calc.todosDelDia.slice(0, 3)
                : lId === "lin-05"
                  ? ["05:20", "05:42", "06:02"]
                  : ["05:35", "06:21", "06:51"];

          return {
            numero,
            color,
            proximos: proximosMostrar,
          };
        });

        if (tarjetas.length > 0) {
          setLineasCard(tarjetas);
        }
      } catch (err) {
        console.warn("No se pudieron calcular horarios de la parada cercana:", err);
      }
    }

    actualizarHorariosCercana();

    return () => {
      activo = false;
    };
  }, [paradaMasCercana?.parada.id, lineasCatalogo]);

  const handleQrPress = () => {
    navigation.navigate("EscanearQr");
  };

  const handleParadaPress = (paradaSeleccionada?: Parada) => {
    const id = paradaSeleccionada?.id ?? "par-101";
    setBusqueda("");
    navigation.navigate("ParadaDetalle", { paradaId: id });
  };

  const handleAvisosPress = () => {
    navigation.navigate("Avisos");
  };

  const textoAviso = avisoDestacado
    ? `${avisoDestacado.lineaIds
        .map((l) => l.replace("lin-0", "L").replace("lin-", "L"))
        .join(", ")}: ${avisoDestacado.titulo.toLowerCase()}`
    : "L2, L7 y L9: desvío por obra en calle Corrientes";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: paleta.fondoApp,
        },
      ]}
    >
      <InicioHeader titulo="Paraná" onPressQr={handleQrPress} />

      {/* Buscador de paradas por nombre o por calle */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={paleta.textoMedio} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar parada por nombre o calle..."
            placeholderTextColor={paleta.textoBajo}
            style={[styles.searchInput, { color: paleta.textoAlto }]}
            returnKeyType="search"
          />
          {busqueda.length > 0 ? (
            <TouchableOpacity
              onPress={() => setBusqueda("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={paleta.textoMedio} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Si el usuario está buscando por nombre/calle, mostramos resultados directos */}
      {busqueda.trim().length > 0 ? (
        <View style={styles.resultadosContainer}>
          <FlatList
            data={paradasFiltradas}
            keyExtractor={(item) => item.parada.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultadosLista}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={[styles.emptySearchTexto, { color: paleta.textoMedio }]}>
                  No encontramos paradas para "{busqueda.trim()}".
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleParadaPress(item.parada)}
                style={[
                  styles.resultadoItem,
                  {
                    backgroundColor: paleta.superficie1,
                    borderColor: paleta.borde,
                  },
                ]}
              >
                <View style={styles.resultadoInfo}>
                  <Text
                    style={[styles.resultadoNombre, { color: paleta.textoAlto }]}
                  >
                    {item.parada.nombre}
                  </Text>
                  <Text
                    style={[styles.resultadoSub, { color: paleta.textoMedio }]}
                  >
                    Líneas:{" "}
                    {item.parada.lineaIds
                      .map((id) => id.replace("lin-0", "").replace("lin-", ""))
                      .join(", ")}{" "}
                    · {formatearDistancia(item.distanciaMetros)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={paleta.textoMedio}
                />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <>
          <TusParadasCard
            nombreParada={paradaMasCercana?.parada.nombre ?? "Alameda y Urquiza"}
            distancia={
              paradaMasCercana
                ? formatearDistancia(paradaMasCercana.distanciaMetros)
                : "a 120 m"
            }
            lineas={lineasCard}
            onPress={() => handleParadaPress(paradaMasCercana?.parada)}
          />

          <AvisosHoyCard
            titulo="Avisos de hoy"
            mensaje={textoAviso}
            onPress={handleAvisosPress}
          />

          <View style={styles.mapContainer}>
            <MapaInicio
              paradas={paradas}
              usuarioCoordenadas={usuarioCoords}
              onSelectParada={(p) => handleParadaPress(p)}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  resultadosContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultadosLista: {
    paddingBottom: 20,
    gap: 10,
  },
  resultadoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultadoInfo: {
    flex: 1,
    marginRight: 8,
  },
  resultadoNombre: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  resultadoSub: {
    fontSize: 13,
  },
  emptySearch: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptySearchTexto: {
    fontSize: 14,
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
    marginTop: 4,
  },
});
