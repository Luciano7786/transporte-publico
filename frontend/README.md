# Frontend - Paraná en Colectivo

Aplicación móvil para consultar líneas, recorridos, paradas, horarios y avisos del transporte público de Paraná.

Este proyecto es la capa cliente de la solución completa del Trabajo Final. La API que consume la app está en la carpeta [`../backend/README.md`](../backend/README.md).

## Stack

- React Native + Expo
- React Navigation
- Expo Notifications
- Expo Location / Camera / QR Scanner
- AsyncStorage y SQLite local
- TypeScript

## Funcionalidades principales

- Consulta de líneas y recorridos
- Búsqueda de paradas por nombre o cercanía
- Lectura de códigos QR de paradas
- Visualización de horarios y próximos servicios
- Favorecer líneas y paradas
- Registro / login de usuarios
- Reporte de demoras
- Gestión de avisos y notificaciones
- Soporte para tema claro / oscuro

## Requisitos

- Node.js 20+ / 22+ (idealmente la versión recomendada por Expo)
- npm o pnpm
- Expo CLI
- Android Studio o emulador Android, o un dispositivo físico para probar la app

## Instalación

Desde la carpeta `frontend`:

```bash
npm install
```

Si usás pnpm:

```bash
pnpm install
```

## Ejecución

### En emulador o dispositivo

```bash
npm start
```

Esto levanta el servidor de Expo. Después podés:

```bash
npm run android
```

```bash
npm run ios
```

```bash
npm run web
```

## Build para Android

Para generar un APK con EAS:

```bash
npx eas-cli@latest build --platform android --profile preview
```

El perfil `preview` está pensado para entregar un build instalable sin Metro. Confirmar el perfil requerido por la consigna antes de entregar.

## Estructura relevante

```text
frontend/
├── App.tsx
├── app.json
├── assets/
├── scripts/
├── src/
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── db/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── types/
│   └── utils/
├── package.json
├── tsconfig.json
└── README.md
```

## Variables de entorno y configuración

La aplicación suele conectarse a la API del backend mediante una URL base configurable según el entorno. Revisar:

- `src/config/`
- `src/services/`
- `App.tsx`

Si tu backend corre localmente, normalmente se configura con `http://<IP-del-PC>:3000` o la dirección del servidor de la API.

## Desarrollo recomendado

- Mantener el diseño mobile-first.
- Revisar la API y sus tipos antes de hacer cambios en los servicios.
- Usar Expo docs oficiales para validar compatibilidad de paquetes nativos.
- Probar siempre en emulador o dispositivo real antes de entregar.

## Enlaces útiles

- Backend: [`../backend/README.md`](../backend/README.md)
- Documento del proyecto: [`../03 - Transporte Publico.pdf`](../03%20-%20Transporte%20Publico.pdf)
- Repositorio: <https://github.com/Luciano7786/transporte-publico>
