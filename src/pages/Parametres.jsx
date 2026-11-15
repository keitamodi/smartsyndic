import {
  Bell,
  MessageCircle,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCircle,
  UserCog,
} from 'lucide-react';
import Page from '@/components/Page';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import useSyndicSettings from '@/hooks/useSyndicSettings';
import { useWorkspace } from '@/lib/workspace';
import GeneralTab from '@/components/settings/GeneralTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import MessagingTab from '@/components/settings/MessagingTab';
import AgentTab from '@/components/settings/AgentTab';
import AccessTab from '@/components/settings/AccessTab';
import TeamTab from '@/components/settings/TeamTab';
import AccountTab from '@/components/settings/AccountTab';

const TABS = [
  { value: 'general', label: 'Général', icon: SlidersHorizontal },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'messaging', label: 'Messagerie', icon: MessageCircle },
  { value: 'agent', label: 'Agent IA', icon: Sparkles },
  { value: 'access', label: 'Rôles & accès', icon: ShieldCheck },
  { value: 'team', label: 'Équipe', icon: UserCog },
  { value: 'account', label: 'Mon compte', icon: UserCircle },
];

export default function Parametres() {
  const { syndicId } = useWorkspace();
  const { toast } = useToast();
  const { settings, update, dirty, loading, saving, save } = useSyndicSettings(syndicId);

  if (!syndicId) return <WorkspaceRequired />;

  const onSave = async () => {
    await save();
    toast({
      title: 'Paramètres enregistrés',
      description: 'Les réglages s’appliquent à tous les modules de votre espace.',
    });
  };

  return (
    <Page
      kicker="Configuration"
      title="Paramètres"
      description="Réglez le fonctionnement de chaque module : notifications, messagerie, agent IA, accès des résidents et de l’équipe."
      actions={
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="hidden text-[11.5px] text-muted-foreground sm:block">
              Modifications non enregistrées
            </span>
          )}
          <Button className="gap-2" onClick={onSave} disabled={!dirty || saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-11 animate-pulse rounded-2xl bg-secondary/70" />
          <div className="h-64 animate-pulse rounded-[22px] bg-secondary/50" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="thin-scroll flex h-auto w-full flex-nowrap items-stretch justify-start gap-1 overflow-x-auto rounded-2xl bg-secondary/60 p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="shrink-0 gap-1.5 rounded-xl px-3 py-2 text-[12.5px] data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="general" className="mt-0">
            <GeneralTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-0">
            <NotificationsTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="messaging" className="mt-0">
            <MessagingTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="agent" className="mt-0">
            <AgentTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="access" className="mt-0">
            <AccessTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <TeamTab settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="account" className="mt-0">
            <AccountTab />
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}