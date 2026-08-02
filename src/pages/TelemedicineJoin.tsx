import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Video, Calendar, User, Star } from "lucide-react";
import { telemedicineService, TelemedicineSessionListItem } from "@/services/telemedicine.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/Logo_Gesclic.png";

const statusLabels: Record<string, string> = {
  scheduled: "Planifiée",
  waiting: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "Absence",
};

const TelemedicineJoin = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [session, setSession] = useState<TelemedicineSessionListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!sessionId || !token) {
      setLoading(false);
      return;
    }
    telemedicineService
      .getGuestSession(sessionId, token)
      .then(setSession)
      .catch(() => toast.error("Lien invalide ou expiré"))
      .finally(() => setLoading(false));
  }, [sessionId, token]);

  const handleJoin = async () => {
    if (!sessionId || !token) return;
    setJoining(true);
    try {
      const joinData = await telemedicineService.guestJoinSession(sessionId, token);
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
    if (!sessionId || !token || rating < 1) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await telemedicineService.guestSubmitFeedback(sessionId, token, rating, feedback);
      toast.success("Merci pour votre avis !");
      const updated = await telemedicineService.getGuestSession(sessionId, token);
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
          {!token ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Lien incomplet. Utilisez le lien reçu par votre clinique (avec code d&apos;accès).
              </CardContent>
            </Card>
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
