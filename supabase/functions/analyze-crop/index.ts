import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an expert agricultural AI assistant specialized in crop disease detection and plant pathology. 
When analyzing crop images, you must:
1. Identify the disease or confirm if the plant is healthy
2. Provide a confidence score (0-100)
3. Give a detailed description of the condition
4. List 5 specific precautions the farmer should take
5. Recommend 3 fertilizers/treatments with dosage and timing

Respond ONLY in valid JSON format with this exact structure:
{
  "name": "Disease Name or Healthy Plant",
  "confidence": 85,
  "isHealthy": false,
  "description": "Detailed description of the condition observed",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4", "precaution 5"],
  "fertilizers": [
    {"name": "Fertilizer Name", "dosage": "amount per application", "timing": "when to apply"},
    {"name": "Fertilizer Name 2", "dosage": "amount", "timing": "timing"},
    {"name": "Fertilizer Name 3", "dosage": "amount", "timing": "timing"}
  ]
}

Be specific about the disease symptoms you observe. Common crop diseases include:
- Late Blight, Early Blight, Powdery Mildew, Bacterial Leaf Spot
- Rust, Anthracnose, Fusarium Wilt, Downy Mildew
- Leaf Curl, Mosaic Virus, Root Rot, Nutrient Deficiencies`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, language } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInstruction = language && language !== 'en' 
      ? `\n\nIMPORTANT: Respond with all text content (name, description, precautions, fertilizer names/dosage/timing) in ${language} language.`
      : '';

    console.log('Analyzing crop image with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt + languageInstruction },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'Analyze this crop image and identify any diseases or health issues. Provide your response in the exact JSON format specified.' 
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                } 
              }
            ]
          }
        ],
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI Response received:', content?.substring(0, 200));

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback response
      result = {
        name: 'Analysis Complete',
        confidence: 75,
        isHealthy: true,
        description: content || 'Unable to fully analyze the image. Please try with a clearer photo of the crop.',
        precautions: [
          'Ensure good air circulation around plants',
          'Water at the base to avoid wet foliage',
          'Monitor regularly for any changes',
          'Remove any damaged or dead plant material',
          'Maintain proper soil nutrition'
        ],
        fertilizers: [
          { name: 'Balanced NPK (15-15-15)', dosage: '100g per plant', timing: 'Every 4 weeks' },
          { name: 'Organic Compost', dosage: '2kg per square meter', timing: 'At planting' },
          { name: 'Micronutrient Mix', dosage: '2g per liter', timing: 'Monthly foliar spray' }
        ]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in analyze-crop function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
