import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Video, ArrowLeft, Calendar, User, Star } from "lucide-react";
import { telemedicineService, TelemedicineSessionListItem } from "@/services/telemedicine.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [session, setSession] = useState<TelemedicineSessionListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    telemedicineService
      .getSession(sessionId)
      .then(setSession)
      .catch(() => toast.error("Session introuvable"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleJoin = async () => {
    if (!sessionId) return;
    setJoining(true);
    try {
      const joinData = await telemedicineService.joinSession(sessionId);
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
    if (!sessionId || rating < 1) {
      toast.error("Veuillez sélectionner une note");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await telemedicineService.submitPatientFeedback(sessionId, rating, feedback);
      toast.success("Merci pour votre avis !");
      const updated = await telemedicineService.getSession(sessionId);
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
    <AppLayout title="Rejoindre la téléconsultation">
      <div className="max-w-lg mx-auto space-y-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="/telemedicine">
            <ArrowLeft className="w-4 h-4" />
            Retour aux sessions
          </Link>
        </Button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !session ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Session introuvable ou accès refusé.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Téléconsultation
              </CardTitle>
              <CardDescription>
                Connectez-vous à la salle vidéo sécurisée de votre consultation.
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
                    <Label className="mb-2 block">Comment s'est passée votre consultation ?</Label>
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
    </AppLayout>
  );
};

export default TelemedicineJoin;
