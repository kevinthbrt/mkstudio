-- Allow all authenticated users (members + admins) to manage their own push subscriptions
DROP POLICY IF EXISTS "Admins can manage their own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
