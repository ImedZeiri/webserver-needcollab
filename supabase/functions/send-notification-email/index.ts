/**
 * @file send-notification-email/index.ts
 * @description Edge function Supabase pour l'envoi de notifications par email.
 * Gère différents types de notifications : offre acceptée, nouvelle offre, nouveau collaborateur.
 * Utilise Resend pour l'envoi d'emails.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialisation du client Resend
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Headers CORS pour autoriser les requêtes cross-origin
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// === TYPES ===

/**
 * Interface pour les paramètres de la requête de notification
 */
interface NotificationEmailRequest {
  /** Type de notification à envoyer */
  type: "offer_accepted" | "new_offer" | "new_collaborator";
  /** ID du need concerné */
  needId: string;
  /** ID de l'offre (optionnel, requis pour certains types) */
  offerId?: string;
  /** IDs des destinataires spécifiques (optionnel) */
  recipientIds?: string[];
}

/**
 * Interface pour les informations d'un collaborateur
 */
interface Collaborator {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  quantity?: number;
}

// === TEMPLATES D'EMAIL ===

/**
 * Génère le HTML pour la liste des collaborateurs (tableau)
 * 
 * @param {Collaborator[]} collaborators - Liste des collaborateurs
 * @returns {string} HTML du tableau des collaborateurs
 */
const getCollaboratorsListHtml = (collaborators: Collaborator[]) => {
  return collaborators.map(c => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 500;">${c.name}</td>
      <td style="padding: 12px;"><a href="mailto:${c.email}" style="color: #2563eb;">${c.email}</a></td>
      <td style="padding: 12px;">${c.phone || "-"}</td>
      <td style="padding: 12px;">${c.city || "-"}</td>
      <td style="padding: 12px; text-align: center;">${c.quantity || 1}</td>
    </tr>
  `).join("");
};

/**
 * Génère le template d'email selon le type de notification
 * 
 * @param {string} type - Type de notification
 * @param {any} data - Données pour le template
 * @returns {Object} Objet avec subject et html
 */
const getEmailTemplate = (type: string, data: any) => {
  switch (type) {
    // Template pour notification aux collaborateurs d'une offre acceptée
    case "offer_accepted":
      return {
        subject: `Offre acceptée pour "${data.needTitle}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669; margin-bottom: 20px;">🎉 Offre acceptée !</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              L'offre pour <strong>"${data.needTitle}"</strong> a été acceptée par le groupe.
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Vendeur</p>
              <p style="margin: 4px 0 0; font-size: 16px; color: #111827; font-weight: 500;">${data.vendorName}</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #6b7280;">Prix total</p>
              <p style="margin: 4px 0 0; font-size: 18px; color: #059669; font-weight: 600;">${data.priceTotal}€</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Le vendeur vous contactera prochainement pour finaliser la transaction.
            </p>
          </div>
        `,
      };

    // Template spécial pour le vendeur avec liste des contacts
    case "offer_accepted_vendor":
      return {
        subject: `🎉 Votre offre a été acceptée pour "${data.needTitle}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669; margin-bottom: 20px;">🎉 Félicitations ! Votre offre a été acceptée !</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Les collaborateurs du need <strong>"${data.needTitle}"</strong> ont accepté votre offre de <strong>${data.priceTotal}€</strong>.
            </p>
            
            <h2 style="color: #111827; margin: 30px 0 15px; font-size: 18px;">📋 Liste des collaborateurs à contacter</h2>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
              Voici les coordonnées des ${data.collaborators?.length || 0} collaborateurs qui souhaitent être contactés :
            </p>
            
            <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #1f2937; color: white;">
                  <th style="padding: 12px; text-align: left;">Nom</th>
                  <th style="padding: 12px; text-align: left;">Email</th>
                  <th style="padding: 12px; text-align: left;">Téléphone</th>
                  <th style="padding: 12px; text-align: left;">Ville</th>
                  <th style="padding: 12px; text-align: center;">Quantité</th>
                </tr>
              </thead>
              <tbody>
                ${data.collaborators ? getCollaboratorsListHtml(data.collaborators) : ""}
              </tbody>
            </table>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Important :</strong> Veuillez contacter ces collaborateurs dans les plus brefs délais pour organiser la transaction et la livraison.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              Merci d'utiliser CollabAchat !
            </p>
          </div>
        `,
      };

    // Template pour notification d'une nouvelle offre
    case "new_offer":
      return {
        subject: `Nouvelle offre pour "${data.needTitle}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">📬 Nouvelle offre reçue</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              Une nouvelle offre a été soumise pour <strong>"${data.needTitle}"</strong>.
            </p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Vendeur</p>
              <p style="margin: 4px 0 0; font-size: 16px; color: #111827; font-weight: 500;">${data.vendorName}</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #6b7280;">Prix proposé</p>
              <p style="margin: 4px 0 0; font-size: 18px; color: #2563eb; font-weight: 600;">${data.priceTotal}€</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Connectez-vous pour voir les détails et voter.
            </p>
          </div>
        `,
      };

    // Template pour notification d'un nouveau collaborateur
    case "new_collaborator":
      return {
        subject: `Nouveau collaborateur sur "${data.needTitle}"`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed; margin-bottom: 20px;">👋 Nouveau collaborateur</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              <strong>${data.collaboratorName}</strong> a rejoint votre need <strong>"${data.needTitle}"</strong>.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Plus vous êtes nombreux, plus le pouvoir de négociation augmente !
            </p>
          </div>
        `,
      };

    // Template par défaut
    default:
      return {
        subject: "Notification CollabAchat",
        html: "<p>Vous avez une nouvelle notification.</p>",
      };
  }
};

// === HANDLER PRINCIPAL ===

