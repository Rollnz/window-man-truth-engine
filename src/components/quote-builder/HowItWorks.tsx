export const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Configure Your Project",
      description: "Select product types, sizes, and options for each opening in your home."
    },
    {
      number: "2", 
      title: "Build Your Estimate",
      description: "Add items to your cart and see real-time pricing based on Florida market data."
    },
    {
      number: "3",
      title: "Unlock Your Quote",
      description: "Get detailed pricing, AI analysis, and negotiation tools to save thousands."
    }
  ];

  return (
    <section className="py-16 bg-background transition-colors duration-300">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build your estimate in minutes, not hours. No sales calls, no pressure.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};