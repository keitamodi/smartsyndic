import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import Page from '@/components/Page';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import ThreadList from '@/components/messaging/ThreadList';
import MessagePane from '@/components/messaging/MessagePane';
import NewThreadDialog from '@/components/messaging/NewThreadDialog';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import useRealtimeMessages from '@/hooks/useRealtimeMessages';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { PROVIDER_SPECIALTY, TEAM_ROLE } from '@/lib/constants';

const RESIDENT_KINDS = {
  coproprietaire: 'coproprietaire',
  proprietaire_bailleur: 'proprietaire',
  occupant: 'occupant',
};

export default function Messagerie() {
  const { syndicId, syndic } = useWorkspace();
  const [selectedId, setSelectedId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { items: threads, loading: loadingThreads, reload: reloadThreads } = useCollection(
    'Thread',
    { syndic_id: syndicId },
    { enabled: !!syndicId, sort: '-updated_date', limit: 100 },
  );

  const { items: residents } = useCollection('Resident', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 200 });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 100 });
  const { items: team } = useCollection('TeamMember', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 100 });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 100 });

  const { items: messages, loading: loadingMessages } = useRealtimeMessages('ThreadMessage', 'thread_id', selectedId);

  const contacts = useMemo(() => {
    const nameOf = (id) => buildings.find((building) => building.id === id)?.name || '';
    const list = [];
    residents
      .filter((resident) => resident.status !== 'sorti')
      .forEach((resident) =>
        list.push({
          id: resident.id,
          name: resident.full_name,
          email: resident.email || '',
          phone: resident.phone || '',
          group: 'Copropriétaires & propriétaires',
          kind: RESIDENT_KINDS[resident.kind] || 'coproprietaire',
          building_id: resident.building_id || '',
          building_name: nameOf(resident.building_id),
        }),
      );
    providers
      .filter((provider) => provider.status !== 'inactif')
      .forEach((provider) =>
        list.push({
          id: provider.id,
          name: provider.name,
          email: provider.email || '',
          phone: provider.phone || '',
          group: 'Techniciens & prestataires',
          kind: provider.kind === 'technicien_interne' ? 'technicien' : 'prestataire',
          building_id: '',
          building_name: PROVIDER_SPECIALTY[provider.specialty] || '',
        }),
      );
    team
      .filter((member) => member.status !== 'desactive')
      .forEach((member) =>
        list.push({
          id: member.id,
          name: member.full_name,
          email: member.email || '',
          phone: member.phone || '',
          group: 'Équipe syndic',
          kind: 'equipe',
          building_id: '',
          building_name: TEAM_ROLE[member.role] || '',
        }),
      );
    return list;
  }, [residents, providers, team, buildings]);

  useEffect(() => {
    if (!threads.some((thread) => thread.id === selectedId)) {
      setSelectedId(threads[0]?.id || '');
    }
  }, [threads, selectedId]);

  if (!syndicId) return <WorkspaceRequired />;

  const selectedThread = threads.find((thread) => thread.id === selectedId) || null;

  const createThread = async ({ contact, subject, message }) => {
    const thread = await base44.entities.Thread.create({
      syndic_id: syndicId,
      subject,
      contact_name: contact.name,
      contact_email: contact.email || '',
      contact_phone: contact.phone || '',
      contact_kind: contact.kind,
      building_id: contact.building_id || '',
      building_name: contact.building_name || '',
      status: message ? 'en_attente' : 'ouvert',
      last_message: message ? message.slice(0, 140) : 'Conversation ouverte',
      last_author: 'Syndic',
      unread_count: 0,
    });
    if (message) {
      await base44.entities.ThreadMessage.create({
        syndic_id: syndicId,
        thread_id: thread.id,
        direction: 'sortant',
        author_name: syndic?.name || 'Syndic',
        author_kind: 'equipe',
        body: message,
      });
    }
    await reloadThreads();
    setSelectedId(thread.id);
  };

  const sendMessage = async (body, direction) => {
    if (!selectedThread) return;
    await base44.entities.ThreadMessage.create({
      syndic_id: syndicId,
      thread_id: selectedThread.id,
      direction,
      author_name: direction === 'entrant' ? selectedThread.contact_name : syndic?.name || 'Syndic',
      author_kind: direction === 'entrant' ? selectedThread.contact_kind || '' : 'equipe',
      body,
    });
    await base44.entities.Thread.update(selectedThread.id, {
      last_message: body.slice(0, 140),
      last_author: direction === 'entrant' ? selectedThread.contact_name : 'Syndic',
      status: direction === 'entrant' ? 'ouvert' : 'en_attente',
      unread_count: 0,
    });
    await reloadThreads();
  };

  const draftReply = async () => {
    if (!selectedThread) return '';
    const lastIncoming = [...messages].reverse().find((message) => message.direction === 'entrant');
    const question = lastIncoming?.body || selectedThread.subject;
    const response = await base44.functions.invoke('agentIA', {
      syndic_id: syndicId,
      message: question,
      mode: 'resident',
    });
    return response?.data?.answer || '';
  };

  const changeStatus = async (status) => {
    if (!selectedThread) return;
    await base44.entities.Thread.update(selectedThread.id, { status });
    await reloadThreads();
  };

  return (
    <Page
      kicker="Relation"
      title="Messagerie"
      description="Échangez avec vos copropriétaires, propriétaires bailleurs, techniciens et prestataires. L’agent IA peut préparer une réponse à partir de vos documents."
      actions={
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle conversation
        </Button>
      }
      wide
    >
      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        <ThreadList
          threads={threads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loadingThreads}
        />
        <MessagePane
          thread={selectedThread}
          messages={messages}
          loading={loadingMessages}
          onSend={sendMessage}
          onDraft={draftReply}
          onStatus={changeStatus}
        />
      </div>

      <div className="flex items-start gap-2 rounded-[18px] border border-border/80 bg-secondary/40 px-3.5 py-3">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.7} />
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Les messages sont conservés dans votre espace syndic. Cochez « Enregistrer comme réponse reçue » pour consigner
          une réponse obtenue par téléphone ou par email, ou laissez l’agent IA rédiger un brouillon à partir de vos
          documents.
        </p>
      </div>

      <NewThreadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contacts={contacts}
        onCreate={createThread}
      />
    </Page>
  );
}