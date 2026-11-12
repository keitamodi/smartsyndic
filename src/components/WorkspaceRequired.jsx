import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import SyndicFormDialog from '@/components/SyndicFormDialog';
import { useWorkspace } from '@/lib/workspace';

export default function WorkspaceRequired() {
  const { loading, error } = useWorkspace();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="rounded-[26px] border border-border bg-card">
        <EmptyState
          icon={Building2}
          title="Créez votre premier espace syndic"
          description={
            error
              ? "Vos espaces de travail n'ont pas pu être chargés. Vérifiez que vous êtes connecté, puis créez ou sélectionnez un espace."
              : 'Un espace syndic regroupe vos immeubles, vos résidents, votre équipe et vos finances. Créez-le pour commencer à enregistrer vos données.'
          }
          action={
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Créer un espace syndic
            </Button>
          }
        />
      </div>
      <SyndicFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}