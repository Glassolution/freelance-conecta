-- Vagas table
CREATE TABLE public.vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  tag TEXT NOT NULL,
  tag_color TEXT NOT NULL DEFAULT '#38bdf8',
  price NUMERIC NOT NULL DEFAULT 0,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'Cliente',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view vagas"
  ON public.vagas FOR SELECT
  TO authenticated
  USING (true);

-- Propostas table (user-specific)
CREATE TABLE public.propostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_date TEXT,
  tag TEXT NOT NULL,
  tag_color TEXT NOT NULL DEFAULT '#38bdf8',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own propostas"
  ON public.propostas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own propostas"
  ON public.propostas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User stats table
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vagas_viewed INTEGER NOT NULL DEFAULT 0,
  propostas_sent INTEGER NOT NULL DEFAULT 0,
  period_label TEXT NOT NULL,
  period_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed some sample vagas
INSERT INTO public.vagas (title, platform, tag, tag_color, price, author_name, author_role, image_url) VALUES
  ('Desenvolvimento de App React Native', 'Workana', 'DEV & TECH', '#38bdf8', 3500, 'Leonardo Martins', 'Cliente', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'),
  ('Redesign de Identidade Visual Completa', '99Freelas', 'DESIGN', '#a78bfa', 2200, 'Camila Santos', 'Cliente', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop'),
  ('Gestão de Tráfego Pago no Google Ads', 'GetNinjas', 'MARKETING', '#34d399', 1800, 'Rafael Oliveira', 'Cliente', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=250&fit=crop'),
  ('Criação de Landing Page para SaaS', 'Upwork', 'DEV & TECH', '#38bdf8', 4500, 'Marcos Silva', 'Cliente', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop'),
  ('Design de UI/UX para App Mobile', 'Workana', 'DESIGN', '#a78bfa', 5000, 'Ana Paula', 'Cliente', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop'),
  ('Edição de Vídeos para YouTube', 'GetNinjas', 'MARKETING', '#34d399', 1200, 'Pedro Henrique', 'Cliente', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop');