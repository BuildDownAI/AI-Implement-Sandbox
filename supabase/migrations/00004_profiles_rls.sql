ALTER TABLE profiles ENABLE row level security;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR select TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR update TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);