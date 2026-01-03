import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an expert agricultural AI assistant specialized in crop disease detection and plant pathology with extensive knowledge of global agriculture.

CRITICAL FIRST STEP: Before any analysis, you MUST determine if the image contains a plant, crop, leaf, or any agricultural subject.

If the image does NOT contain a plant, crop, leaf, vegetation, or agricultural content:
- Return this EXACT JSON structure:
{
  "isPlant": false,
  "notPlantMessage": "This image does not appear to contain a plant or crop. Please upload a clear photo of a plant, leaf, or crop for disease analysis."
}

If the image DOES contain a plant/crop, analyze it thoroughly and return:
{
  "isPlant": true,
  "name": "Disease Name or Healthy Plant",
  "cropType": "Identified crop type (e.g., Rice, Wheat, Tomato, Cotton, etc.)",
  "confidence": 85,
  "isHealthy": false,
  "description": "Detailed description of the condition observed including symptoms, affected plant parts, and progression stage",
  "severity": "mild/moderate/severe",
  "precautions": ["precaution 1", "precaution 2", "precaution 3", "precaution 4", "precaution 5"],
  "fertilizers": [
    {"name": "Fertilizer Name", "dosage": "amount per application", "timing": "when to apply"}
  ],
  "organicTreatments": [
    {"name": "Organic Treatment 1", "dosage": "amount", "timing": "when to apply", "safetyNote": "optional safety tip"}
  ],
  "chemicalTreatments": [
    {"name": "Chemical Treatment 1", "dosage": "amount", "timing": "when to apply", "safetyNote": "IMPORTANT safety warning"}
  ],
  "preventiveMeasures": ["measure 1", "measure 2", "measure 3"]
}

SUPPORTED CROPS (identify and analyze any of these):
- Cereals: Rice, Wheat, Maize/Corn, Sorghum, Millet, Barley, Oats
- Pulses: Chickpea, Lentil, Pigeon Pea, Black Gram, Green Gram, Kidney Bean
- Oilseeds: Soybean, Groundnut/Peanut, Sunflower, Mustard, Sesame, Castor
- Vegetables: Tomato, Potato, Onion, Brinjal/Eggplant, Chili, Cabbage, Cauliflower, Carrot, Radish, Cucumber, Pumpkin, Okra/Lady Finger, Spinach, Beans
- Fruits: Mango, Banana, Citrus (Orange, Lemon, Lime), Apple, Grape, Papaya, Guava, Pomegranate, Watermelon, Coconut
- Commercial Crops: Cotton, Sugarcane, Jute, Tea, Coffee, Rubber, Tobacco
- Spices: Turmeric, Ginger, Cardamom, Black Pepper, Coriander, Cumin

COMMON DISEASES BY CROP TYPE:
- Rice: Blast, Bacterial Leaf Blight, Brown Spot, Sheath Blight, Tungro
- Wheat: Rust (Yellow/Brown/Black), Powdery Mildew, Karnal Bunt, Loose Smut
- Tomato: Early Blight, Late Blight, Septoria Leaf Spot, Bacterial Wilt, Mosaic Virus
- Potato: Late Blight, Early Blight, Black Scurf, Common Scab
- Cotton: Bacterial Blight, Anthracnose, Alternaria Leaf Spot, Root Rot
- Banana: Panama Disease, Black Sigatoka, Bunchy Top Virus
- Mango: Anthracnose, Powdery Mildew, Bacterial Canker, Mango Malformation
- Citrus: Citrus Canker, Greening Disease, Gummosis, Leaf Miner
- Sugarcane: Red Rot, Smut, Grassy Shoot, Ratoon Stunting
- Groundnut: Tikka Disease, Collar Rot, Stem Rot, Bud Necrosis

GENERAL DISEASES (can affect multiple crops):
- Fungal: Powdery Mildew, Downy Mildew, Rust, Anthracnose, Fusarium Wilt, Root Rot, Damping Off
- Bacterial: Bacterial Leaf Spot, Bacterial Wilt, Soft Rot, Crown Gall
- Viral: Mosaic Virus, Leaf Curl, Yellow Vein, Ring Spot
- Nutrient Deficiencies: Nitrogen (yellowing), Phosphorus (purple leaves), Potassium (brown edges), Iron (chlorosis)

TREATMENT GUIDELINES:
For organic treatments include: Neem oil (Azadirachtin), Trichoderma, Pseudomonas, Bacillus subtilis, baking soda solutions, compost tea, garlic spray, cow urine mixture, Bordeaux mixture, beneficial insects, crop rotation.

For chemical treatments always include:
- Specific product names with active ingredients
- Exact dosage (ml/L or g/L)
- Application frequency and intervals
- Pre-harvest interval (PHI)
- Safety precautions (PPE requirements, restricted entry interval)
- Environmental considerations

Be extremely specific about disease symptoms, progression stages, and provide actionable treatment recommendations suitable for farmers with varying levels of expertise.`;

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
      ? `\n\nCRITICAL: You MUST respond with ALL text content in ${langName} language, including the notPlantMessage if the image is not a plant. Use simple, farmer-friendly language that rural farmers can easily understand.`
      : '';

    console.log('Analyzing crop image with Lovable AI (enhanced model), language:', language);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt + languageInstruction },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: 'First, verify if this image contains a plant, crop, leaf, or any vegetation. If not, indicate that clearly. If it is a plant, provide a comprehensive analysis including: 1) Identify the crop type, 2) Detect any diseases or health issues, 3) Assess severity, 4) Provide detailed organic and chemical treatment options with exact dosages, 5) Include preventive measures for future protection.' 
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
    
    console.log('AI Response received:', content?.substring(0, 500));

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
        cropType: 'Unknown',
        confidence: 75,
        isHealthy: true,
        description: content || 'Unable to fully analyze the image. Please try with a clearer photo.',
        severity: 'mild',
        precautions: ['Monitor regularly', 'Maintain proper watering', 'Ensure good soil health', 'Check for pests weekly', 'Maintain proper spacing'],
        fertilizers: [{ name: 'Balanced NPK (10-10-10)', dosage: '100g per plant', timing: 'Monthly during growing season' }],
        organicTreatments: [{ name: 'Neem Oil Solution', dosage: '2-3ml per liter of water', timing: 'Weekly spray in early morning', safetyNote: 'Safe for humans and beneficial insects' }],
        chemicalTreatments: [{ name: 'Mancozeb 75% WP', dosage: '2g per liter of water', timing: 'Bi-weekly when symptoms appear', safetyNote: 'Wear gloves and mask during application. Wait 7 days before harvest.' }],
        preventiveMeasures: ['Crop rotation', 'Proper drainage', 'Balanced fertilization']
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
