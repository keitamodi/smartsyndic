import FormDialog from '@/components/FormDialog';
import { options, WORK_TYPE } from '@/lib/constants';

export default function QuoteRequestDialog({ open, onOpenChange, buildings = [], initial, onSubmit }) {
  const fields = [
    {
      name: 'title',
      label: 'Objet de la demande',
      required: true,
      span: 2,
      placeholder: 'Réfection de l’étanchéité de la toiture-terrasse',
    },
    { name: 'work_type', label: 'Type de travaux', type: 'select', options: options(WORK_TYPE) },
    {
      name: 'building_id',
      label: 'Immeuble concerné',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
      placeholder: 'Aucun immeuble précis',
    },
    { name: 'city', label: 'Ville', required: true, placeholder: 'Lyon' },
    { name: 'postal_code', label: 'Code postal', required: true, placeholder: '69003' },
    { name: 'deadline', label: 'Devis souhaités avant le', type: 'date' },
    { name: 'budget_max', label: 'Budget indicatif (€)', type: 'number', min: 0, placeholder: '15000' },
    {
      name: 'description',
      label: 'Description du besoin',
      type: 'textarea',
      required: true,
      span: 2,
      rows: 4,
      placeholder: 'Décrivez les travaux, l’accès au site, les contraintes et vos attentes.',
    },
    {
      name: 'photos',
      label: 'Photos du site',
      type: 'file',
      span: 2,
      hint: 'Aidez les entreprises à chiffrer : photos des désordres et des accès.',
    },
  ];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? 'Modifier la demande de devis' : 'Nouvelle demande de devis'}
      description="Décrivez le besoin : la demande est créée en brouillon, puis envoyée aux entreprises que vous sélectionnez."
      fields={fields}
      initialValues={initial || { work_type: 'plomberie', photos: [] }}
      onSubmit={onSubmit}
      submitLabel={initial ? 'Mettre à jour' : 'Créer la demande'}
    />
  );
}