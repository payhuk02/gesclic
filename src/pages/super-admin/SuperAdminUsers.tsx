import { useState, useEffect } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  Ban,
  Trash2,
  Eye,
  Mail,
  Building2,
  Calendar,
  Crown,
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { invokeAdminUsers, pickAppRole } from "@/lib/admin-db";

type AppRole = "super_admin" | "admin" | "medecin" | "secretaire" | "infirmier";

interface PlatformUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
  clinic_name: string | null;
  created_at: string;
  last_sign_in: string | null;
  status: "active" | "suspended";
}

const SuperAdminUsers = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);



  useEffect(() => {
    loadUsers();
  }, []);


  const loadUsers = async () => {
    try {
      setLoading(true);
      const payload = await invokeAdminUsers({ action: "list" }) as {
        users?: Array<{
          id: string;
          email: string | null;
          full_name: string | null;
          clinic_name: string | null;
          created_at: string;
          last_sign_in_at: string | null;
          suspended: boolean;
          roles: string[];
        }>;
      };

      const enrichedUsers: PlatformUser[] = (payload.users ?? [])
        .map((user) => ({
          id: user.id,
          email: user.email || "—",
          full_name: user.full_name,
          role: pickAppRole(user.roles ?? []),
          clinic_name: user.clinic_name,
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at,
          status: user.suspended ? "suspended" : "active",
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUsers(enrichedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const runUserAction = async (action: string, userId: string, successMessage: string) => {
    try {
      await invokeAdminUsers({ action, userId });
      toast.success(successMessage);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    }
  };

  const handleSuspendUser = async (userId: string) => {
    await runUserAction("suspend", userId, "Utilisateur suspendu");
  };

  const handleActivateUser = async (userId: string) => {
    await runUserAction("activate", userId, "Utilisateur activé");
  };

  const handleDeleteUser = async (userId: string) => {
    await runUserAction("delete", userId, "Utilisateur supprimé");
  };


  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleConfig = {
    super_admin: { label: "Super Admin", color: "bg-purple-500" },
    admin: { label: "Admin", color: "bg-blue-500" },
    medecin: { label: "Médecin", color: "bg-green-500" },
    secretaire: { label: "Secrétaire", color: "bg-orange-500" },
    infirmier: { label: "Infirmier", color: "bg-cyan-500" },
  };

  const statusConfig = {
    active: { label: "Actif", color: "bg-success/10 text-success border-success/20" },
    suspended: { label: "Suspendu", color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Users</h1>
            <p className="text-muted-foreground">
              Gérez tous les utilisateurs de la plateforme ({users.length} utilisateurs)
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="medecin">Médecin</SelectItem>
                  <SelectItem value="secretaire">Secrétaire</SelectItem>
                  <SelectItem value="infirmier">Infirmier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u) => u.role === "super_admin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u) => u.role === "admin").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Médecins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.role === "medecin").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const roleInfo = user.role ? roleConfig[user.role] : undefined;
                  const statusInfo = statusConfig[user.status];

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                          {user.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{user.full_name || "Utilisateur"}</h3>
                            {user.role === "super_admin" && (
                              <Crown className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {user.clinic_name || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleInfo?.color ?? "bg-slate-500"}>
                          {roleInfo?.label ?? "Sans rôle"}
                        </Badge>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailDialogOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            {user.status === "active" ? (
                              <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className="text-destructive">
                                <Ban className="w-4 h-4 mr-2" />
                                Suspendre
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                                <Shield className="w-4 h-4 mr-2" />
                                Activer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DeleteConfirmDialog
                              onConfirm={() => handleDeleteUser(user.id)}
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

        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails de l'Utilisateur</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-bold">
                    {selectedUser.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.full_name || "Utilisateur"}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>

                    <Badge className={`${(selectedUser.role ? roleConfig[selectedUser.role].color : "bg-slate-500")} mt-1`}>
                      {selectedUser.role ? roleConfig[selectedUser.role].label : "Sans rôle"}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Clinique</p>
                    <p className="font-medium">{selectedUser.clinic_name || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <p className="font-medium">{statusConfig[selectedUser.status].label}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Dernière connexion</p>
                    <p className="font-medium">
                      {selectedUser.last_sign_in 
                        ? new Date(selectedUser.last_sign_in).toLocaleDateString() 
                        : "Jamais"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>


      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminUsers;
