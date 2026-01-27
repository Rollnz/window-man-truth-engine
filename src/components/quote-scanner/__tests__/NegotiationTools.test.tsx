import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NegotiationTools } from '../NegotiationTools';

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('NegotiationTools', () => {
  const defaultProps = {
    emailDraft: null,
    phoneScript: null,
    isDraftingEmail: false,
    isDraftingPhoneScript: false,
    onGenerateEmail: vi.fn(),
    onGeneratePhoneScript: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the header', () => {
      render(<NegotiationTools {...defaultProps} />);
      
      expect(screen.getByText('Negotiation Tools')).toBeInTheDocument();
    });

    it('renders email and phone tabs', () => {
      render(<NegotiationTools {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /email draft/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /phone script/i })).toBeInTheDocument();
    });

    it('shows email tab as default active', () => {
      render(<NegotiationTools {...defaultProps} />);
      
      const emailTab = screen.getByRole('tab', { name: /email draft/i });
      expect(emailTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Email Tab', () => {
    it('shows generate email button when no draft exists', () => {
      render(<NegotiationTools {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /draft negotiation email/i })).toBeInTheDocument();
    });

    it('calls onGenerateEmail when generate button is clicked', async () => {
      const onGenerateEmail = vi.fn();
      render(<NegotiationTools {...defaultProps} onGenerateEmail={onGenerateEmail} />);
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /draft negotiation email/i }));
      
      expect(onGenerateEmail).toHaveBeenCalled();
    });

    it('shows loading state when drafting email', () => {
      render(<NegotiationTools {...defaultProps} isDraftingEmail={true} />);
      
      expect(screen.getByText('Writing Email...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('disables generate button when drafting', () => {
      render(<NegotiationTools {...defaultProps} isDraftingEmail={true} />);
      
      expect(screen.getByRole('button', { name: /writing email/i })).toBeDisabled();
    });

    it('displays email draft when available', () => {
      const emailDraft = 'Dear Contractor, I have some concerns.';
      render(<NegotiationTools {...defaultProps} emailDraft={emailDraft} />);
      
      expect(screen.getByText('Draft Email')).toBeInTheDocument();
      // Use partial match for the text content
      expect(screen.getByText(/Dear Contractor/)).toBeInTheDocument();
    });

    it('shows copy button when email draft exists', () => {
      render(<NegotiationTools {...defaultProps} emailDraft="Test email" />);
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('shows regenerate button when email draft exists', () => {
      render(<NegotiationTools {...defaultProps} emailDraft="Test email" />);
      
      expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    });

    it('copies email to clipboard when copy button is clicked', async () => {
      const emailDraft = 'Test email content';
      render(<NegotiationTools {...defaultProps} emailDraft={emailDraft} />);
      const user = userEvent.setup();
      
      const copyButton = screen.getByRole('button', { name: /^copy$/i });
      await user.click(copyButton);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(emailDraft);
    });

    it('shows "Copied" feedback after copying', async () => {
      render(<NegotiationTools {...defaultProps} emailDraft="Test email" />);
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /^copy$/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });

    it('calls onGenerateEmail when regenerate button is clicked', async () => {
      const onGenerateEmail = vi.fn();
      render(
        <NegotiationTools 
          {...defaultProps} 
          emailDraft="Test email"
          onGenerateEmail={onGenerateEmail}
        />
      );
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /regenerate/i }));
      
      expect(onGenerateEmail).toHaveBeenCalled();
    });
  });

  describe('Phone Tab', () => {
    it('shows generate phone script button when no script exists', async () => {
      render(<NegotiationTools {...defaultProps} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      expect(screen.getByRole('button', { name: /generate phone script/i })).toBeInTheDocument();
    });

    it('calls onGeneratePhoneScript when generate button is clicked', async () => {
      const onGeneratePhoneScript = vi.fn();
      render(<NegotiationTools {...defaultProps} onGeneratePhoneScript={onGeneratePhoneScript} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      await user.click(screen.getByRole('button', { name: /generate phone script/i }));
      
      expect(onGeneratePhoneScript).toHaveBeenCalled();
    });

    it('shows loading state when drafting phone script', async () => {
      render(<NegotiationTools {...defaultProps} isDraftingPhoneScript={true} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      expect(screen.getByText('Writing Script...')).toBeInTheDocument();
    });

    it('displays phone script when available', async () => {
      const phoneScript = 'Hello, I am calling about my quote.';
      render(<NegotiationTools {...defaultProps} phoneScript={phoneScript} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      expect(screen.getByText('Phone Script')).toBeInTheDocument();
      expect(screen.getByText(/Hello, I am calling/)).toBeInTheDocument();
    });

    it('copies phone script to clipboard', async () => {
      const phoneScript = 'Test phone script content';
      render(<NegotiationTools {...defaultProps} phoneScript={phoneScript} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      // Wait for tab content to render
      await waitFor(() => {
        expect(screen.getByText('Phone Script')).toBeInTheDocument();
      });
      
      // Find copy button in the phone tab content
      const copyButton = screen.getByRole('button', { name: /^copy$/i });
      await user.click(copyButton);
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(phoneScript);
    });
  });

  describe('Disabled State', () => {
    it('disables email generate button when disabled prop is true', () => {
      render(<NegotiationTools {...defaultProps} disabled={true} />);
      
      expect(screen.getByRole('button', { name: /draft negotiation email/i })).toBeDisabled();
    });

    it('disables phone generate button when disabled prop is true', async () => {
      render(<NegotiationTools {...defaultProps} disabled={true} />);
      const user = userEvent.setup();
      
      // Switch to phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      expect(screen.getByRole('button', { name: /generate phone script/i })).toBeDisabled();
    });
  });

  describe('Tab Switching', () => {
    it('switches between email and phone tabs', async () => {
      render(<NegotiationTools {...defaultProps} />);
      const user = userEvent.setup();
      
      // Initially email tab is active
      expect(screen.getByRole('tab', { name: /email draft/i })).toHaveAttribute('data-state', 'active');
      
      // Click phone tab
      await user.click(screen.getByRole('tab', { name: /phone script/i }));
      
      expect(screen.getByRole('tab', { name: /phone script/i })).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Accessibility', () => {
    it('tabs are keyboard navigable', async () => {
      render(<NegotiationTools {...defaultProps} />);
      const user = userEvent.setup();
      
      await user.tab(); // Focus first tab
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });
  });
});
