import AppLayout from "@/components/layout/AppLayout";
import { useAppointments, type AppointmentStatus } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { useDoctors } from "@/hooks/useDoctors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Calendar as CalIcon, Clock, Users, AlertTriangle,
  ChevronLeft, ChevronRight, List, LayoutGrid, Plus, Pencil, Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import AddAppointmentDialog from "@/components/dialogs/AddAppointmentDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import type { AppointmentForm } from "@/components/dialogs/AddAppointmentDialog";
import EmptyState from "@/components/EmptyState";

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmé", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Terminé", className: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "Annulé", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7);
const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const Appointments = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "day" | "week">("list");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { patients } = usePatients();
  const { doctors } = useDoctors();

  const filtered = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(search.toLowerCase())
  );

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, appointments]
  );

  const waitingQueue = appointments.filter((a) => a.date === selectedDate && a.status === "pending");

  const weekDates = useMemo(() => {
    const base = new Date(selectedDate);
    const dayOfWeek = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [selectedDate]);

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (view === "week" ? dir * 7 : dir));
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleAdd = (form: AppointmentForm) => {
    addAppointment({ patient_name: form.patientName, doctor_name: form.doctorName, date: form.date, time: form.time, type: form.type });
  };

  const handleEdit = (id: string, form: AppointmentForm) => {
    updateAppointment(id, { patient_name: form.patientName, doctor_name: form.doctorName, date: form.date, time: form.time, type: form.type });
  };

  return (
    <AppLayout title="Rendez-vous">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")}><List className="w-4 h-4" /></Button>
          <Button variant={view === "day" ? "default" : "outline"} size="icon" onClick={() => setView("day")}><CalIcon className="w-4 h-4" /></Button>
          <Button variant={view === "week" ? "default" : "outline"} size="icon" onClick={() => setView("week")}><LayoutGrid className="w-4 h-4" /></Button>
        </div>
        <AddAppointmentDialog onAdd={handleAdd} patients={patients.map(p => ({ id: p.id, name: p.name }))} doctors={doctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty }))} />
      </div>

      {view !== "list" && (
        <div className="flex items-center justify-between mb-6 bg-card rounded-xl p-3 border border-border">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-sm font-semibold text-foreground">
            {view === "week"
              ? `${weekDates[0]} — ${weekDates[5]}`
              : new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar"><CalIcon className="w-4 h-4 mr-1" />Calendrier</TabsTrigger>
            <TabsTrigger value="queue"><Clock className="w-4 h-4 mr-1" />File d'attente ({waitingQueue.length})</TabsTrigger>
            <TabsTrigger value="urgencies"><AlertTriangle className="w-4 h-4 mr-1" />Urgences</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            {view === "list" && (
              <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                {filtered.length === 0 ? (
                  appointments.length === 0 ? (
                    <EmptyState
                      icon={CalIcon}
                      title="Aucun rendez-vous planifié"
                      description="Organisez l'agenda de votre clinique : consultations, suivis, urgences. Basculez entre vue liste, jour et semaine."
                      tips={[
                        "Créez d'abord vos patients et médecins pour les sélectionner rapidement.",
                        "Les rendez-vous « En attente » alimentent la file d'attente du jour.",
                        "La vue semaine offre une lecture rapide de la charge par créneau horaire.",
                      ]}
                      action={<AddAppointmentDialog onAdd={handleAdd} patients={patients.map(p => ({ id: p.id, name: p.name }))} doctors={doctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty }))} />}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">Aucun rendez-vous ne correspond à votre recherche.</div>
                  )
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Patient</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Médecin</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date & Heure</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((a) => {
                          const sc = statusConfig[a.status];
                          return (
                            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-foreground">{a.patient_name}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{a.doctor_name}</td>
                              <td className="px-4 py-3 text-sm text-foreground">{a.date} à {a.time}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{a.type}</td>
                              <td className="px-4 py-3"><Badge variant="outline" className={sc.className}>{sc.label}</Badge></td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  <AddAppointmentDialog
                                    editData={{ patientName: a.patient_name, doctorName: a.doctor_name, date: a.date, time: a.time, type: a.type }}
                                    onEdit={(form) => handleEdit(a.id, form)}
                                    patients={patients.map(p => ({ id: p.id, name: p.name }))}
                                    doctors={doctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty }))}
                                    trigger={
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                    }
                                  />
                                  <DeleteConfirmDialog onConfirm={() => deleteAppointment(a.id)} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {view === "day" && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {HOURS.map((hour) => {
                  const hourAppts = todayAppointments.filter((a) => parseInt(a.time.split(":")[0]) === hour);
                  return (
                    <div key={hour} className="flex border-b border-border last:border-0 min-h-[60px]">
                      <div className="w-20 flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground bg-secondary/20 flex items-start pt-3">{hour}:00</div>
                      <div className="flex-1 p-1.5 flex flex-wrap gap-1.5">
                        {hourAppts.map((a) => {
                          const sc = statusConfig[a.status];
                          return (
                            <div key={a.id} className={`rounded-lg px-3 py-2 text-xs flex-1 min-w-[200px] border ${sc.className} group relative`}>
                              <p className="font-semibold">{a.time} — {a.patient_name}</p>
                              <p className="opacity-80">{a.doctor_name} · {a.type}</p>
                              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <AddAppointmentDialog
                                  editData={{ patientName: a.patient_name, doctorName: a.doctor_name, date: a.date, time: a.time, type: a.type }}
                                  onEdit={(form) => handleEdit(a.id, form)}
                                  patients={patients.map(p => ({ id: p.id, name: p.name }))}
                                  doctors={doctors.map(d => ({ id: d.id, name: d.name, specialty: d.specialty }))}
                                  trigger={<Button variant="ghost" size="icon" className="h-6 w-6"><Pencil className="w-3 h-3" /></Button>}
                                />
                                <DeleteConfirmDialog onConfirm={() => deleteAppointment(a.id)} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "week" && (
              <div className="bg-card rounded-xl border border-border overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 border-b border-border">
                    <div className="w-20" />
                    {weekDates.map((date, i) => (
                      <div key={date} className={`px-2 py-3 text-center text-xs font-medium border-l border-border ${date === selectedDate ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                        <div>{DAYS_OF_WEEK[i]}</div>
                        <div className="text-lg font-bold">{new Date(date).getDate()}</div>
                      </div>
                    ))}
                  </div>
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-7 border-b border-border last:border-0 min-h-[50px]">
                      <div className="w-20 px-2 py-1 text-xs text-muted-foreground bg-secondary/20 flex items-start pt-2">{hour}:00</div>
                      {weekDates.map((date) => {
                        const appts = appointments.filter((a) => a.date === date && parseInt(a.time.split(":")[0]) === hour);
                        return (
                          <div key={date} className="border-l border-border p-0.5">
                            {appts.map((a) => {
                              const sc = statusConfig[a.status];
                              return (
                                <div key={a.id} className={`rounded px-1.5 py-1 text-[10px] mb-0.5 border ${sc.className}`}>
                                  <span className="font-semibold">{a.time}</span> {a.patient_name.split(" ")[0]}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="queue">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">File d'attente — {selectedDate}</h3>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{waitingQueue.length} en attente</Badge>
              </div>
              {waitingQueue.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Aucun patient en attente</div>
              )}
              {waitingQueue.map((a, i) => (
                <div key={a.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-sm font-bold text-warning">{i + 1}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{a.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{a.time} — {a.type} avec {a.doctor_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Reporter</Button>
                    <Button size="sm" className="gradient-hero border-0">Appeler</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="urgencies">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Gestion des urgences</h3>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Consultation sans rendez-vous</h3>
                <p className="text-muted-foreground mb-4">Ajoutez un patient en urgence dans la file d'attente</p>
                <Button className="gradient-hero border-0 gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une urgence
                </Button>
              </div>
              <div className="bg-card rounded-xl p-5 border border-border">
                <h4 className="font-semibold text-foreground mb-3">Médecins disponibles maintenant</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {doctors.filter((d) => d.status === "active").map((d) => {
                    const initials = d.name.replace(/^Dr\.?\s*/i, "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                        <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-sm font-bold text-primary-foreground">{initials}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.specialty}</p>
                        </div>
                        <Badge className="ml-auto bg-success/10 text-success border-success/20" variant="outline">Libre</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default Appointments;
