import CompanyDirectory from '@/components/partners/CompanyDirectory';
import RepertoireFilters from '@/components/partners/RepertoireFilters';

export default function PartnerSearchHeader({ directory, filters }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
      <div className="p-4 sm:p-5">
        <CompanyDirectory {...directory} />
      </div>
      <div className="border-t border-border/70 bg-secondary/40 p-4 sm:p-5">
        <RepertoireFilters {...filters} />
      </div>
    </section>
  );
}