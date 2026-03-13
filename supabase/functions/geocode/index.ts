/**
 * @file geocode/index.ts
 * @description Edge function Supabase pour le géocodage via l'API Mapbox.
 * Supporte le géocodage direct (adresse → coordonnées) et inverse (coordonnées → adresse).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Headers CORS pour autoriser les requêtes cross-origin
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Handler de la fonction Edge
 * 
 * @description Effectue des opérations de géocodage via l'API Mapbox :
 * 
 * **Géocodage direct (forward):**
 * - Paramètre: { query: "Paris, France" }
 * - Retourne: coordonnées et informations du lieu
 * 
 * **Géocodage inverse (reverse):**
 * - Paramètres: { lat: 48.8566, lng: 2.3522, type: "reverse" }
 * - Retourne: adresse et informations du lieu
 * 
 * @param {Request} req - Requête HTTP entrante avec body JSON
 * @returns {Promise<Response>} Résultats du géocodage
 */
serve(async (req) => {
  // Gestion des requêtes preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupération du token Mapbox
    const token = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    // Vérification que le token est configuré
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extraction des paramètres de la requête
    const { query, lat, lng, type } = await req.json();

    let url: string;

    if (type === "reverse" && lat && lng) {
      // === GÉOCODAGE INVERSE ===
      // Convertit des coordonnées en adresse
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=fr&types=place,locality,address`;
    } else if (query) {
      // === GÉOCODAGE DIRECT ===
      // Convertit une adresse en coordonnées
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&language=fr&types=place,locality,address&limit=5`;
    } else {
      // Paramètres manquants
      return new Response(
        JSON.stringify({ error: "Missing query or coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Appel à l'API Mapbox
    const response = await fetch(url);
    const data = await response.json();

    // Vérification de la réponse
    if (!response.ok) {
      throw new Error(data.message || "Geocoding failed");
    }

    // Formatage des résultats pour une utilisation simplifiée
    const results = data.features?.map((feature: any) => ({
      /** Identifiant unique du lieu */
      id: feature.id,
      /** Nom complet du lieu */
      place_name: feature.place_name,
      /** Texte principal (nom court) */
      text: feature.text,
      /** Coordonnées [longitude, latitude] */
      center: feature.center,
      /** Contexte géographique (ville, région, pays) */
      context: feature.context?.reduce((acc: any, ctx: any) => {
        if (ctx.id.startsWith("place")) acc.city = ctx.text;
        if (ctx.id.startsWith("region")) acc.region = ctx.text;
        if (ctx.id.startsWith("country")) acc.country = ctx.text;
        return acc;
      }, {}),
    })) || [];

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Gestion des erreurs
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
