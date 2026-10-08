/**
 * Phase 17 — Frontend Component Tests
 * Tests for: Button, EmptyState, ErrorState, StatusBadge, TrendIndicator,
 *             ErrorBoundary, PageSkeleton, and utility functions.
 */
import { describe, it, expect, vi, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Button Tests ─────────────────────────────────────────────────────────────

import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Save Transaction</Button>);
    expect(screen.getByRole('button', { name: 'Save Transaction' })).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Action</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled and shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading...</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Delete');
  });

  it('renders leftIcon before children', () => {
    const Icon = () => <span data-testid="icon">★</span>;
    render(<Button leftIcon={<Icon />}>With Icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With Icon')).toBeInTheDocument();
  });
});

// ─── EmptyState Tests ────────────────────────────────────────────────────────

import { EmptyState } from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No Transactions" description="Import your bank data to get started." />);
    expect(screen.getByText('No Transactions')).toBeInTheDocument();
    expect(screen.getByText('Import your bank data to get started.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Data"
        description="Nothing here."
        actionLabel="Import Now"
        onAction={handleAction}
      />
    );
    const btn = screen.getByRole('button', { name: 'Import Now' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when onAction is not provided', () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ─── ErrorState Tests ─────────────────────────────────────────────────────────

import { ErrorState } from '../components/ui/ErrorState';

describe('ErrorState', () => {
  it('renders with default title and message', () => {
    render(<ErrorState />);
    expect(screen.getByText(/unable to load data/i)).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<ErrorState title="Connection Failed" message="Unable to reach the server." />);
    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
    expect(screen.getByText('Unable to reach the server.')).toBeInTheDocument();
  });

  it('renders Try Again button and calls onRetry', () => {
    const handleRetry = vi.fn();
    render(<ErrorState title="Error" message="Something went wrong." onRetry={handleRetry} />);
    const btn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(btn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button without onRetry prop', () => {
    render(<ErrorState title="Error" message="Fatal issue." />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has role="alert" for screen readers', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

// ─── StatusBadge Tests ────────────────────────────────────────────────────────

import { StatusBadge } from '../components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders IMPROVING status label', () => {
    render(<StatusBadge status="IMPROVING" />);
    expect(screen.getByText(/improving/i)).toBeInTheDocument();
  });

  it('renders CONCERNING status label', () => {
    render(<StatusBadge status="CONCERNING" />);
    expect(screen.getByText(/concerning/i)).toBeInTheDocument();
  });

  it('renders STABLE status label', () => {
    render(<StatusBadge status="STABLE" />);
    expect(screen.getByText(/stable/i)).toBeInTheDocument();
  });

  it('renders ATTENTION_REQUIRED status label', () => {
    render(<StatusBadge status="ATTENTION_REQUIRED" />);
    expect(screen.getByText(/attention/i)).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<StatusBadge status="IMPROVING" label="↑ Savings Up" />);
    expect(screen.getByText('↑ Savings Up')).toBeInTheDocument();
  });
});

// ─── TrendIndicator Tests ─────────────────────────────────────────────────────

import { TrendIndicator } from '../components/ui/TrendIndicator';

describe('TrendIndicator', () => {
  it('renders positive change percent', () => {
    render(<TrendIndicator changePercent={15.2} status="IMPROVING" />);
    expect(screen.getByText(/15\.2/)).toBeInTheDocument();
  });

  it('renders negative change percent', () => {
    render(<TrendIndicator changePercent={-8.5} status="CONCERNING" />);
    expect(screen.getByText(/8\.5/)).toBeInTheDocument();
  });

  it('renders zero change', () => {
    render(<TrendIndicator changePercent={0} status="STABLE" />);
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });
});

// ─── PageSkeleton Tests ───────────────────────────────────────────────────────

import { PageSkeleton } from '../components/common/PageSkeleton';

describe('PageSkeleton', () => {
  it('renders with correct ARIA loading attributes', () => {
    render(<PageSkeleton />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading page content');
  });

  it('includes sr-only loading message for screen readers', () => {
    render(<PageSkeleton />);
    expect(screen.getByText(/loading page content/i)).toBeInTheDocument();
  });
});

// ─── ErrorBoundary Tests ──────────────────────────────────────────────────────

import { ErrorBoundary } from '../components/common/ErrorBoundary';

const ThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Intentional test error');
  }
  return <div data-testid="child-content">Rendered Successfully</div>;
};

describe('ErrorBoundary', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders error fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByText(/interface rendering error/i)).toBeInTheDocument();
  });

  it('renders nested children without error interference', () => {
    render(
      <ErrorBoundary>
        <div>
          <span data-testid="nested-child">Nested Content</span>
        </div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
});

// ─── Utility Function Tests ───────────────────────────────────────────────────

import { formatCurrency, formatPercent } from '../lib/utils';

describe('formatCurrency', () => {
  it('formats USD amounts correctly', () => {
    expect(formatCurrency(1500, 'USD')).toBe('$1,500');
  });

  it('formats large amounts with comma separators', () => {
    expect(formatCurrency(28450.75, 'USD')).toBe('$28,450.75');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0');
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-500, 'USD');
    expect(result).toContain('500');
  });
});

describe('formatPercent', () => {
  it('formats positive percentage with + sign', () => {
    expect(formatPercent(15.2)).toBe('+15.2%');
  });

  it('formats negative percentage with - sign', () => {
    expect(formatPercent(-8.5)).toBe('-8.5%');
  });

  it('formats zero as 0.0%', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats without sign when includeSign is false', () => {
    expect(formatPercent(12.3, false)).toBe('12.3%');
    expect(formatPercent(-5.0, false)).toBe('5.0%');
  });
});
