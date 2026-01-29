# CERCA - Guía Completa de Testing

## Opciones de Testing

### Opción 1: Replit (Web - Más Fácil)

1. Ve a [replit.com](https://replit.com)
2. Crea una cuenta gratis
3. Click "Create Repl" → "Import from GitHub"
4. Pega la URL del repositorio
5. Click "Run" - automáticamente ejecutará `npm run web`

**Limitaciones en Web:**
- ❌ Mapa nativo (muestra versión simplificada)
- ❌ GPS real (usa ubicación por defecto: Armenia)
- ❌ Notificaciones push
- ✅ Toda la UI y navegación
- ✅ Flujos de usuario completos
- ✅ Sistema de créditos/tokens

---

### Opción 2: Expo Snack (Mejor para Móvil)

1. Ve a [snack.expo.dev](https://snack.expo.dev)
2. Click "Import git URL"
3. Pega la URL del repositorio
4. Prueba directamente en el preview móvil del navegador

---

### Opción 3: Tu Teléfono Android (Más Completo)

#### Requisitos:
- Descargar **Expo Go** desde [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Pasos:
```bash
# En tu terminal:
cd cerca-gps
npm install
npx expo start --tunnel
```

Escanea el código QR con Expo Go.

---

### Opción 4: Emulador Android

```bash
# Instalar dependencias
npm install

# Iniciar con Android Studio Emulator corriendo
npx expo start --android
```

---

## Nuevas Características Implementadas

### Error Boundary (Protección contra crashes)
- La app ya no se congela en errores
- Muestra pantalla amigable con botón "Reintentar"
- En desarrollo muestra detalles del error

### Loading States
- Pantalla de carga con animación
- Skeletons mientras cargan datos
- Overlay de "Procesando..." para acciones

### Detección de Red
- Banner automático cuando no hay internet
- Botón para reintentar conexión
- Funciona offline con datos en caché

### Validación de Inputs
- Teléfono colombiano (10 dígitos, empieza con 3)
- Código OTP (6 dígitos)
- Montos de recarga ($5,000 - $500,000)
- Placas colombianas (ABC123)

### Modo Desarrollo
- Banner amarillo indica "Datos Simulados"
- No requiere backend real
- Conductores y viajes de prueba

### Mapa Web-Compatible
- En web muestra lista de conductores cercanos
- En móvil usa Google Maps nativo
- Fallback automático si Maps no funciona

---

## Flujos de Prueba Completos

### 1. Login
| Paso | Acción | Resultado Esperado |
|------|--------|-------------------|
| 1 | Abrir app | Ver logo CERCA y pantalla de login |
| 2 | Ingresar teléfono: `3001234567` | Campo se formatea |
| 3 | Tocar "Enviar código" | Cambiar a pantalla de código |
| 4 | Ingresar código: `123456` | Loading y luego Home |

### 2. Pantalla Principal
| Elemento | Ubicación | Funcionalidad |
|----------|-----------|---------------|
| ☰ Menú | Arriba izquierda | Abre perfil/ajustes |
| Créditos | Arriba derecha | Va a recarga |
| 🚐 Rutas | Lateral izquierdo | Rutas comunitarias |
| 🚧 Reportes | Lateral izquierdo | Reportes de tráfico |
| ⭐ Favoritos | Lateral izquierdo | Lugares guardados |
| "¿A dónde vamos?" | Centro abajo | Iniciar viaje |
| 🪙 Tokens | Abajo | Ver tokens CERCA |
| 🆘 SOS | Esquina derecha | Emergencia |
| 📍 Ubicación | Derecha | Centrar mapa |

### 3. Solicitar Viaje
```
Paso 1: Tocar "¿A dónde vamos?"
        ↓
Paso 2: Seleccionar destino popular o buscar
        ↓
Paso 3: Elegir tipo de vehículo:
        - Estándar ($)
        - Confort ($$)
        - Taxi ($$$)
        ↓
Paso 4: Elegir modo de viaje:
        - 🔇 Silencioso
        - 💬 Normal
        - 🗣️ Conversación
        ↓
Paso 5: Elegir pago:
        - 💳 Créditos
        - 💵 Efectivo
        ↓
Paso 6: Confirmar → Ver precio → Solicitar
        ↓
Paso 7: Ver búsqueda de conductor
```

### 4. Sistema de Créditos
- Montos: $10,000, $20,000, $50,000, $100,000
- Métodos: Nequi, Daviplata, PSE
- Validación de montos mínimo/máximo

### 5. Reportes de Tráfico
- Tipos: Tráfico, Accidente, Retén, Obras
- Confirmar/Denegar reportes de otros
- Radio de visibilidad: 10km

### 6. Rutas Comunitarias
- Ver rutas activas con horarios
- Reservar cupos
- Ver precio por puesto

### 7. Emergencia SOS
```
Tocar SOS → Seleccionar tipo → Alerta activa
                                    ↓
                           Radio: 10m → 50m → 100m → 300m → 500m
                           (escala cada 30 segundos)
                                    ↓
                           Opciones:
                           - 📞 Llamar 123
                           - ✅ Ya estoy bien
                           - ❌ Cancelar
```

---

## Datos de Prueba Disponibles

### Conductores Mock (4)
| Nombre | Vehículo | Rating | ETA |
|--------|----------|--------|-----|
| María G. | Spark GT Blanco | 4.9 | 3 min |
| Juan P. | Onix Negro | 4.7 | 5 min |
| Pedro M. | Taxi Amarillo | 4.8 | 2 min |
| Ana L. | Picanto Rojo | 4.6 | 7 min |

### Destinos Populares (8)
- 🛒 Centro Comercial Portal del Quindío
- 🌳 Parque de la Vida
- 🚌 Terminal de Transporte
- 🎓 Universidad del Quindío
- 🏥 Hospital San Juan de Dios
- ⛲ Plaza de Bolívar
- ✈️ Aeropuerto El Edén
- 📚 SENA Regional Quindío

### Reportes de Tráfico (4)
- Tráfico pesado - Av. Bolívar con Calle 21
- Accidente menor - Carrera 14 con Calle 18
- Control policial - Entrada norte
- Obras en la vía - Calle 26 con Carrera 19

### Rutas Comunitarias (3)
- Armenia → Universidad (L-V, 6:30am)
- Circasia → Armenia (L-S, 5:30am)
- Armenia → Salento (S-D, 8:00am)

---

## Verificación de UI

### Colores
| Uso | Color | Hex |
|-----|-------|-----|
| Primario | Verde oscuro | #2D6A4F |
| Secundario | Naranja | #FF6B35 |
| Emergencia | Rojo | #E63946 |
| Info | Azul | #3498DB |
| Éxito | Verde | #27AE60 |
| Warning | Amarillo | #F39C12 |

### Elementos a Verificar
- [ ] Fuentes legibles en todos los tamaños
- [ ] Botones con feedback visual al tocar
- [ ] Transiciones suaves (300ms)
- [ ] Teclado no bloquea campos de entrada
- [ ] Emojis se muestran correctamente
- [ ] Espaciado consistente

---

## Problemas Conocidos

| Problema | Causa | Solución |
|----------|-------|----------|
| "For development purposes only" en mapa | Sin API Key de Google Maps | Normal en desarrollo |
| Login acepta cualquier número | Modo desarrollo activo | Configurar Supabase para producción |
| Pagos no procesan | Simulado en desarrollo | Integrar APIs de pago reales |
| Conductores siempre disponibles | Datos mock | Conectar a Supabase real |

---

## Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar en modo túnel (para teléfono)
npx expo start --tunnel

# Iniciar para web
npm run web

# Verificar TypeScript
npx tsc --noEmit

# Limpiar caché
npx expo start -c
```

---

## Siguiente Paso: Producción

Para publicar necesitarás:

1. **Supabase** (Gratis)
   - Crear proyecto en supabase.com
   - Ejecutar `supabase/schema.sql`
   - Copiar URL y Anon Key

2. **Google Maps** (Gratis con límites)
   - Crear proyecto en console.cloud.google.com
   - Habilitar Maps SDK for Android
   - Crear API Key

3. **Variables de Entorno**
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
   ```

4. **Build y Publicar**
   ```bash
   npx eas build --platform android
   npx eas submit --platform android
   ```
