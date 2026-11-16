import InviteAccessCard from '@/components/access/InviteAccessCard';

export default function ProviderAccessCard({ provider }) {
  if (!provider) return null;

  return (
    <InviteAccessCard
      syndicId={provider.syndic_id}
      kind="technicien"
      memberId={provider.id}
      memberType="provider"
      fullName={provider.contact_name || provider.name}
      email={provider.email}
      phone={provider.phone}
    />
  );
}