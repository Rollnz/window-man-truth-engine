import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteAnalysisResults } from '../QuoteAnalysisResults';
import type { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';

const mockResult: QuoteAnalysisResult = {
  overallScore: 75,
  safetyScore: 80,
  scopeScore: 70,
  priceScore: 65,
  finePrintScore: 85,
  warrantyScore: 75,
  pricePerOpening: '$650',
  warnings: ['Missing impact rating certification', 'Vague installation timeline'],
  missingItems: ['Design pressure specifications', 'Permit handling'],
  summary: 'This quote has some concerns that need to be addressed.',
  analyzedAt: '2024-01-15T10:30:00Z',
};

describe('QuoteAnalysisResults', () => {
  describe('Empty/Locked State', () => {
    it('shows lock overlay when no image and locked', () => {
      render(
        <QuoteAnalysisResults 
          result={null} 
          isLocked={true} 
          hasImage={false} 
        />
      );
      
      expect(screen.getByText('Upload to Reveal')).toBeInTheDocument();
      expect(screen.getByText(/see your instant safety score/i)).toBeInTheDocument();
    });

    it('shows lock overlay with different message when has image but locked', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={true} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('Results Locked')).toBeInTheDocument();
      expect(screen.getByText(/enter your email to unlock/i)).toBeInTheDocument();
    });

    it('shows placeholder pricing when no result', () => {
      render(
        <QuoteAnalysisResults 
          result={null} 
          isLocked={false} 
          hasImage={false} 
        />
      );
      
      // Look for the price placeholder in the description
      expect(screen.getByText(/\$ —/)).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('renders the header with correct styling', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('After: Your AI Quote Gradecard')).toBeInTheDocument();
    });
  });

  describe('Score Display', () => {
    it('displays overall score', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('out of 100')).toBeInTheDocument();
    });

    it('displays all category scores', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('Safety')).toBeInTheDocument();
      expect(screen.getByText('80/100')).toBeInTheDocument();
      
      expect(screen.getByText('Scope')).toBeInTheDocument();
      expect(screen.getByText('70/100')).toBeInTheDocument();
      
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('65/100')).toBeInTheDocument();
      
      expect(screen.getByText('Fine Print')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      
      expect(screen.getByText('Warranty')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
    });

    it('displays price per opening', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText(/est\. price per opening: \$650/i)).toBeInTheDocument();
    });

    it('displays summary', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('This quote has some concerns that need to be addressed.')).toBeInTheDocument();
    });
  });

  describe('Score Colors', () => {
    it('shows green for high scores (>=80)', () => {
      const highScoreResult: QuoteAnalysisResult = {
        ...mockResult,
        overallScore: 85,
        safetyScore: 90,
      };
      
      render(
        <QuoteAnalysisResults 
          result={highScoreResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      const highScoreElement = screen.getByText('85');
      expect(highScoreElement).toHaveClass('text-emerald-400');
    });

    it('shows amber for medium scores (60-79)', () => {
      const mediumScoreResult: QuoteAnalysisResult = {
        ...mockResult,
        overallScore: 65,
      };
      
      render(
        <QuoteAnalysisResults 
          result={mediumScoreResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      const mediumScoreElement = screen.getByText('65');
      expect(mediumScoreElement).toHaveClass('text-amber-400');
    });

    it('shows rose for low scores (<60)', () => {
      const lowScoreResult: QuoteAnalysisResult = {
        ...mockResult,
        overallScore: 45,
      };
      
      render(
        <QuoteAnalysisResults 
          result={lowScoreResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      const lowScoreElement = screen.getByText('45');
      expect(lowScoreElement).toHaveClass('text-rose-400');
    });
  });

  describe('Warnings Section', () => {
    it('displays warnings when present', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText('Missing impact rating certification')).toBeInTheDocument();
      expect(screen.getByText('Vague installation timeline')).toBeInTheDocument();
    });

    it('does not show warnings section when no warnings', () => {
      const noWarningsResult: QuoteAnalysisResult = {
        ...mockResult,
        warnings: [],
        missingItems: [],
      };
      
      render(
        <QuoteAnalysisResults 
          result={noWarningsResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
    });
  });

  describe('Missing Items Section', () => {
    it('displays missing items when present', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('Missing Items')).toBeInTheDocument();
      expect(screen.getByText('Design pressure specifications')).toBeInTheDocument();
      expect(screen.getByText('Permit handling')).toBeInTheDocument();
    });

    it('shows missing items in scope description', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText(/missing: design pressure specifications/i)).toBeInTheDocument();
    });
  });

  describe('Timestamp', () => {
    it('displays analyzed timestamp when result has analyzedAt', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText(/last analyzed:/i)).toBeInTheDocument();
    });

    it('does not display timestamp when no result', () => {
      render(
        <QuoteAnalysisResults 
          result={null} 
          isLocked={false} 
          hasImage={false} 
        />
      );
      
      expect(screen.queryByText(/last analyzed:/i)).not.toBeInTheDocument();
    });
  });

  describe('Fine Print Description', () => {
    it('shows first warning in fine print description', () => {
      render(
        <QuoteAnalysisResults 
          result={mockResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText(/warning: missing impact rating certification/i)).toBeInTheDocument();
    });

    it('shows no red flags message when no warnings', () => {
      const noWarningsResult: QuoteAnalysisResult = {
        ...mockResult,
        warnings: [],
        missingItems: [],
      };
      
      render(
        <QuoteAnalysisResults 
          result={noWarningsResult} 
          isLocked={false} 
          hasImage={true} 
        />
      );
      
      expect(screen.getByText('No major red flags found.')).toBeInTheDocument();
    });
  });

  describe('Question Mark Placeholder', () => {
    it('shows question mark for missing scores', () => {
      render(
        <QuoteAnalysisResults 
          result={null} 
          isLocked={false} 
          hasImage={false} 
        />
      );
      
      const questionMarks = screen.getAllByText('?');
      expect(questionMarks.length).toBeGreaterThan(0);
    });
  });
});
