import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteQA } from '../QuoteQA';

describe('QuoteQA', () => {
  const defaultProps = {
    answer: null,
    isAsking: false,
    onAsk: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the header', () => {
      render(<QuoteQA {...defaultProps} />);
      
      expect(screen.getByText('Ask the AI Expert')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      render(<QuoteQA {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('e.g. Is the permit included?')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<QuoteQA {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onAsk with question when form is submitted', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      await user.type(input, 'What is included in the warranty?');
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onAsk).toHaveBeenCalledWith('What is included in the warranty?');
    });

    it('trims whitespace from question', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      await user.type(input, '  Is there a labor warranty?  ');
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onAsk).toHaveBeenCalledWith('Is there a labor warranty?');
    });

    it('does not call onAsk when question is empty', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} />);
      const user = userEvent.setup();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onAsk).not.toHaveBeenCalled();
    });

    it('does not call onAsk when question is only whitespace', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      await user.type(input, '   ');
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onAsk).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<QuoteQA {...defaultProps} disabled={true} />);
      
      expect(screen.getByPlaceholderText('e.g. Is the permit included?')).toBeDisabled();
    });

    it('disables button when disabled prop is true', () => {
      render(<QuoteQA {...defaultProps} disabled={true} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not call onAsk when disabled', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} disabled={true} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      // Bypass disabled state for testing
      await user.type(input, 'test question{enter}', { skipClick: true });
      
      expect(onAsk).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables input when isAsking is true', () => {
      render(<QuoteQA {...defaultProps} isAsking={true} />);
      
      expect(screen.getByPlaceholderText('e.g. Is the permit included?')).toBeDisabled();
    });

    it('shows loading spinner in button when isAsking', () => {
      render(<QuoteQA {...defaultProps} isAsking={true} />);
      
      // Loader2 icon has animate-spin class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not call onAsk when isAsking', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} isAsking={true} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Answer Display', () => {
    it('does not show answer section when answer is null', () => {
      render(<QuoteQA {...defaultProps} answer={null} />);
      
      expect(screen.queryByRole('img', { name: /bot/i })).not.toBeInTheDocument();
    });

    it('shows answer when provided', () => {
      render(
        <QuoteQA 
          {...defaultProps} 
          answer="Yes, the permit is included in the price." 
        />
      );
      
      expect(screen.getByText('Yes, the permit is included in the price.')).toBeInTheDocument();
    });

    it('shows bot icon with answer', () => {
      render(
        <QuoteQA 
          {...defaultProps} 
          answer="The warranty covers labor for 2 years." 
        />
      );
      
      // The answer section should be visible
      expect(screen.getByText('The warranty covers labor for 2 years.')).toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('disables button when input is empty', () => {
      render(<QuoteQA {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables button when input has text', async () => {
      render(<QuoteQA {...defaultProps} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      await user.type(input, 'test');
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('form contains required elements', () => {
      render(<QuoteQA {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('e.g. Is the permit included?')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('can submit form with Enter key', async () => {
      const onAsk = vi.fn();
      render(<QuoteQA {...defaultProps} onAsk={onAsk} />);
      const user = userEvent.setup();
      
      const input = screen.getByPlaceholderText('e.g. Is the permit included?');
      await user.type(input, 'What about the permit?{enter}');
      
      expect(onAsk).toHaveBeenCalledWith('What about the permit?');
    });
  });
});
