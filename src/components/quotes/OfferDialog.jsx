import FormDialog from '@/components/FormDialog';
import { options, QUOTE_CHANNEL } from '@/lib/constants';

export default function OfferDialog({ open, onOpenChange, invites = [], initial, onSubmit }) {
  const fields = [
    {
      name: 'company_name',
      label: 'Entreprise',
      type: 'select',
      required: true,
      options: invites.map((invite) => ({ value: invite.company_name, label: invite.company_name })),
      placeholder: 'Sélectionner une entreprise',
    },
    {
      name: 'received_channel',
      label: 'Reçu par',
      type: 'select',
      options: [
        ...options(QUOTE_CHANNEL),
        { value: 'courrier', label: 'Courrier' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { name: 'amount', label: 'Montant total (€)', type: 'number', required: true, min: 0, step: '0.01' },
    { name: 'duration_days', label: "Délai d'exécution (jours)", type: 'number', min: 0 },
    { name: 'validity_days', label: 'Validité du devis (jours)', type: 'number', min: 0 },
    {
      name: 'conditions',
      label: 'Conditions et observations',
      type: 'textarea',
      span: 2,
      rows: 3,
      placeholder: 'Acompte, garanties, exclusions, échafaudage…',
    },
    {
      name: 'documents',
      label: 'Devis joint',
      type: 'file',
      span: 2,
      hint: 'PDF ou photo du devis reçu par e-mail ou courrier.',
    },
    { name: 'notes', label: 'Notes internes', type: 'textarea', span: 2, rows: 2 },
  ];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Enregistrer un devis reçu"
      description="Saisissez la réponse de l'entreprise, reçue par e-mail ou par téléphone."
      fields={fields}
      initialValues={initial || { received_channel: 'email', documents: [] }}
      onSubmit={onSubmit}
      submitLabel="Enregistrer le devis"
    />
  );
}