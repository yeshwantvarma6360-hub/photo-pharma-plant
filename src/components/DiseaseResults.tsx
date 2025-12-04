import React from 'react';
import { AlertTriangle, CheckCircle2, Shield, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { DiseaseResult } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface DiseaseResultsProps {
  result: DiseaseResult | null;
}

const DiseaseResults: React.FC<DiseaseResultsProps> = ({ result }) => {
  const { t } = useLanguage();

  if (!result) {
    return (
      <Card className="glass-card h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t('noResults')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Disease Header */}
      <Card className={cn(
        "glass-card overflow-hidden",
        result.isHealthy ? "border-success/30" : "border-warning/30"
      )}>
        <div className={cn(
          "h-2",
          result.isHealthy ? "bg-success" : "bg-warning"
        )} />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {result.isHealthy ? (
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">
                  {result.isHealthy ? t('healthy') : t('diseaseDetected')}
                </CardTitle>
                <p className="text-lg font-semibold text-foreground">{result.name}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('confidence')}</span>
              <span className="font-semibold">{result.confidence}%</span>
            </div>
            <Progress 
              value={result.confidence} 
              className={cn(
                "h-2",
                result.isHealthy ? "[&>div]:bg-success" : "[&>div]:bg-warning"
              )} 
            />
            <p className="text-sm text-muted-foreground mt-4">{result.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Precautions */}
      <Card className="glass-card animate-slide-up-delay-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            {t('precautions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.precautions.map((precaution, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-foreground">{precaution}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Fertilizers */}
      <Card className="glass-card animate-slide-up-delay-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="w-5 h-5 text-primary" />
            {t('fertilizers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.fertilizers.map((fertilizer, index) => (
              <div 
                key={index} 
                className="p-4 rounded-xl bg-muted/50 border border-border/50"
              >
                <h4 className="font-semibold text-foreground mb-2">{fertilizer.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dosage: </span>
                    <span className="text-foreground">{fertilizer.dosage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timing: </span>
                    <span className="text-foreground">{fertilizer.timing}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiseaseResults;
