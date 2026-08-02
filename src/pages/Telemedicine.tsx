import AppLayout from "@/components/layout/AppLayout";

import { useState, useEffect } from "react";
import { Video, Calendar, Settings, Loader2, Plus, Search, Download, CheckCircle, XCircle, AlertCircle, Link2, Eye, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { telemedicineService, TelemedicineSessionListItem } from "@/services/telemedicine.service";
import type { TelemedicineSettings } from "@/types/phase1";

import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { toast } from "sonner";


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

interface EndSessionForm {
  clinical_notes: string;
  diagnosis: string;
  treatment_plan: string;
}

const emptyEndForm: EndSessionForm = {
  clinical_notes: "",
  diagnosis: "",
  treatment_plan: "",
};



const Telemedicine = () => {
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { user, hasRole } = useAuth();

  const { activeClinicId } = useClinic();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const telemedicineEnabled = isEnabled("telemedicine_enabled");
  const [sessions, setSessions] = useState<TelemedicineSessionListItem[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<TelemedicineSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const [endForm, setEndForm] = useState<EndSessionForm>(emptyEndForm);
  const [endingSession, setEndingSession] = useState(false);

  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [cancellingSession, setCancellingSession] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<TelemedicineSessionListItem | null>(null);

  useEffect(() => {
    loadSessions();
    loadSettings();
  }, [user, activeClinicId]);

  const loadSessions = async () => {
    try {
      if (!activeClinicId) return;
      const data = await telemedicineService.getClinicSessions(activeClinicId);
      setSessions(data);

    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Erreur lors du chargement des sessions");
    } finally {
      setLoading(false);
    }

  };

  const loadSettings = async () => {
    try {
      if (!activeClinicId) return;
      const data = await telemedicineService.getClinicSettings(activeClinicId);
      const merged = data ? { ...data, clinic_id: activeClinicId } : null;
      setSettingsDraft(merged);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!activeClinicId || !settingsDraft) return;
    setSavingSettings(true);
    try {
      await telemedicineService.updateClinicSettings(activeClinicId, {
        max_session_duration_minutes: settingsDraft.max_session_duration_minutes,
        buffer_time_minutes: settingsDraft.buffer_time_minutes,
        enable_recording: settingsDraft.enable_recording,
        enable_screen_sharing: settingsDraft.enable_screen_sharing,
        enable_chat: settingsDraft.enable_chat,
        enable_waiting_room: settingsDraft.enable_waiting_room,
        waiting_room_message: settingsDraft.waiting_room_message,
        preferred_video_quality: settingsDraft.preferred_video_quality,
      });
      toast.success("Paramètres enregistrés");
      loadSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      const doctor = doctors.find((d) => d.id === form.doctorId);
      
      if (!patient || !doctor) {
        toast.error("Patient ou médecin introuvable");
        return;
      }

      if (!activeClinicId) {
        toast.error("Aucune clinique sélectionnée");
        return;
      }

      await telemedicineService.createSession({
        patient_id: form.patientId,
        patient_name: patient.name,
        doctor_id: form.doctorId,
        doctor_name: doctor.name,
        scheduled_date: form.scheduledDate,
        scheduled_time: form.scheduledTime,
        duration: form.duration,
        reason: form.reason,
      }, activeClinicId);

      toast.success("Session créée avec succès");

      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);

      toast.error(error instanceof Error ? error.message : "Erreur lors de la création de la session");
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    setJoiningSession(sessionId);
    try {
      const joinData = await telemedicineService.joinSession(sessionId);
      telemedicineService.openVideoRoom(joinData);
      toast.success("Ouverture de la session vidéo...");
      loadSessions();
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la connexion à la session");

    } finally {
      setJoiningSession(null);
    }
  };


  const openEndDialog = (sessionId: string) => {
    setEndingSessionId(sessionId);
    setEndForm(emptyEndForm);
    setEndDialogOpen(true);
  };

  const handleEndSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endingSessionId) return;
    setEndingSession(true);
    try {
      await telemedicineService.endSession(endingSessionId, endForm);
      toast.success("Session terminée");
      setEndDialogOpen(false);
      setEndingSessionId(null);
      loadSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la terminaison de la session");
    } finally {
      setEndingSession(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!window.confirm("Annuler cette session de téléconsultation ?")) return;
    setCancellingSession(sessionId);
    try {
      await telemedicineService.cancelSession(sessionId);
      toast.success("Session annulée");
      loadSessions();
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'annulation");
    } finally {
      setCancellingSession(null);
    }
  };

  const copyPatientLink = async (sessionId: string) => {
    try {
      await navigator.clipboard.writeText(telemedicineService.getPatientJoinUrl(sessionId));
      toast.success("Lien patient copié dans le presse-papier");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.patient_name.toLowerCase().includes(search.toLowerCase()) ||
                         session.doctor_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    scheduled: { label: "Planifié", icon: Calendar, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    in_progress: { label: "En cours", icon: Video, className: "bg-success/10 text-success border-success/20" },
    completed: { label: "Terminé", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
    cancelled: { label: "Annulé", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    no_show: { label: "Absence", icon: UserX, className: "bg-muted text-muted-foreground border-border" },
    failed: { label: "Échoué", icon: AlertCircle, className: "bg-warning/10 text-warning border-warning/20" },
  };


  return (
    <AppLayout title="Télémédecine">
      {!flagsLoading && !telemedicineEnabled ? (
        <EmptyState
          icon={Video}
          title="Téléconsultation désactivée"
          description="Cette fonctionnalité est désactivée au niveau de la plateforme. Contactez l'administrateur Gesclic."
        />
      ) : (
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
                  <SelectItem value="no_show">Absence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une Session Vidéo</DialogTitle>
                  <DialogDescription>
                    Planifiez une téléconsultation entre un patient et un médecin.
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
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={form.scheduledDate}
                        onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure</Label>
                      <Input
                        type="time"
                        value={form.scheduledTime}
                        onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Durée (minutes)</Label>
                    <Select value={form.duration.toString()} onValueChange={(v) => setForm({ ...form, duration: parseInt(v) })}>
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
                    <Label>Raison</Label>
                    <Textarea
                      placeholder="Motif de la consultation..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Créer la Session</Button>
                </form>
              </DialogContent>
            </Dialog>

          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon={Video}
              title="Aucune session vidéo"

              description="Commencez par créer votre première session de télémédecine"

            />
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => {
                const config = statusConfig[session.status] || statusConfig.scheduled;
                const StatusIcon = config.icon;


                return (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-2">

                          <div className="flex items-center gap-2">
                            <Badge className={config.className}>

                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">

                              {session.scheduled_date} à {session.scheduled_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium">Patient: {session.patient_name}</span>
                            <span className="text-muted-foreground">Médecin: {session.doctor_name}</span>

                          </div>
                          {session.reason && (
                            <p className="text-sm text-muted-foreground">{session.reason}</p>
                          )}

                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["scheduled", "in_progress"].includes(session.status) && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinSession(session.id)}
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
                          {["scheduled", "in_progress"].includes(session.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyPatientLink(session.id)}
                              title="Copier le lien patient"
                            >
                              <Link2 className="w-4 h-4 mr-2" />
                              Lien patient
                            </Button>
                          )}
                          {session.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openEndDialog(session.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Terminer
                            </Button>
                          )}

                          {session.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelSession(session.id)}
                              disabled={cancellingSession === session.id}
                            >
                              {cancellingSession === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Annuler
                                </>
                              )}
                            </Button>
                          )}
                          {["completed", "no_show"].includes(session.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDetailSession(session)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Détails
                            </Button>
                          )}
                          {session.status === "completed" && session.recording_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(session.recording_url!, "_blank", "noopener,noreferrer")}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Enregistrement
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
          {settingsDraft ? (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de télémédecine</CardTitle>
                <CardDescription>
                  Configuration de la clinique pour les consultations vidéo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée max. session (minutes)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={240}
                      value={settingsDraft.max_session_duration_minutes}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          max_session_duration_minutes: parseInt(e.target.value) || 30,
                        })
                      }
                      disabled={!hasRole("admin")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tampon (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={settingsDraft.buffer_time_minutes}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          buffer_time_minutes: parseInt(e.target.value) || 5,
                        })
                      }
                      disabled={!hasRole("admin")}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "enable_screen_sharing" as const, label: "Partage d'écran" },
                    { key: "enable_chat" as const, label: "Chat texte" },
                    { key: "enable_waiting_room" as const, label: "Salle d'attente" },
                    { key: "enable_recording" as const, label: "Enregistrement (plan Daily payant)" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key}>{label}</Label>
                      <Switch
                        id={key}
                        checked={settingsDraft[key]}
                        onCheckedChange={(checked) =>
                          setSettingsDraft({ ...settingsDraft, [key]: checked })
                        }
                        disabled={!hasRole("admin")}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Qualité vidéo</Label>
                  <Select
                    value={settingsDraft.preferred_video_quality}
                    onValueChange={(v) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        preferred_video_quality: v as TelemedicineSettings["preferred_video_quality"],
                      })
                    }
                    disabled={!hasRole("admin")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">Standard (SD)</SelectItem>
                      <SelectItem value="hd">Haute définition (HD)</SelectItem>
                      <SelectItem value="fhd">Full HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message salle d&apos;attente</Label>
                  <Textarea
                    value={settingsDraft.waiting_room_message ?? ""}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, waiting_room_message: e.target.value })
                    }
                    disabled={!hasRole("admin")}
                    rows={3}
                  />
                </div>

                {hasRole("admin") ? (
                  <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sauvegarder les paramètres
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Seuls les administrateurs peuvent modifier ces paramètres.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState

              icon={Settings}
              title="Paramètres non configurés"
              description="Configurez les paramètres de télémédecine pour commencer"

            />
          )}
        </TabsContent>
      </Tabs>
      )}

      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Terminer la session</DialogTitle>
            <DialogDescription>
              Ajoutez les notes cliniques avant de clôturer la téléconsultation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEndSession} className="space-y-4">
            <div className="space-y-2">
              <Label>Notes cliniques</Label>
              <Textarea
                value={endForm.clinical_notes}
                onChange={(e) => setEndForm({ ...endForm, clinical_notes: e.target.value })}
                placeholder="Compte-rendu de la consultation..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Diagnostic</Label>
              <Input
                value={endForm.diagnosis}
                onChange={(e) => setEndForm({ ...endForm, diagnosis: e.target.value })}
                placeholder="Diagnostic..."
              />
            </div>
            <div className="space-y-2">
              <Label>Plan de traitement</Label>
              <Textarea
                value={endForm.treatment_plan}
                onChange={(e) => setEndForm({ ...endForm, treatment_plan: e.target.value })}
                placeholder="Traitement prescrit, suivi..."
                rows={3}
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={endingSession}>
              {endingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : "Terminer la session"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailSession} onOpenChange={(open) => !open && setDetailSession(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la session</DialogTitle>
            <DialogDescription>
              {detailSession?.scheduled_date} à {detailSession?.scheduled_time} — {detailSession?.patient_name}
            </DialogDescription>
          </DialogHeader>
          {detailSession && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Médecin</span>
                <span className="font-medium">{detailSession.doctor_name}</span>
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium">{statusConfig[detailSession.status]?.label ?? detailSession.status}</span>
              </div>
              {detailSession.reason && (
                <div>
                  <p className="text-muted-foreground mb-1">Motif</p>
                  <p>{detailSession.reason}</p>
                </div>
              )}
              {detailSession.clinical_notes && (
                <div>
                  <p className="text-muted-foreground mb-1">Notes cliniques</p>
                  <p className="whitespace-pre-wrap">{detailSession.clinical_notes}</p>
                </div>
              )}
              {detailSession.diagnosis && (
                <div>
                  <p className="text-muted-foreground mb-1">Diagnostic</p>
                  <p>{detailSession.diagnosis}</p>
                </div>
              )}
              {detailSession.treatment_plan && (
                <div>
                  <p className="text-muted-foreground mb-1">Plan de traitement</p>
                  <p className="whitespace-pre-wrap">{detailSession.treatment_plan}</p>
                </div>
              )}
              {!detailSession.clinical_notes && !detailSession.diagnosis && !detailSession.treatment_plan && (
                <p className="text-muted-foreground">Aucune note clinique enregistrée pour cette session.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default Telemedicine;
