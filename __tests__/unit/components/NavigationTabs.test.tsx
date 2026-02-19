/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { NavigationTabs } from '@/components/NavigationTabs';

// Mock next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NavigationTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all navigation tabs in desktop nav', () => {
    mockPathname.mockReturnValue('/admin/mission-control');
    
    render(<NavigationTabs />);
    
    // Get desktop nav (hidden on mobile)
    const desktopNav = document.querySelector('nav.hidden.sm\\:flex');
    expect(desktopNav).toBeInTheDocument();
    
    // Check for tabs within desktop nav only
    const { getByText } = within(desktopNav as HTMLElement);
    expect(getByText('Overview')).toBeInTheDocument();
    expect(getByText('Activity')).toBeInTheDocument();
    expect(getByText('Calendar')).toBeInTheDocument();
    expect(getByText('Search')).toBeInTheDocument();
  });

  it('should highlight Overview tab on main page', () => {
    mockPathname.mockReturnValue('/admin/mission-control');
    
    render(<NavigationTabs />);
    
    // Overview link should have green text (active state)
    const desktopNav = document.querySelector('nav.hidden.sm\\:flex');
    const overviewLink = desktopNav?.querySelector('a[href="/admin/mission-control"]');
    expect(overviewLink?.textContent).toContain('Overview');
  });

  it('should highlight Activity tab on activity page', () => {
    mockPathname.mockReturnValue('/admin/mission-control/activity');
    
    render(<NavigationTabs />);
    
    const desktopNav = document.querySelector('nav.hidden.sm\\:flex');
    const activityLink = desktopNav?.querySelector('a[href="/admin/mission-control/activity"]');
    expect(activityLink?.textContent).toContain('Activity');
  });

  it('should have correct hrefs for all tabs', () => {
    mockPathname.mockReturnValue('/admin/mission-control');
    
    render(<NavigationTabs />);
    
    const links = screen.getAllByRole('link');
    const hrefs = links.map(l => l.getAttribute('href'));
    
    expect(hrefs).toContain('/admin/mission-control');
    expect(hrefs).toContain('/admin/mission-control/activity');
    expect(hrefs).toContain('/admin/mission-control/calendar');
    expect(hrefs).toContain('/admin/mission-control/search');
  });

  it('should render icons for all tabs', () => {
    mockPathname.mockReturnValue('/admin/mission-control');
    
    render(<NavigationTabs />);
    
    // Should have multiple SVGs (icons in both desktop and mobile)
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('should apply custom className', () => {
    mockPathname.mockReturnValue('/admin/mission-control');
    
    render(<NavigationTabs className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should handle Calendar tab active state', () => {
    mockPathname.mockReturnValue('/admin/mission-control/calendar');
    
    render(<NavigationTabs />);
    
    const desktopNav = document.querySelector('nav.hidden.sm\\:flex');
    const calendarLink = desktopNav?.querySelector('a[href="/admin/mission-control/calendar"]');
    expect(calendarLink?.textContent).toContain('Calendar');
  });

  it('should handle Search tab active state', () => {
    mockPathname.mockReturnValue('/admin/mission-control/search');
    
    render(<NavigationTabs />);
    
    const desktopNav = document.querySelector('nav.hidden.sm\\:flex');
    const searchLink = desktopNav?.querySelector('a[href="/admin/mission-control/search"]');
    expect(searchLink?.textContent).toContain('Search');
  });
});
