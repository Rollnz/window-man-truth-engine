import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-muted-foreground/40 dark:hover:border-muted-foreground/60",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 hover:border-primary/30 dark:bg-background dark:text-muted-foreground dark:border-muted-foreground/20 dark:hover:bg-muted/30 dark:hover:text-foreground",
        // Softer secondary that pairs with primary CTA
        "secondary-action": "bg-muted text-foreground border border-border hover:bg-accent hover:border-primary/50 hover:text-primary transition-colors dark:bg-background dark:text-muted-foreground dark:border-muted-foreground/20 dark:hover:bg-muted/30 dark:hover:text-primary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "high-contrast": "bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90",
        // CTA button - solid primary that stands out on any background
        "cta": "bg-primary text-primary-foreground shadow-md hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:text-primary-foreground transition-all duration-200 dark:shadow-[0_0_20px_hsl(var(--primary)/0.4)] dark:hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]",
        // Glass Frame dimensional button - 3D gradient with pressed effect
        "dimensional": "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground border-2 border-primary/80 shadow-lg hover:from-primary hover:to-primary/90 hover:text-primary-foreground active:translate-y-0.5 active:shadow-md",
        // Frame outline button - thick bordered style
        "frame": "bg-background border-[3px] border-border text-primary hover:border-primary hover:bg-muted/50 hover:text-primary shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
