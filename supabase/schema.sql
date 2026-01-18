-- ==========================================
-- CERCA - Esquema de Base de Datos Supabase
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==========================================
-- TABLA: users
-- Usuarios de la plataforma (pasajeros y conductores)
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_photo TEXT,
  role VARCHAR(20) DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'both')),
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_trips INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 100,
  credits INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  emergency_contacts JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{"rideMode": "normal", "language": "es"}',
  reputation JSONB DEFAULT '{"overall": 100, "asPassenger": 100, "asDriver": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLA: drivers
-- Información específica de conductores
-- ==========================================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_id UUID,
  is_online BOOLEAN DEFAULT FALSE,
  acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
  cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
  blocked_users UUID[] DEFAULT '{}',
  favorite_passengers UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLA: vehicles
-- Vehículos de los conductores
-- ==========================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
  plate VARCHAR(20) UNIQUE NOT NULL,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30) NOT NULL,
  type VARCHAR(20) DEFAULT 'sedan' CHECK (type IN ('sedan', 'suv', 'van', 'motorcycle', 'taxi')),
  photos TEXT[] DEFAULT '{}',
  accessibility TEXT[] DEFAULT '{}',
  capacity INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actualizar referencia en drivers
ALTER TABLE drivers ADD CONSTRAINT fk_vehicle
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

-- ==========================================
-- TABLA: driver_documents
-- Documentos legales de conductores
-- ==========================================
CREATE TABLE driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'license', 'soat', 'tech_review', 'property_card', 'id_card', 'criminal_record'
  file_url TEXT NOT NULL,
  expiration_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, type)
);

-- ==========================================
-- TABLA: driver_locations
-- Ubicación en tiempo real de conductores (PostGIS)
-- ==========================================
CREATE TABLE driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_locations_geo ON driver_locations USING GIST(location);

-- ==========================================
-- TABLA: trips
-- Viajes realizados
-- ==========================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

  -- Origen
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL(10, 7) NOT NULL,
  origin_lng DECIMAL(10, 7) NOT NULL,

  -- Destino
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10, 7) NOT NULL,
  destination_lng DECIMAL(10, 7) NOT NULL,

  -- Estado
  status VARCHAR(20) DEFAULT 'searching' CHECK (status IN (
    'searching', 'accepted', 'arriving', 'waiting', 'inProgress', 'completed', 'cancelled'
  )),

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('passenger', 'driver', 'system')),
  cancellation_reason TEXT,

  -- Precio
  price_base INTEGER NOT NULL,
  price_distance INTEGER NOT NULL,
  price_time INTEGER NOT NULL,
  price_surge INTEGER DEFAULT 0,
  price_discount INTEGER DEFAULT 0,
  price_total INTEGER NOT NULL,

  -- Configuración
  payment_method VARCHAR(20) DEFAULT 'credits' CHECK (payment_method IN ('credits', 'cash')),
  ride_mode VARCHAR(20) DEFAULT 'normal' CHECK (ride_mode IN ('silent', 'normal', 'conversational')),
  accessibility_needs TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_passenger ON trips(passenger_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);

-- ==========================================
-- TABLA: community_routes
-- Rutas comunitarias programadas
-- ==========================================
CREATE TABLE community_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Origen
  origin_address TEXT NOT NULL,
  origin_lat DECIMAL(10, 7) NOT NULL,
  origin_lng DECIMAL(10, 7) NOT NULL,

  -- Destino
  destination_address TEXT NOT NULL,
  destination_lat DECIMAL(10, 7) NOT NULL,
  destination_lng DECIMAL(10, 7) NOT NULL,

  waypoints JSONB DEFAULT '[]',
  schedule JSONB NOT NULL, -- [{dayOfWeek: 1, departureTime: "07:00", isActive: true}]

  price_per_seat INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLA: route_reservations
-- Reservas en rutas comunitarias
-- ==========================================
CREATE TABLE route_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES community_routes(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  schedule_index INTEGER NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 7) NOT NULL,
  pickup_lng DECIMAL(10, 7) NOT NULL,
  seats_reserved INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLA: traffic_reports
-- Reportes viales de la comunidad
-- ==========================================
CREATE TABLE traffic_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'checkpoint', 'accident', 'traffic', 'roadClosed', 'roadDamage', 'police', 'hazard'
  )),
  location_lat DECIMAL(10, 7) NOT NULL,
  location_lng DECIMAL(10, 7) NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  confirmations INTEGER DEFAULT 0,
  denials INTEGER DEFAULT 0,
  credibility_score DECIMAL(3, 2) DEFAULT 0.50,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_location ON traffic_reports(location_lat, location_lng);
