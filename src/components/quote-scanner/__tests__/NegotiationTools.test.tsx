import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NegotiationTools } from '../NegotiationTools';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NegotiationTools', () => {
  describe('Initial Render', () => {
    it('renders the header', () => {
      renderWithRouter(<NegotiationTools />);
      
      expect(screen.getByText('Negotiation Tools')).toBeInTheDocument();
    });

    it('renders the expert link section', () => {
      renderWithRouter(<NegotiationTools />);
      
      expect(screen.getByText('Need Help Negotiating?')).toBeInTheDocument();
      expect(screen.getByText(/Get personalized advice/)).toBeInTheDocument();
    });

    it('renders the chat button with correct link', () => {
      renderWithRouter(<NegotiationTools />);
      
      const link = screen.getByRole('link', { name: /chat with our ai expert/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/expert');
    });
  });

  describe('Accessibility', () => {
    it('has accessible link text', () => {
      renderWithRouter(<NegotiationTools />);
      
      const link = screen.getByRole('link', { name: /chat with our ai expert/i });
      expect(link).toBeInTheDocument();
    });
  });
});
