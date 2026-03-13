-- ============================================================
-- DATABASE EXPORT - Schema, Functions, Triggers & RLS Policies
-- Project: iexuwjwdybenorujndwv
-- Exported: 2026-03-03
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.need_category AS ENUM ('vetements', 'bricolage', 'electronique', 'meubles', 'materiaux', 'sport', 'jardin', 'cuisine', 'decoration', 'jouets', 'livres', 'autres');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.need_status AS ENUM ('draft', 'published', 'in_progress', 'finalized', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vendor_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  username text,
  is_vendor boolean DEFAULT false,
  vendor_company_name text,
  vendor_siret text,
  vendor_status vendor_status,
  vendor_verified_at timestamptz,
  location_lat numeric,
  location_lng numeric,
  location_city text,
  location_country text,
  wants_to_be_contacted boolean DEFAULT true,
  is_suspended boolean DEFAULT false,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.needs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  category need_category NOT NULL,
  status need_status NOT NULL DEFAULT 'draft',
  image_url text,
  target_date date,
  budget_min numeric,
  budget_max numeric,
  min_participants integer DEFAULT 2,
  max_participants integer,
  quantity_per_person integer DEFAULT 1,
  specifications jsonb DEFAULT '{}'::jsonb,
  share_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collaborations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  position integer NOT NULL,
  quantity integer DEFAULT 1,
  cost_percentage numeric,
  wants_contact boolean DEFAULT true,
  location_lat numeric,
  location_lng numeric,
  location_city text,
  location_country text,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id),
  vendor_id uuid NOT NULL REFERENCES public.profiles(id),
  status offer_status NOT NULL DEFAULT 'pending',
  price_total numeric NOT NULL,
  price_per_unit numeric,
  min_buyers integer DEFAULT 1,
  delivery_days integer,
  delivery_description text,
  conditions text,
  message text,
  valid_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.votes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  vote boolean NOT NULL,
  voted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  offer_id uuid REFERENCES public.offers(id),
  content text NOT NULL,
  is_vendor_channel boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  need_id uuid REFERENCES public.needs(id),
  offer_id uuid REFERENCES public.offers(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_unique_username()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  base_name text;
  new_username text;
  counter integer := 0;
BEGIN
  base_name := 'user' || floor(random() * 9000 + 1000)::text;
  new_username := base_name;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_name || counter::text;
  END LOOP;
  RETURN new_username;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  new_username text;
BEGIN
  new_username := public.generate_unique_username();
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), new_username);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_collaborator_on_need(_user_id uuid, _need_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborations WHERE user_id = _user_id AND need_id = _need_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_offer_on_need(_vendor_id uuid, _need_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offers o WHERE o.vendor_id = _vendor_id AND o.need_id = _need_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_next_collaboration_position(p_need_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(MAX(position), 0) + 1 FROM public.collaborations WHERE need_id = p_need_id;
$$;

CREATE OR REPLACE FUNCTION public.calculate_cost_percentages(p_need_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  total_participants INTEGER;
  base_percentage DECIMAL;
  reduction_per_position DECIMAL;
  collab RECORD;
BEGIN
  SELECT COUNT(*) INTO total_participants FROM public.collaborations WHERE need_id = p_need_id;
  IF total_participants = 0 THEN RETURN; END IF;
  base_percentage := 100.0 / total_participants;
  reduction_per_position := base_percentage * 0.1;
  FOR collab IN
    SELECT id, position FROM public.collaborations WHERE need_id = p_need_id ORDER BY position DESC
  LOOP
    UPDATE public.collaborations
    SET cost_percentage = base_percentage + (reduction_per_position * (total_participants - collab.position))
    WHERE id = collab.id;
  END LOOP;
  UPDATE public.collaborations c
  SET cost_percentage = cost_percentage * 100 / (
    SELECT SUM(cost_percentage) FROM public.collaborations WHERE need_id = p_need_id
  )
  WHERE c.need_id = p_need_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_percentages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_cost_percentages(OLD.need_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_cost_percentages(NEW.need_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  need_title TEXT;
  collab RECORD;
BEGIN
  SELECT title INTO need_title FROM public.needs WHERE id = NEW.need_id;
  FOR collab IN SELECT user_id FROM public.collaborations WHERE need_id = NEW.need_id LOOP
    INSERT INTO public.notifications (user_id, type, title, message, need_id, offer_id)
    VALUES (collab.user_id, 'new_offer', 'Nouvelle offre reçue',
      'Une nouvelle offre a été soumise pour "' || need_title || '"', NEW.need_id, NEW.id);
  END LOOP;
  INSERT INTO public.notifications (user_id, type, title, message, need_id, offer_id)
  SELECT n.creator_id, 'new_offer', 'Nouvelle offre reçue',
    'Une nouvelle offre a été soumise pour "' || need_title || '"', NEW.need_id, NEW.id
  FROM public.needs n WHERE n.id = NEW.need_id
  AND n.creator_id NOT IN (SELECT user_id FROM public.collaborations WHERE need_id = NEW.need_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  need_title TEXT;
  sender_name TEXT;
  collab RECORD;
BEGIN
  SELECT title INTO need_title FROM public.needs WHERE id = NEW.need_id;
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  FOR collab IN SELECT user_id FROM public.collaborations WHERE need_id = NEW.need_id AND user_id != NEW.sender_id LOOP
    INSERT INTO public.notifications (user_id, type, title, message, need_id)
    VALUES (collab.user_id, 'new_message', 'Nouveau message',
      COALESCE(sender_name, 'Un collaborateur') || ' a envoyé un message dans "' || need_title || '"', NEW.need_id);
  END LOOP;
  INSERT INTO public.notifications (user_id, type, title, message, need_id)
  SELECT n.creator_id, 'new_message', 'Nouveau message',
    COALESCE(sender_name, 'Un collaborateur') || ' a envoyé un message dans "' || need_title || '"', NEW.need_id
  FROM public.needs n WHERE n.id = NEW.need_id AND n.creator_id != NEW.sender_id
  AND n.creator_id NOT IN (SELECT user_id FROM public.collaborations WHERE need_id = NEW.need_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_collaborator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  need_title TEXT;
  joiner_name TEXT;
  creator_id UUID;
BEGIN
  SELECT title, n.creator_id INTO need_title, creator_id FROM public.needs n WHERE id = NEW.need_id;
  SELECT full_name INTO joiner_name FROM public.profiles WHERE id = NEW.user_id;
  IF creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, need_id)
    VALUES (creator_id, 'new_collaborator', 'Nouveau collaborateur',
      COALESCE(joiner_name, 'Quelqu''un') || ' a rejoint votre need "' || need_title || '"', NEW.need_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < NOW() OR used = true;
END;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- Drop existing policies before recreating to avoid conflicts
-- ============================================================

-- PROFILES
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- NEEDS
DROP POLICY IF EXISTS "Anyone can view published needs" ON public.needs;
DROP POLICY IF EXISTS "Authenticated users can create needs" ON public.needs;
DROP POLICY IF EXISTS "Creators can update own needs" ON public.needs;
DROP POLICY IF EXISTS "Creators can delete own needs" ON public.needs;

CREATE POLICY "Anyone can view published needs" ON public.needs FOR SELECT USING ((status <> 'draft'::need_status) OR (creator_id = auth.uid()));
CREATE POLICY "Authenticated users can create needs" ON public.needs FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own needs" ON public.needs FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own needs" ON public.needs FOR DELETE USING (auth.uid() = creator_id);

-- COLLABORATIONS
DROP POLICY IF EXISTS "Authenticated users can join collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Users can update own collaboration" ON public.collaborations;
DROP POLICY IF EXISTS "Users can leave collaboration" ON public.collaborations;
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Creators can view need collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Vendors can view need collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Collaborators can view need collaborations" ON public.collaborations;

CREATE POLICY "Authenticated users can join collaborations" ON public.collaborations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collaboration" ON public.collaborations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave collaboration" ON public.collaborations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own collaborations" ON public.collaborations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can view need collaborations" ON public.collaborations FOR SELECT USING (EXISTS (SELECT 1 FROM needs n WHERE n.id = collaborations.need_id AND n.creator_id = auth.uid()));
CREATE POLICY "Vendors can view need collaborations" ON public.collaborations FOR SELECT USING (has_offer_on_need(auth.uid(), need_id));
CREATE POLICY "Collaborators can view need collaborations" ON public.collaborations FOR SELECT USING (is_collaborator_on_need(auth.uid(), need_id));

-- OFFERS
DROP POLICY IF EXISTS "Verified vendors can create offers" ON public.offers;
DROP POLICY IF EXISTS "Vendors can update own offers" ON public.offers;
DROP POLICY IF EXISTS "Users can view offers" ON public.offers;

CREATE POLICY "Verified vendors can create offers" ON public.offers FOR INSERT WITH CHECK ((auth.uid() = vendor_id) AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_vendor = true AND profiles.vendor_status = 'verified'::vendor_status)));
CREATE POLICY "Vendors can update own offers" ON public.offers FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Users can view offers" ON public.offers FOR SELECT USING ((auth.uid() = vendor_id) OR (EXISTS (SELECT 1 FROM needs n WHERE n.id = offers.need_id AND n.creator_id = auth.uid())) OR (EXISTS (SELECT 1 FROM collaborations c WHERE c.need_id = offers.need_id AND c.user_id = auth.uid())));

-- VOTES
DROP POLICY IF EXISTS "Collaborators can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can update own vote" ON public.votes;
DROP POLICY IF EXISTS "Authorized users can view votes" ON public.votes;

CREATE POLICY "Collaborators can vote" ON public.votes FOR INSERT WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM collaborations c JOIN offers o ON o.need_id = c.need_id WHERE o.id = votes.offer_id AND c.user_id = auth.uid())));
CREATE POLICY "Users can update own vote" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authorized users can view votes" ON public.votes FOR SELECT USING ((EXISTS (SELECT 1 FROM offers o JOIN collaborations c ON c.need_id = o.need_id WHERE o.id = votes.offer_id AND c.user_id = auth.uid())) OR (EXISTS (SELECT 1 FROM offers o JOIN needs n ON n.id = o.need_id WHERE o.id = votes.offer_id AND n.creator_id = auth.uid())) OR (EXISTS (SELECT 1 FROM offers o WHERE o.id = votes.offer_id AND o.vendor_id = auth.uid())));

-- MESSAGES
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Collaborators can view messages" ON public.messages;

CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Collaborators can view messages" ON public.messages FOR SELECT USING ((EXISTS (SELECT 1 FROM collaborations WHERE collaborations.need_id = messages.need_id AND collaborations.user_id = auth.uid())) OR (EXISTS (SELECT 1 FROM needs WHERE needs.id = messages.need_id AND needs.creator_id = auth.uid())) OR (offer_id IS NOT NULL AND EXISTS (SELECT 1 FROM offers WHERE offers.id = messages.offer_id AND offers.vendor_id = auth.uid())));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- OTP_CODES
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.otp_codes;

CREATE POLICY "Service role can manage OTP codes" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
