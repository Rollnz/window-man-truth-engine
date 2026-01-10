import { Button } from "@/components/ui/button";
import { Save, Calendar } from "lucide-react";
import { Navbar } from "@/components/home/Navbar";

const variants = [
  { name: "default", label: "Default (Primary Blue)" },
  { name: "destructive", label: "Destructive" },
  { name: "outline", label: "Outline" },
  { name: "secondary", label: "Secondary" },
  { name: "secondary-action", label: "Secondary Action (New)" },
  { name: "ghost", label: "Ghost" },
  { name: "link", label: "Link" },
  { name: "cta", label: "CTA (Consultation)" },
  { name: "high-contrast", label: "High Contrast" },
  { name: "dimensional", label: "Dimensional" },
  { name: "frame", label: "Frame" },
] as const;

type VariantName = typeof variants[number]["name"];

interface ButtonGridProps {
  background: "bg-background" | "bg-card";
  backgroundLabel: string;
}

function ButtonGrid({ background, backgroundLabel }: ButtonGridProps) {
  return (
    <div className={`${background} p-6 rounded-lg border border-border`}>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        On {backgroundLabel}
      </h3>
      <div className="space-y-6">
        {variants.map((variant) => (
          <div key={variant.name} className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {variant.label}
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Default state - short label */}
              <Button variant={variant.name as VariantName}>
                <Save className="w-4 h-4" />
                Save
              </Button>

              {/* Disabled state */}
              <Button variant={variant.name as VariantName} disabled>
                <Save className="w-4 h-4" />
                Disabled
              </Button>

              {/* Long label */}
              <Button variant={variant.name as VariantName} size="lg">
                <Calendar className="w-4 h-4" />
                Schedule Your Free Consultation Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ThemePanelProps {
  theme: "light" | "dark";
}

function ThemePanel({ theme }: ThemePanelProps) {
  const bgClass = theme === "dark" ? "bg-[#0A0F14]" : "bg-white";
  const textClass = theme === "dark" ? "text-white" : "text-slate-900";

  return (
    <div
      className={`${bgClass} ${textClass} p-6 rounded-xl ${theme}`}
      data-theme={theme}
    >
      <h2 className="text-2xl font-bold mb-6 capitalize">{theme} Mode</h2>
      <div className="space-y-8">
        <ButtonGrid background="bg-background" backgroundLabel="bg-background" />
        <ButtonGrid background="bg-card" backgroundLabel="bg-card" />
      </div>

      {/* State simulation section */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4">Interactive States</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Hover over buttons to see hover states. Tab through for focus states.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Default</p>
            <Button variant="default">Primary</Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">CTA</p>
            <Button variant="cta">Get Started</Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Secondary Action</p>
            <Button variant="secondary-action">Learn More</Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Outline</p>
            <Button variant="outline">Options</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ButtonAudit() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      {/* Header */}
      <div className="max-w-[1800px] mx-auto p-4 md:p-8 pt-20">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Button Variant Audit
        </h1>
        <p className="text-slate-600 mt-2">
          Side-by-side comparison of all button variants in light and dark themes
        </p>
      </div>

      <div className="max-w-[1800px] mx-auto p-4 md:p-8 pt-0">

      {/* Split screen comparison */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>

        {/* Size variants */}
        <div className="mt-8 bg-white p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Size Variants</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Small (sm)</p>
              <Button size="sm">Small Button</Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Default</p>
              <Button size="default">Default Button</Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Large (lg)</p>
              <Button size="lg">Large Button</Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Icon</p>
              <Button size="icon">
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
