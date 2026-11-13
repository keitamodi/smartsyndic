import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Buildings from '@/pages/Buildings';
import Maintenance from '@/pages/Maintenance';
import Tickets from '@/pages/Tickets';
import Contracts from '@/pages/Contracts';
import Assemblies from '@/pages/Assemblies';
import AgentIA from '@/pages/AgentIA';
import Messagerie from '@/pages/Messagerie';
import Residents from '@/pages/Residents';
import Providers from '@/pages/Providers';
import Team from '@/pages/Team';
import Billing from '@/pages/Billing';
import Guide from '@/pages/Guide';
import Help from '@/pages/Help';
import About from '@/pages/About';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/immeubles" element={<Buildings />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/contrats" element={<Contracts />} />
        <Route path="/assemblees" element={<Assemblies />} />
        <Route path="/agent-ia" element={<AgentIA />} />
        <Route path="/messagerie" element={<Messagerie />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/prestataires" element={<Providers />} />
        <Route path="/equipe" element={<Team />} />
        <Route path="/facturation" element={<Billing />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/aide" element={<Help />} />
        <Route path="/a-propos" element={<About />} />
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