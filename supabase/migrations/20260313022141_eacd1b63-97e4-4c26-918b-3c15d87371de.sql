
-- Profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  avatar_url text,
  plan text DEFAULT 'free',
  plan_expires_at timestamptz,
  onboarding_completed boolean DEFAULT false,
  onboarding_profile text,
  onboarding_tools text[],
  onboarding_goal text,
  onboarding_budget text,
  created_at timestamptz DEFAULT now()
);

-- Ads table
CREATE TABLE public.ads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  skills text[],
  price numeric,
  deadline_days int,
  status text DEFAULT 'active',
  views int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Proposals table (for Markfy ad proposals)
CREATE TABLE public.ad_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  message text,
  price numeric,
  deadline_days int,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  company text,
  project_name text,
  project_value numeric,
  project_status text DEFAULT 'in_progress',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Conversations table
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 uuid REFERENCES public.profiles(id),
  participant_2 uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text,
  message text,
  type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- RLS: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS: ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active ads" ON public.ads FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Owner can insert ads" ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update ads" ON public.ads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete ads" ON public.ads FOR DELETE USING (auth.uid() = user_id);

-- RLS: ad_proposals
ALTER TABLE public.ad_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sender can manage own proposals" ON public.ad_proposals FOR ALL USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Ad owner can view proposals" ON public.ad_proposals FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.ads WHERE id = ad_id)
);
CREATE POLICY "Ad owner can update proposals" ON public.ad_proposals FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.ads WHERE id = ad_id)
);

-- RLS: clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can manage conversations" ON public.conversations FOR ALL 
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- RLS: messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR
  auth.uid() = (SELECT participant_1 FROM public.conversations WHERE id = conversation_id) OR
  auth.uid() = (SELECT participant_2 FROM public.conversations WHERE id = conversation_id)
);
CREATE POLICY "Sender can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Participants can update messages" ON public.messages FOR UPDATE USING (
  auth.uid() = sender_id OR
  auth.uid() = (SELECT participant_1 FROM public.conversations WHERE id = conversation_id) OR
  auth.uid() = (SELECT participant_2 FROM public.conversations WHERE id = conversation_id)
);

-- RLS: notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User sees own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "User can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment ad views
CREATE OR REPLACE FUNCTION public.increment_ad_views(p_ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.ads SET views = views + 1 WHERE id = p_ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
