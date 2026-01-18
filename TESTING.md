# CERCA - Guía de Testing

## Requisitos para Probar

### En tu teléfono Android:
1. **Descargar Expo Go** desde Google Play Store
   - Link: https://play.google.com/store/apps/details?id=host.exp.exponent

### En tu computador:
- El servidor ya está corriendo

---

## Conectar al App

### Opción 1: URL Manual (Recomendada)
1. Abre **Expo Go** en tu teléfono
2. Toca **"Enter URL manually"** (abajo)
3. Escribe: `exp://vzaonii-anonymous-8081.exp.direct`
4. Toca **Connect**

### Opción 2: Misma Red WiFi
1. Asegúrate que tu teléfono y PC estén en la misma red WiFi
2. Abre **Expo Go**
3. Debería aparecer "cerca" en la lista de proyectos

---

## Flujos de Prueba

### 1. Login (Pantalla inicial)
- [ ] Ver logo CERCA y tagline
- [ ] Ingresar número de teléfono (cualquier número de 10 dígitos)
- [ ] Tocar "Enviar código"
- [ ] Ingresar código de verificación (cualquier número de 4+ dígitos)
- [ ] Tocar "Verificar"
- [ ] Debería entrar al Home

### 2. Pantalla Principal (Pasajero)
- [ ] Ver mapa centrado en Armenia, Quindío
- [ ] Ver botón de menú (☰) arriba izquierda
- [ ] Ver saldo de créditos arriba derecha
- [ ] Ver botones rápidos: Rutas, Reportes, Favoritos
- [ ] Ver tarjeta "¿A dónde vamos?" abajo
- [ ] Ver tokens CERCA abajo
- [ ] Ver botón SOS rojo (emergencia)
- [ ] Tocar el botón de ubicación (📍) para centrar mapa

### 3. Solicitar Viaje
- [ ] Tocar "¿A dónde vamos?"
- [ ] Buscar destino o seleccionar lugar popular
- [ ] Seleccionar destino
- [ ] Ver pantalla de confirmación con:
  - Mapa con origen y destino
  - Tipos de vehículo (Estándar, Confort, Taxi)
  - Modo de viaje (Silencioso, Normal, Conversación)
  - Método de pago (Créditos o Efectivo)
  - Precio estimado
- [ ] Tocar "Solicitar CERCA"
- [ ] Ver animación de búsqueda de conductor

### 4. Sistema de Créditos
- [ ] Desde Home, tocar el saldo de créditos
- [ ] Ver pantalla de Créditos con:
  - Saldo actual
  - Opciones de recarga ($10K, $20K, $50K, $100K)
  - Métodos de pago (Nequi, Daviplata, PSE)
- [ ] Seleccionar monto y método
- [ ] Tocar "Recargar" (simulado)

### 5. Reportes de Tráfico
- [ ] Desde Home, tocar "Reportes" (🚧)
- [ ] Ver mapa con reportes existentes
- [ ] Ver lista de reportes activos
- [ ] Tocar "+" para crear nuevo reporte
- [ ] Seleccionar tipo (Retén, Accidente, Trancón, etc.)
- [ ] Confirmar o denegar reportes existentes

### 6. Rutas Comunitarias
- [ ] Desde Home, tocar "Rutas" (🚐)
- [ ] Ver lista de rutas disponibles
- [ ] Ver detalles: origen, destino, horario, precio
- [ ] Seleccionar cupos
- [ ] Reservar (simulado)

### 7. Botón de Emergencia (SOS)
- [ ] Tocar el botón rojo SOS
- [ ] Ver modal con tipos de emergencia
- [ ] Seleccionar tipo (Asalto, Accidente, etc.)
- [ ] Ver alerta activa con:
  - Radio de búsqueda (empieza en 10m)
  - Usuarios notificados
  - Botón llamar 123
  - Opción "Ya estoy bien"
  - Opción "Cancelar alerta"
- [ ] El radio se expande automáticamente cada 30 segundos

### 8. Cambiar a Modo Conductor
- [ ] En Home, tocar menú (☰)
- [ ] Ir a Perfil
- [ ] Cambiar rol a "Conductor" (si está habilitado)
- [ ] Ver pantalla de conductor con:
  - Toggle Online/Offline
  - Mapa con solicitudes
  - Estadísticas del día

---

## Características a Verificar

### UI/UX
- [ ] Colores correctos (verde #2D6A4F, naranja #FF6B35)
- [ ] Fuentes legibles
- [ ] Botones respondan al toque
- [ ] Transiciones suaves entre pantallas
- [ ] Teclado no bloquea inputs

### Mapa
- [ ] Se carga correctamente
- [ ] Muestra ubicación del usuario (si da permisos)
- [ ] Marcadores visibles
- [ ] Zoom funciona

### Permisos
- [ ] Solicita permiso de ubicación
- [ ] Funciona con/sin permiso (muestra Armenia por defecto)

---

## Problemas Conocidos (Testing)

1. **Sin Google Maps API Key**: El mapa puede mostrar "For development purposes only". Esto es normal en testing.

2. **Login simulado**: Cualquier número/código funciona. En producción usará Supabase Auth real.

3. **Pagos simulados**: Los pagos de créditos no procesan realmente. Solo simulan la UI.

4. **Conductores mock**: Los conductores que aparecen son datos de prueba.

---

## Reportar Bugs

Si encuentras un bug, anota:
1. Qué pantalla
2. Qué acción hiciste
3. Qué esperabas
4. Qué pasó realmente
5. Screenshot si es posible

---

## Siguiente Paso: Producción

Para publicar en Google Play necesitarás:
1. Configurar Supabase real (crear proyecto)
2. Obtener Google Maps API Key
3. Configurar pagos reales (Nequi/Daviplata API)
4. Crear cuenta Google Play Console ($25)
5. Generar APK/AAB con `eas build`
