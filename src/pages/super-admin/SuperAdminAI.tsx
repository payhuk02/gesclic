import { useCallback, useEffect, useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Plus, Save, Trash2, Zap, Loader2, KeyRound, Activity } from "lucide-react";
import { toast } from "sonner";

type Provider = {
  id?: string;
  provider: string;
  label: string;
  base_url: string;
  default_model: string | null;
  enabled: boolean;
  priority: number;
  api_key_last4?: string | null;
  has_key?: boolean;
  api_key?: string;
  clear_key?: boolean;
};

type Feature = {
  id?: string;
  feature_key: string;
  label: string;
  description: string | null;
  provider_id: string | null;
  model: string | null;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  enabled: boolean;
};

type UsageLog = {
  id: string;
  feature_key: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  latency_ms: number | null;
  error: string | null;
  created_at: string;
};

const PROVIDER_PRESETS: Record<string, { label: string; base_url: string; default_model: string }> = {
  lovable: { label: "Lovable AI Gateway", base_url: "https://ai.gateway.lovable.dev/v1", default_model: "google/gemini-3.6-flash" },
  openrouter: { label: "OpenRouter", base_url: "https://openrouter.ai/api/v1", default_model: "openai/gpt-4o-mini" },
  openai: { label: "OpenAI", base_url: "https://api.openai.com/v1", default_model: "gpt-4o-mini" },
  gemini: { label: "Google Gemini", base_url: "https://generativelanguage.googleapis.com/v1beta/openai", default_model: "gemini-2.5-flash" },
  anthropic: { label: "Anthropic Claude", base_url: "https://api.anthropic.com/v1", default_model: "claude-3-5-sonnet-latest" },
  custom: { label: "Fournisseur personnalisé", base_url: "", default_model: "" },
};

const callAdmin = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("ai-admin", { body: payload });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) msg = (await ctx.clone().json())?.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as Record<string, unknown>;
};

