import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Copy, Download, RefreshCw, Loader2, QrCode, Smartphone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { securityService } from "@/services/security.service";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

const Security = () => {
  const { user } = useAuth();
  const { activeClinicId } = useClinic();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<any>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<"verify" | "backup">("verify");
  const [verifyCode, setVerifyCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, [user, activeClinicId]);

  const loadSecurityData = async () => {
    if (!user || !activeClinicId) return;
    
    try {
      setLoading(true);
      const [enabled, logs, events] = await Promise.all([
        securityService.isMFAEnabled(user.id),
        securityService.getAuditLogs(activeClinicId, 50),
        securityService.getSecurityEvents(activeClinicId),
      ]);
      
      setMfaEnabled(enabled);
      setAuditLogs(logs);
      setSecurityEvents(events);
    } catch (error) {
      console.error("Error loading security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    if (!user) return;

    try {
      console.log("Starting MFA setup for user:", user.id);
      const setup = await securityService.enableMFA('totp');
      console.log("MFA setup response:", setup);
      setMfaSetup(setup);
      setBackupCodes(setup.backup_codes || []);
      setSetupStep("verify");
      toast.success("Configuration MFA initialisée");
    } catch (error: any) {
      console.error("Error setting up MFA:", error);
      console.error("Error details:", error.message);
      toast.error(`Erreur lors de la configuration MFA: ${error.message}`);
    }
  };

  const handleVerifyMFA = async () => {
    if (!user || !mfaSetup) return;

    try {
      const verified = await securityService.verifyMFA(user.id, verifyCode, true);
      if (verified) {
        toast.success("MFA activé avec succès");
        setMfaEnabled(true);
        setMfaSetup(null);
        setVerifyCode("");
        loadSecurityData();
      } else {
        toast.error("Code incorrect");
      }
    } catch (error) {
      console.error("Error verifying MFA:", error);
      toast.error("Erreur lors de la vérification");
    }
  };

  const handleDisableMFA = async () => {
    if (!user) return;
    
    try {
      await securityService.disableMFA(user.id, verifyCode);
      toast.success("MFA désactivé");
      setMfaEnabled(false);
      setVerifyCode("");
      loadSecurityData();
    } catch (error) {
      console.error("Error disabling MFA:", error);
      toast.error("Erreur lors de la désactivation");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gesclic-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Codes de backup téléchargés");
  };

  const severityConfig: Record<string, { label: string; className: string }> = {
    low: { label: "Faible", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    medium: { label: "Moyen", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    high: { label: "Élevé", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    critical: { label: "Critique", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  return (
    <AppLayout title="Sécurité">
      <Tabs defaultValue="mfa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="mfa">MFA</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
        </TabsList>

        <TabsContent value="mfa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Authentification à Deux Facteurs
              </CardTitle>
              <CardDescription>
                Protégez votre compte avec une authentification à deux facteurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : mfaEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-success">MFA Activé</p>
                      <p className="text-sm text-muted-foreground">Votre compte est protégé par MFA</p>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Lock className="w-4 h-4 mr-2" />
                        Désactiver MFA
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Désactiver MFA</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Entrez votre code MFA actuel pour désactiver l'authentification à deux facteurs.
                        </p>
                        <div className="space-y-2">
                          <Label>Code MFA</Label>
                          <Input
                            placeholder="123456"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            maxLength={6}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={handleDisableMFA}
                        >
                          Désactiver MFA
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-medium text-warning">MFA Non Activé</p>
                      <p className="text-sm text-muted-foreground">Activez MFA pour sécuriser votre compte</p>
                    </div>
                  </div>
                  
                  <Button onClick={handleSetupMFA}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Activer MFA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {mfaSetup && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration MFA</CardTitle>
                <CardDescription>
                  Scannez le QR code avec votre application d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {setupStep === "verify" ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={mfaSetup.qr_code_url}
                        alt="QR Code"
                        className="w-48 h-48 border rounded-lg"
                      />
                      <div className="space-y-2 w-full max-w-sm">
                        <Label>Secret Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecret ? "text" : "password"}
                            value={mfaSetup.secret}
                            readOnly
                            className="flex-1 font-mono"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(mfaSetup.secret)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Entrez le code de votre application</Label>
                      <Input
                        placeholder="123456"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleVerifyMFA} className="flex-1">
                        Vérifier et Activer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMfaSetup(null);
                          setVerifyCode("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Codes de Backup</h3>
                      <p className="text-sm text-muted-foreground">
                        Sauvegardez ces codes de récupération. Vous pourrez les utiliser si vous perdez accès à votre application d'authentification.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="p-3 bg-muted rounded-lg font-mono text-center text-sm"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={downloadBackupCodes} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(backupCodes.join("\n"))}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </Button>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setMfaSetup(null);
                        setBackupCodes([]);
                        setVerifyCode("");
                      }}
                      className="w-full"
                    >
                      J'ai sauvegardé mes codes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Journal d'Audit
              </CardTitle>
              <CardDescription>
                Historique des actions effectuées sur le compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : auditLogs.length === 0 ? (
                <EmptyState
                  icon={Lock}
                  title="Aucun événement d'audit"
                  description="Les actions de sécurité seront enregistrées ici"
                />
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.resource_type} - {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? "Succès" : "Échec"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Événements de Sécurité
              </CardTitle>
              <CardDescription>
                Alertes et incidents de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : securityEvents.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="Aucun événement de sécurité"
                  description="Les alertes de sécurité apparaîtront ici"
                />
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => {
                    const config = severityConfig[event.severity] || severityConfig.low;
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{event.event_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.description} - {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Security;
