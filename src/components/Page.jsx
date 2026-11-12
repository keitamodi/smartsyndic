import PageHeader from '@/components/PageHeader';

export default function Page({ kicker, title, description, actions, children, wide = false }) {
  return (
    <div className={`mx-auto w-full ${wide ? 'max-w-[1360px]' : 'max-w-[1180px]'} space-y-5`}>
      <PageHeader kicker={kicker} title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}