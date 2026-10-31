import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { FiltroAvisos } from "../../services/avisos.service";

interface FiltrosAvisosProps {
  filtroActual: FiltroAvisos;
  onChangeFiltro: (filtro: FiltroAvisos) => void;
}

export const FiltrosAvisos: React.FC<FiltrosAvisosProps> = ({
  filtroActual,
  onChangeFiltro,
}) => {
  const { paleta } = useThemeContext();

  const opciones: Array<{ id: FiltroAvisos; label: string }> = [
    { id: "vigentes", label: "Vigentes" },
    { id: "mis_lineas", label: "Mis líneas" },
    { id: "vencidos", label: "Vencidos" },
  ];

  return (
    <View style={styles.container}>
      {opciones.map((opcion) => {
        const activo = filtroActual === opcion.id;

        return (
          <TouchableOpacity
            key={opcion.id}
            activeOpacity={0.8}
            onPress={() => onChangeFiltro(opcion.id)}
            style={[
              styles.chip,
              activo
                ? [styles.chipActivo, { backgroundColor: paleta.acento }]
                : [
                    styles.chipInactivo,
                    {
                      backgroundColor: paleta.superficie2,
                      borderColor: paleta.borde,
                    },
                  ],
            ]}
          >
            <Text
              style={[
                styles.chipTexto,
                {
                  color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                  fontWeight: activo ? "700" : "500",
                },
              ]}
            >
              {opcion.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActivo: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  chipInactivo: {
    borderWidth: 1,
  },
  chipTexto: {
    fontSize: 14,
  },
});
