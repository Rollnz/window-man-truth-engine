import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertTriangle, Thermometer, Volume2, Clock, Home, Mail, Calendar } from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import { SessionData } from "@/hooks/useSessionData";
import { ROUTES } from "@/config/navigation";
import { NextStepCard } from "@/components/seo/NextStepCard";
import { MethodologyBadge } from "@/components/authority/MethodologyBadge";

interface RealityReportProps {
  score: number;
  sessionData: SessionData;
  onEmailReport?: () => void;
  onScheduleConsult?: () => void;
}

const RealityReport = ({ score, sessionData, onEmailReport, onScheduleConsult }: RealityReportProps) => {
  const getInterpretation = () => {
    if (score <= 30) return {
      title: "Your Windows May Be Adequate",
      description: "Based on your responses, your current windows show relatively low signs of hidden costs. However, there may still be room for improvement.",
      urgency: "low"
    };
    if (score <= 55) return {
      title: "Moderate Hidden Costs Detected",
      description: "Your windows are showing signs of inefficiency. The costs may not be obvious, but they're quietly adding up on your energy bills.",
      urgency: "moderate"
    };
    if (score <= 75) return {
      title: "High Hidden Costs Detected",
      description: "Your current windows are likely costing you significantly more than you realize. Taking action soon could save you substantial money.",
      urgency: "high"
    };
    return {
      title: "Critical: Immediate Attention Recommended",
      description: "Your windows are in a critical state of inefficiency. Every day you wait, you're losing money and comfort.",
      urgency: "critical"
    };
  };

  const generateInsights = () => {
    const insights = [];

    // Window age insight
    if (sessionData.windowAge === '15-20' || sessionData.windowAge === '20+') {
      insights.push({
        icon: Clock,
        text: `Your ${sessionData.windowAge === '20+' ? '20+ year old' : '15-20 year old'} windows are past their prime lifespan, likely causing significant energy loss.`
      });
    } else if (sessionData.windowAge === '10-15') {
      insights.push({
        icon: Clock,
        text: "At 10-15 years old, your windows are entering the zone where efficiency declines rapidly."
      });
    }

    // Draftiness insight
    if (sessionData.draftinessLevel === 'severe' || sessionData.draftinessLevel === 'moderate') {
      insights.push({
        icon: Thermometer,
        text: `The ${sessionData.draftinessLevel} drafts you're experiencing indicate failing window seals, letting conditioned air escape.`
      });
    }

    // Noise insight
    if (sessionData.noiseLevel === 'severe' || sessionData.noiseLevel === 'moderate') {
      insights.push({
        icon: Volume2,
        text: `${sessionData.noiseLevel === 'severe' ? 'Heavy' : 'Noticeable'} outside noise penetration means your windows lack proper insulation.`
      });
    }

    // Energy bill insight
    if (sessionData.currentEnergyBill === '$300-400' || sessionData.currentEnergyBill === '$400+') {
      insights.push({
        icon: AlertTriangle,
        text: "Your high energy bills suggest your HVAC is working overtime to compensate for window inefficiency."
      });
    }

    // Home size insight
    if (sessionData.homeSize && sessionData.homeSize > 2500) {
      insights.push({
        icon: Home,
        text: `With ${sessionData.homeSize.toLocaleString()} sq ft, inefficient windows have an outsized impact on your energy costs.`
      });
    }

    // Return top 3 insights
    return insights.slice(0, 3);
  };

  const interpretation = getInterpretation();
  const insights = generateInsights();

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Your Reality Report
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what your windows are really costing you
        </p>
      </div>

      <ScoreGauge score={score} />

      <Card className="bg-card/50 border-border/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">{interpretation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{interpretation.description}</p>
          
          {insights.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Key Findings:</h4>
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <insight.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{insight.text}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Conversion CTAs */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-center">Ready to Take Action?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-center text-muted-foreground text-sm mb-4">
            {score >= 76 
              ? "Your score indicates urgent action is needed. Let's create your personalized action plan."
              : "Get your complete Reality Report with detailed recommendations and next steps."
            }
          </p>
          
          <Button 
            size="lg" 
            onClick={onEmailReport}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Mail className="mr-2 h-5 w-5" />
            Email My Reality Report
          </Button>
          
          <Button
            size="lg"
            variant="cta"
            onClick={onScheduleConsult}
            className="w-full"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Free Consultation
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 pt-4">
        <Link to={ROUTES.COST_CALCULATOR} className="w-full">
          <Button 
            size="lg" 
            className="w-full py-6 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-all"
          >
            Calculate Your Exact Financial Loss
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
        <Link to={ROUTES.HOME} className="w-full">
          <Button variant="ghost" size="lg" className="w-full">
            Explore Other Tools
          </Button>
        </Link>
      </div>

      {/* Methodology Badge */}
      <div className="flex justify-center pt-4">
        <MethodologyBadge />
      </div>

      {/* Next Step Card - Prevents traffic leaks */}
      <NextStepCard currentToolPath="/reality-check" className="mt-8" />
    </div>
  );
};

export default RealityReport;