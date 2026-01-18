# CERCA - Guía de Configuración

## Requisitos Previos

- Node.js 18+
- Cuenta de Google Play Console ($25 USD único)
- Cuenta de Supabase (gratis para empezar)
- Teléfono Android con Expo Go instalado

## 1. Configurar Supabase

### Crear proyecto
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto (gratis)
3. Guarda la URL y la ANON KEY que te dan

### Crear tablas
1. Ve a SQL Editor en el dashboard de Supabase
2. Copia y pega el contenido de `supabase/schema.sql`
3. Ejecuta el script

### Configurar autenticación
1. Ve a Authentication > Providers
2. Habilita "Phone" (SMS)
3. Para pruebas, usa el modo de prueba de Supabase (no envía SMS reales)

## 2. Configurar la App

### Variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Instalar dependencias
```bash
cd C:\Users\asus\projects\cerca
npm install
```

### Ejecutar en desarrollo
```bash
npx expo start
```

Escanea el código QR con Expo Go en tu teléfono.

## 3. Configurar Google Maps (para Android)

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita "Maps SDK for Android"
4. Crea una API Key
5. Agrega la key en `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY"
        }
      }
    }
  }
}
```

## 4. Publicar en Google Play

### Crear build de producción
```bash
npx expo build:android
```

O usando EAS Build (recomendado):
```bash
npm install -g eas-cli
eas build --platform android
```

### Subir a Google Play Console
1. Crea una cuenta en [Google Play Console](https://play.google.com/console) ($25)
2. Crea una nueva aplicación
3. Sube el APK/AAB generado
4. Completa la información de la tienda

## Estructura del Proyecto

```
cerca/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── screens/        # Pantallas de la app
│   ├── navigation/     # Configuración de navegación
│   ├── store/          # Estado global (Zustand)
│   ├── services/       # APIs y servicios externos
│   ├── types/          # Tipos TypeScript
│   ├── constants/      # Colores, configuración
│   └── hooks/          # Custom hooks
├── supabase/
│   └── schema.sql      # Esquema de base de datos
├── App.tsx             # Entrada principal
└── app.json            # Configuración de Expo
```

## Configuración de Pagos (Próximo paso)

Para integrar Nequi/Daviplata:
1. Crear cuenta empresarial en cada plataforma
2. Obtener credenciales de API
3. Implementar webhook para confirmación de pagos

## Soporte

Para problemas técnicos o preguntas, contactar al desarrollador.
