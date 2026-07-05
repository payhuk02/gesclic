// Phase 2 TypeScript Types
// Integration Marketplace, API Platform, Workflow Automation, Multi-Location Management

// ============================================================================
// INTEGRATION MARKETPLACE TYPES
// ============================================================================

export type IntegrationCategory = 
  | 'ehr' 
  | 'medical_device' 
  | 'lab' 
  | 'imaging' 
  | 'billing' 
  | 'communication' 
  | 'analytics' 
  | 'custom';

export type PricingModel = 'free' | 'freemium' | 'paid' | 'enterprise';

export type AuthType = 'oauth2' | 'api_key' | 'basic_auth' | 'custom';

export type IntegrationStatus = 'pending' | 'approved' | 'rejected' | 'deprecated';

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export type InstanceStatus = 'active' | 'inactive' | 'error' | 'suspended';

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export type ReviewStatus = 'published' | 'hidden' | 'flagged';

// Integration Catalog
export interface IntegrationCatalog {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  developer_id?: string;
  
  // App Details
  logo_url?: string;
  screenshots: string[];
  version: string;
  pricing_model: PricingModel;
  pricing_details: Record<string, any>;
  
  // Technical Details
  auth_type: AuthType;
  api_documentation_url?: string;
  webhook_url?: string;
  sdk_urls: Record<string, string>;
  
  // Ratings & Reviews
  average_rating: number;
  total_reviews: number;
  total_installs: number;
  
  // Status
  status: IntegrationStatus;
  featured: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Integration Instance
export interface IntegrationInstance {
  id: string;
  clinic_id: string;
  integration_id: string;
  
  // Configuration
  config: Record<string, any>;
  auth_credentials?: Record<string, any>;
  enabled: boolean;
  
  // Webhook Configuration
  webhook_url?: string;
  webhook_events: string[];
  
  // Sync Settings
  sync_frequency: SyncFrequency;
  last_sync_at?: string;
  next_sync_at?: string;
  
  // Status
  status: InstanceStatus;
  error_message?: string;
  
  // Metadata
  installed_at: string;
  updated_at: string;
}

// Integration Review
export interface IntegrationReview {
  id: string;
  integration_id: string;
  clinic_id?: string;
  user_id?: string;
  
  // Review
  rating: number;
  title?: string;
  review?: string;
  
  // Helpful Votes
  helpful_count: number;
  
  // Status
  verified_purchase: boolean;
  status: ReviewStatus;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  integration_instance_id: string;
  
  // Event Details
  event_type: string;
  event_data: Record<string, any>;
  
  // Delivery
  delivery_url: string;
  delivery_status: WebhookDeliveryStatus;
  delivery_attempts: number;
  last_delivery_attempt?: string;
  delivery_response?: string;
  
  // Metadata
  created_at: string;
  delivered_at?: string;
}

// OAuth Token
export interface OAuthToken {
  id: string;
  integration_instance_id: string;
  user_id: string;
  
  // Token Details
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at?: string;
  scope: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Integration Filters
export interface IntegrationFilters {
  category?: IntegrationCategory;
  pricing_model?: PricingModel;
  featured?: boolean;
  min_rating?: number;
  search?: string;
}

// ============================================================================
// API PLATFORM TYPES
// ============================================================================

export type APIMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type APIVersion = 'v1' | 'v2';

export type RateLimitTier = 'free' | 'basic' | 'pro' | 'enterprise';

// API Key
export interface APIKey {
  id: string;
  user_id: string;
  clinic_id: string;
  
  // Key Details
  key_prefix: string;
  key_hash: string;
  name: string;
  
  // Permissions
  scopes: string[];
  
  // Rate Limiting
  rate_limit_tier: RateLimitTier;
  requests_per_minute: number;
  requests_per_day: number;
  
  // Status
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// API Request Log
export interface APIRequestLog {
  id: string;
  api_key_id: string;
  
  // Request Details
  method: APIMethod;
  path: string;
  version: APIVersion;
  query_params?: Record<string, any>;
  request_body?: Record<string, any>;
  
  // Response Details
  status_code: number;
  response_body?: Record<string, any>;
  response_time_ms: number;
  
  // Metadata
  ip_address: string;
  user_agent?: string;
  created_at: string;
}

// Webhook Subscription
export interface WebhookSubscription {
  id: string;
  user_id: string;
  clinic_id: string;
  
