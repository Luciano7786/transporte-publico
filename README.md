# Paraná en Colectivo

Nuestra aplicación móvil permite consultar el transporte público de Paraná. El proyecto integra una app
Expo/React Native con una API propia para consultar líneas, paradas, horarios y avisos, y para
gestionar reportes de demoras.

## Componentes

| Componente | Descripción | Documentación |
|---|---|---|
| Aplicación móvil | Interfaz para pasajeros y herramientas de administración. | [`frontend/README.md`](frontend/README.md) |
| API | Servicios, autenticación, datos de transporte, avisos y reportes. | [`backend/README.md`](backend/README.md) |

## Inicio rápido

1. Iniciar la API siguiendo las instrucciones de [`backend/README.md`](backend/README.md).
   La opción recomendada es Docker Compose.
2. Configurar `EXPO_PUBLIC_API_URL` con una dirección accesible desde el dispositivo donde se
   ejecuta la app.
3. Instalar las dependencias y ejecutar la app desde la carpeta `frontend`, como se explica en
   [`frontend/README.md`](frontend/README.md).

## Equipo

- Luciano Cirvini
- Sofia Guardia
- Mariano Jimenez
- Macarena Schefer
