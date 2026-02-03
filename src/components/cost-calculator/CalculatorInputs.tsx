import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getBillRangeOptions, getAgeRangeOptions } from '@/lib/calculations';
import { SessionData } from '@/hooks/useSessionData';
import { Calculator, Zap, Home, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
interface CalculatorInputsProps {
  sessionData: SessionData;
  onCalculate: (inputs: ValidatedInputs) => void;
  isCalculating?: boolean;
}
export interface ValidatedInputs {
  energyBill: string;
  windowAge: string;
  homeSize: number;
  windowCount: number;
}
export function CalculatorInputs({
  sessionData,
  onCalculate,
  isCalculating = false
}: CalculatorInputsProps) {
  // Initialize from session data or empty state
  const [energyBill, setEnergyBill] = useState<string>(sessionData.currentEnergyBill || '');
  const [windowAge, setWindowAge] = useState<string>(sessionData.windowAge || '');
  const [homeSize, setHomeSize] = useState<number>(sessionData.homeSize || 2000);
  const [windowCount, setWindowCount] = useState<number>(sessionData.windowCount || 10);

  // Track which fields were pre-filled
  const hasPrefilledBill = !!sessionData.currentEnergyBill;
  const hasPrefilledAge = !!sessionData.windowAge;
  const hasPrefilledSize = !!sessionData.homeSize;

  // Check if form is valid
  const isValid = energyBill !== '' && windowAge !== '';
  const billOptions = getBillRangeOptions();
  const ageOptions = getAgeRangeOptions();
  const handleCalculate = () => {
    if (!isValid) return;
    onCalculate({
      energyBill,
      windowAge,
      homeSize,
      windowCount
    });
  };
  return <div className="space-y-8">
      {/* Energy Bill Selection */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Monthly Energy Bill</h3>
            </div>
            {hasPrefilledBill && <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                Using your saved info
              </Badge>}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {billOptions.map(option => <Button key={option} type="button" variant={energyBill === option ? 'default' : 'outline'} className={cn('h-12 text-sm transition-all', energyBill === option && 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]')} onClick={() => setEnergyBill(option)}>
                {option}
              </Button>)}
          </div>
          
          {!hasPrefilledBill && !energyBill && <p className="text-sm text-muted-foreground mt-2">
              Select your average monthly energy bill
            </p>}
        </CardContent>
      </Card>

      {/* Window Age Selection */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Window Age</h3>
            </div>
            {hasPrefilledAge && <Badge variant="outline" className="border-primary/50 text-primary-foreground text-base">
                Using your saved info
              </Badge>}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ageOptions.map(option => <Button key={option} type="button" variant={windowAge === option ? 'default' : 'outline'} className={cn('h-12 text-sm transition-all', windowAge === option && 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]')} onClick={() => setWindowAge(option)}>
                {option}
              </Button>)}
          </div>
          
          {!hasPrefilledAge && !windowAge && <p className="text-sm text-muted-foreground mt-2">
              How old are your current windows?
            </p>}
        </CardContent>
      </Card>

      {/* Home Size Slider */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-white">Home Size</h3>
            </div>
            {hasPrefilledSize && <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                Using your saved info
              </Badge>}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Square Feet</span>
              <span className="text-xl font-bold text-primary">{homeSize.toLocaleString()}</span>
            </div>
            <Slider value={[homeSize]} onValueChange={value => setHomeSize(value[0])} min={500} max={5000} step={100} className="py-4" aria-label="Home Size in square feet" />
            <div className="flex justify-between text-xs text-white">
              <span>500 sq ft</span>
              <span>5,000 sq ft</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Window Count Slider */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-white">Number of Windows</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Windows to Replace</span>
              <span className="text-xl font-bold text-primary">{windowCount}</span>
            </div>
            <Slider value={[windowCount]} onValueChange={value => setWindowCount(value[0])} min={1} max={50} step={1} className="py-4" aria-label="Number of windows to replace" />
            <div className="flex justify-between text-xs text-white">
              <span>1 window</span>
              <span>50 windows</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculate Button */}
      <Button onClick={handleCalculate} disabled={!isValid || isCalculating} className="w-full h-14 text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]" size="lg">
        <Calculator className="mr-2 h-5 w-5" />
        {isCalculating ? 'Calculating...' : 'Calculate My True Cost'}
      </Button>

      {!isValid && <p className="text-center text-sm text-muted-foreground">
          Please select your energy bill and window age to continue
        </p>}
    </div>;
}