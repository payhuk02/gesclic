import AppLayout from "@/components/layout/AppLayout";
import { usePayments } from "@/hooks/usePayments";
import { usePatients } from "@/hooks/usePatients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingUp, Clock, CheckCircle, Pencil, FileText, Loader2, Wallet } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { generateInvoicePDF } from "@/utils/exportUtils";
import AddPaymentDialog from "@/components/dialogs/AddPaymentDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import type { PaymentForm } from "@/components/dialogs/AddPaymentDialog";
import EmptyState from "@/components/EmptyState";

const Payments = () => {
  const { payments, loading, addPayment, updatePayment, deletePayment } = usePayments();
  const { patients } = usePatients();

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  const handleAdd = (form: PaymentForm) => {
    addPayment({ patient_name: form.patientName, amount: form.amount, method: form.method, description: form.description });
  };

  const handleEdit = (id: string, form: PaymentForm) => {
    updatePayment(id, { patient_name: form.patientName, amount: form.amount, method: form.method, description: form.description });
  };

  return (
    <AppLayout title="Paiements">
      <div className="flex justify-end gap-2 mb-4">
        <ExportButtons
          data={payments.map(p => ({ ...p, patientName: p.patient_name })) as unknown as Record<string, unknown>[]}
          columns={[
            { header: "Patient", key: "patientName" },
            { header: "Montant", key: "amount" },
            { header: "Méthode", key: "method" },
            { header: "Statut", key: "status" },
            { header: "Date", key: "date" },
            { header: "Description", key: "description" },
          ]}
          title="Liste des paiements"
          filename="paiements"
        />
        <AddPaymentDialog onAdd={handleAdd} patients={patients.map(p => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Payés</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPaid.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">En attente</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPending.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{(totalPaid + totalPending).toLocaleString()} FCFA</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        payments.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card border border-border">
            <EmptyState
              icon={Wallet}
              title="Aucun paiement enregistré"
              description="Suivez la caisse de votre clinique : encaissements, en attente, méthode de paiement. Chaque paiement génère automatiquement une facture PDF."
              tips={[
                "Mobile Money (Orange, Wave, MTN, Moov), espèces et carte sont supportés.",
                "Les revenus mensuels alimentent le tableau de bord et les rapports.",
                "Un paiement peut être marqué « En attente » puis mis à jour en « Payé ».",
              ]}
              action={<AddPaymentDialog onAdd={handleAdd} patients={patients.map(p => ({ id: p.id, name: p.name }))} />}
            />
          </div>
        ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          {(
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Montant</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Méthode</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.patient_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.description}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.amount.toLocaleString()} {p.currency}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          {p.method}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={p.status === "paid" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                          {p.status === "paid" ? "Payé" : "En attente"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <AddPaymentDialog
                            editData={{ patientName: p.patient_name, amount: p.amount, method: p.method, description: p.description }}
                            onEdit={(form) => handleEdit(p.id, form)}
                            patients={patients.map(pt => ({ id: pt.id, name: pt.name }))}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => generateInvoicePDF({ patientName: p.patient_name, amount: p.amount, currency: p.currency, method: p.method, date: p.date, description: p.description })}>
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <DeleteConfirmDialog onConfirm={() => deletePayment(p.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )
      )}
    </AppLayout>
  );
};

export default Payments;
