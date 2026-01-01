export interface Treatment {
  name: string;
  dosage: string;
  timing: string;
  safetyNote?: string;
}

export interface DiseaseResult {
  name: string;
  confidence: number;
  isHealthy: boolean;
  description: string;
  precautions: string[];
  fertilizers: { name: string; dosage: string; timing: string }[];
  organicTreatments?: Treatment[];
  chemicalTreatments?: Treatment[];
  isPlant?: boolean;
  notPlantMessage?: string;
}

export const mockDiseases: DiseaseResult[] = [];

export const getRandomDisease = (): DiseaseResult => {
  return mockDiseases[0];
};
