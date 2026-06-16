import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../contexts/AuthContext'

// Public pages
import Landing from '../pages/public/Landing'
import Pricing from '../pages/public/Pricing'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Member pages
import Dashboard from '../pages/member/Dashboard'
import Profile from '../pages/member/Profile'
import Opportunities from '../pages/member/Opportunities'
import IdeaGenerator from '../pages/member/IdeaGenerator'
import TeamMatching from '../pages/member/TeamMatching'
import Workspace from '../pages/member/Workspace'
import Analytics from '../pages/member/Analytics'
import Syllabus from '../pages/member/Syllabus'
import CanvasGenerator from '../pages/member/CanvasGenerator'
import WeeklyCheckin from '../pages/member/WeeklyCheckin'
import MentorshipBooking from '../pages/member/MentorshipBooking'
import ProjectShowcase from '../pages/member/ProjectShowcase'
import PeerEvaluation from '../pages/member/PeerEvaluation'
import PitchDeckAdvisor from '../pages/member/PitchDeckAdvisor'
import Gradebook from '../pages/manager/Gradebook'
import JobBoard from '../pages/member/JobBoard'
import CustomerValidation from '../pages/member/CustomerValidation'
import FinancialHub from '../pages/member/FinancialHub'
import SlideOutline from '../pages/member/SlideOutline'
import PaymentHistory from '../pages/member/PaymentHistory'
import StartupCertificate from '../pages/member/StartupCertificate'
import IdeationHub from '../pages/hubs/IdeationHub'
import StartupToolsHub from '../pages/hubs/StartupToolsHub'
import EvaluationHub from '../pages/hubs/EvaluationHub'
import CommunityHub from '../pages/hubs/CommunityHub'

// Leader
import TeamManagement from '../pages/leader/TeamManagement'

// Manager
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import TeamMonitoring from '../pages/manager/TeamMonitoring'
import TeamDetail from '../pages/manager/TeamDetail'
import Invitations from '../pages/manager/Invitations'

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard'
import UserManagement from '../pages/admin/UserManagement'
import SubscriptionManagement from '../pages/admin/SubscriptionManagement'
import PaymentManagement from '../pages/admin/PaymentManagement'
import ReportManagement from '../pages/admin/ReportManagement'

const ProtectedRoute = ({ children, allowed }: { children: JSX.Element; allowed: string[] }) => {
  const { role } = useAuth()
  if (allowed.includes('guest')) return children
  if (!role || role === 'guest') return <Navigate to="/login" replace />
  if (!allowed.includes(role)) return <Navigate to="/" replace />
  return children
}

// Role-based redirect after login
const RoleBasedRedirect = () => {
  const { role } = useAuth()
  if (role === 'guest') return <Navigate to="/" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect - role-based */}
      <Route path="/app" element={<RoleBasedRedirect />} />

      {/* Public pages */}
      <Route path="/" element={<PublicLayout />}> 
        <Route index element={<Landing />} />
        <Route path="pricing" element={<Pricing />} />
      </Route>

      <Route element={<AuthLayout />}> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Member / authenticated (MainLayout) */}
      <Route path="/" element={<MainLayout />}>
        <Route
          path="dashboard"
          element={<ProtectedRoute allowed={['member', 'leader', 'manager', 'admin']}><Dashboard /></ProtectedRoute>}
        />
        <Route path="profile" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Profile /></ProtectedRoute>} />
        <Route path="ideation-hub" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><IdeationHub /></ProtectedRoute>} />
        <Route path="startup-tools" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><StartupToolsHub /></ProtectedRoute>} />
        <Route path="evaluation-hub" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><EvaluationHub /></ProtectedRoute>} />
        <Route path="community-hub" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><CommunityHub /></ProtectedRoute>} />
        <Route path="canvas-generator" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><CanvasGenerator /></ProtectedRoute>} />
        <Route path="weekly-checkin" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><WeeklyCheckin /></ProtectedRoute>} />
        <Route path="mentorship-booking" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><MentorshipBooking /></ProtectedRoute>} />
        <Route path="project-showcase" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><ProjectShowcase /></ProtectedRoute>} />
        <Route path="peer-evaluation" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><PeerEvaluation /></ProtectedRoute>} />
        <Route path="pitch-deck-advisor" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><PitchDeckAdvisor /></ProtectedRoute>} />
        <Route path="gradebook" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Gradebook /></ProtectedRoute>} />
        <Route path="job-board" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><JobBoard /></ProtectedRoute>} />
        <Route path="opportunities" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Opportunities /></ProtectedRoute>} />
        <Route path="idea-generator" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><IdeaGenerator /></ProtectedRoute>} />
        <Route path="team-matching" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><TeamMatching /></ProtectedRoute>} />
        <Route path="workspace" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Workspace /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Analytics /></ProtectedRoute>} />
        <Route path="syllabus" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><Syllabus /></ProtectedRoute>} />
        <Route path="customer-validation" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><CustomerValidation /></ProtectedRoute>} />
        <Route path="financial-hub" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><FinancialHub /></ProtectedRoute>} />
        <Route path="slide-outline" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><SlideOutline /></ProtectedRoute>} />
        <Route path="payment-history" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><PaymentHistory /></ProtectedRoute>} />
        <Route path="startup-certificate" element={<ProtectedRoute allowed={['member','leader','manager','admin']}><StartupCertificate /></ProtectedRoute>} />

        <Route path="team-management" element={<ProtectedRoute allowed={['leader','manager','admin']}><TeamManagement /></ProtectedRoute>} />
      </Route>

      {/* Manager routes (MainLayout) */}
      <Route path="/manager" element={<MainLayout />}>
        <Route index element={<ProtectedRoute allowed={['manager','admin']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="teams" element={<ProtectedRoute allowed={['manager','admin']}><TeamMonitoring /></ProtectedRoute>} />
        <Route path="team/:id" element={<ProtectedRoute allowed={['manager','admin']}><TeamDetail /></ProtectedRoute>} />
        <Route path="invitations" element={<ProtectedRoute allowed={['manager','admin']}><Invitations /></ProtectedRoute>} />
      </Route>

      {/* Admin routes (AdminLayout) */}
      <Route path="/admin" element={<MainLayout />}>
        <Route index element={<ProtectedRoute allowed={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowed={['admin', 'leader']}><UserManagement /></ProtectedRoute>} />
        <Route path="subscriptions" element={<ProtectedRoute allowed={['admin']}><SubscriptionManagement /></ProtectedRoute>} />
        <Route path="payments" element={<ProtectedRoute allowed={['admin']}><PaymentManagement /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute allowed={['admin']}><ReportManagement /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
