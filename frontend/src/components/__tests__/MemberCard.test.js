/**
 * Unit tests for MemberCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock the ProfileImage component
jest.mock('../ProfileImage', () => {
  return function MockProfileImage({ member }) {
    return <div data-testid="profile-image">{member.first_name}</div>;
  };
});

// Import the component
import MemberCard from '../MemberCard';

// Helper to render with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MemberCard', () => {
  // Use dates that will calculate to specific ages
  const mockLivingMember = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    birth_date: '1990-01-15',
    death_date: null,
    location: 'New York, NY',
    is_alive: true
  };

  const mockDeceasedMember = {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    birth_date: '1950-01-01',
    death_date: '2020-01-01',
    location: 'Los Angeles, CA',
    is_alive: false
  };

  it('should render member information correctly', () => {
    renderWithRouter(<MemberCard member={mockLivingMember} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    // Check for "years old" text (actual age will vary based on current date)
    expect(screen.getByText(/\d+ years old/)).toBeInTheDocument();
  });

  it('should render deceased member with correct styling', () => {
    renderWithRouter(<MemberCard member={mockDeceasedMember} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Lived 70 years')).toBeInTheDocument();
    expect(screen.getByTitle('Deceased')).toBeInTheDocument();
  });

  it('should show deceased indicator when is_alive is false', () => {
    renderWithRouter(<MemberCard member={mockDeceasedMember} />);

    const deceasedIndicator = screen.getByTitle('Deceased');
    expect(deceasedIndicator).toBeInTheDocument();
  });

  it('should not show deceased indicator for living members', () => {
    renderWithRouter(<MemberCard member={mockLivingMember} />);

    expect(screen.queryByTitle('Deceased')).not.toBeInTheDocument();
  });

  it('should render full name including middle name', () => {
    const memberWithMiddleName = {
      ...mockLivingMember,
      middle_name: 'William'
    };

    renderWithRouter(<MemberCard member={memberWithMiddleName} />);

    expect(screen.getByText(/John.*William.*Doe/)).toBeInTheDocument();
  });

  it('should handle missing location gracefully', () => {
    const memberWithoutLocation = {
      ...mockLivingMember,
      location: null
    };

    renderWithRouter(<MemberCard member={memberWithoutLocation} />);

    expect(screen.getByText('Location not specified')).toBeInTheDocument();
  });

  it('should render View and Edit links with correct paths', () => {
    renderWithRouter(<MemberCard member={mockLivingMember} />);

    const viewLink = screen.getByRole('link', { name: /view/i });
    const editLink = screen.getByRole('link', { name: /edit/i });

    expect(viewLink).toHaveAttribute('href', '/members/1');
    expect(editLink).toHaveAttribute('href', '/members/1/edit');
  });

  it('should return null when member is undefined', () => {
    const { container } = renderWithRouter(<MemberCard member={undefined} />);

    expect(container.firstChild).toBeNull();
  });

  it('should return null when member is null', () => {
    const { container } = renderWithRouter(<MemberCard member={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render ProfileImage component', () => {
    renderWithRouter(<MemberCard member={mockLivingMember} />);

    expect(screen.getByTestId('profile-image')).toBeInTheDocument();
  });

  it('should handle member without age gracefully', () => {
    const memberWithoutBirthDate = {
      ...mockLivingMember,
      birth_date: null
    };

    renderWithRouter(<MemberCard member={memberWithoutBirthDate} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText(/years old/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lived.*years/)).not.toBeInTheDocument();
  });

  it('should format age display correctly for deceased members', () => {
    renderWithRouter(<MemberCard member={mockDeceasedMember} />);

    // Should show "Lived X years" instead of "X years old"
    expect(screen.getByText('Lived 70 years')).toBeInTheDocument();
    expect(screen.queryByText('70 years old')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for hover effects', () => {
    const { container } = renderWithRouter(<MemberCard member={mockLivingMember} />);

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('transition-shadow');
  });

  it('should render with Unknown Name when names are missing', () => {
    const memberWithoutName = {
      id: 1,
      first_name: '',
      last_name: '',
      death_date: null,
      location: 'Test Location'
    };

    renderWithRouter(<MemberCard member={memberWithoutName} />);

    expect(screen.getByText('Unknown Name')).toBeInTheDocument();
  });
});
