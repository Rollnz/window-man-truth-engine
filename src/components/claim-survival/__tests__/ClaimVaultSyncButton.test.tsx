import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClaimVaultSyncButton } from '../ClaimVaultSyncButton';
import type { AnalysisResult } from '@/hooks/useEvidenceAnalysis';

// Mock dependencies
const mockSignInWithMagicLink = vi.fn();
const mockUpdateFields = vi.fn();
const mockTrackEvent = vi.fn();
const mockToast = vi.fn();

// Mock session data state
let mockSessionData: Record<string, unknown> = {};
let mockUser: { email: string } | null = null;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithMagicLink: mockSignInWithMagicLink,
    user: mockUser,
  }),
}));

vi.mock('@/hooks/useSessionData', () => ({
  useSessionData: () => ({
    sessionData: mockSessionData,
    updateFields: mockUpdateFields,
  }),
}));

vi.mock('@/lib/gtm', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

// Sample analysis result for tests
const mockAnalysis: AnalysisResult = {
  overallScore: 75,
  status: 'warning',
  summary: 'You have 5 of 7 documents ready',
  documentStatus: [
    { docId: 'policy', status: 'complete', recommendation: 'Looks good' },
    { docId: 'photos', status: 'missing', recommendation: 'Upload damage photos' },
  ],
  nextSteps: ['Upload damage photos', 'Get contractor estimate'],
  analyzedAt: '2024-01-15T10:00:00Z',
};

describe('ClaimVaultSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData = {};
    mockUser = null;
    mockSignInWithMagicLink.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save to my vault/i })).toBeInTheDocument();
    });

    it('displays the analysis score in the form description', () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      expect(screen.getByText(/75% readiness score/i)).toBeInTheDocument();
    });

    it('renders compact variant as a button initially', () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} variant="compact" />);
      
      expect(screen.getByRole('button', { name: /save analysis to my vault/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });

    it('expands compact variant to show form on click', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} variant="compact" />);
      
      await user.click(screen.getByRole('button', { name: /save analysis to my vault/i }));
      
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  describe('Session Data Initialization', () => {
    it('initializes form fields from session data when available', async () => {
      mockSessionData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
        expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
        expect(screen.getByLabelText(/email address/i)).toHaveValue('john@example.com');
      });
    });

    it('initializes with empty fields when no session data exists', () => {
      mockSessionData = {};

      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    });

    it('does not overwrite user-entered values when session data arrives late', async () => {
      const user = userEvent.setup();
      // Start with no session data
      mockSessionData = {};
      const { rerender } = render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      // User types their own values
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'Jane');
      
      // Session data arrives
      mockSessionData = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      rerender(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      // User's value should be preserved
      expect(firstNameInput).toHaveValue('Jane');
    });
  });

  describe('Form Validation', () => {
    it('shows validation error when first name is too short', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'A');
      fireEvent.blur(firstNameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('clears validation error when user corrects input', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      
      // Enter invalid email
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      // Clear and enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('prevents form submission when validation fails', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      // Fill only email (missing required firstName)
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      
      // Try to submit
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      // Should not call signInWithMagicLink
      expect(mockSignInWithMagicLink).not.toHaveBeenCalled();
    });

    it('validates all fields on submit and shows errors', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      // Submit with empty fields
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form successfully with valid data', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      // Fill valid data
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockSignInWithMagicLink).toHaveBeenCalledWith('john@example.com');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockSignInWithMagicLink.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/sending access link/i)).toBeInTheDocument();
      });
    });

    it('shows success state after successful submission', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });

    it('persists form data to session on submission', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockUpdateFields).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            sourceTool: 'claim-survival-kit',
          })
        );
      });
    });

    it('tracks vault_sync_clicked event on submission', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('vault_sync_clicked', expect.objectContaining({
          source_tool: 'claim-survival-kit',
          analysis_score: 75,
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast when magic link fails', async () => {
      const user = userEvent.setup();
      mockSignInWithMagicLink.mockResolvedValue({ 
        error: { message: 'Invalid email domain' } 
      });
      
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: "Couldn't send access link",
          variant: 'destructive',
        }));
      });
    });

    it('tracks vault_sync_error event on magic link failure', async () => {
      const user = userEvent.setup();
      mockSignInWithMagicLink.mockResolvedValue({ 
        error: { message: 'Rate limited' } 
      });
      
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('vault_sync_error', expect.objectContaining({
          source_tool: 'claim-survival-kit',
          error_type: 'magic_link_failed',
          error_message: 'Rate limited',
        }));
      });
    });

    it('shows error toast when sync throws an exception', async () => {
      const user = userEvent.setup();
      mockSignInWithMagicLink.mockRejectedValue(new Error('Network error'));
      
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Something went wrong',
          variant: 'destructive',
        }));
      });
    });

    it('resets loading state after error', async () => {
      const user = userEvent.setup();
      mockSignInWithMagicLink.mockResolvedValue({ 
        error: { message: 'Error' } 
      });
      
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /save to my vault/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save to my vault/i })).not.toBeDisabled();
      });
    });
  });

  describe('Authenticated User State', () => {
    beforeEach(() => {
      mockUser = { email: 'user@example.com' };
    });

    it('shows synced state for authenticated users', async () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await waitFor(() => {
        expect(screen.getByText(/logged in as user@example.com/i)).toBeInTheDocument();
      });
    });

    it('auto-syncs analysis for authenticated users', async () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await waitFor(() => {
        expect(mockUpdateFields).toHaveBeenCalledWith(expect.objectContaining({
          claimAnalysisResult: expect.objectContaining({
            overallScore: 75,
          }),
          email: 'user@example.com',
        }));
      });
    });

    it('tracks vault_auto_sync event for authenticated users', async () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('vault_auto_sync', expect.objectContaining({
          source_tool: 'claim-survival-kit',
          analysis_score: 75,
          user_authenticated: true,
        }));
      });
    });

    it('shows Manage Vault link for authenticated users', async () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /manage.*vault/i })).toHaveAttribute('href', '/vault');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes on required fields', () => {
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true');
    });

    it('sets aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      render(<ClaimVaultSyncButton analysis={mockAnalysis} />);
      
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby', 'vault-email-error');
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
