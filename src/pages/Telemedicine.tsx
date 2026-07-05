import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Video, Calendar, Users, Clock, Play, Settings, Loader2, Plus, Search, Filter, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { telemedicineService } from "@/services/telemedicine.service";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
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

const Telemedicine = () => {
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [sessions, setSessions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [joiningSession, setJoiningSession] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    loadSettings();
  }, [user, activeClinicId]);

  const loadSessions = async () => {
    try {
      if (!user) return;
      const data = await telemedicineService.getUpcomingSessions(user.id);
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
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
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

      await telemedicineService.createSession({
        patient_id: form.patientId,
        patient_name: patient.name,
        doctor_id: form.doctorId,
        doctor_name: doctor.name,
        scheduled_date: form.scheduledDate,
        scheduled_time: form.scheduledTime,
        duration: form.duration,
        reason: form.reason,
      });

      toast.success("Session créée avec succès");
      setCreateDialogOpen(false);
      setForm(emptyForm);
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Erreur lors de la création de la session");
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    setJoiningSession(sessionId);
    try {
      const token = await telemedicineService.joinSession(sessionId);
      // In a real implementation, this would redirect to the video room
      toast.success("Rejoindre la session vidéo...");
      // window.location.href = `/telemedicine/room/${sessionId}?token=${token}`;
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Erreur lors de la connexion à la session");
    } finally {
      setJoiningSession(null);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await telemedicineService.endSession(sessionId);
      toast.success("Session terminée");
      loadSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Erreur lors de la terminaison de la session");
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
    failed: { label: "Échoué", icon: AlertCircle, className: "bg-warning/10 text-warning border-warning/20" },
  };

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
                        <div className="flex gap-2">
                          {session.status === "scheduled" && (
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
                          {session.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleEndSession(session.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Terminer
                            </Button>
                          )}
                          {session.status === "completed" && session.recording_url && (
                            <Button size="sm" variant="outline">
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
          {settings ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>API Key Daily.co</Label>
                  <Input
                    type="password"
                    value={settings.daily_api_key || ""}
                    placeholder="Entrez votre clé API Daily.co"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée par défaut (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.default_duration || 30}
                    placeholder="30"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enregistrer automatiquement les sessions</Label>
                  <Select value={settings.auto_record ? "true" : "false"} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Sauvegarder les paramètres</Button>
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
    </AppLayout>
  );
};

export default Telemedicine;
