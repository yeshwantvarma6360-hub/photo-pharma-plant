export interface DiseaseResult {
  name: string;
  confidence: number;
  isHealthy: boolean;
  description: string;
  precautions: string[];
  fertilizers: {
    name: string;
    dosage: string;
    timing: string;
  }[];
}

export const mockDiseases: DiseaseResult[] = [
  {
    name: 'Late Blight',
    confidence: 94,
    isHealthy: false,
    description: 'Late blight is caused by the fungus-like organism Phytophthora infestans. It can destroy an entire crop within days if left untreated.',
    precautions: [
      'Remove and destroy infected plant material immediately',
      'Ensure good air circulation between plants',
      'Water plants at the base, avoiding wetting leaves',
      'Apply fungicides preventively during humid conditions',
      'Rotate crops and avoid planting in the same location each year',
    ],
    fertilizers: [
      { name: 'Copper-based Fungicide', dosage: '2-3g per liter of water', timing: 'Every 7-10 days during humid weather' },
      { name: 'Potassium Phosphite', dosage: '3ml per liter of water', timing: 'Foliar spray every 14 days' },
      { name: 'Balanced NPK (10-10-10)', dosage: '200g per plant', timing: 'Monthly during growing season' },
    ],
  },
  {
    name: 'Powdery Mildew',
    confidence: 87,
    isHealthy: false,
    description: 'Powdery mildew appears as white powdery spots on leaves and stems. It thrives in warm, dry conditions with high humidity at night.',
    precautions: [
      'Improve air circulation by proper spacing of plants',
      'Avoid overhead watering',
      'Remove and dispose of affected leaves',
      'Apply sulfur or potassium bicarbonate sprays',
      'Plant resistant varieties when available',
    ],
    fertilizers: [
      { name: 'Sulfur Dust', dosage: '25g per 10 liters of water', timing: 'Every 10-14 days' },
      { name: 'Neem Oil', dosage: '5ml per liter of water', timing: 'Weekly as preventive spray' },
      { name: 'High Potassium Fertilizer', dosage: '150g per plant', timing: 'Every 3 weeks' },
    ],
  },
  {
    name: 'Healthy Plant',
    confidence: 96,
    isHealthy: true,
    description: 'Your crop appears to be healthy with no visible signs of disease or pest damage. Continue with regular maintenance practices.',
    precautions: [
      'Continue regular watering schedule',
      'Monitor for any early signs of stress or disease',
      'Maintain proper soil nutrition',
      'Keep the area weed-free',
      'Practice crop rotation for future seasons',
    ],
    fertilizers: [
      { name: 'Balanced NPK (15-15-15)', dosage: '100g per plant', timing: 'Every 4 weeks' },
      { name: 'Organic Compost', dosage: '2-3kg per square meter', timing: 'At planting and mid-season' },
      { name: 'Micronutrient Mix', dosage: '2g per liter of water', timing: 'Monthly foliar spray' },
    ],
  },
  {
    name: 'Bacterial Leaf Spot',
    confidence: 82,
    isHealthy: false,
    description: 'Bacterial leaf spot causes dark, water-soaked lesions that may have yellow halos. It spreads rapidly in warm, wet conditions.',
    precautions: [
      'Remove infected leaves immediately',
      'Avoid working with plants when wet',
      'Use drip irrigation instead of overhead watering',
      'Apply copper-based bactericides',
      'Ensure seeds are disease-free before planting',
    ],
    fertilizers: [
      { name: 'Copper Hydroxide', dosage: '2g per liter of water', timing: 'Every 7 days during outbreak' },
      { name: 'Calcium Nitrate', dosage: '5g per liter of water', timing: 'Foliar spray every 2 weeks' },
      { name: 'Potash (Potassium Chloride)', dosage: '100g per plant', timing: 'Monthly application' },
    ],
  },
];

export const getRandomDisease = (): DiseaseResult => {
  return mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
};
