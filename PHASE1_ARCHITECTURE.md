# Phase 1 Implementation Architecture
**Gesclic Advanced Features - Phase 1 Foundation**
**Timeline**: 3-6 months
**Focus**: AI Intelligence, Telemedicine, Analytics, Patient Portal

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  React App (Vite)        │  Patient Portal (React Native/Web)   │
│  - Dashboard             │  - Appointment Scheduling           │
│  - Clinical Tools        │  - Medical Records Access            │
│  - Telemedicine UI       │  - Secure Messaging                 │
│  - Analytics Dashboard    │  - Payment Portal                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Vercel Edge Functions  │  Supabase Edge Functions             │
│  - Rate Limiting         │  - AI Diagnostic Service              │
│  - Authentication        │  - Telemedicine WebRTC Signaling     │
│  - Request Routing      │  - Data Processing Pipelines          │
│  - Response Caching      │  - Webhook Handlers                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Database      │  External Services                    │
│  - Clinical Data        │  - AI Services (Lovable, OpenAI)      │
│  - Patient Records      │  - Telemedicine (Daily.co/Twilio)     │
│  - Analytics Data       │  - Payment Processing (Stripe)         │
│  - User Management      │  - Email/SMS (SendGrid/Twilio)        │
│  - Audit Logs           │  - Storage (Supabase Storage)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 Feature Specifications

### 1. Enhanced AI Diagnostic Assistant

#### Technical Stack
- **AI Service**: Lovable AI Gateway (existing) + OpenAI GPT-4 Medical
- **Database**: Supabase (PostgreSQL) with pgvector for embeddings
- **Caching**: Redis for frequent diagnoses
- **Monitoring**: Custom analytics for AI performance

#### Database Schema

```sql
-- Clinical Decisions Table
CREATE TABLE clinical_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES doctors(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Input Data
  symptoms JSONB NOT NULL,
  vitals JSONB,
  medical_history_summary TEXT,
  current_medications JSONB,
  
  -- AI Recommendations
  ai_differential_diagnosis JSONB,
  ai_recommended_tests JSONB,
  ai_treatment_suggestions JSONB,
  ai_risk_factors JSONB,
  ai_confidence_score DECIMAL(3,2),
  
  -- Provider Actions
  provider_diagnosis TEXT,
  provider_actions JSONB,
  provider_agreement_with_ai BOOLEAN,
  
  -- Outcomes
  actual_diagnosis TEXT,
  treatment_outcome TEXT,
  follow_up_required BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clinical_decisions_patient ON clinical_decisions(patient_id);
CREATE INDEX idx_clinical_decisions_provider ON clinical_decisions(provider_id);
CREATE INDEX idx_clinical_decisions_created ON clinical_decisions(created_at DESC);

-- Medical Knowledge Base
CREATE TABLE medical_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'symptom', 'condition', 'treatment', 'guideline'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  confidence_level DECIMAL(3,2),
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_knowledge_embedding ON medical_knowledge USING ivfflat (embedding vector_cosine_ops);
```

#### API Endpoints

```typescript
// AI Diagnostic Service
interface AIDiagnosticService {
  // Get differential diagnosis
  getDifferentialDiagnosis(request: DiagnosticRequest): Promise<DiagnosticResponse>;
  
  // Check drug interactions
  checkDrugInteractions(medications: Medication[]): Promise<InteractionAlert[]>;
  
  // Get clinical guidelines
  getClinicalGuidelines(condition: string): Promise<Guideline[]>;
  
  // Analyze symptoms with context
  analyzeSymptomsWithContext(request: ContextualAnalysisRequest): Promise<AnalysisResponse>;
}

interface DiagnosticRequest {
  patientId: string;
  symptoms: Symptom[];
  vitals?: VitalSigns[];
  medicalHistory?: MedicalRecord[];
  currentMedications?: Medication[];
  context?: {
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    aggravatingFactors: string[];
    relievingFactors: string[];
  };
}

interface DiagnosticResponse {
  differentialDiagnosis: {
    condition: string;
    probability: number;
    reasoning: string;
    recommendedTests: string[];
    redFlags: string[];
  }[];
  recommendedActions: {
    immediate: string[];
    followUp: string[];
    lifestyle: string[];
  };
  riskAssessment: {
    overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    specificRisks: string[];
    recommendedMonitoring: string[];
  };
  confidenceScore: number;
  disclaimer: string;
}
```

#### Implementation Priority
1. **Week 1-2**: Database schema and basic API structure
2. **Week 3-4**: AI service integration with existing Lovable gateway
3. **Week 5-6**: UI components for diagnostic assistance
4. **Week 7-8**: Drug interaction checking
5. **Week 9-10**: Clinical guidelines integration
6. **Week 11-12**: Testing and refinement

---

### 2. Basic Telemedicine Integration

