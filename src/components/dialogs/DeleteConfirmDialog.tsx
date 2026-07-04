import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
}

const DeleteConfirmDialog = ({ title = "Confirmer la suppression", description = "Cette action est irréversible. Voulez-vous continuer ?", onConfirm, trigger }: Props) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {trigger || (
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </AlertDialogTrigger>
    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-base sm:text-lg">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">Supprimer</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteConfirmDialog;
