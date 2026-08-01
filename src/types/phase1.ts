// Phase 1 Feature Types
// This file contains TypeScript types for all Phase 1 advanced features

// ============================================================================
// AI Diagnostic Assistant Types
// ============================================================================

export interface ClinicalDecision {
  id: string;
  patient_id: string;
  provider_id: string;
  clinic_id: string;
  
  // Input Data
  symptoms: Symptom[];
  vitals?: VitalSigns[];
  medical_history_summary?: string;
  current_medications?: Medication[];
  
  // AI Recommendations
  ai_differential_diagnosis?: DifferentialDiagnosis[];
  ai_recommended_tests?: RecommendedTest[];
  ai_treatment_suggestions?: TreatmentSuggestion[];
  ai_risk_factors?: RiskFactor[];
  ai_confidence_score?: number;
  
  // Provider Actions
  provider_diagnosis?: string;
  provider_actions?: ProviderAction[];
  provider_agreement_with_ai?: boolean;
  
  // Outcomes
  actual_diagnosis?: string;
  treatment_outcome?: string;
  follow_up_required?: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  onset: Date;
  description?: string;
  aggravating_factors?: string[];
  relieving_factors?: string[];
}

export interface VitalSigns {
  type: 'blood_pressure' | 'heart_rate' | 'temperature' | 'respiratory_rate' | 'oxygen_saturation' | 'weight' | 'height';
  value: number;
  unit: string;
  recorded_at: Date;
  abnormal?: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  start_date: Date;
  end_date?: Date;
  prescribed_by?: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  reasoning: string;
  recommended_tests: string[];
  red_flags: string[];
}

export interface RecommendedTest {
  test_name: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  reasoning: string;
}

export interface TreatmentSuggestion {
  treatment: string;
  evidence_level: string;
  alternatives?: string[];
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'moderate' | 'high';
  mitigation?: string;
}

export interface ProviderAction {
  action: string;
  timestamp: Date;
  notes?: string;
}

export interface MedicalKnowledge {
  id: string;
  category: 'symptom' | 'condition' | 'treatment' | 'guideline';
  title: string;
  content: string;
  source?: string;
  confidence_level: number;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface DiagnosticRequest {
  patient_id: string;
  symptoms: Symptom[];
  vitals?: VitalSigns[];
  medical_history?: string;
  current_medications?: Medication[];
  context?: {
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    aggravating_factors: string[];
    relieving_factors: string[];
  };
}

export interface DiagnosticResponse {
  differential_diagnosis: DifferentialDiagnosis[];
  recommended_actions: {
    immediate: string[];
    follow_up: string[];
    lifestyle: string[];
  };
  risk_assessment: {
    overall_risk: 'low' | 'moderate' | 'high' | 'critical';
    specific_risks: string[];
    recommended_monitoring: string[];
  };
  confidence_score: number;
  disclaimer: string;
}

// ============================================================================
// Telemedicine Types
// ============================================================================

export interface TelemedicineSession {
  id: string;
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  clinic_id: string;
  
  // Session Details
  daily_room_name: string;
  daily_room_url?: string;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Session Timing
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  duration_seconds?: number;
  
  // Recording
  recording_url?: string;
  recording_status?: 'none' | 'recording' | 'processed' | 'available';
  consent_recording: boolean;
  
  // Technical Details
  connection_quality?: 'excellent' | 'good' | 'fair' | 'poor';
  technical_issues?: TechnicalIssue[];
  
  // Clinical Notes
  clinical_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_actions?: FollowUpAction[];
  
