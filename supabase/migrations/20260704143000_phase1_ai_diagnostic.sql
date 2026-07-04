-- Phase 1: AI Diagnostic Assistant - Clinical Decisions Table
-- This migration creates the foundation for AI-powered clinical decision support

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Clinical Decisions Table
CREATE TABLE public.clinical_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_clinical_decisions_patient ON public.clinical_decisions(patient_id);
CREATE INDEX idx_clinical_decisions_provider ON public.clinical_decisions(provider_id);
CREATE INDEX idx_clinical_decisions_clinic ON public.clinical_decisions(clinic_id);
CREATE INDEX idx_clinical_decisions_created ON public.clinical_decisions(created_at DESC);

-- Row Level Security
ALTER TABLE public.clinical_decisions ENABLE ROW LEVEL SECURITY;

-- Policies: Clinic members can view clinical decisions
CREATE POLICY "Clinic members can view clinical decisions"
  ON public.clinical_decisions FOR SELECT
  TO authenticated
  USING (public.is_clinic_member(clinic_id, auth.uid()));

-- Policies: Clinic providers can insert clinical decisions
CREATE POLICY "Clinic providers can insert clinical decisions"
  ON public.clinical_decisions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  );

-- Policies: Clinic providers can update clinical decisions
CREATE POLICY "Clinic providers can update clinical decisions"
  ON public.clinical_decisions FOR UPDATE
  TO authenticated
  USING (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  )
  WITH CHECK (
    public.is_clinic_member(clinic_id, auth.uid())
    AND auth.uid() = provider_id
  );

-- Trigger for updated_at
CREATE TRIGGER update_clinical_decisions_updated_at
  BEFORE UPDATE ON public.clinical_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medical Knowledge Base Table
CREATE TABLE public.medical_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('symptom', 'condition', 'treatment', 'guideline')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  confidence_level DECIMAL(3,2) DEFAULT 0.80,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for vector similarity search
CREATE INDEX idx_medical_knowledge_embedding 
  ON public.medical_knowledge 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Row Level Security
ALTER TABLE public.medical_knowledge ENABLE ROW LEVEL SECURITY;

-- Policies: All authenticated users can read medical knowledge
CREATE POLICY "Authenticated users can read medical knowledge"
  ON public.medical_knowledge FOR SELECT
  TO authenticated
  USING (true);

-- Policies: Only admins can manage medical knowledge
CREATE POLICY "Admins can manage medical knowledge"
  ON public.medical_knowledge FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_medical_knowledge_updated_at
  BEFORE UPDATE ON public.medical_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to search medical knowledge by similarity
CREATE OR REPLACE FUNCTION public.search_medical_knowledge(
  query_embedding vector(1536),
  category_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  source TEXT,
  confidence_level DECIMAL,
  similarity DECIMAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mk.id,
    mk.category,
    mk.title,
    mk.content,
    mk.source,
    mk.confidence_level,
    1 - (mk.embedding <=> query_embedding) as similarity
  FROM public.medical_knowledge mk
  WHERE
    (category_filter IS NULL OR mk.category = category_filter)
  ORDER BY mk.embedding <=> query_embedding
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_medical_knowledge TO authenticated;
