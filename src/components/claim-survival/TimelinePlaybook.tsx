import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { timelineNodes, adjusterScript } from '@/data/claimSurvivalData';

export function TimelinePlaybook() {
  return (
    <div className="container px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">24-Hour Post-Hurricane Playbook</h2>
        <p className="text-muted-foreground">
          What to do (and NOT do) in the critical first day after storm damage.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto space-y-4 mb-12">
        {timelineNodes.map((node, index) => (
          <Card 
            key={index} 
            className={`p-4 md:p-5 ${
              node.critical ? 'border-destructive/50 bg-destructive/5' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg shrink-0 ${
                node.critical ? 'bg-destructive/20' : 'bg-muted'
              }`}>
                <Clock className={`w-5 h-5 ${
                  node.critical ? 'text-destructive' : 'text-muted-foreground'
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={node.critical ? 'destructive' : 'secondary'}>
                    {node.hour}
                  </Badge>
                  {node.critical && (
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Critical
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{node.title}</h3>
                <p className="text-sm text-muted-foreground">{node.action}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Adjuster Script */}
      <Card className="max-w-3xl mx-auto p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/20 shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">{adjusterScript.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{adjusterScript.intro}</p>
            
            <ul className="space-y-2 mb-4">
              {adjusterScript.statements.map((statement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="italic">{statement}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{adjusterScript.warning}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
