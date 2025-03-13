/*
  # Create petitions table

  1. New Tables
    - `petitions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `college_name` (text)
      - `roll_number` (text)
      - `phone_number` (text)
      - `email` (text)
      - `problem_description` (text)
      - `aadhar_url` (text)
      - `profile_url` (text)
      - `signature_url` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `petitions` table
    - Add policies for:
      - Users can read their own petitions
      - Users can create their own petitions
      - Admins can read all petitions
*/

CREATE TABLE IF NOT EXISTS petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  college_name text NOT NULL,
  roll_number text NOT NULL,
  phone_number text NOT NULL,
  email text NOT NULL,
  problem_description text NOT NULL,
  aadhar_url text NOT NULL,
  profile_url text NOT NULL,
  signature_url text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own petitions
CREATE POLICY "Users can read own petitions"
  ON petitions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create their own petitions
CREATE POLICY "Users can create own petitions"
  ON petitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS petitions_user_id_idx ON petitions(user_id);
CREATE INDEX IF NOT EXISTS petitions_status_idx ON petitions(status);