  // Patient Feedback
  patient_rating?: number;
  patient_feedback?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface TechnicalIssue {
  type: 'audio' | 'video' | 'connection' | 'other';
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface FollowUpAction {
  action: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
}

export interface TelemedicineSettings {
  id: string;
  clinic_id: string;
  
  // Configuration
  enable_video: boolean;
  enable_recording: boolean;
  require_consent_for_recording: boolean;
  max_session_duration_minutes: number;
  buffer_time_minutes: number;
  
  // Quality Settings
  preferred_video_quality: 'sd' | 'hd' | 'fhd';
  enable_screen_sharing: boolean;
  enable_chat: boolean;
  
  // Waiting Room
  enable_waiting_room: boolean;
  waiting_room_message?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface JoinToken {
  token: string;
  room_url: string;
  expires_at: string;
  permissions: {
    can_record: boolean;
    can_screen_share: boolean;
    can_chat: boolean;
  };
}

export interface SessionSummary {
  clinical_notes: string;
  diagnosis: string;
  treatment_plan: string;
  follow_up_actions: FollowUpAction[];
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsEvent {
  id: string;
  clinic_id: string;
  user_id?: string;
  user_type?: 'provider' | 'admin' | 'staff' | 'patient';
  
  // Event Details
  event_name: string;
  event_category: string;
  event_properties?: Record<string, any>;
  
  // Context
  page_url?: string;
  referrer_url?: string;
  user_agent?: string;
  
  // Timing
  created_at: string;
}

export interface DailyRevenue {
  clinic_id: string;
  date: string;
  transaction_count: number;
  total_revenue: number;
  average_transaction: number;
  unique_patients: number;
  currencies: string[];
}

export interface DailyAppointments {
  clinic_id: string;
  date: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_shows: number;
  pending: number;
}

export interface ProviderPerformance {
  clinic_id: string;
  provider_id: string;
  provider_name: string;
  specialty: string;
  total_appointments: number;
  completed_appointments: number;
  no_shows: number;
  completion_rate: number;
  unique_patients_seen: number;
}

export interface RevenueMetrics {
  total_revenue: number;
  revenue_growth: number;
  revenue_by_service: ServiceRevenue[];
  revenue_by_provider: ProviderRevenue[];
  revenue_forecast: RevenueForecast[];
  average_revenue_per_patient: number;
  collection_rate: number;
}

export interface ServiceRevenue {
  service_name: string;
  revenue: number;
  growth: number;
}

export interface ProviderRevenue {
  provider_id: string;
  provider_name: string;
  revenue: number;
  growth: number;
}

export interface RevenueForecast {
  period: string;
  forecast: number;
  confidence: number;
}

export interface PatientMetrics {
  total_patients: number;
  new_patients: number;
  patient_retention_rate: number;
  patient_acquisition_cost: number;
  patient_lifetime_value: number;
  patient_satisfaction: number;
}

export interface OperationalMetrics {
  appointment_utilization: number;
  average_wait_time: number;
  no_show_rate: number;
  staff_efficiency: number;
  resource_utilization: number;
}

export interface FinancialHealth {
  current_ratio: number;
  profit_margin: number;
  operating_cash_flow: number;
  days_in_ar: number;
  bad_debt_ratio: number;
}

// ============================================================================
// Patient Portal Types
// ============================================================================

export interface PatientPortalSettings {
  id: string;
  patient_id: string;
  clinic_id: string;
  
  // Preferences
  enable_appointments: boolean;
  enable_messaging: boolean;
  enable_records_access: boolean;
  enable_payments: boolean;
  
  // Notifications
  email_appointment_reminders: boolean;
  sms_appointment_reminders: boolean;
  email_test_results: boolean;
  sms_test_results: boolean;
  
  // Security
  require_2fa: boolean;
  session_timeout_minutes: number;
  
  // Language
  preferred_language: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PatientMessage {
  id: string;
  patient_id: string;
  provider_id?: string;
  clinic_id: string;
  
  // Message Content
  subject?: string;
  body: string;
  message_type: 'inquiry' | 'appointment_request' | 'prescription_refill' | 'test_result' | 'general';
  
  // Attachments
  attachments?: MessageAttachment[];
  
  // Status
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Thread
  thread_id?: string;
  parent_message_id?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  read_at?: string;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface MessageThread {
  thread_id: string;
  subject: string;
  message_type: string;
  status: string;
  priority: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
}

export interface PatientFeedback {
  id: string;
  patient_id: string;
  appointment_id?: string;
  clinic_id: string;
  
  // Ratings
  overall_rating: number;
  provider_rating?: number;
  staff_rating?: number;
  facility_rating?: number;
  
  // Feedback
  what_went_well?: string;
  what_could_improve?: string;
  would_recommend?: boolean;
  
  // Sentiment Analysis (AI)
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
  key_topics?: string[];
  
  // Metadata
  created_at: string;
}

export interface AppointmentSlot {
  id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

// ============================================================================
// Security Types
// ============================================================================

export interface AuditLog {
  id: string;
  clinic_id?: string;
  user_id?: string;
  user_type?: 'provider' | 'admin' | 'staff' | 'patient' | 'system';
  
  // Action Details
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  
  // Timing
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  clinic_id?: string;
  user_id?: string;
  
  // Event Details
  event_type: 'login_attempt' | 'permission_denied' | 'data_access' | 'suspicious_activity' | 'brute_force' | 'data_breach_attempt' | 'unusual_location' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  
  // Resolution
  resolved: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  
  // Timing
  created_at: string;
}

export interface MFASettings {
  id: string;
  user_id: string;
  clinic_id?: string;
  
  // MFA Configuration
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | 'none';
  secret?: string;
  phone_number?: string;
  email_address?: string;
  
  // Backup Codes
  backup_codes?: string[];
  
  // Metadata
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SetupMFAResponse {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
  requires_mfa?: boolean;
}

export interface RegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone?: string;
}

// ============================================================================
// Common Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}
