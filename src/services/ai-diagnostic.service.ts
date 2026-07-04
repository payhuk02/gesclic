// AI Diagnostic Service
// Service layer for AI-powered clinical decision support

import { supabase } from '@/integrations/supabase/client';
import type { 
  DiagnosticRequest, 
  DiagnosticResponse, 
  ClinicalDecision,
  MedicalKnowledge 
} from '@/types/phase1';

export class AIDiagnosticService {
  private readonly LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;
  private readonly AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

  /**
   * Get differential diagnosis based on symptoms and patient context
   */
  async getDifferentialDiagnosis(request: DiagnosticRequest): Promise<DiagnosticResponse> {
    try {
      // Build the prompt for AI
      const systemPrompt = this.buildDiagnosticSystemPrompt();
      const userPrompt = this.buildDiagnosticUserPrompt(request);

      // Call AI service
      const aiResponse = await this.callAIService(systemPrompt, userPrompt);

      // Parse AI response
      const diagnosticResponse = this.parseDiagnosticResponse(aiResponse);

      // Store clinical decision in database
      await this.storeClinicalDecision(request, diagnosticResponse);

      return diagnosticResponse;
    } catch (error) {
      console.error('Error getting differential diagnosis:', error);
      throw new Error('Failed to get AI diagnostic recommendation');
    }
  }

  /**
   * Check drug interactions
   */
  async checkDrugInteractions(medications: string[]): Promise<any[]> {
    try {
      const systemPrompt = `You are a pharmaceutical expert specializing in drug interactions. 
      Analyze the provided medications and identify potential interactions.
      Return interactions in JSON format with severity levels (mild, moderate, severe).`;

      const userPrompt = `Check for drug interactions in these medications: ${medications.join(', ')}`;

      const response = await this.callAIService(systemPrompt, userPrompt);
      return this.parseDrugInteractions(response);
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      return [];
    }
  }

  /**
   * Get clinical guidelines for a condition
   */
  async getClinicalGuidelines(condition: string): Promise<any[]> {
    try {
      // Search medical knowledge base first
      const { data: knowledge } = await supabase.rpc('search_medical_knowledge', {
        query_embedding: await this.generateEmbedding(condition),
        category_filter: 'guideline',
        limit_count: 5
      });

      if (knowledge && knowledge.length > 0) {
        return knowledge;
      }

      // Fallback to AI if no local knowledge
      const systemPrompt = `You are a medical expert providing clinical guidelines.
      Provide evidence-based guidelines for the given condition following WHO, CDC, or local health authority recommendations.`;

      const userPrompt = `Provide clinical guidelines for: ${condition}`;

      const response = await this.callAIService(systemPrompt, userPrompt);
      return this.parseGuidelines(response);
    } catch (error) {
      console.error('Error getting clinical guidelines:', error);
      return [];
    }
  }

