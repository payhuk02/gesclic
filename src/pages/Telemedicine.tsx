import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Video,
  Calendar,
  Settings as SettingsIcon,
  Loader2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  telemedicineService,
  type TelemedicineSessionRow,
  type JoinResult,
} from "@/services/telemedicine.service";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/EmptyState";

interface SessionForm {
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  reason: string;
}

const emptyForm: SessionForm = {
  patientId: "",
  doctorId: "",
  scheduledDate: new Date().toISOString().split("T")[0],
  scheduledTime: "09:00",
  duration: 30,
  reason: "",
};

const statusConfig: Record<string, { label: string; icon: typeof Video; className: string }> = {
  scheduled: { label: "Planifié", icon: Calendar, className: "bg-primary/10 text-primary border-primary/20" },
  waiting: { label: "En attente", icon: Clock, className: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "En cours", icon: Video, className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Terminé", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Annulé", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  no_show: { label: "Absent", icon: Ban, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s.toString().padStart(2, "0")}s`;
};

const Telemedicine = () => {
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { user } = useAuth();
  const { activeClinicId, activeRole } = useClinic();

  const isAdmin = activeRole === "admin";

  const [sessions, setSessions] = useState<TelemedicineSessionRow[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ session: TelemedicineSessionRow; join: JoinResult } | null>(null);
  const [endTarget, setEndTarget] = useState<TelemedicineSessionRow | null>(null);
  const [endForm, setEndForm] = useState({ clinical_notes: "", diagnosis: "", treatment_plan: "" });
  const [endingSession, setEndingSession] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!activeClinicId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSessions(await telemedicineService.getClinicSessions(activeClinicId));
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Erreur lors du chargement des sessions");
    } finally {
      setLoading(false);
    }
  }, [activeClinicId]);

  const loadSettings = useCallback(async () => {
    if (!activeClinicId) return;
    try {
      const data = await telemedicineService.getClinicSettings(activeClinicId);
      setSettings(data as unknown as Record<string, unknown> | null);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, [activeClinicId]);

  useEffect(() => {
    loadSessions();
    loadSettings();
  }, [loadSessions, loadSettings]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeClinicId) {
      toast.error("Aucune clinique active");
      return;
    }
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = doctors.find((d) => d.id === form.doctorId);
    if (!patient) {
      toast.error("Sélectionnez un patient");
      return;
    }
    if (!doctor) {
      toast.error("Sélectionnez un médecin");
      return;
    }

    setCreating(true);
    let appointmentId: string | null = null;
    try {
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          clinic_id: activeClinicId,
          patient_id: form.patientId,
          patient_name: patient.name,
          doctor_name: doctor.name,
          date: form.scheduledDate,
          time: form.scheduledTime,
          type: "teleconsultation",
          status: "scheduled",
        })
        .select("id")
        .single();

      if (apptError) throw apptError;
      appointmentId = appointment.id;

      await telemedicineService.createSession({
        appointmentId: appointment.id,
        clinicId: activeClinicId,
        patientId: form.patientId,
        doctorId: form.doctorId,
        providerId: user.id,
        scheduledStart: new Date(`${form.scheduledDate}T${form.scheduledTime}:00`),
        durationMinutes: form.duration,
        reason: form.reason,
      });

      toast.success("Session de téléconsultation créée");
      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      // Roll back the orphan appointment if the session could not be created
      if (appointmentId) {
        await supabase.from("appointments").delete().eq("id", appointmentId);
      }
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création de la session",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSession = async (session: TelemedicineSessionRow) => {
    setJoiningSession(session.id);
    try {
      const join = await telemedicineService.joinSession(session.id);
      setActiveCall({ session, join });
      loadSessions();
    } catch (error) {
      console.error("Error joining session:", error);
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("DAILY") || message.includes("Daily")
          ? "Clé API Daily.co manquante : configurez-la pour lancer la vidéo."
          : message || "Erreur lors de la connexion à la session",
      );
    } finally {
      setJoiningSession(null);
    }
  };

  const handleEndSession = async () => {
    if (!endTarget) return;
    setEndingSession(true);
    try {
      await telemedicineService.endSession(endTarget.id, endForm);
      toast.success("Session terminée");
      setEndTarget(null);
      setEndForm({ clinical_notes: "", diagnosis: "", treatment_plan: "" });
      setActiveCall(null);
      loadSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Erreur lors de la clôture de la session");
    } finally {
      setEndingSession(false);
    }
  };

  const handleCancelSession = async (session: TelemedicineSessionRow) => {
    try {
      await telemedicineService.cancelSession(session.id);
      toast.success("Session annulée");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleSaveSettings = async () => {
    if (!activeClinicId || !settings) return;
    setSavingSettings(true);
    try {
      const updated = await telemedicineService.updateClinicSettings(activeClinicId, {
        enable_video: settings.enable_video as boolean,
        enable_recording: settings.enable_recording as boolean,
        require_consent_for_recording: settings.require_consent_for_recording as boolean,
        enable_screen_sharing: settings.enable_screen_sharing as boolean,
        enable_chat: settings.enable_chat as boolean,
        enable_waiting_room: settings.enable_waiting_room as boolean,
        max_session_duration_minutes: Number(settings.max_session_duration_minutes) || 30,
        buffer_time_minutes: Number(settings.buffer_time_minutes) || 5,
        preferred_video_quality: settings.preferred_video_quality as string,
        waiting_room_message: settings.waiting_room_message as string,
      } as never);
      setSettings(updated as unknown as Record<string, unknown>);
      toast.success("Paramètres enregistrés");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Enregistrement impossible (réservé aux administrateurs)");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const patientName = session.patients?.name?.toLowerCase() ?? "";
      const doctorName = session.doctors?.name?.toLowerCase() ?? "";
      const matchesSearch =
        !q || patientName.includes(q) || doctorName.includes(q) || (session.reason ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const setSetting = (key: string, value: unknown) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <AppLayout title="Télémédecine">
      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="sessions">Sessions Vidéo</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="scheduled">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Session
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon={Video}
              title="Aucune session vidéo"
              description={
                sessions.length === 0
                  ? "Commencez par créer votre première session de télémédecine"
                  : "Aucune session ne correspond à votre recherche"
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                const config = statusConfig[session.status] || statusConfig.scheduled;
                const StatusIcon = config.icon;
                const duration = formatDuration(session.duration_seconds);
                return (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={config.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(session.scheduled_start)}
                            </span>
                            {duration && (
                              <span className="text-sm text-muted-foreground">• Durée : {duration}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="font-medium">
                              Patient : {session.patients?.name ?? "—"}
                            </span>
                            <span className="text-muted-foreground">
                              Médecin : {session.doctors?.name ?? "—"}
                            </span>
                          </div>
                          {session.reason && (
                            <p className="text-sm text-muted-foreground">{session.reason}</p>
                          )}
                          {session.status === "completed" && session.diagnosis && (
                            <p className="text-sm">
                              <span className="font-medium">Diagnostic :</span> {session.diagnosis}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {(session.status === "scheduled" ||
                            session.status === "waiting" ||
                            session.status === "in_progress") && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinSession(session)}
                              disabled={joiningSession === session.id}
                            >
                              {joiningSession === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Video className="w-4 h-4 mr-2" />
                                  Rejoindre
                                </>
                              )}
                            </Button>
                          )}
                          {session.status === "in_progress" && (
                            <Button size="sm" variant="destructive" onClick={() => setEndTarget(session)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Terminer
                            </Button>
                          )}
                          {(session.status === "scheduled" || session.status === "waiting") && (
                            <Button size="sm" variant="outline" onClick={() => handleCancelSession(session)}>
                              <Ban className="w-4 h-4 mr-2" />
                              Annuler
                            </Button>
                          )}
                          {session.status === "completed" && session.recording_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={session.recording_url} target="_blank" rel="noreferrer">
                                Enregistrement
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {settings ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                {!isAdmin && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    Seuls les administrateurs de la clinique peuvent modifier ces paramètres.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["enable_video", "Activer la vidéo"],
                    ["enable_recording", "Enregistrement des sessions"],
                    ["require_consent_for_recording", "Consentement requis pour l'enregistrement"],
                    ["enable_screen_sharing", "Partage d'écran"],
                    ["enable_chat", "Chat en session"],
                    ["enable_waiting_room", "Salle d'attente"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor={key}>{label}</Label>
                      <Switch
                        id={key}
                        checked={Boolean(settings[key])}
                        disabled={!isAdmin}
                        onCheckedChange={(v) => setSetting(key, v)}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Durée max. (minutes)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={240}
                      value={Number(settings.max_session_duration_minutes) || 30}
                      disabled={!isAdmin}
                      onChange={(e) => setSetting("max_session_duration_minutes", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temps tampon (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={Number(settings.buffer_time_minutes) || 0}
                      disabled={!isAdmin}
                      onChange={(e) => setSetting("buffer_time_minutes", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualité vidéo</Label>
                    <Select
                      value={(settings.preferred_video_quality as string) || "hd"}
                      disabled={!isAdmin}
                      onValueChange={(v) => setSetting("preferred_video_quality", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sd">SD</SelectItem>
                        <SelectItem value="hd">HD</SelectItem>
                        <SelectItem value="full_hd">Full HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message de la salle d'attente</Label>
                  <Textarea
                    value={(settings.waiting_room_message as string) || ""}
                    disabled={!isAdmin}
                    onChange={(e) => setSetting("waiting_room_message", e.target.value)}
                  />
                </div>

                <Button onClick={handleSaveSettings} disabled={!isAdmin || savingSettings}>
                  {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Sauvegarder les paramètres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={SettingsIcon}
              title="Paramètres non disponibles"
              description="Sélectionnez une clinique active pour configurer la télémédecine"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Création de session */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une Session Vidéo</DialogTitle>
            <DialogDescription>
              Un rendez-vous de type téléconsultation est créé automatiquement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Médecin</Label>
              <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {doctors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun médecin enregistré : ajoutez-en un depuis la page Personnel.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  required
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  required
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Select
                value={form.duration.toString()}
                onValueChange={(v) => setForm({ ...form, duration: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Textarea
                placeholder="Motif de la consultation..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer la Session
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Salle vidéo */}
      <Dialog open={!!activeCall} onOpenChange={(open) => !open && setActiveCall(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Consultation vidéo — {activeCall?.session.patients?.name ?? ""}
            </DialogTitle>
            <DialogDescription>
              Autorisez l'accès à la caméra et au microphone pour démarrer.
            </DialogDescription>
          </DialogHeader>
          {activeCall && (
            <div className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <iframe
                  title="Salle de téléconsultation"
                  src={`${activeCall.join.room_url}?t=${activeCall.join.token}`}
                  allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
                  className="h-full w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveCall(null)}>
                  Quitter
                </Button>
                <Button variant="destructive" onClick={() => setEndTarget(activeCall.session)}>
                  Terminer la session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clôture de session */}
      <Dialog open={!!endTarget} onOpenChange={(open) => !open && setEndTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Terminer la session</DialogTitle>
            <DialogDescription>Renseignez le compte-rendu de la consultation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnostic</Label>
              <Input
                value={endForm.diagnosis}
                onChange={(e) => setEndForm({ ...endForm, diagnosis: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Plan de traitement</Label>
              <Textarea
                value={endForm.treatment_plan}
                onChange={(e) => setEndForm({ ...endForm, treatment_plan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes cliniques</Label>
              <Textarea
                value={endForm.clinical_notes}
                onChange={(e) => setEndForm({ ...endForm, clinical_notes: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleEndSession} disabled={endingSession}>
              {endingSession && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Clôturer la session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Telemedicine;
