import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import SpaceBackground from './components/SpaceBackground';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Register from './pages/Register';
import JournalDetail from './pages/JournalDetail';
import JournalForm from './pages/JournalForm';
import Profile from './pages/Profile';
import Search from './pages/Search';
import PlanTrip from './pages/PlanTrip';
import Itinerary from './pages/Itinerary';
import Meetways from './pages/Meetways';
import MeetwayDetail from './pages/MeetwayDetail';
import CreateMeetway from './pages/CreateMeetway';
import AIPlanTrip from './pages/AIPlanTrip';
import EditMeetway from './pages/EditMeetway';
import JournalBudget from './pages/JournalBudget';
import JournalPacking from './pages/JournalPacking';
import Onboarding from './pages/Onboarding';
import TravelLens from './pages/TravelLens';
import JustSplit from './pages/JustSplit';
import JustSplitDetail from './pages/JustSplitDetail';
import VerifyEmail from './pages/VerifyEmail';

// Routes where the shell chrome (navbar, bottom nav, background) is hidden
const AUTH_PATHS = ['/welcome', '/login', '/register', '/verify-email'];

function AppShell() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  // First-time visitor: redirect to /welcome before anything else
  const hasSeenOnboarding = localStorage.getItem('roamera_onboarded');
  if (!loading && !user && !hasSeenOnboarding && !isAuthPage) {
    return <Navigate to="/welcome" replace />;
  }

  // Unauthenticated user hitting app routes → send to login (after onboarding seen)
  if (!loading && !user && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {!isAuthPage && <SpaceBackground />}
      {!isAuthPage && <Navbar />}

      <div style={isAuthPage ? {} : { paddingBottom: 64 }}>
        <Routes>
          {/* Core */}
          <Route path="/"                     element={<Feed />} />

          {/* Auth / onboarding — no chrome */}
          <Route path="/welcome"              element={<Onboarding />} />
          <Route path="/login"                element={<Login />} />
          <Route path="/register"             element={<Register />} />
          <Route path="/verify-email"         element={<VerifyEmail />} />

          {/* Journals */}
          <Route path="/journals/:id"         element={<JournalDetail />} />
          <Route path="/journals/:id/edit"    element={<JournalForm />} />
          <Route path="/journals/:id/budget"  element={<JournalBudget />} />
          <Route path="/journals/:id/packing" element={<JournalPacking />} />
          <Route path="/create"               element={<JournalForm />} />

          {/* Users */}
          <Route path="/users/:id"            element={<Profile />} />
          <Route path="/search"               element={<Search />} />

          {/* Planning */}
          <Route path="/plan/:destination"    element={<PlanTrip />} />
          <Route path="/ai-planner"           element={<AIPlanTrip />} />
          <Route path="/itinerary/:id"        element={<Itinerary />} />

          {/* TravelLens */}
          <Route path="/travellens"           element={<TravelLens />} />

          {/* JustSplit */}
          <Route path="/justsplit"            element={<JustSplit />} />
          <Route path="/justsplit/:id"        element={<JustSplitDetail />} />

          {/* Meetways — must be ordered: specifics before :id wildcard */}
          <Route path="/meetways"             element={<Meetways />} />
          <Route path="/meetways/create"      element={<CreateMeetway />} />
          <Route path="/meetways/:id/edit"    element={<EditMeetway />} />
          <Route path="/meetways/:id"         element={<MeetwayDetail />} />
        </Routes>
      </div>

      {!isAuthPage && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
