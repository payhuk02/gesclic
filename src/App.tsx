import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

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

const queryClient = new QueryClient();

const ProtectedPages = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ClinicProvider>
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
                  <Route path="/prescriptions" element={<ProtectedPages><Prescriptions /></ProtectedPages>} />
                  <Route path="/payments" element={<ProtectedPages><Payments /></ProtectedPages>} />
                  <Route path="/laboratory" element={<ProtectedPages><Laboratory /></ProtectedPages>} />
                  <Route path="/pharmacy" element={<ProtectedPages><Pharmacy /></ProtectedPages>} />
                  <Route path="/staff" element={<ProtectedPages><Staff /></ProtectedPages>} />
                  <Route path="/settings" element={<ProtectedPages><SettingsPage /></ProtectedPages>} />
                  <Route path="/subscriptions" element={<ProtectedPages><Subscriptions /></ProtectedPages>} />
                  <Route path="/reports" element={<ProtectedPages><Reports /></ProtectedPages>} />
                  <Route path="/integrations" element={<ProtectedPages><Integrations /></ProtectedPages>} />
                  <Route path="/oauth/callback" element={<ProtectedPages><OAuthCallback /></ProtectedPages>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ClinicProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