const SuperAdminAI = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ action: "list" });
      setProviders((data.providers as Provider[]) ?? []);
      setFeatures((data.features as Feature[]) ?? []);
      setLogs((data.logs as UsageLog[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patchProvider = (idx: number, patch: Partial<Provider>) =>
    setProviders((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const patchFeature = (idx: number, patch: Partial<Feature>) =>
    setFeatures((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const saveProvider = async (p: Provider, idx: number) => {
    setBusy(`save-${idx}`);
    try {
      const apiKey = keyInputs[p.id ?? `new-${idx}`];
      const res = await callAdmin({ action: "save_provider", provider: { ...p, api_key: apiKey } });
      const saved = res.provider as Provider;
      setProviders((prev) => prev.map((x, i) => (i === idx ? saved : x)));
      setKeyInputs((prev) => ({ ...prev, [saved.id!]: "", [`new-${idx}`]: "" }));
      toast.success("Fournisseur enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const testProvider = async (p: Provider, idx: number) => {
    if (!p.id) return toast.error("Enregistrez d'abord le fournisseur");
    setBusy(`test-${idx}`);
    try {
      const res = await callAdmin({ action: "test_provider", id: p.id });
      if (res.ok) toast.success(`Connexion OK (${res.latency_ms} ms) — ${res.model}`);
      else toast.error(String(res.error));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const deleteProvider = async (p: Provider, idx: number) => {
    if (!p.id) return setProviders((prev) => prev.filter((_, i) => i !== idx));
    if (!confirm(`Supprimer « ${p.label} » ?`)) return;
    try {
      await callAdmin({ action: "delete_provider", id: p.id });
      setProviders((prev) => prev.filter((_, i) => i !== idx));
      toast.success("Fournisseur supprimé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const saveFeature = async (f: Feature, idx: number) => {
    setBusy(`feat-${idx}`);
    try {
      const res = await callAdmin({ action: "save_feature", feature: f });
      setFeatures((prev) => prev.map((x, i) => (i === idx ? (res.feature as Feature) : x)));
      toast.success("Fonctionnalité enregistrée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const deleteFeature = async (f: Feature, idx: number) => {
    if (!f.id) return setFeatures((prev) => prev.filter((_, i) => i !== idx));
    if (!confirm(`Supprimer « ${f.label} » ?`)) return;
    try {
      await callAdmin({ action: "delete_feature", id: f.id });
      setFeatures((prev) => prev.filter((_, i) => i !== idx));
      toast.success("Fonctionnalité supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const addProvider = () =>
    setProviders((prev) => [
      ...prev,
      { provider: "openrouter", ...PROVIDER_PRESETS.openrouter, default_model: PROVIDER_PRESETS.openrouter.default_model, enabled: true, priority: 100 },
    ]);

  const addFeature = () =>
    setFeatures((prev) => [
      ...prev,
      {
        feature_key: "", label: "", description: null, provider_id: null, model: null,
        temperature: 0.3, max_tokens: 2048, system_prompt: "", enabled: true,
      },
    ]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> Intelligence Artificielle
            </h1>
            <p className="text-muted-foreground">
              Fournisseurs, clés API et fonctionnalités IA de la plateforme
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualiser"}
          </Button>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="providers"><KeyRound className="w-4 h-4 mr-1" />Fournisseurs</TabsTrigger>
            <TabsTrigger value="features"><Zap className="w-4 h-4 mr-1" />Fonctionnalités</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-1" />Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            {providers.map((p, idx) => (
              <Card key={p.id ?? `new-${idx}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {p.label}
                      {p.has_key ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-300">Clé configurée</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">Sans clé</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{p.provider}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={p.enabled} onCheckedChange={(v) => patchProvider(idx, { enabled: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteProvider(p, idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={p.provider}
                      onValueChange={(v) => {
                        const preset = PROVIDER_PRESETS[v];
                        patchProvider(idx, {
                          provider: v,
                          label: preset.label,
                          base_url: preset.base_url,
                          default_model: preset.default_model,
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROVIDER_PRESETS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nom affiché</Label>
                    <Input className="mt-1" value={p.label} onChange={(e) => patchProvider(idx, { label: e.target.value })} />
                  </div>
                  <div>
                    <Label>URL de base</Label>
                    <Input className="mt-1" value={p.base_url} onChange={(e) => patchProvider(idx, { base_url: e.target.value })} />
                  </div>
                  <div>
                    <Label>Modèle par défaut</Label>
                    <Input className="mt-1" value={p.default_model ?? ""} onChange={(e) => patchProvider(idx, { default_model: e.target.value })} />
                  </div>
                  <div>
                    <Label>Clé API {p.api_key_last4 ? `(•••• ${p.api_key_last4})` : ""}</Label>
                    <Input
                      className="mt-1"
                      type="password"
                      autoComplete="off"
                      placeholder={p.has_key ? "Laisser vide pour conserver la clé actuelle" : "sk-..."}
                      value={keyInputs[p.id ?? `new-${idx}`] ?? ""}
                      onChange={(e) => setKeyInputs((prev) => ({ ...prev, [p.id ?? `new-${idx}`]: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Stockée côté serveur uniquement, jamais renvoyée au navigateur.
                    </p>
                  </div>
                  <div>
                    <Label>Priorité (plus petit = préféré)</Label>
                    <Input className="mt-1" type="number" value={p.priority}
                      onChange={(e) => patchProvider(idx, { priority: parseInt(e.target.value) || 100 })} />
                  </div>
                  <div className="md:col-span-2 flex gap-2 flex-wrap">
                    <Button onClick={() => saveProvider(p, idx)} disabled={busy === `save-${idx}`}>
                      {busy === `save-${idx}` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => testProvider(p, idx)} disabled={busy === `test-${idx}`}>
                      {busy === `test-${idx}` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                      Tester la connexion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addProvider}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter un fournisseur
            </Button>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            {features.map((f, idx) => (
              <Card key={f.id ?? `newf-${idx}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-base">{f.label || "Nouvelle fonctionnalité"}</CardTitle>
                    <CardDescription>{f.feature_key}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={f.enabled} onCheckedChange={(v) => patchFeature(idx, { enabled: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteFeature(f, idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Clé technique</Label>
                    <Input className="mt-1" value={f.feature_key} onChange={(e) => patchFeature(idx, { feature_key: e.target.value })} />
                  </div>
                  <div>
                    <Label>Libellé</Label>
                    <Input className="mt-1" value={f.label} onChange={(e) => patchFeature(idx, { label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fournisseur</Label>
                    <Select
                      value={f.provider_id ?? "auto"}
                      onValueChange={(v) => patchFeature(idx, { provider_id: v === "auto" ? null : v })}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique (par priorité)</SelectItem>
                        {providers.filter((p) => p.id).map((p) => (
                          <SelectItem key={p.id} value={p.id!}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modèle (vide = modèle par défaut)</Label>
                    <Input className="mt-1" value={f.model ?? ""} onChange={(e) => patchFeature(idx, { model: e.target.value })} />
                  </div>
                  <div>
                    <Label>Température</Label>
                    <Input className="mt-1" type="number" step="0.1" min="0" max="2" value={f.temperature}
                      onChange={(e) => patchFeature(idx, { temperature: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Tokens maximum</Label>
                    <Input className="mt-1" type="number" value={f.max_tokens}
                      onChange={(e) => patchFeature(idx, { max_tokens: parseInt(e.target.value) || 1024 })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Invite système</Label>
                    <Textarea className="mt-1 min-h-[120px]" value={f.system_prompt ?? ""}
                      onChange={(e) => patchFeature(idx, { system_prompt: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={() => saveFeature(f, idx)} disabled={busy === `feat-${idx}`}>
                      {busy === `feat-${idx}` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addFeature}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter une fonctionnalité
            </Button>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">50 derniers appels IA</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun appel enregistré.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Fonction</th>
                        <th className="py-2 pr-4">Fournisseur</th>
                        <th className="py-2 pr-4">Modèle</th>
                        <th className="py-2 pr-4">Latence</th>
                        <th className="py-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 pr-4 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                          <td className="py-2 pr-4">{l.feature_key}</td>
                          <td className="py-2 pr-4">{l.provider}</td>
                          <td className="py-2 pr-4">{l.model}</td>
                          <td className="py-2 pr-4">{l.latency_ms ? `${l.latency_ms} ms` : "—"}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={l.status === "success" ? "text-emerald-600 border-emerald-300" : "text-destructive border-destructive/40"}>
                              {l.status}
                            </Badge>
                            {l.error && <span className="block text-xs text-muted-foreground max-w-xs truncate">{l.error}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAI;
