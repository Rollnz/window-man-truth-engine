import { Home, FileText, DollarSign } from "lucide-react";

export const WhoIsThisFor = () => {
  const personas = [
    {
      icon: Home,
      title: "First-Time Window Buyers",
      description: "Never replaced impact windows before? We break down the process and costs so you know exactly what to expect."
    },
    {
      icon: FileText,
      title: "Quote Comparison Shoppers",
      description: "Already have a few quotes? Use our tool to verify pricing and identify hidden fees or overcharges."
    },
    {
      icon: DollarSign,
      title: "Budget-Conscious Homeowners",
      description: "Need to maximize value? Our AI helps you find the best price-to-performance options for your situation."
    }
  ];

  return (
    <section className="py-16 bg-muted transition-colors duration-300">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Who Is This For?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're just starting research or ready to negotiate, we've got you covered.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {personas.map((persona, index) => (
            <div key={index} className="bg-card rounded-xl p-6 shadow-sm border border-border transition-colors duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <persona.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{persona.title}</h3>
              <p className="text-muted-foreground text-sm">{persona.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};