import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      diagnostic: `Tu es un assistant médical IA spécialisé dans l'aide au diagnostic. Tu aides les médecins à analyser les symptômes et suggérer des pistes diagnostiques.

IMPORTANT: Tu ne poses PAS de diagnostic définitif. Tu fournis des pistes et suggestions pour aider le médecin dans sa réflexion clinique.

Format de réponse:
1. **Analyse des symptômes** : résumé structuré
2. **Diagnostics possibles** : liste ordonnée par probabilité avec justification
3. **Examens recommandés** : pour confirmer/infirmer
4. **Signaux d'alerte** : à surveiller

Réponds toujours en français. Sois concis mais complet.`,

      summary: `Tu es un assistant médical IA spécialisé dans le résumé de dossiers médicaux. Tu synthétises les informations médicales de manière claire et structurée pour les professionnels de santé.

Format de réponse:
1. **Résumé patient** : informations clés
2. **Historique** : chronologie des consultations
3. **Traitements en cours** : liste avec posologie
4. **Points d'attention** : alertes et suivis nécessaires

Réponds toujours en français. Sois concis et cliniquement pertinent.`,
    };

    const systemMessage = systemPrompts[mode] || systemPrompts.diagnostic;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un instant." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des crédits dans les paramètres." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("medical-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
