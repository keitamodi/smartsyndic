import InviteAccessCard from '@/components/access/InviteAccessCard';

export default function ProviderAccessCard({ provider }) {
  if (!provider) return null;

  return (
    <InviteAccessCard
      syndicId={provider.syndic_id}
      email={provider.email}
      kind="technicien"
      fullName={provider.contact_name || provider.name}
    />
  );
}