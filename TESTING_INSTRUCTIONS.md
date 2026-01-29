# CERCA GPS - Testing Instructions

## Quick Start

### Option 1: Double-click the batch file (Easiest)
1. Open File Explorer
2. Navigate to: `c:\Users\asus\OneDrive - Wieland & Associates Inc\Documents\GitHub\cerca-gps`
3. Double-click `run-expo.bat`
4. Wait for the browser to open at http://localhost:8081

### Option 2: Command Prompt
1. Open Command Prompt (Win + R → type `cmd` → Enter)
2. Run these commands:
```cmd
cd "c:\Users\asus\OneDrive - Wieland & Associates Inc\Documents\GitHub\cerca-gps"
npx expo start --web
```

### Option 3: Mobile Testing with Expo Go
1. Install **Expo Go** on your phone:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. Run in Command Prompt:
```cmd
cd "c:\Users\asus\OneDrive - Wieland & Associates Inc\Documents\GitHub\cerca-gps"
npx expo start
```

3. Scan the QR code with:
   - Android: Open Expo Go → Scan QR Code
   - iOS: Open Camera → Scan QR → Tap notification

---

## Test Credentials

| Field | Value |
|-------|-------|
| Phone | Any 10 digits starting with 3 (e.g., `3001234567`) |
| OTP Code | `123456` |

---

## Testing Flows

### 1. Passenger Flow (Main)
1. **Login**
   - Enter phone: `3001234567`
   - Enter OTP: `123456`
   - You're now logged in as a passenger

2. **Request a Trip**
   - Tap "¿A dónde vamos?" on the home screen
   - Select a destination (or type an address)
   - Review the price and tap "Confirmar viaje"
   - Wait for driver matching (simulated in dev mode)
   - Watch the trip progress

3. **Complete & Rate**
   - When trip ends, rate the driver (1-5 stars)
   - Select feedback tags
   - Add optional comment

### 2. Driver Registration
1. Go to **Profile** tab (bottom right)
2. Tap **"Quiero ser conductor"**
3. Complete 4-step registration:
   - Step 1: Personal info
   - Step 2: Vehicle details
   - Step 3: Upload documents
   - Step 4: Confirmation

### 3. Driver Mode
After registering as driver:
1. Go to **Profile** → tap your avatar
2. Select **"Modo Conductor"**
3. Toggle **"Conectado"** to go online
4. Accept incoming trip requests
5. Navigate and complete trips

### 4. Feature Testing

| Feature | How to Test |
|---------|-------------|
| **Credits** | Profile → Creditos y pagos → Recargar |
| **Promo Codes** | Profile → Codigos promocionales → Enter `BIENVENIDO` |
| **Referrals** | Profile → Invitar amigos → Share code |
| **Favorites** | Profile → Lugares favoritos → Add home/work |
| **Emergency Contacts** | Profile → Contactos de emergencia → Add contacts |
| **Support** | Profile → Ayuda y soporte → Browse FAQ |
| **Trip History** | Activity tab → View past trips |
| **Traffic Reports** | Home → Traffic icon → Report or view |
| **Community Routes** | Community tab → Browse routes |

### 5. Available Promo Codes (Dev Mode)
| Code | Discount |
|------|----------|
| `BIENVENIDO` | 50% off (max $10,000) - New users |
| `CERCA2024` | $5,000 off |
| `VIAJELIBRE` | Free trip up to $15,000 |
| `VOLVISTE` | 30% off - Returning users |

---

## App Features Summary

### Passenger Features
- Phone/OTP authentication
- Trip booking with real-time pricing
- Multiple payment methods (credits, cash)
- Real-time driver tracking
- Driver rating system
- Trip history & receipts
- Credits/wallet management
- Promo codes & referrals
- Favorite locations
- Emergency contacts & SOS button
- Traffic reports

### Driver Features
- Driver registration flow
- Document management
- Online/offline toggle
- Trip accept/reject
- Navigation to pickup/destination
- Earnings dashboard
- Withdrawal requests
- Rating & feedback view

### Safety Features
- Emergency SOS button
- Share trip with contacts
- Emergency contact management
- Driver verification
- Real-time tracking

---

## Troubleshooting

### "Module not found" error
```cmd
cd "c:\Users\asus\OneDrive - Wieland & Associates Inc\Documents\GitHub\cerca-gps"
npm install
npx expo start --web
```

### Port already in use
```cmd
npx expo start --web --port 8082
```

### Expo Go can't connect
Use tunnel mode:
```cmd
npx expo start --tunnel
```

### Clear cache
```cmd
npx expo start --clear
```

---

## Project Structure

```
cerca-gps/
├── src/
│   ├── screens/           # All app screens
│   │   ├── auth/          # Login
│   │   ├── passenger/     # Passenger screens (5)
│   │   ├── driver/        # Driver screens (3)
│   │   └── shared/        # Shared screens (14)
│   ├── services/          # API services (7)
│   ├── store/             # Zustand stores (3)
│   ├── components/        # Reusable components (7)
│   ├── hooks/             # Custom hooks (3)
│   ├── constants/         # Theme & config
│   ├── types/             # TypeScript types
│   └── navigation/        # Navigation config
├── App.tsx                # App entry point
├── run-expo.bat           # Quick start script
└── package.json           # Dependencies
```

---

## Next Steps for Production

1. **Supabase Setup**
   - Create project at https://supabase.com
   - Add credentials to `.env` file
   - Run database migrations

2. **Google Maps API**
   - Get API key from Google Cloud Console
   - Add to `app.json`

3. **Payment Integration**
   - Set up Wompi or Stripe
   - Configure payment webhooks

4. **Push Notifications**
   - Configure Expo Push Notifications
   - Set up notification server

5. **Build & Deploy**
   ```cmd
   npx eas build --platform android
   npx eas build --platform ios
   ```

---

## Support

For issues or questions:
- Check the FAQ in the app (Profile → Ayuda y soporte)
- Review code in the `src/` folder
- Contact: soporte@cercaapp.co (placeholder)
