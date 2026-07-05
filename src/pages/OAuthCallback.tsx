import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { oauthService, OAuthProviders, type OAuthConfig } from "@/services/oauth.service";
import { useAuth } from "@/contexts/AuthContext";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connexion en cours…");

  useEffect(() => {
    const completeOAuth = async () => {
      const error = searchParams.get("error");
      if (error) {
        setStatus("error");
        setMessage(`Autorisation refusée : ${error}`);
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      if (!code || !state) {
        setStatus("error");
        setMessage("Paramètres OAuth manquants.");
        return;
      }

      if (!oauthService.validateState(state)) {
        setStatus("error");
        setMessage("Session OAuth invalide ou expirée.");
        return;
      }

      const providerKey = sessionStorage.getItem("oauth_provider") as keyof typeof OAuthProviders | null;
      const instanceId = sessionStorage.getItem("oauth_instance_id");

      if (!providerKey || !instanceId || !user?.id) {
        setStatus("error");
        setMessage("Contexte OAuth introuvable. Relancez la connexion depuis Intégrations.");
        return;
      }

      const config = OAuthProviders[providerKey] as OAuthConfig;
      if (!config?.client_id) {
        setStatus("error");
        setMessage(`Identifiants OAuth non configurés pour ${providerKey}.`);
        return;
      }

      try {
        const tokenResponse = await oauthService.exchangeCodeForToken(config, code);
        await oauthService.storeOAuthToken(instanceId, user.id, tokenResponse);
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_instance_id");
        sessionStorage.removeItem("oauth_state");
        setStatus("success");
        setMessage("Intégration connectée avec succès.");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Impossible de finaliser la connexion OAuth.");
      }
    };

    completeOAuth();
  }, [searchParams, user?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-4">
        {status === "loading" && <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />}
        {status === "success" && <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />}
        {status === "error" && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
        <p className="text-foreground">{message}</p>
        {status !== "loading" && (
          <Button onClick={() => navigate("/integrations")}>Retour aux intégrations</Button>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
