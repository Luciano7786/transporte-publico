import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisosHoyCard } from "../components/inicio/AvisosHoyCard";
import { InicioHeader } from "../components/inicio/InicioHeader";
import { MapaInicio } from "../components/inicio/MapaInicio";
import {
  LineaHorariosCard,
  TusParadasCard,
} from "../components/inicio/TusParadasCard";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerAvisos } from "../services/lineas.service";
import {
  calcularProximosHorarios,
  obtenerHorariosPorParada,
  obtenerParadas,
} from "../services/paradas.service";
import type { Aviso, Parada } from "../types";

export function ParadasScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();

  const [paradas, setParadas] = useState<Parada[]>([]);
  const [avisoDestacado, setAvisoDestacado] = useState<Aviso | null>(null);
  const [lineasCard, setLineasCard] = useState<LineaHorariosCard[]>([
    { numero: "5", color: "#1B6CA8", proximos: ["10:42", "11:02", "11:22"] },
    { numero: "14", color: "#B45309", proximos: ["10:51", "11:21", "11:51"] },
  ]);

  useEffect(() => {
    let activo = true;

    async function cargarDatosInicio() {
      try {
        const resParadas = await obtenerParadas();
        if (activo && resParadas.datos) {
          setParadas(resParadas.datos);
        }

        const resAvisos = await obtenerAvisos();
        if (activo && resAvisos.datos) {
          const desvio = resAvisos.datos.find((a) => a.gravedad === "desvio");
          setAvisoDestacado(desvio ?? resAvisos.datos[0] ?? null);
        }

        const resHorarios = await obtenerHorariosPorParada("par-101");
        if (activo && resHorarios.datos.length > 0) {
          const proxL5 = calcularProximosHorarios(
            resHorarios.datos,
            "lin-05",
            "10:34",
          );
          const proxL14 = calcularProximosHorarios(
            resHorarios.datos,
            "lin-14",
            "10:34",
          );

          setLineasCard([
            {
              numero: "5",
              color: "#1B6CA8",
              proximos:
                proxL5.proximos.length > 0
                  ? proxL5.proximos
                  : ["10:42", "11:02", "11:22"],
            },
            {
              numero: "14",
              color: "#B45309",
              proximos:
                proxL14.proximos.length > 0
                  ? proxL14.proximos
                  : ["10:51", "11:21", "11:51"],
            },
          ]);
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

  const handleQrPress = () => {
    Alert.alert(
      "Escanear Parada",
      "Función de escaneo QR (expo-camera) para identificar la parada de manera inmediata.",
    );
  };

  const handleParadaPress = (paradaSeleccionada?: Parada) => {
    const id = paradaSeleccionada?.id ?? "par-101";
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

      <TusParadasCard
        nombreParada="Alameda y Urquiza"
        distancia="a 120 m"
        lineas={lineasCard}
        onPress={() => handleParadaPress()}
      />

      <AvisosHoyCard
        titulo="Avisos de hoy"
        mensaje={textoAviso}
        onPress={handleAvisosPress}
      />

      <View style={styles.mapContainer}>
        <MapaInicio
          paradas={paradas}
          onSelectParada={(p) => handleParadaPress(p)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    marginTop: 4,
  },
});
