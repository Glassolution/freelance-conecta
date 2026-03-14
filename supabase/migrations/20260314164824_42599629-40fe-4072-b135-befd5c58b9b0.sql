-- Conversations for support chat history
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_support_conversations_user_updated
  ON public.support_conversations (user_id, updated_at DESC);

-- Messages within support conversations
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_created
  ON public.support_messages (conversation_id, created_at ASC);

-- Policies: support_conversations
DROP POLICY IF EXISTS "Users can view own support conversations" ON public.support_conversations;
CREATE POLICY "Users can view own support conversations"
ON public.support_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own support conversations" ON public.support_conversations;
CREATE POLICY "Users can create own support conversations"
ON public.support_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own support conversations" ON public.support_conversations;
CREATE POLICY "Users can update own support conversations"
ON public.support_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own support conversations" ON public.support_conversations;
CREATE POLICY "Users can delete own support conversations"
ON public.support_conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policies: support_messages
DROP POLICY IF EXISTS "Users can view own support messages" ON public.support_messages;
CREATE POLICY "Users can view own support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_conversations c
    WHERE c.id = support_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create own support messages" ON public.support_messages;
CREATE POLICY "Users can create own support messages"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.support_conversations c
    WHERE c.id = support_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own support messages" ON public.support_messages;
CREATE POLICY "Users can delete own support messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_conversations c
    WHERE c.id = support_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

-- Timestamp management for updated_at
CREATE OR REPLACE FUNCTION public.set_support_conversations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_conversations_updated_at ON public.support_conversations;
CREATE TRIGGER trg_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_support_conversations_updated_at();

CREATE OR REPLACE FUNCTION public.touch_support_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_support_conversation_on_message ON public.support_messages;
CREATE TRIGGER trg_touch_support_conversation_on_message
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_support_conversation_on_message();