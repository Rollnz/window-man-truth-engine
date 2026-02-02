import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQ { question: string; answer: string; }

const faqs: FAQ[] = [
  { question: 'Is this really free?', answer: 'Yes, 100% free. The AI audit costs you nothing, and there\'s no credit card required. We make money only if you choose to use our partner network to improve your quote, and even then, you\'re never charged directly — the contractor pays a finder\'s fee if you switch. Most people use the free audit to negotiate with their existing contractor.' },
  { question: 'Do you share my personal information?', answer: 'Your contact information is never shared without explicit permission. If you opt into the partner comparison, we share project specifications (window sizes, location, scope) — not your name, email, or phone. If a partner wants to reach you, we ask you first.' },
  { question: 'Will this bash my contractor?', answer: 'No. The audit is objective and fact-based, not a hit piece. We check technical specs, code compliance, scope completeness, and pricing against market data. Many contractors welcome informed customers — it actually makes the sales process smoother when expectations are clear upfront.' },
  { question: "What if I don't have my estimate yet?", answer: 'You can create a free Window Vault to save your project details, learn about the risks, and come back when you have a quote. The Vault keeps track of your progress and stores everything you need for when you\'re ready to upload.' },
  { question: 'What documents work?', answer: 'We accept PDFs, photos, and screenshots of your window quote or estimate. The AI can read standard contractor proposals, itemized quotes, and even handwritten estimates. If it\'s readable, we can analyze it. The upload takes about 60 seconds.' },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/50 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-5 text-left hover:bg-muted/10 transition-colors px-2 -mx-2 rounded"><span className="font-medium text-foreground pr-4">{faq.question}</span><ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /></button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}><p className="text-muted-foreground text-sm leading-relaxed px-2">{faq.answer}</p></div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12"><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 mb-4"><HelpCircle className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-muted-foreground">Common Questions</span></div><h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Frequently Asked Questions</h2></div>
        <div className="max-w-2xl mx-auto"><div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">{faqs.map((faq, index) => (<FAQItem key={index} faq={faq} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} />))}</div></div>
        <p className="text-center text-sm text-muted-foreground mt-8">Still have questions? <a href="/consultation" className="text-primary hover:underline">Talk to Window Man</a></p>
      </div>
    </section>
  );
}
