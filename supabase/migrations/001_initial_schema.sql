-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  session_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  session_count INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Invoice settings table
CREATE TABLE invoice_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'France',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  siret TEXT NOT NULL,
  ape_code TEXT,
  tva_mention TEXT NOT NULL DEFAULT 'TVA non applicable, art. 293 B du CGI',
  payment_terms TEXT NOT NULL DEFAULT 'Paiement à réception de facture',
  invoice_prefix TEXT NOT NULL DEFAULT 'MKS',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  logo_url TEXT,
  bank_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  sessions_purchased INTEGER NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ
);

-- Class types table
CREATE TABLE class_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#D4AF37',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Class sessions table
CREATE TABLE class_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE NOT NULL,
  coach_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER NOT NULL DEFAULT 0,
  min_cancel_hours INTEGER NOT NULL DEFAULT 2,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  recurring_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Class bookings table
CREATE TABLE class_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  session_debited BOOLEAN NOT NULL DEFAULT true,
  booked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  cancelled_at TIMESTAMPTZ,
  UNIQUE(member_id, class_session_id)
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_orders_member_id ON orders(member_id);
CREATE INDEX idx_class_sessions_start_time ON class_sessions(start_time);
CREATE INDEX idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX idx_class_bookings_session_id ON class_bookings(class_session_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_settings_updated_at BEFORE UPDATE ON invoice_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Invoice settings policies
CREATE POLICY "Admins can manage invoice settings" ON invoice_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can view invoice settings" ON invoice_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Orders policies
CREATE POLICY "Members can view their own orders" ON orders
  FOR SELECT USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Class types policies
CREATE POLICY "Anyone authenticated can view class types" ON class_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage class types" ON class_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Class sessions policies
CREATE POLICY "Anyone authenticated can view class sessions" ON class_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage class sessions" ON class_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Class bookings policies
CREATE POLICY "Members can view their own bookings" ON class_bookings
  FOR SELECT USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all bookings" ON class_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can create their own bookings" ON class_bookings
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update their own bookings" ON class_bookings
  FOR UPDATE USING (
    member_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
