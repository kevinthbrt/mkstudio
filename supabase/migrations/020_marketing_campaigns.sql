-- Marketing opt-in flag for members (RGPD-friendly, one-click unsubscribe from campaign emails)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT true;

-- History of admin marketing campaigns sent to members
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'promotion', 'massage')),
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email_campaigns" ON email_campaigns
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
