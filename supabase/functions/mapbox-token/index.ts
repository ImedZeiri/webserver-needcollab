/**
 * @file mapbox-token/index.ts
 * @description Edge function Supabase pour fournir le token Mapbox de manière sécurisée.
 * Permet d'éviter d'exposer le token Mapbox dans le code client.
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
 * @description Retourne le token Mapbox configuré en variable d'environnement.
 * Cela permet de sécuriser le token en le gardant côté serveur.
 * 
 * @param {Request} req - Requête HTTP entrante
 * @returns {Promise<Response>} Réponse avec le token ou une erreur
 */
serve(async (req) => {
  // Gestion des requêtes preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupération du token depuis les variables d'environnement
    const token = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    // Vérification que le token est configuré
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retour du token
    return new Response(
      JSON.stringify({ token }),
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
