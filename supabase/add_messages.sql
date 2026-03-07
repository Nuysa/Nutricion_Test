-- ─── MESSAGES ───
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text,
    attachments jsonb DEFAULT '[]'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- Mark as read policy
CREATE POLICY "Users can update is_read of received messages" ON public.messages
    FOR UPDATE USING (
        receiver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );
