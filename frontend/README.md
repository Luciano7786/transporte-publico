# Paraná en Colectivo — Aplicación móvil

Aplicación móvil del Trabajo Final de **Desarrollo para Móviles (UNER)**. Nuestra app reúne
información del transporte público de Paraná para consultar líneas, paradas, recorridos,
horarios y avisos, además de reportar demoras.

## Funcionalidades

- Consulta de líneas, recorridos, paradas y horarios.
- Búsqueda de paradas cercanas y lectura de sus códigos QR.
- Avisos de servicio y reportes de demora con imágenes.
- Sesión de pasajero, líneas y paradas favoritas.
- Datos locales para facilitar el uso sin conexión.
- Preferencias de perfil, apariencia y notificaciones.
- Herramientas de administración para la Dirección de Transporte.

## Requisitos

- Node.js 24.
- pnpm.
- Expo Go para probar en un teléfono, o un emulador Android/iOS.
- La API del proyecto en ejecución. La configuración y las opciones de inicio están en
  [`backend/README.md`](../backend/README.md).

## Instalación y ejecución

Desde esta carpeta:

```bash
pnpm install
pnpm start
```

El servidor de Expo muestra un código QR para abrir la app con Expo Go. También están disponibles:

```bash
pnpm android
pnpm ios
pnpm web
```

## Dirección de la API

La app toma la dirección desde `EXPO_PUBLIC_API_URL`. Para una prueba en un teléfono conectado
a la misma red wifi que la computadora, se debe usar la IP de la computadora, no `localhost`.

En PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.0.10:3000"
pnpm start
```

En macOS o Linux:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 pnpm start
```

Reemplazar `192.168.0.10` por la dirección correspondiente. La API debe estar accesible desde
el teléfono. En la guía del backend se detallan el inicio local y la conexión desde Expo Go.

## Tecnologías

Expo SDK 57, React Native, TypeScript, React Navigation, SQLite local y servicios de la API
del proyecto.

## Equipo

- Luciano Cirvini
- Sofia Guardia
- Mariano Jimenez
- Macarena Schefer
