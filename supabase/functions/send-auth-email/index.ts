/**
 * @file send-auth-email/index.ts
 * @description Edge function Supabase pour l'authentification par email OTP.
 * Gère l'envoi de codes OTP par email et leur vérification.
 * Utilise Resend pour l'envoi d'emails.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// === CONFIGURATION ===

/** Clé API Resend pour l'envoi d'emails */
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
/** URL du projet Supabase */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
/** Clé service role Supabase (accès admin) */
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

/**
 * Headers CORS pour autoriser les requêtes cross-origin
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === TYPES ===

/**
 * Interface pour les paramètres de la requête d'authentification
 */
interface AuthEmailRequest {
  /** Adresse email de l'utilisateur */
  email: string;
  /** Action à effectuer: envoyer OTP, vérifier OTP, ou connexion directe */
  action: "send" | "verify" | "direct";
  /** Code OTP à vérifier (requis si action === "verify") */
  code?: string;
}

// === FONCTIONS UTILITAIRES ===

/**
 * Génère un code OTP à 6 chiffres
 * 
 * @returns {string} Code OTP de 6 chiffres
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Génère le contenu de l'email avec le code OTP
 * 
 * @param {string} otp - Le code OTP à inclure dans l'email
 * @returns {Object} Objet contenant le sujet et le HTML de l'email
 */
const getEmailContent = (otp: string) => {
  return {
    subject: `Votre code de connexion CollabAchat: ${otp}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Votre code de connexion</h1>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Utilisez ce code pour vous connecter à votre compte CollabAchat :
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 30px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
              Ce code expire dans 10 minutes.<br>
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} CollabAchat. Tous droits réservés.
          </p>
        </body>
      </html>
    `,
  };
};

// === HANDLER PRINCIPAL ===

/**
 * Handler de la fonction Edge
 * 
 * Gère deux actions :
 * 1. "send" : Génère et envoie un code OTP par email
 * 2. "verify" : Vérifie le code OTP et authentifie l'utilisateur
 * 
 * @param {Request} req - Requête HTTP entrante
 * @returns {Promise<Response>} Réponse HTTP
 */
const handler = async (req: Request): Promise<Response> => {
  console.log("send-auth-email function called");

  // Gestion des requêtes preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialisation du client Supabase avec accès admin
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { email, action, code }: AuthEmailRequest = await req.json();
    
    console.log(`Action: ${action}, Email: ${email}`);

    // Validation de l'email
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // === ACTION: ENVOI DU CODE OTP ===
    if (action === "send") {
      // Suppression des anciens codes OTP pour cet email
      await supabase.from("otp_codes").delete().eq("email", email.toLowerCase());

      // Génération du nouveau code OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expire dans 10 minutes

      // Stockage du code OTP en base de données
      const { error: insertError } = await supabase.from("otp_codes").insert({
        email: email.toLowerCase(),
        code: otp,
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        throw new Error("Failed to generate verification code");
      }

      // Envoi de l'email via l'API Resend
      const { subject, html } = getEmailContent(otp);

      console.log("Sending email via Resend...");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "CollabAchat <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });

      const emailResponse = await res.json();
      console.log("Resend response:", emailResponse);

      if (!res.ok) {
        console.error("Resend API error:", emailResponse);
        throw new Error(emailResponse.message || "Failed to send email");
      }

      return new Response(
        JSON.stringify({ success: true, message: "Code sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    // === ACTION: VÉRIFICATION DU CODE OTP ===
    } else if (action === "verify") {
      // Validation du code
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Code is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Recherche d'un code OTP valide (non utilisé et non expiré)
      const { data: otpData, error: otpError } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (otpError || !otpData) {
        console.error("OTP verification failed:", otpError);
        return new Response(
          JSON.stringify({ error: "Code invalide ou expiré" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Marquer le code OTP comme utilisé
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpData.id);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      let session;

      if (existingUser) {
        // Utilisateur existant : générer un magic link pour connexion auto
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
          options: {
            redirectTo: `${req.headers.get("origin") ?? ""}/`,
          },
        });

        if (error) {
          console.error("Error generating magic link:", error);
          throw new Error("Failed to authenticate");
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: existingUser.id,
            action_link: data.properties?.action_link,
            verification_type: "magiclink",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      } else {
        // Nouvel utilisateur : créer le compte puis générer magic link
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          email_confirm: true,
        });

        if (createError) {
          console.error("Error creating user:", createError);
          throw new Error("Failed to create user");
        }

        // Générer magic link pour le nouvel utilisateur
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
          options: {
            redirectTo: `${req.headers.get("origin") ?? ""}/`,
          },
        });

        if (error) {
          console.error("Error generating magic link:", error);
          throw new Error("Failed to authenticate");
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: newUser.user.id,
            action_link: data.properties?.action_link,
            verification_type: "magiclink",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

    // === ACTION: CONNEXION DIRECTE (sans OTP, sans email) ===
    } else if (action === "direct") {
      console.log("Direct login for:", email);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        // Utilisateur existant : générer magic link
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
          options: {
            redirectTo: `${req.headers.get("origin") ?? ""}/`,
          },
        });

        if (error) {
          console.error("Error generating magic link:", error);
          throw new Error("Failed to authenticate");
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: existingUser.id,
            action_link: data.properties?.action_link,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      } else {
        // Nouvel utilisateur : créer le compte puis générer magic link
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          email_confirm: true,
        });

        if (createError) {
          console.error("Error creating user:", createError);
          throw new Error("Failed to create user");
        }

        // Générer magic link pour le nouvel utilisateur
        const { data, error } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
          options: {
            redirectTo: `${req.headers.get("origin") ?? ""}/`,
          },
        });

        if (error) {
          console.error("Error generating magic link:", error);
          throw new Error("Failed to authenticate");
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: newUser.user.id,
            action_link: data.properties?.action_link,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

    } else {
      // Action non reconnue
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Démarrage du serveur Edge Function
serve(handler);
