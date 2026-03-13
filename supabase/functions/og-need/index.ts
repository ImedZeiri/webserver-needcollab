import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_IMAGES: Record<string, string> = {
  vetements: "/images/categories/vetements.jpg",
  bricolage: "/images/categories/bricolage.jpg",
  electronique: "/images/categories/electronique.jpg",
  meubles: "/images/categories/meubles.jpg",
  materiaux: "/images/categories/materiaux.jpg",
  sport: "/images/categories/sport.jpg",
  jardin: "/images/categories/jardin.jpg",
  cuisine: "/images/categories/cuisine.jpg",
  decoration: "/images/categories/decoration.jpg",
  jouets: "/images/categories/jouets.jpg",
  livres: "/images/categories/livres.jpg",
  autres: "/images/categories/autres.jpg",
};

function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const needId = url.searchParams.get("needId");
    const ref = url.searchParams.get("ref") || "";

    // L'origine de votre app (utilisée pour construire des URLs absolues)
    const appOrigin = url.searchParams.get("appOrigin") || "";

    if (!needId) {
      return new Response("Missing needId", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: need, error } = await supabase
      .from("needs")
      .select("id,title,description,category,image_url")
      .eq("id", needId)
      .maybeSingle();

    if (error) {
      console.error("og-need: db error", error);
      return new Response("Database error", {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (!need) {
      return new Response("Not found", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const safeTitle = escapeHtml(`${need.title} - CollabBuy`);
    const safeDesc = escapeHtml(
      need.description || `Rejoins cette collaboration d'achat groupé: ${need.title}`,
    );

    const fallbackPath = CATEGORY_IMAGES[String(need.category)] || CATEGORY_IMAGES.autres;

    const toAbsolute = (value: string) => {
      // Si déjà absolu, on garde
      if (/^https?:\/\//i.test(value)) return value;
      // Sinon on tente de le rendre absolu via l'origine de l'app
      if (appOrigin) return `${appOrigin}${value.startsWith("/") ? "" : "/"}${value}`;
      return value;
    };

    const imageAbsolute = need.image_url
      ? toAbsolute(String(need.image_url))
      : appOrigin
        ? `${appOrigin}${fallbackPath}`
        : fallbackPath;

    const canonical = appOrigin
      ? `${appOrigin}/needs/${needId}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`
      : "";

    const redirectTarget = canonical || (appOrigin ? `${appOrigin}/needs/${needId}` : "/");

    const userAgent = req.headers.get("user-agent") || "";
    const isSocialBot = /(WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Pinterest|Googlebot|bingbot)/i
      .test(userAgent);

    console.log("og-need: ua", userAgent);
    console.log("og-need: isSocialBot", isSocialBot);
    console.log("og-need: og:image", imageAbsolute);

    const redirectMeta = isSocialBot
      ? ""
      : `\n    <meta http-equiv="refresh" content="0; url=${escapeHtml(redirectTarget)}" />`;

    const redirectScript = isSocialBot
      ? ""
      : `\n    <script>window.location.replace(${JSON.stringify(redirectTarget)});</script>`;

    const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />

    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ""}

    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="website" />
    ${canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}" />` : ""}
    <meta property="og:image" content="${escapeHtml(imageAbsolute)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${escapeHtml(imageAbsolute)}" />
    ${redirectMeta}
  </head>
  <body>
    <noscript>
      <a href="${escapeHtml(redirectTarget)}">Ouvrir la collaboration</a>
    </noscript>
    ${isSocialBot ? `<p><a href="${escapeHtml(redirectTarget)}">Ouvrir la collaboration</a></p>` : ""}
    ${redirectScript}
  </body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("og-need error", e);
    return new Response("Internal error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
