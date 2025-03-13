/*
  # Initial Schema Setup for Student Protest Platform

  1. New Tables
    - profiles
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - full_name (text)
      - is_admin (boolean)
      - created_at (timestamp)
      
    - signatures
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - student_name (text)
      - college_name (text)
      - roll_number (text)
      - aadhaar_url (text)
      - email (text)
      - contact_number (text)
      - problem_description (text)
      - verified (boolean)
      - created_at (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for user access
    - Add policies for admin access
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create signatures table
CREATE TABLE signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  student_name text NOT NULL,
  college_name text NOT NULL,
  roll_number text NOT NULL,
  aadhaar_url text NOT NULL,
  email text NOT NULL,
  contact_number text NOT NULL,
  problem_description text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Signatures policies
CREATE POLICY "Users can read all signatures"
  ON signatures
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own signature"
  ON signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signature"
  ON signatures
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can do everything"
  ON signatures
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );