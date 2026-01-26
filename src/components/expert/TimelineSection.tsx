import { ClipboardList, AlertTriangle, FileCheck } from 'lucide-react';
const steps = [{
  icon: ClipboardList,
  step: 1,
  title: 'Before the Appointment',
  description: 'Use this tool to build your requirements and know the right questions to ask.'
}, {
  icon: AlertTriangle,
  step: 2,
  title: 'During the Quote',
  description: 'Spot red flags and price gouging immediately while the rep is still talking.'
}, {
  icon: FileCheck,
  step: 3,
  title: 'Before You Sign',
  description: 'Upload your quote to verify fairness and catch hidden fees.'
}];
export function TimelineSection() {
  return <section className="py-16 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-black dark:text-white">
          The "Golden Window" <span className="text-primary">Timeline</span>
        </h2>
        <p className="text-center mb-10 max-w-2xl mx-auto text-2xl text-black dark:text-white">
          The most dangerous time is when you're sitting at the kitchen table with a pen. 
          <span className="font-medium text-black dark:text-white"> Get prepared first.</span>
        </p>

        <div className="relative">
          {/* Timeline line - visible on md+ */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(step => <div key={step.step} className="relative flex flex-col items-center text-center">
                {/* Step circle */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 shadow-lg">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                  Step {step.step}
                </span>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>)}
          </div>
        </div>
      </div>
    </section>;
}