# Paraná en Colectivo

Aplicación móvil para consultar información útil del transporte público de Paraná.

## Equipo

- Luciano Cirvini
- Sofía Guardia
- Mariano Jimenez
- Macarena Schefer

## Funcionalidades

- Consulta de líneas, recorridos, paradas y horarios.
- Visualización de recorridos y paradas en el mapa.
- Búsqueda de paradas cercanas y lectura de códigos QR.
- Consulta de avisos y reporte de demoras.
- Inicio de sesión, perfil y gestión de favoritos.

## Entrega final

- **Build Android (APK):** el enlace de EAS se agrega aca una vez generado. La consigna solicita entregar el **link del build**; desde esa página se puede acceder al APK.
- **Código fuente:** [repositorio del proyecto](https://github.com/Luciano7786/transporte-publico).

Para generar el build indicado por la consigna, desde `frontend`:

```bash
npx eas-cli@latest build --platform android --profile preview
```

El perfil `preview` está configurado para producir un APK instalable sin Metro. Antes de entregar, confirmar con la cátedra el perfil requerido: la consigna final indica `preview`, mientras que el documento [`03 - Transporte Publico.pdf`](./03%20-%20Transporte%20Publico.pdf) menciona un build de producción.

## Ejecución

Para iniciar la aplicación, con Node.js y npm instalados, desde `frontend`:

```bash
npm ci
npm start
```

Las instrucciones para ejecutar el backend están en [`backend/README.md`](./backend/README.md).
