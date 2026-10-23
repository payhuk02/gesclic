import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleGuard from "@/components/RoleGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { AppRole } from "@/contexts/ClinicContext";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClinicBrandingProvider } from "@/components/ClinicBrandingProvider";
import { createQueryClient } from "@/lib/cache/react-query-config";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Patients = lazy(() => import("./pages/Patients"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Payments = lazy(() => import("./pages/Payments"));
const Laboratory = lazy(() => import("./pages/Laboratory"));
const Pharmacy = lazy(() => import("./pages/Pharmacy"));
const Staff = lazy(() => import("./pages/Staff"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reports = lazy(() => import("./pages/Reports"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Integrations = lazy(() => import("./pages/Integrations"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));

// Phase 1 Features
const Telemedicine = lazy(() => import("./pages/Telemedicine"));
const TelemedicineJoin = lazy(() => import("./pages/TelemedicineJoin"));
const Security = lazy(() => import("./pages/Security"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));

// Phase 2 Features
const APIPlatform = lazy(() => import("./pages/APIPlatform"));
const WorkflowAutomation = lazy(() => import("./pages/WorkflowAutomation"));
const Webhooks = lazy(() => import("./pages/Webhooks"));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard"));
const SuperAdminClinics = lazy(() => import("./pages/super-admin/SuperAdminClinics"));
const SuperAdminUsers = lazy(() => import("./pages/super-admin/SuperAdminUsers"));
const SuperAdminAnalytics = lazy(() => import("./pages/super-admin/SuperAdminAnalytics"));
const SuperAdminBilling = lazy(() => import("./pages/super-admin/SuperAdminBilling"));
const SuperAdminActivity = lazy(() => import("./pages/super-admin/SuperAdminActivity"));
const SuperAdminSettings = lazy(() => import("./pages/super-admin/SuperAdminSettings"));
const SuperAdminSecurity = lazy(() => import("./pages/super-admin/SuperAdminSecurity"));
const SuperAdminAuditLogs = lazy(() => import("./pages/super-admin/SuperAdminAuditLogs"));
const SuperAdminFeatureFlags = lazy(() => import("./pages/super-admin/SuperAdminFeatureFlags"));
const SuperAdminSystemHealth = lazy(() => import("./pages/super-admin/SuperAdminSystemHealth"));
const SuperAdminEmailTemplates = lazy(() => import("./pages/super-admin/SuperAdminEmailTemplates"));
const SuperAdminSupport = lazy(() => import("./pages/super-admin/SuperAdminSupport"));
const SuperAdminAnnouncements = lazy(() => import("./pages/super-admin/SuperAdminAnnouncements"));
const SuperAdminBackup = lazy(() => import("./pages/super-admin/SuperAdminBackup"));
const SuperAdminAPIManagement = lazy(() => import("./pages/super-admin/SuperAdminAPIManagement"));
const SuperAdminAI = lazy(() => import("./pages/super-admin/SuperAdminAI"));

const queryClient = createQueryClient();

const ProtectedPages = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const RoleProtected = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: AppRole[];
}) => (
  <ProtectedRoute>
    <RoleGuard allowedRoles={roles} redirectTo="/dashboard">
      {children}
    </RoleGuard>
  </ProtectedRoute>
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <FeatureFlagsProvider>
            <ClinicProvider>
              <ClinicBrandingProvider>
              <SuperAdminProvider>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/invite/:token" element={<InviteAccept />} />
                  <Route path="/onboarding" element={<ProtectedPages><Onboarding /></ProtectedPages>} />
                  <Route path="/dashboard" element={<ProtectedPages><Dashboard /></ProtectedPages>} />
                  <Route path="/appointments" element={<ProtectedPages><Appointments /></ProtectedPages>} />
                  <Route path="/patients" element={<ProtectedPages><Patients /></ProtectedPages>} />
                  <Route path="/patients/:id" element={<ProtectedPages><PatientDetail /></ProtectedPages>} />
                  <Route path="/medical-records" element={<ProtectedPages><MedicalRecords /></ProtectedPages>} />
                  <Route path="/prescriptions" element={<RoleProtected roles={["admin", "medecin"]}><Prescriptions /></RoleProtected>} />
                  <Route path="/payments" element={<RoleProtected roles={["admin", "secretaire"]}><Payments /></RoleProtected>} />
                  <Route path="/laboratory" element={<RoleProtected roles={["admin", "medecin", "infirmier"]}><Laboratory /></RoleProtected>} />
                  <Route path="/pharmacy" element={<RoleProtected roles={["admin", "medecin", "infirmier"]}><Pharmacy /></RoleProtected>} />
                  <Route path="/staff" element={<RoleProtected roles={["admin"]}><Staff /></RoleProtected>} />
                  <Route path="/settings" element={<ProtectedPages><SettingsPage /></ProtectedPages>} />
                  <Route path="/subscriptions" element={<RoleProtected roles={["admin"]}><Subscriptions /></RoleProtected>} />
                  <Route path="/reports" element={<RoleProtected roles={["admin", "medecin"]}><Reports /></RoleProtected>} />
                  <Route path="/integrations" element={<RoleProtected roles={["admin"]}><Integrations /></RoleProtected>} />
                  <Route path="/oauth/callback" element={<RoleProtected roles={["admin"]}><OAuthCallback /></RoleProtected>} />
                  
                  {/* Phase 1 Features */}
                  <Route path="/telemedicine" element={<RoleProtected roles={["admin", "medecin"]}><Telemedicine /></RoleProtected>} />
                  <Route path="/t/:joinCode" element={<TelemedicineJoin />} />
                  <Route path="/telemedicine/join/:sessionId/:token" element={<TelemedicineJoin />} />
                  <Route path="/telemedicine/join/:sessionId" element={<TelemedicineJoin />} />
                  <Route path="/security" element={<ProtectedPages><Security /></ProtectedPages>} />
                  <Route path="/advanced-analytics" element={<RoleProtected roles={["admin", "medecin"]}><AdvancedAnalytics /></RoleProtected>} />
                  
                  {/* Phase 2 Features */}
                  <Route path="/api-platform" element={<RoleProtected roles={["admin"]}><APIPlatform /></RoleProtected>} />
                  <Route path="/workflow-automation" element={<RoleProtected roles={["admin"]}><WorkflowAutomation /></RoleProtected>} />
                  <Route path="/webhooks" element={<RoleProtected roles={["admin"]}><Webhooks /></RoleProtected>} />
                  
                  {/* Super Admin Routes — auth required; SuperAdminLayout enforces role */}
                  <Route path="/super-admin" element={<ProtectedPages><SuperAdminDashboard /></ProtectedPages>} />
                  <Route path="/super-admin/clinics" element={<ProtectedPages><SuperAdminClinics /></ProtectedPages>} />
                  <Route path="/super-admin/users" element={<ProtectedPages><SuperAdminUsers /></ProtectedPages>} />
                  <Route path="/super-admin/analytics" element={<ProtectedPages><SuperAdminAnalytics /></ProtectedPages>} />
                  <Route path="/super-admin/billing" element={<ProtectedPages><SuperAdminBilling /></ProtectedPages>} />
                  <Route path="/super-admin/activity" element={<ProtectedPages><SuperAdminActivity /></ProtectedPages>} />
                  <Route path="/super-admin/security" element={<ProtectedPages><SuperAdminSecurity /></ProtectedPages>} />
                  <Route path="/super-admin/audit" element={<ProtectedPages><SuperAdminAuditLogs /></ProtectedPages>} />
                  <Route path="/super-admin/feature-flags" element={<ProtectedPages><SuperAdminFeatureFlags /></ProtectedPages>} />
                  <Route path="/super-admin/health" element={<ProtectedPages><SuperAdminSystemHealth /></ProtectedPages>} />
                  <Route path="/super-admin/email" element={<ProtectedPages><SuperAdminEmailTemplates /></ProtectedPages>} />
                  <Route path="/super-admin/support" element={<ProtectedPages><SuperAdminSupport /></ProtectedPages>} />
                  <Route path="/super-admin/announcements" element={<ProtectedPages><SuperAdminAnnouncements /></ProtectedPages>} />
                  <Route path="/super-admin/backup" element={<ProtectedPages><SuperAdminBackup /></ProtectedPages>} />
                  <Route path="/super-admin/api" element={<ProtectedPages><SuperAdminAPIManagement /></ProtectedPages>} />
                  <Route path="/super-admin/ai" element={<ProtectedPages><SuperAdminAI /></ProtectedPages>} />
                  <Route path="/super-admin/settings" element={<ProtectedPages><SuperAdminSettings /></ProtectedPages>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </SuperAdminProvider>
              </ClinicBrandingProvider>
            </ClinicProvider>
            </FeatureFlagsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