  /**
   * Analyze symptoms with full patient context
   */
  async analyzeSymptomsWithContext(request: DiagnosticRequest): Promise<any> {
    try {
      const systemPrompt = `You are an AI clinical assistant specializing in symptom analysis.
      Analyze symptoms in the context of patient history, medications, and vitals.
      Provide differential diagnosis with confidence scores and recommended next steps.`;

      const userPrompt = this.buildDiagnosticUserPrompt(request);

      const response = await this.callAIService(systemPrompt, userPrompt);
      return this.parseDiagnosticResponse(response);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }

  /**
   * Get clinical decision history for a patient
   */
  async getPatientClinicalDecisions(patientId: string): Promise<ClinicalDecision[]> {
    try {
      const { data, error } = await supabase
        .from('clinical_decisions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting clinical decisions:', error);
      return [];
    }
  }

  /**
   * Store clinical decision in database
   */
  private async storeClinicalDecision(
    request: DiagnosticRequest,
    response: DiagnosticResponse
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase.from('clinical_decisions').insert({
        patient_id: request.patient_id,
        provider_id: userData.user.id,
        clinic_id: await this.getCurrentClinicId(),
        symptoms: request.symptoms,
        vitals: request.vitals,
        medical_history_summary: request.medical_history,
        current_medications: request.current_medications,
        ai_differential_diagnosis: response.differential_diagnosis,
        ai_risk_factors: response.risk_assessment.specific_risks,
        ai_confidence_score: response.confidence_score,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing clinical decision:', error);
    }
  }

  /**
   * Call AI service
   */
  private async callAIService(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(this.AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Build system prompt for diagnostic analysis
   */
  private buildDiagnosticSystemPrompt(): string {
    return `You are an AI clinical assistant specializing in diagnostic support for healthcare providers.
    
IMPORTANT: You are providing decision support, not making definitive diagnoses. Always include appropriate disclaimers.

Your response should include:
1. Differential diagnosis with probability estimates
2. Recommended diagnostic tests
3. Risk assessment
4. Recommended immediate actions
5. Recommended follow-up actions
6. Red flags that require immediate attention

Format your response as valid JSON with this structure:
{
  "differential_diagnosis": [
    {
      "condition": "condition name",
      "probability": 0.0-1.0,
      "reasoning": "explanation",
      "recommended_tests": ["test1", "test2"],
      "red_flags": ["flag1", "flag2"]
    }
  ],
  "recommended_actions": {
    "immediate": ["action1", "action2"],
    "follow_up": ["action1", "action2"],
    "lifestyle": ["recommendation1", "recommendation2"]
  },
  "risk_assessment": {
    "overall_risk": "low|moderate|high|critical",
    "specific_risks": ["risk1", "risk2"],
    "recommended_monitoring": ["monitoring1", "monitoring2"]
  },
  "confidence_score": 0.0-1.0,
  "disclaimer": "appropriate medical disclaimer"
}

Always respond in French.`;
  }

  /**
   * Build user prompt with patient data
   */
  private buildDiagnosticUserPrompt(request: DiagnosticRequest): string {
    let prompt = `Patient symptoms:\n`;
    
    request.symptoms.forEach((symptom, index) => {
      prompt += `${index + 1}. ${symptom.name} (Severity: ${symptom.severity}, Duration: ${symptom.duration})\n`;
      if (symptom.description) {
        prompt += `   Description: ${symptom.description}\n`;
      }
      if (symptom.aggravating_factors?.length) {
        prompt += `   Aggravating factors: ${symptom.aggravating_factors.join(', ')}\n`;
      }
      if (symptom.relieving_factors?.length) {
        prompt += `   Relieving factors: ${symptom.relieving_factors.join(', ')}\n`;
      }
    });

    if (request.vitals?.length) {
      prompt += `\nVital signs:\n`;
      request.vitals.forEach((vital) => {
        prompt += `- ${vital.type}: ${vital.value} ${vital.unit}\n`;
      });
    }

    if (request.medical_history) {
      prompt += `\nMedical history: ${request.medical_history}\n`;
    }

    if (request.current_medications?.length) {
      prompt += `\nCurrent medications:\n`;
      request.current_medications.forEach((med) => {
        prompt += `- ${med.name} ${med.dosage} (${med.frequency})\n`;
      });
    }

    if (request.context) {
      prompt += `\nContext:\n`;
      prompt += `- Duration: ${request.context.duration}\n`;
      prompt += `- Severity: ${request.context.severity}\n`;
      if (request.context.aggravating_factors?.length) {
        prompt += `- Aggravating factors: ${request.context.aggravating_factors.join(', ')}\n`;
      }
      if (request.context.relieving_factors?.length) {
        prompt += `- Relieving factors: ${request.context.relieving_factors.join(', ')}\n`;
      }
    }

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseDiagnosticResponse(aiResponse: string): DiagnosticResponse {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from AI response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return default response if parsing fails
      return {
        differential_diagnosis: [],
        recommended_actions: {
          immediate: [],
          follow_up: [],
          lifestyle: []
        },
        risk_assessment: {
          overall_risk: 'moderate',
          specific_risks: [],
          recommended_monitoring: []
        },
        confidence_score: 0.5,
        disclaimer: 'Unable to parse AI response. Please consult with a healthcare provider.'
      };
    }
  }

  /**
   * Parse drug interactions from AI response
   */
  private parseDrugInteractions(aiResponse: string): any[] {
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return [];
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return parsed.interactions || [];
    } catch (error) {
      console.error('Error parsing drug interactions:', error);
      return [];
    }
  }

  /**
   * Parse clinical guidelines from AI response
   */
  private parseGuidelines(aiResponse: string): any[] {
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return [];
      
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return parsed.guidelines || [];
    } catch (error) {
      console.error('Error parsing guidelines:', error);
      return [];
    }
  }

  /**
   * Generate embedding for semantic search
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // This would call an embedding service like OpenAI's text-embedding-ada-002
    // For now, return a placeholder
    // TODO: Implement actual embedding generation
    return new Array(1536).fill(0);
  }

  /**
   * Get current clinic ID from user context
   */
  private async getCurrentClinicId(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return '';

      const { data } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', userData.user.id)
        .eq('is_active', true)
        .single();

      return data?.clinic_id || '';
    } catch (error) {
      console.error('Error getting clinic ID:', error);
      return '';
    }
  }
}

// Export singleton instance
export const aiDiagnosticService = new AIDiagnosticService();
