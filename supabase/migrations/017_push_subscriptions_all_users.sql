-- Allow all authenticated users (not just admins) to manage their own push subscriptions.
-- Members need push subscriptions for course reminders.
-- Admin-only notifications are filtered at the application level.

DROP POLICY IF EXISTS "Admins can manage their own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
