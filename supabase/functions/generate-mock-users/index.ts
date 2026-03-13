import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const quebecLocations = [
  { city: "Montréal", lat: 45.5017, lng: -73.5673 },
  { city: "Québec", lat: 46.8139, lng: -71.2080 },
  { city: "Laval", lat: 45.6066, lng: -73.7124 },
  { city: "Gatineau", lat: 45.4765, lng: -75.7013 },
  { city: "Longueuil", lat: 45.5312, lng: -73.5186 },
  { city: "Sherbrooke", lat: 45.4042, lng: -71.8929 },
  { city: "Saguenay", lat: 48.4280, lng: -71.0686 },
  { city: "Lévis", lat: 46.8032, lng: -71.1779 },
  { city: "Trois-Rivières", lat: 46.3432, lng: -72.5477 },
  { city: "Terrebonne", lat: 45.7050, lng: -73.6373 },
  { city: "Saint-Jean-sur-Richelieu", lat: 45.3073, lng: -73.2628 },
  { city: "Brossard", lat: 45.4588, lng: -73.4600 },
  { city: "Repentigny", lat: 45.7422, lng: -73.4594 },
  { city: "Drummondville", lat: 45.8803, lng: -72.4846 },
  { city: "Saint-Jérôme", lat: 45.7803, lng: -74.0036 },
];

const firstNames = ["Jean", "Marie", "Pierre", "Sophie", "Michel", "Isabelle", "François", "Catherine", "André", "Nathalie", 
  "Louis", "Julie", "Robert", "Sylvie", "Jacques", "Diane", "Claude", "Lise", "Paul", "Monique",
  "Martin", "Chantal", "Daniel", "Annie", "Marc", "Nicole", "Yves", "Josée", "Alain", "Lucie"];

const lastNames = ["Tremblay", "Gagnon", "Roy", "Côté", "Bouchard", "Gauthier", "Morin", "Lavoie", "Fortin", "Gagné",
  "Ouellet", "Pelletier", "Bélanger", "Lévesque", "Bergeron", "Leblanc", "Paquette", "Girard", "Simard", "Boucher"];

const companyNames = ["Quincaillerie du Québec", "Matériaux Laurentides", "Électro-Pro", "Jardin Expert", "Meubles Montréal",
  "Sport Plus", "Livres & Co", "Jouets Magiques", "Déco Design", "Cuisine Pro", "Brico Maître", "Tech Solutions"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Secret key pour éviter les abus - utiliser un secret simple pour la génération
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== "generate-mock-2024") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const createdUsers: any[] = [];
    const errors: any[] = [];

    // Create 25 regular users
    for (let i = 0; i < 25; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const location = quebecLocations[i % quebecLocations.length];
      const email = `user${i + 1}@mockdata.test`;
      
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: "MockPassword123!",
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
          }
        });

        if (authError) {
          errors.push({ email, error: authError.message });
          continue;
        }

        // Update profile with location
        if (authUser?.user) {
          await supabaseAdmin.from("profiles").update({
            full_name: `${firstName} ${lastName}`,
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
            location_city: location.city,
            location_country: "Canada",
            location_lat: location.lat + (Math.random() - 0.5) * 0.1,
            location_lng: location.lng + (Math.random() - 0.5) * 0.1,
            wants_to_be_contacted: Math.random() > 0.3,
          }).eq("id", authUser.user.id);

          createdUsers.push({ id: authUser.user.id, email, type: "user", name: `${firstName} ${lastName}` });
        }
      } catch (e) {
        errors.push({ email, error: String(e) });
      }
    }

    // Create 10 verified vendors
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[(i + 10) % firstNames.length];
      const lastName = lastNames[(i + 5) % lastNames.length];
      const location = quebecLocations[i % quebecLocations.length];
      const email = `vendor${i + 1}@mockdata.test`;
      const companyName = companyNames[i % companyNames.length];
      
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: "MockPassword123!",
          email_confirm: true,
          user_metadata: {
            full_name: `${firstName} ${lastName}`,
          }
        });

        if (authError) {
          errors.push({ email, error: authError.message });
          continue;
        }

        if (authUser?.user) {
          await supabaseAdmin.from("profiles").update({
            full_name: `${firstName} ${lastName}`,
            username: `vendor_${firstName.toLowerCase()}${i}`,
            location_city: location.city,
            location_country: "Canada",
            location_lat: location.lat + (Math.random() - 0.5) * 0.05,
            location_lng: location.lng + (Math.random() - 0.5) * 0.05,
            is_vendor: true,
            vendor_status: "verified",
            vendor_company_name: companyName,
            vendor_siret: `QC${String(100000 + i).padStart(6, "0")}`,
            vendor_verified_at: new Date().toISOString(),
          }).eq("id", authUser.user.id);

          createdUsers.push({ id: authUser.user.id, email, type: "vendor", name: `${firstName} ${lastName}`, company: companyName });
        }
      } catch (e) {
        errors.push({ email, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: createdUsers.length,
        users: createdUsers,
        errors 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
