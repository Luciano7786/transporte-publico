import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { Sentido } from "../../types";

interface SentidoSelectorProps {
  sentido: Sentido;
  destinoIda: string;
  destinoVuelta: string;
  onChange: (sentido: Sentido) => void;
}

export const SentidoSelector: React.FC<SentidoSelectorProps> = ({
  sentido,
  destinoIda,
  destinoVuelta,
  onChange,
}) => {
  const { paleta } = useThemeContext();

  const esIda = sentido === "ida";

  return (
    <View style={styles.container}>
      {/* Botón Ida */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange("ida")}
        style={[
          styles.button,
          esIda
            ? [styles.activeButton, { backgroundColor: paleta.acento }]
            : [
                styles.inactiveButton,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ],
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: esIda ? paleta.textoSobreAcento : paleta.textoMedio,
              fontWeight: esIda ? "700" : "500",
            },
          ]}
          numberOfLines={1}
        >
          Ida · {destinoIda}
        </Text>
      </TouchableOpacity>

      {/* Botón Vuelta */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange("vuelta")}
        style={[
          styles.button,
          !esIda
            ? [styles.activeButton, { backgroundColor: paleta.acento }]
            : [
                styles.inactiveButton,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ],
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: !esIda ? paleta.textoSobreAcento : paleta.textoMedio,
              fontWeight: !esIda ? "700" : "500",
            },
          ]}
          numberOfLines={1}
        >
          Vuelta · {destinoVuelta}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  activeButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  inactiveButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
  },
});