  // Subscription Details
  name: string;
  url: string;
  events: string[];
  
  // Security
  secret?: string;
  
  // Status
  is_active: boolean;
  
  // Delivery Stats
  total_delivered: number;
  total_failed: number;
  last_delivered_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// WORKFLOW AUTOMATION TYPES
// ============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export type TriggerType = 'manual' | 'event' | 'schedule' | 'webhook';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export type WorkflowCategory = 'appointment' | 'patient' | 'billing' | 'notification' | 'custom';

// Workflow Node Types
export type NodeType = 'trigger' | 'action' | 'condition' | 'loop' | 'delay' | 'transform';

// Workflow Definition
export interface WorkflowDefinition {
  id: string;
  clinic_id: string;
  created_by: string;
  
  // Workflow Details
  name: string;
  description?: string;
  category?: WorkflowCategory;
  
  // Workflow Definition (JSON)
  definition: WorkflowGraph;
  
  // Status
  status: WorkflowStatus;
  version: number;
  
  // Execution Stats
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_execution_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Workflow Graph (nodes and edges)
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
}

// Workflow Node
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, any>;
}

// Workflow Edge
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

// Workflow Trigger
export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  triggered_by?: string;
  
  // Execution Context
  trigger_type: TriggerType;
  trigger_data?: Record<string, any>;
  input_data?: Record<string, any>;
  
  // Execution State
  status: ExecutionStatus;
  current_node_id?: string;
  execution_state?: Record<string, any>;
  
  // Results
  output_data?: Record<string, any>;
  error_message?: string;
  error_details?: Record<string, any>;
  
  // Timing
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

// Workflow Log
export interface WorkflowLog {
  id: string;
  execution_id: string;
  
  // Log Details
  level: LogLevel;
  node_id?: string;
  message: string;
  data?: Record<string, any>;
  
  // Timing
  created_at: string;
}

// Workflow Template
export interface WorkflowTemplate {
  id: string;
  
  // Template Details
  name: string;
  description?: string;
  category?: WorkflowCategory;
  
  // Template Definition
  definition: WorkflowGraph;
  
  // Metadata
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MULTI-LOCATION MANAGEMENT TYPES
// ============================================================================

export type LocationType = 'region' | 'clinic' | 'department' | 'room';

export type LocationStatus = 'active' | 'inactive' | 'maintenance';

export type ResourceType = 'room' | 'equipment' | 'bed' | 'other';

export type TransferType = 'patient' | 'staff' | 'resource' | 'inventory';

export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

// Location
export interface Location {
  id: string;
  parent_id?: string;
  clinic_id: string;
  
  // Location Details
  name: string;
  type: LocationType;
  code?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  
  // Contact
  phone?: string;
  email?: string;
  
  // Capacity
  capacity?: number;
  operating_hours?: Record<string, { open: string; close: string }>;
  
  // Status
  status: LocationStatus;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Location Staff
export interface LocationStaff {
  id: string;
  location_id: string;
  user_id: string;
  
  // Assignment Details
  role: string;
  is_primary: boolean;
  
  // Schedule
  schedule?: Record<string, Array<{ start: string; end: string }>>;
  
  // Status
  status: 'active' | 'inactive' | 'on_leave';
  
  // Metadata
  assigned_at: string;
  updated_at: string;
}

// Location Resource
export interface LocationResource {
  id: string;
  location_id: string;
  
  // Resource Details
  name: string;
  type: ResourceType;
  capacity?: number;
  
  // Availability
  available: boolean;
  maintenance_notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Location Metrics
export interface LocationMetrics {
  id: string;
  location_id: string;
  
  // Metrics
  metric_date: string;
  metric_type: string;
  metric_value: number;
  metric_details?: Record<string, any>;
  
  // Metadata
  created_at: string;
}

// Location Transfer
export interface LocationTransfer {
  id: string;
  from_location_id: string;
  to_location_id: string;
  
  // Transfer Details
  transfer_type: TransferType;
  item_id?: string;
  item_type?: string;
  
  // Status
  status: TransferStatus;
  
  // Timing
  requested_at: string;
  completed_at?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export type SortOrder = 'asc' | 'desc';

export type SortOption = {
  field: string;
  order: SortOrder;
};
