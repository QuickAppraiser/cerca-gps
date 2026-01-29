# CERCA - Plan MVP Recomendado

## Estrategia: MVP Híbrido (2-3 semanas)

### Fase 1: Core Funcional (Semana 1)

**Objetivo:** Un viaje real de A a B

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Conectar Login a Supabase Auth | CRÍTICO | 4 horas |
| Crear perfil de usuario real | CRÍTICO | 2 horas |
| Guardar viajes en base de datos | CRÍTICO | 4 horas |
| Matching conductor-pasajero simple | CRÍTICO | 6 horas |
| Notificación al conductor (push) | CRÍTICO | 4 horas |
| Conductor acepta/rechaza viaje | CRÍTICO | 4 horas |

**Total Fase 1:** ~24 horas de desarrollo

---

### Fase 2: Pagos y Cierre (Semana 2)

**Objetivo:** Cobrar por viajes

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Integrar pagos (Nequi o PSE) | CRÍTICO | 8 horas |
| Sistema de créditos funcional | ALTO | 4 horas |
| Confirmar viaje completado | CRÍTICO | 2 horas |
| Calificación post-viaje | ALTO | 4 horas |
| Historial de viajes | MEDIO | 3 horas |

**Total Fase 2:** ~21 horas de desarrollo

---

### Fase 3: Polish (Semana 3)

**Objetivo:** Experiencia completa

| Tarea | Prioridad | Esfuerzo |
|-------|-----------|----------|
| Pantalla de perfil de usuario | MEDIO | 4 horas |
| Pantalla de perfil de conductor | MEDIO | 4 horas |
| Registro de conductor completo | ALTO | 6 horas |
| Favoritos (casa/trabajo) | BAJO | 2 horas |
| Configuraciones básicas | BAJO | 2 horas |

**Total Fase 3:** ~18 horas de desarrollo

---

## Qué CORTAR del MVP Inicial

| Feature | Razón para cortar |
|---------|-------------------|
| **Rutas Comunitarias** | Complejidad alta, poco uso inicial |
| **Reportes de Tráfico** | No es core, agregar post-lanzamiento |
| **Sistema de Tokens** | Gamificación puede esperar |
| **Modos de Viaje** | Silencioso/Normal - solo agrega complejidad |
| **Múltiples Vehículos** | Empezar con 1 tipo, agregar después |
| **Verificación Automática** | Verificar documentos manualmente primero |

---

## Arquitectura Simplificada

### Servicios Gratuitos

| Servicio | Uso | Límite Gratis |
|----------|-----|---------------|
| **Supabase** | Backend completo | 500MB, 50k usuarios |
| **Expo Push** | Notificaciones | Ilimitado |
| **Google Maps** | Mapas | $200/mes crédito |
| **Wompi/Nequi** | Pagos | Comisión por transacción |

### Flujo Simplificado

```
PASAJERO                         CONDUCTOR
    │                                │
    ├─► Login (Supabase)             │
    │                                │
    ├─► Seleccionar destino          │
    │                                │
    ├─► Crear viaje (DB)────────────►│
    │                                │
    │    ◄────────Push notification──┤
    │                                │
    │    ◄────────Acepta viaje──────┤
    │                                │
    ├─► Ver conductor en camino      │
    │                                │
    ├─► Viaje en progreso            │
    │                                │
    ├─► Pagar (efectivo/créditos)    │
    │                                │
    ├─► Calificar conductor          │
    │                                │
    └─► Fin                          │
```

---

## Stack Tecnológico Final

```
Frontend:       React Native + Expo
Backend:        Supabase (PostgreSQL + Auth + Realtime)
Mapas:          Google Maps (o OpenStreetMap gratis)
Pagos:          Wompi (Colombia) o solo efectivo
Notificaciones: Expo Push Notifications
Hosting:        EAS Build (Expo gratis)
```

---

## Pantallas MVP Final (7 pantallas)

### Pasajero (4)
1. **Login** - Teléfono + OTP
2. **Home** - Mapa + "¿A dónde?"
3. **Confirmar** - Precio + Pedir
4. **En Viaje** - Estado en tiempo real

### Conductor (3)
5. **Login** - Mismo que pasajero
6. **Dashboard** - Online/Offline + Solicitudes
7. **Viaje Activo** - Navegación + Completar

### Compartidas
- Pantalla de perfil básico
- Historial de viajes

---

## Cronograma Sugerido

```
Semana 1 (Días 1-5):
├── Día 1-2: Autenticación Supabase
├── Día 3-4: Creación y matching de viajes
└── Día 5: Push notifications

Semana 2 (Días 6-10):
├── Día 6-7: Sistema de pagos
├── Día 8: Calificaciones
└── Día 9-10: Testing y fixes

Semana 3 (Días 11-15):
├── Día 11-12: Registro de conductor
├── Día 13-14: Polish y perfiles
└── Día 15: Build de producción
```

---

## Métricas de Éxito MVP

| Métrica | Objetivo |
|---------|----------|
| Tiempo de carga | < 3 segundos |
| Matching conductor | < 5 minutos |
| Crash rate | < 1% |
| Completar viaje | > 90% de intentos |

---

## Inversión Estimada

| Concepto | Costo |
|----------|-------|
| Desarrollo (DIY) | $0 |
| Supabase | $0 (tier gratis) |
| Google Maps | $0 (primeros $200) |
| EAS Build | $0 (tier gratis) |
| Google Play | $25 (único) |
| **Total lanzamiento** | **$25** |

---

## Próximo Paso Inmediato

1. **Decidir:** ¿MVP Lean o Full?
2. **Configurar:** Crear proyecto Supabase real
3. **Conectar:** Reemplazar mocks con llamadas reales
4. **Probar:** Testing con 3-5 usuarios reales
5. **Publicar:** Build y subir a Play Store

---

**¿Listo para empezar? El primer paso es crear el proyecto en Supabase.**
