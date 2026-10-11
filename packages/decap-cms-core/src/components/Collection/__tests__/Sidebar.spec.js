import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render } from '@testing-library/react';

import { Sidebar } from '../Sidebar';

jest.mock('../../UI', () => ({
  SettingsDropdown: () => <div data-testid="account-settings" />,
}));

describe('Support Manager Sidebar', () => {
  function renderSidebar(props) {
    return render(
      <MemoryRouter>
        <Sidebar {...props} />
      </MemoryRouter>,
    );
  }

  it('renders the Support Manager navigation and account settings', () => {
    const { getByText, getByTestId, getByRole } = renderSidebar({
      user: { name: 'Editor' },
    });

    expect(getByText('Support Manager')).toBeInTheDocument();
    expect(getByRole('link', { name: /Articles/ })).toHaveAttribute('href', '/collections/help');
    expect(getByRole('link', { name: /New article/ })).toHaveAttribute('href', '/collections/help/new');
    expect(getByRole('link', { name: /Media library/ })).toHaveAttribute('href', '/media');
    expect(getByText('Editor')).toBeInTheDocument();
    expect(getByTestId('account-settings')).toBeInTheDocument();
  });

  it('labels planned management features without making them navigation links', () => {
    const { getByText, queryByRole } = renderSidebar();

    expect(getByText('Categories')).toBeInTheDocument();
    expect(getByText('Revision history')).toBeInTheDocument();
    expect(getByText('Insights')).toBeInTheDocument();
    expect(queryByRole('link', { name: /Categories/ })).toBeNull();
  });

  it('opens and closes the mobile navigation on the toggle event', () => {
    const { container, getAllByLabelText } = renderSidebar();

    act(() => {
      window.dispatchEvent(new Event('uo-support-toggle-navigation'));
    });
    expect(container.querySelector('#support-mobile-navigation')).toHaveClass('mobile-open');

    fireEvent.click(getAllByLabelText('Close navigation')[0]);
    expect(container.querySelector('#support-mobile-navigation')).not.toHaveClass('mobile-open');
  });

  it('closes the mobile navigation when Escape is pressed', () => {
    const { container } = renderSidebar();

    act(() => {
      window.dispatchEvent(new Event('uo-support-toggle-navigation'));
    });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('#support-mobile-navigation')).not.toHaveClass('mobile-open');
  });

  it('closes the mobile navigation after selecting an article link', () => {
    const { container, getByRole } = renderSidebar();

    act(() => {
      window.dispatchEvent(new Event('uo-support-toggle-navigation'));
    });
    fireEvent.click(getByRole('link', { name: /Articles/ }));
    expect(container.querySelector('#support-mobile-navigation')).not.toHaveClass('mobile-open');
  });
});
