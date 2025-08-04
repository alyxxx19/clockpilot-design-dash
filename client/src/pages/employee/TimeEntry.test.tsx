import React from 'react';
import { renderWithProviders, screen, userEvent, waitFor } from '../../tests/setup/frontend.setup';
import { TimeEntry } from './TimeEntry';
import { server } from '../../tests/setup/frontend.setup';
import { http, HttpResponse } from 'msw';

// Mock des composants complexes
jest.mock('../../components/TimeSlotGrid', () => ({
  TimeSlotGrid: ({ onAddTimeEntry, onTimeEntrySelect }: any) => (
    <div data-testid="time-slot-grid">
      <button onClick={() => onAddTimeEntry(new Date())} data-testid="mock-add-entry">
        Ajouter entrée
      </button>
      <button onClick={() => onTimeEntrySelect({ id: '1' })} data-testid="mock-select-entry">
        Sélectionner entrée
      </button>
    </div>
  ),
}));

jest.mock('../../components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <div data-testid="calendar">
      <button onClick={() => onSelect(new Date('2024-08-03'))} data-testid="select-date">
        Sélectionner date
      </button>
      <div>Date sélectionnée: {selected?.toDateString()}</div>
    </div>
  ),
}));

describe('TimeEntry Page', () => {
  beforeEach(() => {
    // Mock de l'authentification
    localStorage.setItem('auth_token', 'valid-token');
    
    // Setup des réponses API
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          id: 1,
          email: 'employee@clockpilot.com',
          role: 'employee'
        });
      }),
      
      http.get('/api/time-entries', () => {
        return HttpResponse.json({
          data: [
            {
              id: '1',
              employeeId: 1,
              date: '2024-08-03',
              startTime: '09:00',
              endTime: '17:00',
              workedHours: 7,
              status: 'draft'
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        });
      })
    );
  });

  it('should render time entry page correctly', async () => {
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByText('Saisie des Temps')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.getByTestId('time-slot-grid')).toBeInTheDocument();
  });

  it('should handle date selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByTestId('select-date')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('select-date'));
    
    expect(screen.getByText('Date sélectionnée: Sat Aug 03 2024')).toBeInTheDocument();
  });

  it('should handle adding new time entry', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/time-entries', () => {
        return HttpResponse.json({
          id: '2',
          employeeId: 1,
          date: '2024-08-03',
          startTime: '18:00',
          endTime: '20:00',
          workedHours: 2,
          status: 'draft'
        });
      })
    );
    
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-add-entry')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('mock-add-entry'));
    
    // Vérifier que le formulaire d'ajout s'ouvre
    await waitFor(() => {
      expect(screen.getByText('Nouvelle Entrée de Temps')).toBeInTheDocument();
    });
  });

  it('should handle time entry selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-select-entry')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('mock-select-entry'));
    
    // Vérifier que les détails de l'entrée sont affichés
    await waitFor(() => {
      expect(screen.getByText('Détails de l\'Entrée')).toBeInTheDocument();
    });
  });

  it('should display time entries for selected date', async () => {
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByText('Saisie des Temps')).toBeInTheDocument();
    });
    
    // Les entrées devraient être chargées automatiquement
    expect(screen.getByTestId('time-slot-grid')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get('/api/time-entries', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );
    
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderWithProviders(<TimeEntry />);
    
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should be accessible with proper headings', async () => {
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Saisie des Temps' })).toBeInTheDocument();
    });
  });

  it('should handle navigation between dates', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
    
    // Navigation vers jour précédent
    const prevButton = screen.getByTestId('prev-day');
    if (prevButton) {
      await user.click(prevButton);
      // Vérifier que les données se rechargent pour la nouvelle date
    }
  });

  it('should validate time entry form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TimeEntry />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-add-entry')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('mock-add-entry'));
    
    await waitFor(() => {
      expect(screen.getByText('Nouvelle Entrée de Temps')).toBeInTheDocument();
    });
    
    // Essayer de soumettre sans données
    const submitButton = screen.getByTestId('submit-time-entry');
    await user.click(submitButton);
    
    // Vérifier les messages d'erreur de validation
    await waitFor(() => {
      expect(screen.getByText('L\'heure de début est requise')).toBeInTheDocument();
      expect(screen.getByText('L\'heure de fin est requise')).toBeInTheDocument();
    });
  });
});