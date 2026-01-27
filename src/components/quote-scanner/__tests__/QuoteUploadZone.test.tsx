import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteUploadZone } from '../QuoteUploadZone';

// Mock the SampleQuoteDocument component
vi.mock('../SampleQuoteDocument', () => ({
  SampleQuoteDocument: () => <div data-testid="sample-quote-document">Sample Quote</div>,
}));

// Mock the FloatingCallout component
vi.mock('../FloatingCallout', () => ({
  FloatingCallout: ({ label }: { label: string }) => (
    <div data-testid="floating-callout">{label}</div>
  ),
}));

describe('QuoteUploadZone', () => {
  const defaultProps = {
    onFileSelect: vi.fn(),
    isAnalyzing: false,
    hasResult: false,
    imagePreview: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the upload zone with header', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      expect(screen.getByText('Before: Just a Confusing Estimate')).toBeInTheDocument();
    });

    it('renders sample quote document when no image preview', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      expect(screen.getByTestId('sample-quote-document')).toBeInTheDocument();
    });

    it('renders floating callouts when no image preview', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const callouts = screen.getAllByTestId('floating-callout');
      expect(callouts.length).toBeGreaterThan(0);
    });

    it('shows upload prompt text', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      expect(screen.getByText('Upload Your Estimate')).toBeInTheDocument();
      expect(screen.getByText('JPG, PNG, or PDF up to 10MB')).toBeInTheDocument();
    });

    it('renders Select File button', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /select file/i })).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      expect(screen.getByText(/contractors often hand you numbers/i)).toBeInTheDocument();
    });
  });

  describe('File Input', () => {
    it('has hidden file input with correct accept types', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp');
      expect(fileInput).toHaveClass('hidden');
    });

    it('triggers file input click when Select File button is clicked', async () => {
      render(<QuoteUploadZone {...defaultProps} />);
      const user = userEvent.setup();
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      await user.click(screen.getByRole('button', { name: /select file/i }));
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('calls onFileSelect when file is selected', async () => {
      const onFileSelect = vi.fn();
      render(<QuoteUploadZone {...defaultProps} onFileSelect={onFileSelect} />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });
      
      await fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(onFileSelect).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Drag and Drop', () => {
    it('accepts image files on drop', () => {
      const onFileSelect = vi.fn();
      render(<QuoteUploadZone {...defaultProps} onFileSelect={onFileSelect} />);
      
      const dropZone = screen.getByText('Upload Your Estimate').closest('div')?.parentElement?.parentElement;
      const mockFile = new File(['test'], 'quote.png', { type: 'image/png' });
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [mockFile],
        },
      });
      
      expect(onFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('accepts PDF files on drop', () => {
      const onFileSelect = vi.fn();
      render(<QuoteUploadZone {...defaultProps} onFileSelect={onFileSelect} />);
      
      const dropZone = screen.getByText('Upload Your Estimate').closest('div')?.parentElement?.parentElement;
      const mockFile = new File(['test'], 'quote.pdf', { type: 'application/pdf' });
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [mockFile],
        },
      });
      
      expect(onFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('rejects non-image/PDF files on drop', () => {
      const onFileSelect = vi.fn();
      render(<QuoteUploadZone {...defaultProps} onFileSelect={onFileSelect} />);
      
      const dropZone = screen.getByText('Upload Your Estimate').closest('div')?.parentElement?.parentElement;
      const mockFile = new File(['test'], 'quote.txt', { type: 'text/plain' });
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [mockFile],
        },
      });
      
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('handles dragOver event', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const dropZone = screen.getByText('Upload Your Estimate').closest('div')?.parentElement?.parentElement;
      
      fireEvent.dragOver(dropZone!, { preventDefault: vi.fn() });
      
      // Should not throw
      expect(dropZone).toBeInTheDocument();
    });

    it('handles dragLeave event', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const dropZone = screen.getByText('Upload Your Estimate').closest('div')?.parentElement?.parentElement;
      
      fireEvent.dragLeave(dropZone!, { preventDefault: vi.fn() });
      
      // Should not throw
      expect(dropZone).toBeInTheDocument();
    });
  });

  describe('Analyzing State', () => {
    it('shows analyzing overlay when isAnalyzing is true', () => {
      render(<QuoteUploadZone {...defaultProps} isAnalyzing={true} />);
      
      expect(screen.getByText('Analyzing Contract...')).toBeInTheDocument();
      expect(screen.getByText(/scanning for impact ratings/i)).toBeInTheDocument();
    });

    it('shows loading spinner when analyzing', () => {
      render(<QuoteUploadZone {...defaultProps} isAnalyzing={true} />);
      
      // Loader2 icon is present (has animate-spin class)
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('disables Select File button when analyzing', () => {
      render(<QuoteUploadZone {...defaultProps} isAnalyzing={true} />);
      
      expect(screen.getByRole('button', { name: /select file/i })).toBeDisabled();
    });

    it('has pointer-events-none when analyzing', () => {
      render(<QuoteUploadZone {...defaultProps} isAnalyzing={true} />);
      
      const uploadZone = document.querySelector('.pointer-events-none');
      expect(uploadZone).toBeInTheDocument();
    });
  });

  describe('Image Preview State', () => {
    it('shows image preview when imagePreview is provided', () => {
      const base64Image = 'dGVzdA=='; // base64 for "test"
      render(<QuoteUploadZone {...defaultProps} imagePreview={base64Image} />);
      
      const previewImage = screen.getByAltText('Preview of your uploaded window replacement quote');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', expect.stringContaining(base64Image));
    });

    it('shows "Analyze Another Quote" text when image preview exists', () => {
      render(<QuoteUploadZone {...defaultProps} imagePreview="dGVzdA==" />);
      
      expect(screen.getByText('Analyze Another Quote')).toBeInTheDocument();
    });

    it('shows "Select Different File" button when image preview exists', () => {
      render(<QuoteUploadZone {...defaultProps} imagePreview="dGVzdA==" />);
      
      expect(screen.getByRole('button', { name: /select different file/i })).toBeInTheDocument();
    });

    it('hides sample quote document when image preview exists', () => {
      render(<QuoteUploadZone {...defaultProps} imagePreview="dGVzdA==" />);
      
      expect(screen.queryByTestId('sample-quote-document')).not.toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container div', () => {
      const ref = vi.fn();
      render(<QuoteUploadZone {...defaultProps} ref={ref} />);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Accessibility', () => {
    it('has accessible file input', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('button is focusable', () => {
      render(<QuoteUploadZone {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /select file/i });
      expect(button).toBeInTheDocument();
      // Button should not have tabIndex=-1
      expect(button).not.toHaveAttribute('tabIndex', '-1');
    });
  });
});
