import { ArrowUpRight, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** S'affiche quand une création dépasse le plafond du forfait en cours. */
export default function QuotaLimitDialog({ quota, planName, onClose }) {
  const navigate = useNavigate();
  const open = !!quota;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <Gauge className="h-4 w-4 text-primary" />
          </span>
          <DialogTitle>Limite « {quota?.label} » atteinte</DialogTitle>
          <DialogDescription>
            Votre forfait {planName} autorise {quota?.limit} {quota?.unit} et vous en utilisez déjà{' '}
            {quota?.used}. Passez à un forfait supérieur pour continuer sans interrompre votre
            gestion.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-xl bg-secondary/50 p-3 text-[12.5px] text-foreground/75">
          Vos données existantes restent intégralement accessibles : seul l'ajout de nouveaux
          éléments est bloqué.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Plus tard
          </Button>
          <Button className="gap-2" onClick={() => navigate('/abonnement')}>
            Voir les forfaits
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}