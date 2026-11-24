import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Layout from '@/components/Layout';
import TableauDeBord from '@/pages/TableauDeBord';
import Buildings from '@/pages/Buildings';
import Maintenance from '@/pages/Maintenance';
import Tickets from '@/pages/Tickets';
import Contracts from '@/pages/Contracts';
import Assemblies from '@/pages/Assemblies';
import AgentIA from '@/pages/AgentIA';
import Messagerie from '@/pages/Messagerie';
import Residents from '@/pages/Residents';
import Providers from '@/pages/Providers';
import Devis from '@/pages/Devis';
import Partenaires from '@/pages/Partenaires';
import Team from '@/pages/Team';
import Billing from '@/pages/Billing';
import Abonnement from '@/pages/Abonnement';
import Guide from '@/pages/Guide';
import Help from '@/pages/Help';
import About from '@/pages/About';
import Parametres from '@/pages/Parametres';
import TestAcces from '@/pages/TestAcces';
import MonEspace from '@/pages/MonEspace';
import MesInterventions from '@/pages/MesInterventions';
import Accueil from '@/pages/Accueil';
import DemandesInscription from '@/pages/DemandesInscription';
import Pricing from '@/pages/Pricing';
import MentionsLegales from '@/pages/legal/MentionsLegales';
import CGU from '@/pages/legal/CGU';
import Confidentialite from '@/pages/legal/Confidentialite';
import Cookies from '@/pages/legal/Cookies';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirection gérée par le routeur : évite un double aller-retour avec le SDK.
      return <Navigate to="/login" replace />;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Accueil />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/tableau-de-bord" element={<TableauDeBord />} />
          <Route path="/immeubles" element={<Buildings />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/contrats" element={<Contracts />} />
          <Route path="/assemblees" element={<Assemblies />} />
          <Route path="/agent-ia" element={<AgentIA />} />
          <Route path="/messagerie" element={<Messagerie />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/prestataires" element={<Providers />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/partenaires" element={<Partenaires />} />
          <Route path="/equipe" element={<Team />} />
          <Route path="/facturation" element={<Billing />} />
          <Route path="/abonnement" element={<Abonnement />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/aide" element={<Help />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/test-acces" element={<TestAcces />} />
          <Route path="/demandes-inscription" element={<DemandesInscription />} />
          <Route path="/mon-espace" element={<MonEspace />} />
          <Route path="/mes-interventions" element={<MesInterventions />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App