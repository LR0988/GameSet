-- Supabase Schema for GameSet
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qoyevxtxzaohdygcbtcv/sql

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Game Scores / Leaderboard Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  user_email TEXT,
  display_name TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id_score 
ON public.game_scores (game_id, score DESC);

-- Enable RLS for game_scores
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game scores are viewable by everyone" 
ON public.game_scores FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" 
ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