#### Technical Stack
- **Video Service**: Daily.co (HIPAA-compliant, easy integration)
- **Signaling**: Supabase Realtime for session management
- **Recording**: Daily.co built-in recording with Supabase Storage
- **Scheduling**: Integration with existing appointments system

#### Database Schema

```sql
-- Telemedicine Sessions
CREATE TABLE telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID NOT NULL REFERENCES doctors(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Session Details
  daily_room_name TEXT UNIQUE NOT NULL,
  daily_room_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'
  
  -- Session Timing
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Recording
  recording_url TEXT,
  recording_status TEXT, -- 'none', 'recording', 'processed', 'available'
  consent_recording BOOLEAN DEFAULT false,
  
  -- Technical Details
  connection_quality TEXT, -- 'excellent', 'good', 'fair', 'poor'
  technical_issues JSONB,
  
  -- Clinical Notes
  clinical_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_actions JSONB,
  
  -- Patient Feedback
  patient_rating INTEGER, -- 1-5
  patient_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemedicine_sessions_appointment ON telemedicine_sessions(appointment_id);
CREATE INDEX idx_telemedicine_sessions_patient ON telemedicine_sessions(patient_id);
CREATE INDEX idx_telemedicine_sessions_provider ON telemedicine_sessions(provider_id);
CREATE INDEX idx_telemedicine_sessions_status ON telemedicine_sessions(status);
CREATE INDEX idx_telemedicine_sessions_scheduled ON telemedicine_sessions(scheduled_start);

-- Telemedicine Settings (per clinic)
CREATE TABLE telemedicine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Configuration
  enable_video BOOLEAN DEFAULT true,
  enable_recording BOOLEAN DEFAULT false,
  require_consent_for_recording BOOLEAN DEFAULT true,
  max_session_duration_minutes INTEGER DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 5,
  
  -- Quality Settings
  preferred_video_quality TEXT DEFAULT 'hd', -- 'sd', 'hd', 'fhd'
  enable_screen_sharing BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  
  -- Waiting Room
  enable_waiting_room BOOLEAN DEFAULT true,
  waiting_room_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id)
);
```

#### API Endpoints

```typescript
// Telemedicine Service
interface TelemedicineService {
  // Create video session
  createSession(appointmentId: string): Promise<TelemedicineSession>;
  
  // Join session
  joinSession(sessionId: string, role: 'provider' | 'patient'): Promise<JoinToken>;
  
  // End session
  endSession(sessionId: string, summary: SessionSummary): Promise<void>;
  
  // Get session recording
  getRecording(sessionId: string): Promise<RecordingInfo>;
  
  // Check session status
  getSessionStatus(sessionId: string): Promise<SessionStatus>;
}

interface TelemedicineSession {
  id: string;
  appointmentId: string;
  roomUrl: string;
  roomName: string;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed';
  scheduledStart: Date;
  scheduledEnd: Date;
  recordingEnabled: boolean;
}

interface JoinToken {
  token: string;
  roomUrl: string;
  expiresAt: Date;
  permissions: {
    canRecord: boolean;
    canScreenShare: boolean;
    canChat: boolean;
  };
}
```

#### Implementation Priority
1. **Week 1-2**: Database schema and Daily.co integration
2. **Week 3-4**: Session management and scheduling integration
3. **Week 5-6**: Video UI components (React)
4. **Week 7-8**: Recording and storage integration
5. **Week 9-10**: Waiting room and session controls
6. **Week 11-12**: Testing and HIPAA compliance verification

---

### 3. Advanced Analytics Dashboard

#### Technical Stack
- **Data Warehouse**: Supabase with materialized views
- **Visualization**: Recharts (existing) + D3.js for advanced charts
- **Real-time**: Supabase Realtime subscriptions
- **Export**: ExcelJS for Excel, jsPDF for PDF

#### Database Schema

```sql
-- Analytics Events (for tracking user actions)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT, -- 'provider', 'admin', 'staff'
  
  -- Event Details
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_properties JSONB,
  
  -- Context
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_clinic ON analytics_events(clinic_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- Materialized Views for Performance

-- Daily Revenue
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT 
  clinic_id,
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  AVG(amount) as average_transaction,
  COUNT(DISTINCT patient_name) as unique_patients
FROM payments
WHERE status = 'completed'
GROUP BY clinic_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_revenue ON mv_daily_revenue(clinic_id, date);

-- Daily Appointments
CREATE MATERIALIZED VIEW mv_daily_appointments AS
SELECT 
  clinic_id,
  DATE(created_at) as date,
  COUNT(*) as total_appointments,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
  SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_shows
FROM appointments
GROUP BY clinic_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_appointments ON mv_daily_appointments(clinic_id, date);

-- Refresh Function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_appointments;
END;
$$ LANGUAGE plpgsql;
```

