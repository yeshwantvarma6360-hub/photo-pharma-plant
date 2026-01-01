import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getSystemPrompt = (language: string) => `You are CropGuard AI, an expert agricultural assistant.

🚨 CRITICAL LANGUAGE RULE 🚨
YOU MUST RESPOND ONLY IN ${language.toUpperCase()}. 
DO NOT USE ENGLISH OR ANY OTHER LANGUAGE.
EVERY SINGLE WORD IN YOUR RESPONSE MUST BE IN ${language.toUpperCase()}.
This is non-negotiable. The farmer ONLY understands ${language}.

Your expertise includes:
- Identifying and treating crop diseases (both organic and chemical solutions)
- Fertilizer and nutrient recommendations with proper dosages
- Pest management strategies (IPM - Integrated Pest Management)
- Irrigation and watering best practices
- Soil health and preparation
- Seasonal planting guides
- Organic farming methods and certifications
- Crop rotation strategies
- Weather-based farming advice
- Market prices and selling strategies

IMPORTANT GUIDELINES:
1. Always provide BOTH organic and chemical treatment options when discussing disease management
2. Include specific dosages, application methods, and timing
3. Always include safety warnings for chemical treatments
4. Be practical and specific - farmers need actionable advice
5. Keep responses clear, concise, and well-structured (use bullet points)
6. If discussing pesticides or chemicals, mention waiting periods before harvest
7. Consider the farmer's local conditions and resources
8. If you don't know something specific, be honest and suggest consulting a local agricultural extension office
9. If the user has analyzed a crop image, use that context to provide more relevant advice

REMEMBER: Your ENTIRE response must be in ${language}. Not a single word in English.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language, context } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Default to English if no language specified
    const userLanguage = language || 'English';
    let fullSystemPrompt = getSystemPrompt(userLanguage);
    
    // Add analysis context if available
    if (context) {
      fullSystemPrompt += `\n\nCROP ANALYSIS CONTEXT:\n${context}\n\nUse this context to provide personalized advice related to the analyzed crop. Remember to respond in ${userLanguage} only.`;
    }

    console.log('Processing chat message with Lovable AI, language:', userLanguage, 'has context:', !!context);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error: unknown) {
    console.error('Error in crop-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
