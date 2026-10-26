import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

export interface LineaHorariosCard {
  numero: string;
  color: string;
  proximos: string[];
}

interface TusParadasCardProps {
  nombreParada?: string;
  distancia?: string;
  lineas?: LineaHorariosCard[];
  onPress?: () => void;
}

export const TusParadasCard: React.FC<TusParadasCardProps> = ({
  nombreParada = "Alameda y Urquiza",
  distancia = "a 120 m",
  lineas = [
    { numero: "5", color: "#1B6CA8", proximos: ["10:42", "11:02", "11:22"] },
    { numero: "14", color: "#B45309", proximos: ["10:51", "11:21", "11:51"] },
  ],
  onPress,
}) => {
  const { paleta } = useThemeContext();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: paleta.superficie1,
          borderColor: paleta.borde,
        },
      ]}
    >
      {/* Encabezado: "Tus paradas" y distancia */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={[styles.subtitulo, { color: paleta.textoBajo }]}>
            Tus paradas
          </Text>
          <Text style={[styles.nombreParada, { color: paleta.textoAlto }]}>
            {nombreParada}
          </Text>
        </View>
        <Text style={[styles.distancia, { color: paleta.textoMedio }]}>
          {distancia}
        </Text>
      </View>

      {/* Filas de Líneas y horarios */}
      <View style={styles.lineasContainer}>
        {lineas.map((linea) => {
          const proximo = linea.proximos[0] ?? "--:--";
          const siguientes = linea.proximos.slice(1);

          return (
            <View key={linea.numero} style={styles.lineaRow}>
              {/* Badge de número de línea */}
              <View
                style={[styles.lineaBadge, { backgroundColor: linea.color }]}
              >
                <Text style={styles.lineaNumero}>{linea.numero}</Text>
              </View>

              {/* Horarios */}
              <View style={styles.horariosRow}>
                <Text
                  style={[styles.horarioPrincipal, { color: paleta.textoAlto }]}
                >
                  {proximo}
                </Text>
                {siguientes.map((h, idx) => (
                  <Text
                    key={idx}
                    style={[
                      styles.horarioSecundario,
                      { color: paleta.textoMedio },
                    ]}
                  >
                    {h}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Pie de tarjeta */}
      <Text style={[styles.footerText, { color: paleta.textoBajo }]}>
        Horarios según tabla
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  titleColumn: {
    flex: 1,
  },
  subtitulo: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  nombreParada: {
    fontSize: 18,
    fontWeight: "700",
  },
  distancia: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
  },
  lineasContainer: {
    gap: 12,
  },
  lineaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineaBadge: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  lineaNumero: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  horariosRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginLeft: 14,
    gap: 14,
  },
  horarioPrincipal: {
    fontSize: 20,
    fontWeight: "700",
  },
  horarioSecundario: {
    fontSize: 16,
    fontWeight: "400",
  },
  footerText: {
    fontSize: 12,
    marginTop: 14,
  },
});
