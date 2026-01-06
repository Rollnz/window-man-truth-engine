import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WindowGuyQuoteFormProps {
  onSubmit?: () => void;
}

/**
 * Lightweight quote form used inside the TrueWindowCost modal.
 * Captures basic contact info so the host page can trigger follow-up.
 */
export default function WindowGuyQuoteForm({ onSubmit }: WindowGuyQuoteFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Defensive trim to avoid storing accidental whitespace.
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      zip: zip.trim(),
      notes: notes.trim(),
    };

    console.log("Quote requested", payload);
    onSubmit?.();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Alex Homeowner"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip">ZIP</Label>
        <Input
          id="zip"
          inputMode="numeric"
          pattern="[0-9]*"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          required
          placeholder="33101"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Project notes (optional)</Label>
        <textarea
          id="notes"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Share your timeline or specific goals."
        />
      </div>

      <Button type="submit" className="w-full font-semibold">
        Send My Estimate Request
      </Button>
    </form>
  );
}
