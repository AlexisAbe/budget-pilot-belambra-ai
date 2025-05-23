import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCampaignStore } from '@/store/campaignStore';
import { Campaign } from '@/types/campaign';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface BudgetDistributionModalProps {
  campaign: Campaign;
  open: boolean;
  onClose: () => void;
}

interface WeekPercentage {
  weekLabel: string;
  percentage: number;
}

export function BudgetDistributionModal({ campaign, open, onClose }: BudgetDistributionModalProps) {
  // Fix the type of selectedMethod to match the expected types in autoDistributeBudgetService
  const [selectedMethod, setSelectedMethod] = useState<'even' | 'front-loaded' | 'back-loaded' | 'bell-curve'>('even');
  const [activeTab, setActiveTab] = useState('auto');
  const { autoDistributeBudget, weeks } = useCampaignStore();
  const [weekPercentages, setWeekPercentages] = useState<WeekPercentage[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(100);
  
  // Filter weeks to only include those that overlap with the campaign
  const campaignStart = new Date(campaign.startDate);
  const campaignEnd = new Date(campaign.startDate);
  campaignEnd.setDate(campaignEnd.getDate() + campaign.durationDays - 1);

  // Initialize week percentages on modal open
  useEffect(() => {
    if (open) {
      const relevantWeeks = weeks.filter(week => {
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(week.endDate);
        return (campaignStart <= weekEnd && campaignEnd >= weekStart);
      });
      
      // Initialize with equal percentages
      const weekCount = relevantWeeks.length;
      const initialPercentage = weekCount > 0 ? Math.floor(100 / weekCount) : 0;
      const remainder = 100 - (initialPercentage * weekCount);
      
      const initialWeekPercentages = relevantWeeks.map((week, index) => ({
        weekLabel: week.weekLabel,
        // Add the remainder to the first week to ensure exactly 100%
        percentage: index === 0 ? initialPercentage + remainder : initialPercentage
      }));
      
      setWeekPercentages(initialWeekPercentages);
      setTotalPercentage(100); // Reset to 100%
    }
  }, [open, weeks, campaign]);
  
  const handlePercentageChange = (weekLabel: string, value: number) => {
    const newPercentages = weekPercentages.map(week => 
      week.weekLabel === weekLabel 
        ? { ...week, percentage: value } 
        : week
    );
    
    setWeekPercentages(newPercentages);
    
    // Update the total percentage
    const newTotal = newPercentages.reduce((sum, week) => sum + week.percentage, 0);
    setTotalPercentage(newTotal);
  };

  const handleDistribute = () => {
    if (activeTab === 'auto') {
      // No need to provide a third argument for auto distribution methods
      autoDistributeBudget(campaign.id, selectedMethod);
    } else {
      // For manual distribution, check if percentages add up to 100%
      if (Math.abs(totalPercentage - 100) > 0.1) {
        toast({
          title: "Erreur",
          description: `Le total doit être de 100% (actuellement ${totalPercentage}%)`,
          variant: "destructive"
        });
        return;
      }
      
      // Convert array to object format that the utility function expects
      const percentageObject: Record<string, number> = {};
      weekPercentages.forEach(week => {
        percentageObject[week.weekLabel] = week.percentage;
      });
      
      // Pass the explicit 'manual' type and the percentages
      autoDistributeBudget(campaign.id, 'manual', percentageObject);
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Distribuer le Budget</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez comment distribuer {campaign.totalBudget.toLocaleString('fr-FR')}€ sur la durée de la campagne ({campaign.durationDays} jours)
          </p>
          
          <Tabs defaultValue="auto" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="auto" className="flex-1">Distribution Auto</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">Pourcentages Manuels</TabsTrigger>
            </TabsList>
            <TabsContent value="auto" className="py-4">
              <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)}>
                <div className="flex items-start space-x-2 mb-4">
                  <RadioGroupItem value="even" id="even" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="even" className="font-medium">
                      Distribution Égale
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Budget égal sur toutes les semaines de la campagne
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 mb-4">
                  <RadioGroupItem value="front-loaded" id="front-loaded" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="front-loaded" className="font-medium">
                      Front-Loaded
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Budget plus élevé au début, diminuant vers la fin
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 mb-4">
                  <RadioGroupItem value="back-loaded" id="back-loaded" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="back-loaded" className="font-medium">
                      Back-Loaded
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Budget plus faible au début, augmentant vers la fin
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="bell-curve" id="bell-curve" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="bell-curve" className="font-medium">
                      Courbe en Cloche
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Budget maximal au milieu de la campagne
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </TabsContent>
            <TabsContent value="manual" className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>Semaine</span>
                  <span>Pourcentage {totalPercentage !== 100 && 
                    <span className={totalPercentage > 100 ? "text-red-500" : "text-amber-500"}>
                      ({totalPercentage}%)
                    </span>}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {weekPercentages.map((week) => (
                    <div key={week.weekLabel} className="flex items-center justify-between">
                      <Label htmlFor={`week-${week.weekLabel}`} className="w-16">{week.weekLabel}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`week-${week.weekLabel}`}
                          type="number"
                          min="0"
                          max="100"
                          className="w-20"
                          value={week.percentage}
                          onChange={(e) => handlePercentageChange(week.weekLabel, Number(e.target.value))}
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalPercentage !== 100 && (
                  <p className={`text-sm ${totalPercentage > 100 ? "text-red-500" : "text-amber-500"}`}>
                    {totalPercentage > 100 
                      ? `Le total est supérieur à 100% (${totalPercentage}%)`
                      : `Le total est inférieur à 100% (${totalPercentage}%)`
                    }
                  </p>
                )}
                
                {totalPercentage === 100 && (
                  <p className="text-sm text-green-500">
                    Le total est bien de 100%
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleDistribute}>
            Distribuer le Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