#### Dashboard Components

```typescript
// Dashboard Types
interface AnalyticsDashboard {
  // Executive Dashboard
  executive: {
    revenueMetrics: RevenueMetrics;
    patientMetrics: PatientMetrics;
    operationalMetrics: OperationalMetrics;
    financialHealth: FinancialHealth;
  };
  
  // Clinical Dashboard
  clinical: {
    qualityMetrics: QualityMetrics;
    providerPerformance: ProviderPerformance[];
    patientOutcomes: PatientOutcomes;
    guidelineAdherence: GuidelineAdherence;
  };
  
  // Provider Dashboard
  provider: {
    personalMetrics: PersonalMetrics;
    patientPanel: PatientPanel;
    appointmentUtilization: AppointmentUtilization;
    patientFeedback: PatientFeedback;
  };
}

interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number; // percentage
  revenueByService: ServiceRevenue[];
  revenueByProvider: ProviderRevenue[];
  revenueForecast: RevenueForecast[];
  averageRevenuePerPatient: number;
  collectionRate: number;
}

interface PatientMetrics {
  totalPatients: number;
  newPatients: number;
  patientRetentionRate: number;
  patientAcquisitionCost: number;
  patientLifetimeValue: number;
  patientSatisfaction: number; // NPS
}
```

#### Implementation Priority
1. **Week 1-2**: Analytics events tracking and database schema
2. **Week 3-4**: Materialized views and aggregation queries
3. **Week 5-6**: Executive dashboard components
4. **Week 7-8**: Clinical dashboard components
5. **Week 9-10**: Provider dashboard components
6. **Week 11-12**: Export functionality and report builder

---

### 4. Patient Portal MVP

#### Technical Stack
- **Frontend**: React (separate build) with mobile-first design
- **Authentication**: Supabase Auth with patient-specific flows
- **Real-time**: Supabase Realtime for notifications
- **Payments**: Stripe Elements for payment processing

#### Database Schema

```sql
-- Patient Portal Settings
CREATE TABLE patient_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Preferences
  enable_appointments BOOLEAN DEFAULT true,
  enable_messaging BOOLEAN DEFAULT true,
  enable_records_access BOOLEAN DEFAULT true,
  enable_payments BOOLEAN DEFAULT true,
  
  -- Notifications
  email_appointment_reminders BOOLEAN DEFAULT true,
  sms_appointment_reminders BOOLEAN DEFAULT false,
  email_test_results BOOLEAN DEFAULT true,
  sms_test_results BOOLEAN DEFAULT false,
  
  -- Security
  require_2fa BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 30,
  
  -- Language
  preferred_language TEXT DEFAULT 'fr',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, clinic_id)
);

-- Patient Messages
CREATE TABLE patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  provider_id UUID REFERENCES doctors(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Message Content
  subject TEXT,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'inquiry', 'appointment_request', 'prescription_refill', 'test_result', 'general'
  
  -- Attachments
  attachments JSONB, -- [{url, name, type, size}]
  
  -- Status
  status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Thread
  thread_id UUID,
  parent_message_id UUID REFERENCES patient_messages(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_patient_messages_patient ON patient_messages(patient_id);
CREATE INDEX idx_patient_messages_provider ON patient_messages(provider_id);
CREATE INDEX idx_patient_messages_thread ON patient_messages(thread_id);
CREATE INDEX idx_patient_messages_status ON patient_messages(status);

-- Patient Feedback
CREATE TABLE patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  
  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  provider_rating INTEGER CHECK (provider_rating >= 1 AND provider_rating <= 5),
  staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
  
  -- Feedback
  what_went_well TEXT,
  what_could_improve TEXT,
  would_recommend BOOLEAN,
  
  -- Sentiment Analysis (AI)
  sentiment_score DECIMAL(3,2),
  sentiment_label TEXT, -- 'positive', 'neutral', 'negative'
  key_topics JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_feedback_patient ON patient_feedback(patient_id);
CREATE INDEX idx_patient_feedback_clinic ON patient_feedback(clinic_id);
CREATE INDEX idx_patient_feedback_created ON patient_feedback(created_at DESC);
```

#### Portal Features

