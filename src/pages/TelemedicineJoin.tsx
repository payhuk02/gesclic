import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Video, Calendar, User, Star } from "lucide-react";
import {
  telemedicineService,
  TelemedicineSessionListItem,
  GuestJoinAuth,
} from "@/services/telemedicine.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/Logo_Gesclic.png";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f-]{36}$/i;

const statusLabels: Record<string, string> = {
  scheduled: "Planifiée",
  waiting: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "Absence",
};

const TelemedicineJoin = () => {
  const { joinCode, sessionId, token: tokenParam } = useParams<{
    joinCode?: string;
    sessionId?: string;
    token?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromQuery = searchParams.get("token") ?? "";
  const legacyToken = tokenParam ?? tokenFromQuery;

  const auth = useMemo((): GuestJoinAuth | null => {
    if (joinCode) {
      return { mode: "code", code: joinCode };
    }
    if (sessionId && legacyToken && UUID_RE.test(legacyToken)) {
      return { mode: "legacy", sessionId, token: legacyToken };
    }
    return null;
  }, [joinCode, sessionId, legacyToken]);

  const [session, setSession] = useState<TelemedicineSessionListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingLink, setResolvingLink] = useState(!auth && !!sessionId && !joinCode);
  const [joining, setJoining] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (auth || joinCode || !sessionId) {
      setResolvingLink(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session) {
          if (!cancelled) setResolvingLink(false);
          return;
        }

        const { data, error } = await supabase
          .from("telemedicine_sessions")
          .select("patient_join_code")
          .eq("id", sessionId)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data?.patient_join_code) {
          navigate(`/t/${data.patient_join_code}`, { replace: true });
          return;
        }
      } finally {
        if (!cancelled) setResolvingLink(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth, joinCode, sessionId, navigate]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    setLoading(true);
    telemedicineService
      .getGuestSessionAuth(auth)
      .then(setSession)
      .catch(() => toast.error("Lien invalide ou expiré"))
      .finally(() => setLoading(false));
  }, [auth]);

  const handleJoin = async () => {
    if (!auth) return;
    setJoining(true);
    try {
      const joinData = await telemedicineService.guestJoinAuth(auth);
      telemedicineService.openVideoRoom(joinData);
      toast.success("Ouverture de la salle vidéo...");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de rejoindre la session");
    } finally {
      setJoining(false);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || rating < 1) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await telemedicineService.guestSubmitFeedbackAuth(auth, rating, feedback);
      toast.success("Merci pour votre avis !");
      const updated = await telemedicineService.getGuestSessionAuth(auth);
      setSession(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer l'avis");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const canJoin = session && ["scheduled", "waiting", "in_progress"].includes(session.status);
  const canFeedback =
    session &&
    ["completed", "no_show"].includes(session.status) &&
    !session.patient_rating;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src={logo} alt="Gesclic" className="h-8 w-auto" />
          <span className="text-sm text-muted-foreground">Téléconsultation sécurisée</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          {!auth ? (
            resolvingLink || loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                  <p>Lien incomplet ou invalide.</p>
                  <p className="text-sm">
                    Demandez à votre clinique le lien court via le bouton « Lien patient »
                    (format : …/t/votre-code).
                  </p>
                </CardContent>
              </Card>
            )
          ) : loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !session ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Lien invalide ou session introuvable.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Votre téléconsultation
                </CardTitle>
                <CardDescription>
                  Aucun compte Gesclic requis — cliquez ci-dessous pour rejoindre la salle vidéo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{statusLabels[session.status] ?? session.status}</Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {session.scheduled_date} à {session.scheduled_time}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Patient :</span> {session.patient_name}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Médecin :</span> {session.doctor_name}
                  </p>
                  {session.reason && (
                    <p className="text-muted-foreground">Motif : {session.reason}</p>
                  )}
                </div>

                {canJoin && (
                  <Button className="w-full" onClick={handleJoin} disabled={joining}>
                    {joining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Rejoindre la salle vidéo
                      </>
                    )}
                  </Button>
                )}

                {!canJoin && !canFeedback && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {session.patient_rating
                      ? "Merci, votre avis a déjà été enregistré."
                      : "Cette session n'est plus disponible."}
                  </p>
                )}

                {canFeedback && (
                  <form onSubmit={handleFeedback} className="space-y-4 pt-2 border-t border-border">
                    <div>
                      <Label className="mb-2 block">Comment s&apos;est passée votre consultation ?</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            aria-label={`Note ${value}`}
                          >
                            <Star
                              className={cn(
                                "w-7 h-7",
                                value <= rating ? "fill-warning text-warning" : "text-muted-foreground",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Commentaire (optionnel)</Label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Partagez votre expérience..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submittingFeedback || rating < 1}>
                      {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer mon avis"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TelemedicineJoin;
