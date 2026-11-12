import { useState } from 'react';
import FormDialog from '@/components/FormDialog';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { options, SYNDIC_KIND } from '@/lib/constants';

export const SYNDIC_FIELDS = [
  { name: 'name', label: 'Nom du syndic', required: true, span: 2, placeholder: 'Cabinet Horizon Syndic' },
  { name: 'kind', label: 'Type de syndic', type: 'select', options: options(SYNDIC_KIND) },
  { name: 'siret', label: 'SIRET', placeholder: '123 456 789 00012' },
  { name: 'address', label: 'Adresse', span: 2, placeholder: '12 rue des Lilas' },
  { name: 'postal_code', label: 'Code postal', placeholder: '69003' },
  { name: 'city', label: 'Ville', placeholder: 'Lyon' },
  { name: 'contact_email', label: 'Email de contact', type: 'email', placeholder: 'contact@cabinet.fr' },
  { name: 'phone', label: 'Téléphone', placeholder: '04 78 00 00 00' },
];

export default function SyndicFormDialog({ open, onOpenChange, initialValues, onSaved }) {
  const { refresh } = useWorkspace();
  const [busy, setBusy] = useState(false);

  const submit = async (values) => {
    setBusy(true);
    try {
      if (initialValues?.id) {
        await base44.entities.Syndic.update(initialValues.id, values);
      } else {
        await base44.entities.Syndic.create({ ...values, status: values.status || 'actif' });
      }
      await refresh();
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialValues?.id ? "Modifier l'espace syndic" : 'Créer un espace syndic'}
      description="Chaque espace isole ses immeubles, ses utilisateurs et ses données. Vous pourrez y inviter votre équipe ensuite."
      fields={SYNDIC_FIELDS}
      initialValues={initialValues || { name: '', kind: 'professionnel', siret: '', address: '', postal_code: '', city: '', contact_email: '', phone: '' }}
      onSubmit={submit}
      submitLabel={initialValues?.id ? 'Mettre à jour' : "Créer l'espace"}
      notice={busy ? 'Enregistrement en cours…' : undefined}
    />
  );
}