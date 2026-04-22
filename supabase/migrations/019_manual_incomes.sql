-- Manual income entries for retroactive accounting (admin only)
CREATE TABLE IF NOT EXISTS manual_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE manual_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage manual_incomes" ON manual_incomes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