```typescript
// Patient Portal Features
interface PatientPortal {
  // Authentication
  auth: {
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (data: RegistrationData) => Promise<AuthResult>;
    resetPassword: (email: string) => Promise<void>;
    setup2FA: () => Promise<Setup2FAResult>;
  };
  
  // Appointments
  appointments: {
    list: () => Promise<Appointment[]>;
    book: (slot: AppointmentSlot) => Promise<Appointment>;
    cancel: (id: string) => Promise<void>;
    reschedule: (id: string, newSlot: AppointmentSlot) => Promise<Appointment>;
  };
  
  // Medical Records
  records: {
    list: () => Promise<MedicalRecord[]>;
    view: (id: string) => Promise<MedicalRecord>;
    download: (id: string, format: 'pdf' | 'json') => Promise<Blob>;
  };
  
  // Messaging
  messaging: {
    listThreads: () => Promise<MessageThread[]>;
    getThread: (id: string) => Promise<Message[]>;
    sendMessage: (threadId: string, message: string) => Promise<Message>;
    markAsRead: (id: string) => Promise<void>;
  };
  
  // Prescriptions
  prescriptions: {
    list: () => Promise<Prescription[]>;
    requestRefill: (id: string) => Promise<RefillRequest>;
  };
  
  // Payments
  payments: {
    list: () => Promise<Payment[]>;
    pay: (id: string, method: PaymentMethod) => Promise<PaymentResult>;
    setupPaymentMethod: (method: PaymentMethod) => Promise<void>;
  };
  
  // Profile
  profile: {
    get: () => Promise<PatientProfile>;
    update: (data: Partial<PatientProfile>) => Promise<PatientProfile>;
    uploadAvatar: (file: File) => Promise<string>;
  };
}
```

#### Implementation Priority
1. **Week 1-2**: Patient authentication and registration flows
2. **Week 3-4**: Appointment booking and management
3. **Week 5-6**: Medical records access and viewing
4. **Week 7-8**: Secure messaging system
5. **Week 9-10**: Payment processing integration
6. **Week 11-12**: Profile management and feedback system

---

## Security & Compliance Enhancements

### Enhanced Security Features

```sql
-- Audit Log Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES auth.users(id),
  user_type TEXT,
  
  -- Action Details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_clinic ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Security Events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'login_attempt', 'permission_denied', 'data_access', 'suspicious_activity'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  details JSONB,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_clinic ON security_events(clinic_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
```

### MFA Implementation

```typescript
// Multi-Factor Authentication
interface MFAService {
  // Enable MFA for user
  enableMFA(userId: string): Promise<SetupMFAResponse>;
  
  // Verify MFA during login
  verifyMFA(userId: string, code: string): Promise<boolean>;
  
  // Generate backup codes
  generateBackupCodes(userId: string): Promise<string[]>;
  
  // Disable MFA
  disableMFA(userId: string, currentCode: string): Promise<void>;
}

interface SetupMFAResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
```

---

## Infrastructure Requirements

### Additional Dependencies

```json
{
  "dependencies": {
    "@daily-co/daily-js": "^0.42.0",
    "@stripe/stripe-js": "^2.1.0",
    "recharts": "^2.10.0",
    "d3": "^7.8.0",
    "exceljs": "^4.3.0",
    "jspdf": "^2.5.1",
    "qrcode.react": "^3.1.0",
    "speakeasy": "^2.0.0",
    "zxcvbn": "^4.4.2"
  },
  "devDependencies": {
    "@types/d3": "^7.4.0",
    "@types/speakeasy": "^2.0.10",
    "@types/zxcvbn": "^4.4.1"
  }
}
```

### Environment Variables

```bash
# AI Services
LOVABLE_API_KEY=your_lovable_api_key
OPENAI_API_KEY=your_openai_api_key

# Telemedicine
DAILY_API_KEY=your_daily_api_key

# Payments
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Security
MFA_SECRET=your_mfa_secret_key
ENCRYPTION_KEY=your_encryption_key

# Analytics
ANALYTICS_ENABLED=true
```

---

## Implementation Timeline

### Month 1: Foundation
- Week 1-2: Architecture setup, database schemas
- Week 3-4: AI diagnostic service foundation

### Month 2: Core Features
- Week 5-6: Telemedicine integration
- Week 7-8: Analytics dashboard foundation

### Month 3: Patient Experience
- Week 9-10: Patient portal MVP
- Week 11-12: Security enhancements

### Months 4-6: Refinement
- Testing and optimization
- Performance tuning
- User feedback integration
- Documentation completion

---

## Success Metrics

### Technical Metrics
- API response time < 200ms (p95)
- Video call quality > 90% good/excellent
- Dashboard load time < 2 seconds
- 99.9% uptime for critical services

### User Metrics
- AI diagnostic adoption rate > 60%
- Telemedicine utilization > 30% of appointments
- Patient portal activation > 80%
- Dashboard daily active users > 70%

### Business Metrics
- Patient satisfaction increase > 20%
- Provider efficiency increase > 25%
- Revenue growth > 15%
- Patient retention improvement > 10%

---

## Next Steps

1. **Immediate**: Set up development environment for Phase 1
2. **Week 1**: Begin database schema implementation
3. **Week 2**: Start AI diagnostic service development
4. **Continuous**: Regular progress reviews and adjustments

---

**Document Version**: 1.0
**Last Updated**: July 4, 2026
**Status**: Ready for Implementation
