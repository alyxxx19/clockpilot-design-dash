import React from 'react';
import { renderWithProviders, screen, userEvent, waitFor } from '../../../tests/setup/frontend.setup';
import { TimeEntryForm } from './TimeEntryForm';
import { server } from '../../../tests/setup/frontend.setup';
import { http, HttpResponse } from 'msw';

// Mock des composants UI
jest.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => render({ field: { onChange: jest.fn(), value: '' } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: ({ children }: any) => <span className="error">{children}</span>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, disabled }: any) => (
    <button onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  ),
}));

const mockTimeEntry = {
  id: '1',
  employeeId: 1,
  date: '2024-08-03',
  startTime: '09:00',
  endTime: '17:00',
  breakDuration: 60,
  workedHours: 7,
  overtimeHours: 0,
  status: 'draft' as const,
  notes: 'Test entry',
  validatedAt: null,
  validatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('TimeEntryForm Component', () => {
  const defaultProps = {
    timeEntry: null,
    selectedDate: new Date('2024-08-03'),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    server.use(
      http.post('/api/time-entries', () => {
        return HttpResponse.json({
          id: '2',
          employeeId: 1,
          date: '2024-08-03',
          startTime: '10:00',
          endTime: '18:00',
          workedHours: 7,
          status: 'draft'
        });
      })
    );
  });

  it('should render form fields correctly', () => {
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Heure de début')).toBeInTheDocument();
    expect(screen.getByLabelText('Heure de fin')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('should populate form with existing time entry data', () => {
    renderWithProviders(
      <TimeEntryForm {...defaultProps} timeEntry={mockTimeEntry} />
    );
    
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test entry')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Enregistrer');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('L\'heure de début est requise')).toBeInTheDocument();
      expect(screen.getByText('L\'heure de fin est requise')).toBeInTheDocument();
    });
  });

  it('should validate time logic', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    // Saisir une heure de fin antérieure à l'heure de début
    const startTimeInput = screen.getByLabelText('Heure de début');
    const endTimeInput = screen.getByLabelText('Heure de fin');
    
    await user.type(startTimeInput, '17:00');
    await user.type(endTimeInput, '09:00');
    
    const submitButton = screen.getByText('Enregistrer');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('L\'heure de fin doit être postérieure à l\'heure de début')).toBeInTheDocument();
    });
  });

  it('should calculate worked hours automatically', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    const startTimeInput = screen.getByLabelText('Heure de début');
    const endTimeInput = screen.getByLabelText('Heure de fin');
    const breakInput = screen.getByLabelText('Pause (minutes)');
    
    await user.type(startTimeInput, '09:00');
    await user.type(endTimeInput, '17:00');
    await user.type(breakInput, '60');
    
    // Vérifier que les heures travaillées sont calculées
    await waitFor(() => {
      expect(screen.getByText('Heures travaillées: 7.00h')).toBeInTheDocument();
    });
  });

  it('should detect overtime hours', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    const startTimeInput = screen.getByLabelText('Heure de début');
    const endTimeInput = screen.getByLabelText('Heure de fin');
    
    await user.type(startTimeInput, '07:00');
    await user.type(endTimeInput, '19:00'); // 12 heures
    
    await waitFor(() => {
      expect(screen.getByText('Heures supplémentaires: 2.00h')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Dépassement de la limite légale quotidienne')).toBeInTheDocument();
    });
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    // Remplir le formulaire
    await user.type(screen.getByLabelText('Heure de début'), '09:00');
    await user.type(screen.getByLabelText('Heure de fin'), '17:00');
    await user.type(screen.getByLabelText('Pause (minutes)'), '60');
    await user.type(screen.getByLabelText('Notes'), 'Journée productive');
    
    const submitButton = screen.getByText('Enregistrer');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        date: '2024-08-03',
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 60,
        notes: 'Journée productive'
      });
    });
  });

  it('should handle cancel action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Annuler');
    await user.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    renderWithProviders(<TimeEntryForm {...defaultProps} isLoading={true} />);
    
    const submitButton = screen.getByText('Enregistrement...');
    expect(submitButton).toBeDisabled();
  });

  it('should handle API errors', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/time-entries', () => {
        return HttpResponse.json(
          { error: 'Validation failed' },
          { status: 400 }
        );
      })
    );
    
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    // Remplir et soumettre le formulaire
    await user.type(screen.getByLabelText('Heure de début'), '09:00');
    await user.type(screen.getByLabelText('Heure de fin'), '17:00');
    
    const submitButton = screen.getByText('Enregistrer');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Erreur lors de l\'enregistrement')).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    // Tab entre les champs
    await user.tab();
    expect(screen.getByLabelText('Date')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText('Heure de début')).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText('Heure de fin')).toHaveFocus();
  });

  it('should warn about break requirements', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    // Créer un créneau de plus de 6h sans pause suffisante
    await user.type(screen.getByLabelText('Heure de début'), '08:00');
    await user.type(screen.getByLabelText('Heure de fin'), '15:00'); // 7h
    await user.type(screen.getByLabelText('Pause (minutes)'), '10'); // Pause insuffisante
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Pause insuffisante pour une journée de plus de 6h')).toBeInTheDocument();
    });
  });

  it('should handle cross-midnight shifts', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntryForm {...defaultProps} />);
    
    await user.type(screen.getByLabelText('Heure de début'), '22:00');
    await user.type(screen.getByLabelText('Heure de fin'), '06:00'); // Lendemain
    
    await waitFor(() => {
      expect(screen.getByText('Heures travaillées: 8.00h')).toBeInTheDocument();
      expect(screen.getByText('ℹ️ Créneau de nuit détecté')).toBeInTheDocument();
    });
  });
});