CREATE INDEX idx_reports_active ON traffic_reports(is_active, expires_at);

-- ==========================================
-- TABLA: emergency_alerts
-- Alertas de emergencia del botón CERCA
-- ==========================================
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'accident', 'assault', 'medical', 'vehicle_issue', 'harassment', 'other'
  )),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'responding', 'resolved', 'false_alarm', 'cancelled'
  )),
  location_lat DECIMAL(10, 7) NOT NULL,
  location_lng DECIMAL(10, 7) NOT NULL,
  location_history JSONB DEFAULT '[]',
  escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
  responders_notified UUID[] DEFAULT '{}',
  responders_confirmed UUID[] DEFAULT '{}',
  resolution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_active ON emergency_alerts(status) WHERE status = 'active';

-- ==========================================
-- TABLA: ratings
-- Calificaciones de viajes
-- ==========================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  rated_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  tags TEXT[] DEFAULT '{}',
  rater_role VARCHAR(20) NOT NULL CHECK (rater_role IN ('passenger', 'driver')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, rater_id)
);

-- ==========================================
-- TABLA: credit_transactions
-- Historial de transacciones de créditos
-- ==========================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'trip_payment', 'refund', 'commission')),
  description TEXT NOT NULL,
  payment_method VARCHAR(50),
  external_reference VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id);

-- ==========================================
-- TABLA: token_transactions
-- Historial de transacciones de tokens
-- ==========================================
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABLA: penalties
-- Penalizaciones a usuarios
-- ==========================================
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'minor', 'major', 'suspension')),
  description TEXT NOT NULL,
  tokens_deducted INTEGER,
  suspension_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  appealed_at TIMESTAMPTZ,
  appeal_status VARCHAR(20) CHECK (appeal_status IN ('pending', 'accepted', 'rejected'))
);

-- ==========================================
-- FUNCIONES
-- ==========================================

-- Función: Obtener conductores cercanos
CREATE OR REPLACE FUNCTION get_nearby_drivers(lat DECIMAL, lng DECIMAL, radius_km DECIMAL)
RETURNS TABLE (
  driver_id UUID,
  user_id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  rating DECIMAL,
  vehicle_type VARCHAR,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS driver_id,
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.rating,
    v.type AS vehicle_type,
    ST_Distance(
      dl.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM driver_locations dl
  JOIN drivers d ON d.id = dl.driver_id
  JOIN users u ON u.id = d.user_id
  LEFT JOIN vehicles v ON v.id = d.vehicle_id
  WHERE d.is_online = TRUE
    AND ST_DWithin(
      dl.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar créditos de usuario
CREATE OR REPLACE FUNCTION update_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO new_balance;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar tokens de usuario
CREATE OR REPLACE FUNCTION update_user_tokens(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET tokens = GREATEST(0, tokens + p_amount),
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING tokens INTO new_balance;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar rating promedio de usuario
CREATE OR REPLACE FUNCTION update_user_rating(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  avg_rating DECIMAL;
BEGIN
  SELECT AVG(score)::DECIMAL(3,2) INTO avg_rating
  FROM ratings
  WHERE rated_id = p_user_id;

  UPDATE users
  SET rating = COALESCE(avg_rating, 5.00),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN COALESCE(avg_rating, 5.00);
END;
$$ LANGUAGE plpgsql;

-- Función: Confirmar reporte vial
CREATE OR REPLACE FUNCTION confirm_report(p_report_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE traffic_reports
  SET confirmations = confirmations + 1,
      credibility_score = LEAST(1.0, credibility_score + 0.05)
  WHERE id = p_report_id;

  -- Dar tokens al usuario que reportó
  PERFORM update_user_tokens(
    (SELECT user_id FROM traffic_reports WHERE id = p_report_id),
    2
  );
END;
$$ LANGUAGE plpgsql;

-- Función: Decrementar cupos disponibles
CREATE OR REPLACE FUNCTION decrement_available_seats(p_route_id UUID, p_seats INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_routes
  SET available_seats = GREATEST(0, available_seats - p_seats),
      updated_at = NOW()
  WHERE id = p_route_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Drivers can view own data" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (
    auth.uid() = passenger_id OR
    auth.uid() IN (SELECT user_id FROM drivers WHERE id = driver_id)
  );

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- Insertar configuración de pico y placa para Armenia
-- (Se puede expandir con más ciudades del Quindío)
