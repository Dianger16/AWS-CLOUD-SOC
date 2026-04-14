/**
 * tests/components.test.tsx — React component tests.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Loader, CardSkeleton } from '../src/components/Loader'
import { StatCard, AssetCard } from '../src/components/AssetCard'

// ── Loader ────────────────────────────────────────────────────────────────────

describe('Loader', () => {
  it('renders with default label', () => {
    render(<Loader />)
    expect(screen.getByText('Scanning...')).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<Loader label="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders without label when empty string passed', () => {
    const { container } = render(<Loader label="" />)
    expect(container.querySelector('span')).toBeNull()
  })
})

describe('CardSkeleton', () => {
  it('renders skeleton placeholder', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })
})

// ── StatCard ──────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Findings" value={42} />)
    expect(screen.getByText('Total Findings')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders sublabel when provided', () => {
    render(<StatCard label="Alerts" value={5} sublabel="unresolved" />)
    expect(screen.getByText('unresolved')).toBeInTheDocument()
  })

  it('does not render sublabel when omitted', () => {
    render(<StatCard label="Count" value={0} />)
    expect(screen.queryByText('unresolved')).toBeNull()
  })
})

// ── AssetCard ─────────────────────────────────────────────────────────────────

describe('AssetCard', () => {
  it('renders type and count', () => {
    render(<AssetCard type="EC2 Instances" count={12} icon="◫" />)
    expect(screen.getByText('EC2 Instances')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders risk badge when riskCount > 0', () => {
    render(<AssetCard type="S3 Buckets" count={5} icon="◩" riskCount={2} />)
    expect(screen.getByText('2 AT RISK')).toBeInTheDocument()
  })

  it('does not render risk badge when riskCount is 0', () => {
    render(<AssetCard type="S3 Buckets" count={5} icon="◩" riskCount={0} />)
    expect(screen.queryByText(/AT RISK/)).toBeNull()
  })

  it('pads single-digit count with zero', () => {
    render(<AssetCard type="EC2 Instances" count={3} icon="◫" />)
    expect(screen.getByText('03')).toBeInTheDocument()
  })
})
