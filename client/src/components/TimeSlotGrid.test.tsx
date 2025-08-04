import React from 'react';
import { renderWithProviders, screen, userEvent } from '../../tests/setup/frontend.setup';
import { TimeSlotGrid } from './TimeSlotGrid';

// Mock des composants UI complexes
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

const mockTimeEntries = [
  {
    id: '1',
    employeeId: 1,
    date: '2024-08-03',
    startTime: '09:00',
    endTime: '12:00',
    breakDuration: 0,
    workedHours: 3,
    overtimeHours: 0,
    status: 'draft' as const,
    notes: 'Matin',
    validatedAt: null,
    validatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    employeeId: 1,
    date: '2024-08-03',
    startTime: '14:00',
    endTime: '18:00',
    breakDuration: 15,
    workedHours: 3.75,
    overtimeHours: 0,
    status: 'submitted' as const,
    notes: 'Après-midi',
    validatedAt: null,
    validatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('TimeSlotGrid Component', () => {
  const defaultProps = {
    timeEntries: mockTimeEntries,
    selectedDate: new Date('2024-08-03'),
    onTimeEntrySelect: jest.fn(),
    onTimeEntryEdit: jest.fn(),
    onTimeEntryDelete: jest.fn(),
    onAddTimeEntry: jest.fn(),
    isLoading: false,
    canEdit: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render time entries for selected date', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 18:00')).toBeInTheDocument();
    expect(screen.getByText('Matin')).toBeInTheDocument();
    expect(screen.getByText('Après-midi')).toBeInTheDocument();
  });

  it('should display worked hours correctly', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    expect(screen.getByText('3.00h')).toBeInTheDocument();
    expect(screen.getByText('3.75h')).toBeInTheDocument();
  });

  it('should show status badges', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    expect(screen.getByText('Brouillon')).toBeInTheDocument();
    expect(screen.getByText('Soumis')).toBeInTheDocument();
  });

  it('should handle time entry selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const firstEntry = screen.getByTestId('time-entry-1');
    await user.click(firstEntry);
    
    expect(defaultProps.onTimeEntrySelect).toHaveBeenCalledWith(mockTimeEntries[0]);
  });

  it('should show edit button when canEdit is true', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const editButtons = screen.getAllByTestId(/edit-time-entry-/);
    expect(editButtons).toHaveLength(2);
  });

  it('should hide edit button when canEdit is false', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} canEdit={false} />);
    
    const editButtons = screen.queryAllByTestId(/edit-time-entry-/);
    expect(editButtons).toHaveLength(0);
  });

  it('should handle edit action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const editButton = screen.getByTestId('edit-time-entry-1');
    await user.click(editButton);
    
    expect(defaultProps.onTimeEntryEdit).toHaveBeenCalledWith(mockTimeEntries[0]);
  });

  it('should handle delete action with confirmation', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const deleteButton = screen.getByTestId('delete-time-entry-1');
    await user.click(deleteButton);
    
    expect(confirmSpy).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer cette entrée de temps ?'
    );
    expect(defaultProps.onTimeEntryDelete).toHaveBeenCalledWith('1');
    
    confirmSpy.mockRestore();
  });

  it('should not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const deleteButton = screen.getByTestId('delete-time-entry-1');
    await user.click(deleteButton);
    
    expect(defaultProps.onTimeEntryDelete).not.toHaveBeenCalled();
    
    confirmSpy.mockRestore();
  });

  it('should show loading state', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} timeEntries={[]} />);
    
    expect(screen.getByText('Aucune entrée de temps pour cette date')).toBeInTheDocument();
  });

  it('should show add button', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const addButton = screen.getByTestId('add-time-entry');
    expect(addButton).toBeInTheDocument();
  });

  it('should handle add time entry action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    const addButton = screen.getByTestId('add-time-entry');
    await user.click(addButton);
    
    expect(defaultProps.onAddTimeEntry).toHaveBeenCalledWith(defaultProps.selectedDate);
  });

  it('should display break duration when present', () => {
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    // Le deuxième entry a une pause de 15 minutes
    expect(screen.getByText('Pause: 15min')).toBeInTheDocument();
  });

  it('should handle overtime display', () => {
    const entriesWithOvertime = [
      {
        ...mockTimeEntries[0],
        workedHours: 12,
        overtimeHours: 2
      }
    ];
    
    renderWithProviders(
      <TimeSlotGrid {...defaultProps} timeEntries={entriesWithOvertime} />
    );
    
    expect(screen.getByText('Heures sup: 2.00h')).toBeInTheDocument();
  });

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeSlotGrid {...defaultProps} />);
    
    // Tab vers la première entrée
    await user.tab();
    expect(screen.getByTestId('time-entry-1')).toHaveFocus();
    
    // Enter pour sélectionner
    await user.keyboard('{Enter}');
    expect(defaultProps.onTimeEntrySelect).toHaveBeenCalledWith(mockTimeEntries[0]);
  });

  it('should sort entries by start time', () => {
    const unsortedEntries = [
      { ...mockTimeEntries[1] }, // 14:00
      { ...mockTimeEntries[0] }  // 09:00
    ];
    
    renderWithProviders(
      <TimeSlotGrid {...defaultProps} timeEntries={unsortedEntries} />
    );
    
    const entries = screen.getAllByTestId(/time-entry-/);
    expect(entries[0]).toHaveAttribute('data-testid', 'time-entry-1'); // 09:00 en premier
    expect(entries[1]).toHaveAttribute('data-testid', 'time-entry-2'); // 14:00 en second
  });
});