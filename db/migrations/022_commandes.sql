-- ============================================================
-- 022 - Commandes
--
-- Une commande garde une copie de ce qui a ete vendu (nom, format, prix) :
-- renommer ou changer le prix d'un produit ne reecrit pas le passe.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS public.orders_number_seq START 1001;

CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number            text NOT NULL UNIQUE,
  -- Identifiant tire par le navigateur : un double envoi ne cree qu'une commande.
  client_ref        uuid NOT NULL UNIQUE,
  status            text NOT NULL DEFAULT 'nouvelle'
                    CHECK (status IN ('nouvelle', 'confirmee', 'preparee', 'terminee', 'annulee')),
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL,
  mode              text NOT NULL CHECK (mode IN ('shipping', 'local', 'pickup')),
  fulfillment_date  date NOT NULL,
  address           text NOT NULL DEFAULT '',
  address2          text NOT NULL DEFAULT '',
  postal_code       text NOT NULL DEFAULT '',
  city              text NOT NULL DEFAULT '',
  country           text NOT NULL DEFAULT '',
  distance_km       numeric(6,2),
  billing_same      boolean NOT NULL DEFAULT true,
  billing_address   text NOT NULL DEFAULT '',
  billing_postal_code text NOT NULL DEFAULT '',
  billing_city      text NOT NULL DEFAULT '',
  instructions      text NOT NULL DEFAULT '',
  subtotal          numeric(10,2) NOT NULL,
  gift_total        numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee      numeric(10,2) NOT NULL DEFAULT 0,
  total             numeric(10,2) NOT NULL,
  currency          text NOT NULL DEFAULT 'EUR',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

DROP TRIGGER IF EXISTS orders_touch ON public.orders;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id     uuid REFERENCES public.products (id) ON DELETE SET NULL,
  slug           text NOT NULL,
  name           text NOT NULL,
  variant_label  text NOT NULL DEFAULT '',
  quantity       integer NOT NULL CHECK (quantity > 0),
  unit_price     numeric(10,2) NOT NULL,
  line_total     numeric(10,2) NOT NULL,
  gift_wrap      boolean NOT NULL DEFAULT false,
  gift_message   text NOT NULL DEFAULT '',
  -- Faux quand le prix n'a pas pu etre recalcule par le serveur : produit
  -- hors base, ou prix garanti different du prix du jour.
  price_verified boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
