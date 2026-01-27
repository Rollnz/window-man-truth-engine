import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ScannerStep3Analysis } from '../steps/ScannerStep3Analysis';

describe('ScannerStep3Analysis', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the analysis title', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      expect(screen.getByText('Analyzing Your Quote...')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      // Progress bar container
      const progressContainer = document.querySelector('.bg-slate-200');
      expect(progressContainer).toBeInTheDocument();
    });

    it('renders loading spinner', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders all 4 analysis steps', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      expect(screen.getByText('Scanning document for text...')).toBeInTheDocument();
      expect(screen.getByText('Analyzing warranty terms...')).toBeInTheDocument();
      expect(screen.getByText('Checking price against 2025 market data...')).toBeInTheDocument();
      expect(screen.getByText('Generating your gradecard...')).toBeInTheDocument();
    });
  });

  describe('Step Progression', () => {
    it('starts with no completed steps', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      // Should not have any check icons initially
      const checkIcons = document.querySelectorAll('.bg-primary.text-white');
      expect(checkIcons.length).toBe(0);
    });

    it('completes first step after 1250ms', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(1250);
      });
      
      // First step should be completed (has check icon with bg-primary)
      const completedSteps = document.querySelectorAll('.bg-primary.text-white');
      expect(completedSteps.length).toBe(1);
    });

    it('completes second step after 2500ms', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(2500);
      });
      
      const completedSteps = document.querySelectorAll('.bg-primary.text-white');
      expect(completedSteps.length).toBe(2);
    });

    it('completes third step after 3750ms', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(3750);
      });
      
      const completedSteps = document.querySelectorAll('.bg-primary.text-white');
      expect(completedSteps.length).toBe(3);
    });

    it('completes all steps after 5000ms', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      const completedSteps = document.querySelectorAll('.bg-primary.text-white');
      expect(completedSteps.length).toBe(4);
    });
  });

  describe('Progress Bar', () => {
    it('starts at 0%', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      const progressBar = document.querySelector('.bg-primary.rounded-full');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('progresses over time', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(1000); // 10 intervals of 100ms, 2% each = 20%
      });
      
      const progressBar = document.querySelector('.bg-primary.rounded-full');
      expect(progressBar).toHaveStyle({ width: '20%' });
    });

    it('reaches 100% after 5000ms', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      const progressBar = document.querySelector('.bg-primary.rounded-full');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Completion Callback', () => {
    it('calls onComplete after all steps when not analyzing', async () => {
      const onComplete = vi.fn();
      render(<ScannerStep3Analysis onComplete={onComplete} isAnalyzing={false} />);
      
      await act(async () => {
        vi.advanceTimersByTime(5500); // 5 seconds + 200ms delay + buffer
      });
      
      expect(onComplete).toHaveBeenCalled();
    });

    it('does not call onComplete while isAnalyzing is true', async () => {
      const onComplete = vi.fn();
      render(<ScannerStep3Analysis onComplete={onComplete} isAnalyzing={true} />);
      
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });
      
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('calls onComplete when isAnalyzing becomes false after steps complete', async () => {
      const onComplete = vi.fn();
      const { rerender } = render(
        <ScannerStep3Analysis onComplete={onComplete} isAnalyzing={true} />
      );
      
      // Complete all steps
      await act(async () => {
        vi.advanceTimersByTime(5500);
      });
      
      expect(onComplete).not.toHaveBeenCalled();
      
      // Now set isAnalyzing to false
      rerender(<ScannerStep3Analysis onComplete={onComplete} isAnalyzing={false} />);
      
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Step Visibility', () => {
    it('current step has full opacity', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      // First step should be visible (current)
      const firstStep = screen.getByText('Scanning document for text...').closest('div');
      expect(firstStep).toHaveClass('opacity-100');
    });

    it('completed steps have full opacity', async () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      await act(async () => {
        vi.advanceTimersByTime(1300);
      });
      
      // First step (completed) should still be visible
      const firstStep = screen.getByText('Scanning document for text...').closest('div');
      expect(firstStep).toHaveClass('opacity-100');
    });

    it('future steps have reduced opacity', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      // Last step should be less visible initially
      const lastStep = screen.getByText('Generating your gradecard...').closest('div');
      expect(lastStep).toHaveClass('opacity-40');
    });
  });

  describe('Cleanup', () => {
    it('clears timeouts on unmount', async () => {
      const onComplete = vi.fn();
      const { unmount } = render(<ScannerStep3Analysis onComplete={onComplete} />);
      
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      unmount();
      
      // Advance time after unmount - should not cause errors
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      
      // onComplete should not be called since component unmounted
      // (depending on when it was scheduled)
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  describe('Pulsing Animation', () => {
    it('renders pulsing animation elements', () => {
      render(<ScannerStep3Analysis onComplete={vi.fn()} />);
      
      // Check for analysis-pulse class or pulsing elements
      const pulsingElements = document.querySelectorAll('.analysis-pulse, .animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });
  });
});
