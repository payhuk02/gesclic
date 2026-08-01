import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, AlertTriangle, Package, Pill, TrendingDown, Pencil, Loader2, PackagePlus, SearchX } from "lucide-react";
import { useState } from "react";
import { usePharmacyStock, type PharmacyItem } from "@/hooks/usePharmacyStock";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import EmptyState from "@/components/EmptyState";

interface ItemForm { name: string; category: string; quantity: number; price: number; threshold: number }
const empty: ItemForm = { name: "", category: "", quantity: 0, price: 0, threshold: 10 };

const ItemDialog = ({ trigger, initial, onSubmit, title }: { trigger: React.ReactNode; initial?: PharmacyItem; onSubmit: (f: ItemForm) => void; title: string }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(initial ? { name: initial.name, category: initial.category, quantity: initial.quantity, price: initial.price, threshold: initial.threshold } : empty);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
    setOpen(false);
    if (!initial) setForm(empty);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setForm({ name: initial.name, category: initial.category, quantity: initial.quantity, price: initial.price, threshold: initial.threshold }); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Nom du produit *</Label><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Catégorie</Label><Input className="mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Antalgique, Antibiotique..." /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quantité</Label><Input className="mt-1" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></div>
            <div><Label>Prix (FCFA)</Label><Input className="mt-1" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} /></div>
            <div><Label>Seuil alerte</Label><Input className="mt-1" type="number" min={0} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" className="gradient-hero border-0">Enregistrer</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Pharmacy = () => {
  const [search, setSearch] = useState("");
  const { items, loading, addItem, updateItem, deleteItem } = usePharmacyStock();

  const filtered = items.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter((m) => m.quantity <= m.threshold);
  const totalValue = items.reduce((s, m) => s + m.quantity * m.price, 0);

  return (
    <AppLayout title="Pharmacie">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Pill className="w-4 h-4 text-primary" /></div>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground">Produits</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center mb-2"><AlertTriangle className="w-4 h-4 text-destructive" /></div>
          <p className="text-2xl font-bold text-foreground">{lowStock.length}</p>
          <p className="text-xs text-muted-foreground">Rupture de stock</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-2"><Package className="w-4 h-4 text-accent" /></div>
          <p className="text-2xl font-bold text-foreground">{totalValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Valeur stock (FCFA)</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Alertes de rupture de stock</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m) => (
              <span key={m.id} className="text-xs bg-card border border-destructive/20 rounded-lg px-3 py-1.5 text-foreground flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-destructive" />{m.name} — {m.quantity} restants
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ItemDialog title="Nouveau produit" onSubmit={(f) => addItem(f)} trigger={<Button className="gradient-hero border-0 gap-2 flex-shrink-0"><Plus className="w-4 h-4" />Ajouter</Button>} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card border border-border">
          <EmptyState
            icon={PackagePlus}
            title="Votre stock est vide"
            description="Ajoutez vos médicaments et consommables pour suivre les quantités en temps réel et recevoir des alertes de rupture."
            tips={[
              "Définissez un seuil d'alerte par produit pour anticiper les commandes.",
              "Les produits en dessous du seuil s'affichent en rouge dans le tableau de bord.",
              "Regroupez par catégorie (Antalgique, Antibiotique, Consommable…) pour filtrer plus vite.",
            ]}
            action={<ItemDialog title="Nouveau produit" onSubmit={(f) => addItem(f)} trigger={<Button className="gradient-hero border-0 gap-2"><Plus className="w-4 h-4" />Ajouter le premier produit</Button>} />}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Produit</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Prix unitaire</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-4"><EmptyState compact icon={SearchX} title="Aucun produit trouvé" description={search ? `Aucun résultat pour « ${search} ».` : "Ajustez vos filtres pour voir des résultats."} /></td></tr>
                ) : filtered.map((m) => {
                  const isLow = m.quantity <= m.threshold;
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{m.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{m.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${isLow ? "text-destructive" : "text-foreground"}`}>{m.quantity}</span>
                        <span className="text-xs text-muted-foreground"> / seuil {m.threshold}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{m.price.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={isLow ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"}>
                          {isLow ? "Stock bas" : "OK"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <ItemDialog title="Modifier le produit" initial={m} onSubmit={(f) => updateItem(m.id, f)} trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>} />
                          <DeleteConfirmDialog onConfirm={() => deleteItem(m.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Pharmacy;
