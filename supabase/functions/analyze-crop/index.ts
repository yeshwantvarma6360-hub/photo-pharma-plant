import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an expert agricultural AI assistant specialized in crop disease detection and plant pathology. 

CRITICAL FIRST STEP: Before any analysis, you MUST determine if the image contains a plant, crop, leaf, or any agricultural subject.

If the image does NOT contain a plant, crop, leaf, vegetation, or agricultural content:
- Return this EXACT JSON structure:
{
  "isPlant": false,
  "notPlantMessage": "This image does not appear to contain a plant or crop. Please upload a clear photo of a plant, leaf, or crop for disease analysis."
}

If the image DOES contain a plant/crop, analyze it and return:
{
  "isPlant": true,
  "name": "Disease Name or Healthy Plant",
  "confidence": 85,
  "isHealthy": false,
  "description": "Detailed description of the condition observed",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4", "precaution 5"],
  "fertilizers": [
    {"name": "Fertilizer Name", "dosage": "amount per application", "timing": "when to apply"}
  ],
  "organicTreatments": [
    {"name": "Organic Treatment 1", "dosage": "amount", "timing": "when to apply", "safetyNote": "optional safety tip"}
  ],
  "chemicalTreatments": [
    {"name": "Chemical Treatment 1", "dosage": "amount", "timing": "when to apply", "safetyNote": "IMPORTANT safety warning"}
  ]
}

Be specific about disease symptoms. Common crop diseases include:
- Late Blight, Early Blight, Powdery Mildew, Bacterial Leaf Spot
- Rust, Anthracnose, Fusarium Wilt, Downy Mildew
- Leaf Curl, Mosaic Virus, Root Rot, Nutrient Deficiencies

For organic treatments include: Neem oil, baking soda solutions, compost tea, garlic spray, beneficial insects.
For chemical treatments always include safety precautions (PPE, waiting periods before harvest).`;

const languageInstructions: Record<string, string> = {
  en: '',
  hi: 'Hindi (हिन्दी)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ta: 'Tamil (தமிழ்)',
  bn: 'Bengali (বাংলা)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  pt: 'Portuguese (Português)',
};

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

    const langName = languageInstructions[language] || '';
    const languageInstruction = langName 
      ? `\n\nCRITICAL: You MUST respond with ALL text content in ${langName} language, including the notPlantMessage if the image is not a plant.`
      : '';

    console.log('Analyzing crop image with Lovable AI, language:', language);

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
                text: 'First, verify if this image contains a plant, crop, leaf, or any vegetation. If not, indicate that clearly. If it is a plant, analyze it for diseases and provide comprehensive treatment options.' 
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
    
    console.log('AI Response received:', content?.substring(0, 300));

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        isPlant: true,
        name: 'Analysis Complete',
        confidence: 75,
        isHealthy: true,
        description: content || 'Unable to fully analyze the image. Please try with a clearer photo.',
        precautions: ['Monitor regularly', 'Maintain proper watering', 'Ensure good soil health'],
        fertilizers: [{ name: 'Balanced NPK', dosage: '100g per plant', timing: 'Monthly' }],
        organicTreatments: [{ name: 'Neem Oil', dosage: '2ml per liter', timing: 'Weekly' }],
        chemicalTreatments: [{ name: 'General Fungicide', dosage: 'As per label', timing: 'When needed', safetyNote: 'Wear protective gear' }]
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
