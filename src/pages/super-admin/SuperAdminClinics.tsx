import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  Trash2,
  Eye,
  Edit,
  Crown,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

interface Clinic {
  id: string;
  name: string;
  plan: "free" | "standard" | "pro" | "enterprise";
  status: "active" | "suspended" | "pending";
  created_at: string;
  user_count: number;
  appointment_count: number;
  revenue: number;
  country: string;
  email: string;
}

const SuperAdminClinics = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Mock data for user_count, appointment_count, revenue
      const enrichedClinics = (data || []).map((clinic: any) => ({
        ...clinic,
        user_count: Math.floor(Math.random() * 50) + 5,
        appointment_count: Math.floor(Math.random() * 500) + 50,
        revenue: Math.floor(Math.random() * 200000) + 10000,
        country: "Côte d'Ivoire",
        email: `contact@${clinic.name.toLowerCase().replace(/\s+/g, "-")}.com`,
      })) as Clinic[];

      setClinics(enrichedClinics);
    } catch (error) {
      console.error("Error loading clinics:", error);
      toast.error("Erreur lors du chargement des cliniques");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendClinic = async (clinicId: string) => {
    try {
      const { error } = await supabase
        .from("clinics")
        .update({ status: "suspended" })
        .eq("id", clinicId);

      if (error) throw error;

      toast.success("Clinique suspendue");
      loadClinics();
    } catch (error) {
      console.error("Error suspending clinic:", error);
      toast.error("Erreur lors de la suspension");
    }
  };

  const handleActivateClinic = async (clinicId: string) => {
    try {
      const { error } = await supabase
        .from("clinics")
        .update({ status: "active" })
        .eq("id", clinicId);

      if (error) throw error;

      toast.success("Clinique activée");
      loadClinics();
    } catch (error) {
      console.error("Error activating clinic:", error);
      toast.error("Erreur lors de l'activation");
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    try {
      const { error } = await supabase
        .from("clinics")
        .delete()
        .eq("id", clinicId);

      if (error) throw error;

      toast.success("Clinique supprimée");
      loadClinics();
    } catch (error) {
      console.error("Error deleting clinic:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredClinics = clinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(search.toLowerCase()) ||
      clinic.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || clinic.status === statusFilter;
    const matchesPlan = planFilter === "all" || clinic.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const planConfig = {
    free: { label: "Gratuit", color: "bg-slate-500" },
    standard: { label: "Standard", color: "bg-blue-500" },
    pro: { label: "Pro", color: "bg-purple-500" },
    enterprise: { label: "Entreprise", color: "bg-amber-500" },
  };

  const statusConfig = {
    active: { label: "Actif", icon: CheckCircle, color: "bg-success/10 text-success border-success/20" },
    suspended: { label: "Suspendu", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
    pending: { label: "En attente", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clinics Management</h1>
            <p className="text-muted-foreground">
              Gérez toutes les cliniques de la plateforme ({clinics.length} cliniques)
            </p>
          </div>
          <Button className="gradient-hero border-0">
            <Building2 className="w-4 h-4 mr-2" />
            Nouvelle Clinique
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une clinique..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les plans</SelectItem>
                  <SelectItem value="free">Gratuit</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Entreprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cliniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clinics.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {clinics.filter((c) => c.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suspendues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {clinics.filter((c) => c.status === "suspended").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenu Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clinics.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clinics List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Cliniques</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClinics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune clinique trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClinics.map((clinic) => {
                  const planInfo = planConfig[clinic.plan];
                  const statusInfo = statusConfig[clinic.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={clinic.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                          {clinic.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{clinic.name}</h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{clinic.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {clinic.user_count} utilisateurs
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {clinic.appointment_count} RDV
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {clinic.revenue.toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={planInfo.color}>{planInfo.label}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedClinic(clinic); setDetailDialogOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {clinic.status === "active" ? (
                              <DropdownMenuItem onClick={() => handleSuspendClinic(clinic.id)} className="text-destructive">
                                <Ban className="w-4 h-4 mr-2" />
                                Suspendre
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateClinic(clinic.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteClinic(clinic.id)}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              }
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinic Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la Clinique</DialogTitle>
            </DialogHeader>
            {selectedClinic && (
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="users">Utilisateurs</TabsTrigger>
                  <TabsTrigger value="billing">Facturation</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-bold">
                        {selectedClinic.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedClinic.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedClinic.email}</p>
                        <Badge className={planConfig[selectedClinic.plan].color} className="mt-1">
                          {planConfig[selectedClinic.plan].label}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <Users className="w-5 h-5 text-primary mb-2" />
                          <p className="text-2xl font-bold">{selectedClinic.user_count}</p>
                          <p className="text-xs text-muted-foreground">Utilisateurs</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <Calendar className="w-5 h-5 text-primary mb-2" />
                          <p className="text-2xl font-bold">{selectedClinic.appointment_count}</p>
                          <p className="text-xs text-muted-foreground">Rendez-vous</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <CreditCard className="w-5 h-5 text-primary mb-2" />
                          <p className="text-2xl font-bold">{selectedClinic.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">FCFA Revenu</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <TrendingUp className="w-5 h-5 text-primary mb-2" />
                          <p className="text-2xl font-bold">+12%</p>
                          <p className="text-xs text-muted-foreground">Croissance</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="users">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Liste des utilisateurs de la clinique</p>
                  </div>
                </TabsContent>
                <TabsContent value="billing">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Historique de facturation</p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminClinics;