serve(async (req) => {
  // Gestion des requêtes preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialisation du client Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérification manuelle du JWT (optionnelle mais recommandée pour la sécurité)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Vérifier le token avec le client Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError) {
        console.log("JWT verification warning (non-blocking):", authError.message);
        // On continue quand même car la fonction utilise SERVICE_ROLE_KEY
      } else {
        console.log("Request authenticated for user:", user?.email);
      }
    }

    // Extraction des paramètres de la requête
    const { type, needId, offerId, recipientIds }: NotificationEmailRequest = await req.json();

    console.log(`Processing ${type} notification for need ${needId}`);

    // Récupération des détails du need
    const { data: need, error: needError } = await supabase
      .from("needs")
      .select("title, creator_id")
      .eq("id", needId)
      .single();

    if (needError || !need) {
      console.error("Need not found:", needError);
      throw new Error("Need not found");
    }

    // Récupération des détails de l'offre si applicable
    let offer = null;
    let vendor = null;
    if (offerId) {
      const { data: offerData } = await supabase
        .from("offers")
        .select("*, profiles:vendor_id(full_name, email)")
        .eq("id", offerId)
        .single();
      offer = offerData;
      vendor = offerData?.profiles;
    }

    // === DÉTERMINATION DES DESTINATAIRES ===
    let recipients: { email: string; name: string }[] = [];

    if (recipientIds && recipientIds.length > 0) {
      // Destinataires spécifiés
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("id", recipientIds);
      
      recipients = (profiles || [])
        .filter(p => p.email)
        .map(p => ({ email: p.email!, name: p.full_name || "Collaborateur" }));
    } else {
      // Tous les collaborateurs + créateur
      const { data: collaborations } = await supabase
        .from("collaborations")
        .select("user_id")
        .eq("need_id", needId);

      const userIds = (collaborations || []).map(c => c.user_id);
      
      const { data: collaboratorProfiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("id", userIds);

      const collaboratorEmails = (collaboratorProfiles || [])
        .filter(p => p.email)
        .map(p => ({ email: p.email!, name: p.full_name || "Collaborateur" }));

      // Ajout du créateur
      const { data: creator } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", need.creator_id)
        .single();

      if (creator?.email) {
        collaboratorEmails.push({ email: creator.email, name: creator.full_name || "Créateur" });
      }

      // Suppression des doublons
      recipients = collaboratorEmails.filter(
        (r, i, arr) => arr.findIndex(x => x.email === r.email) === i
      );
    }

    // Vérification qu'il y a des destinataires
    if (recipients.length === 0 && type !== "offer_accepted") {
      console.log("No recipients found with email addresses");
      return new Response(
        JSON.stringify({ message: "No recipients with email addresses" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === RÉCUPÉRATION DES CONTACTS POUR OFFRE ACCEPTÉE ===
    let collaboratorsList: Collaborator[] = [];
    if (type === "offer_accepted" && offerId) {
      // Récupération des collaborateurs qui acceptent d'être contactés
      const { data: collaborations } = await supabase
        .from("collaborations")
        .select("user_id, quantity")
        .eq("need_id", needId)
        .eq("wants_contact", true);

      if (collaborations && collaborations.length > 0) {
        const userIds = collaborations.map(c => c.user_id);
        const quantityMap = new Map(collaborations.map(c => [c.user_id, c.quantity]));
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, location_city")
          .in("id", userIds);

        collaboratorsList = (profiles || [])
          .filter(p => p.email)
          .map(p => ({
            name: p.full_name || "Collaborateur",
            email: p.email!,
            phone: p.phone || undefined,
            city: p.location_city || undefined,
            quantity: quantityMap.get(p.id) || 1,
          }));
      }

      // Ajout du créateur s'il accepte d'être contacté
      const { data: creator } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, location_city, wants_to_be_contacted")
        .eq("id", need.creator_id)
        .single();

      if (creator?.email && creator.wants_to_be_contacted !== false) {
        // Éviter les doublons
        if (!collaboratorsList.find(c => c.email === creator.email)) {
          collaboratorsList.push({
            name: creator.full_name || "Créateur",
            email: creator.email,
            phone: creator.phone || undefined,
            city: creator.location_city || undefined,
            quantity: 1,
          });
        }
      }
    }

    // === PRÉPARATION DES DONNÉES D'EMAIL ===
    const emailData = {
      needTitle: need.title,
      vendorName: vendor?.full_name || "Vendeur",
      priceTotal: offer?.price_total || 0,
      collaboratorName: recipientIds?.[0] ? "Un nouveau membre" : "",
      collaborators: collaboratorsList,
    };

    const template = getEmailTemplate(type, emailData);

    // === ENVOI DES EMAILS ===
    const emailPromises = recipients.map(recipient =>
      resend.emails.send({
        from: "CollabAchat <onboarding@resend.dev>",
        to: [recipient.email],
        subject: template.subject,
        html: template.html,
      })
    );

    // Email spécial au vendeur avec la liste des contacts
    if (type === "offer_accepted" && vendor?.email && collaboratorsList.length > 0) {
      const vendorTemplate = getEmailTemplate("offer_accepted_vendor", emailData);
      emailPromises.push(
        resend.emails.send({
          from: "CollabAchat <onboarding@resend.dev>",
          to: [vendor.email],
          subject: vendorTemplate.subject,
          html: vendorTemplate.html,
        })
      );
      console.log(`Sending vendor email to ${vendor.email} with ${collaboratorsList.length} collaborators`);
    }

    // Attente de tous les envois
    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successful} emails`,
        successful,
        failed,
        vendorNotified: type === "offer_accepted" && vendor?.email ? true : false,
        collaboratorsCount: collaboratorsList.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
