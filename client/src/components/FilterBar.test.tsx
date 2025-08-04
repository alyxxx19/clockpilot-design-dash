import React from 'react';
import { renderWithProviders, screen, userEvent } from '../../tests/setup/frontend.setup';
import { FilterBar } from './FilterBar';
import type { FilterOption } from './FilterBar';

const mockFilterOptions: FilterOption[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'active', label: 'Actif' },
      { value: 'inactive', label: 'Inactif' }
    ]
  },
  {
    key: 'department',
    label: 'Département',
    type: 'select',
    options: [
      { value: 'it', label: 'IT' },
      { value: 'hr', label: 'RH' }
    ]
  },
  {
    key: 'hire_date',
    label: 'Date d\'embauche',
    type: 'date'
  },
  {
    key: 'has_email',
    label: 'Avec email',
    type: 'boolean'
  }
];

const mockSortOptions = [
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date' }
];

describe('FilterBar Component', () => {
  const defaultProps = {
    searchPlaceholder: 'Rechercher...',
    searchValue: '',
    onSearchChange: jest.fn(),
    filterOptions: mockFilterOptions,
    activeFilters: [],
    onFiltersChange: jest.fn(),
    sortOptions: mockSortOptions,
    sortValue: 'name',
    sortDirection: 'asc' as const,
    onSortChange: jest.fn(),
    onReset: jest.fn(),
    onSaveFilters: jest.fn(),
    savedFilterSets: [],
    onLoadFilterSet: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input with placeholder', () => {
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Rechercher...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await user.type(searchInput, 'John Doe');
    
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('John Doe');
  });

  it('should render filter options button', () => {
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filtres');
    expect(filtersButton).toBeInTheDocument();
  });

  it('should open filters panel when clicking filters button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    // Vérifier que les options de filtre sont visibles
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Département')).toBeInTheDocument();
  });

  it('should handle select filter changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    // Ouvrir le panneau de filtres
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    // Sélectionner une option dans le filtre statut
    const statusSelect = screen.getByTestId('filter-status');
    await user.click(statusSelect);
    
    const activeOption = screen.getByText('Actif');
    await user.click(activeOption);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith([
      { key: 'status', value: 'active', label: 'Statut: Actif' }
    ]);
  });

  it('should handle date filter changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    const dateInput = screen.getByTestId('filter-hire_date');
    await user.type(dateInput, '2024-01-01');
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith([
      { key: 'hire_date', value: '2024-01-01', label: 'Date d\'embauche: 01/01/2024' }
    ]);
  });

  it('should handle boolean filter changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filtres');
    await user.click(filtersButton);
    
    const booleanSwitch = screen.getByTestId('filter-has_email');
    await user.click(booleanSwitch);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith([
      { key: 'has_email', value: 'true', label: 'Avec email: Oui' }
    ]);
  });

  it('should display active filter chips', () => {
    const activeFilters = [
      { key: 'status', value: 'active', label: 'Statut: Actif' },
      { key: 'department', value: 'it', label: 'Département: IT' }
    ];

    renderWithProviders(
      <FilterBar {...defaultProps} activeFilters={activeFilters} />
    );
    
    expect(screen.getByText('Statut: Actif')).toBeInTheDocument();
    expect(screen.getByText('Département: IT')).toBeInTheDocument();
  });

  it('should remove filter chip when clicking X', async () => {
    const user = userEvent.setup();
    const activeFilters = [
      { key: 'status', value: 'active', label: 'Statut: Actif' }
    ];

    renderWithProviders(
      <FilterBar {...defaultProps} activeFilters={activeFilters} />
    );
    
    const removeButton = screen.getByTestId('remove-filter-status');
    await user.click(removeButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith([]);
  });

  it('should handle sort changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    const sortSelect = screen.getByTestId('sort-select');
    await user.click(sortSelect);
    
    const dateOption = screen.getByText('Date');
    await user.click(dateOption);
    
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('date', 'asc');
  });

  it('should toggle sort direction when clicking same sort option', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FilterBar {...defaultProps} sortValue="name" sortDirection="asc" />
    );
    
    const sortSelect = screen.getByTestId('sort-select');
    await user.click(sortSelect);
    
    const nameOption = screen.getByText('Nom');
    await user.click(nameOption);
    
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('name', 'desc');
  });

  it('should reset all filters when clicking reset button', async () => {
    const user = userEvent.setup();
    const activeFilters = [
      { key: 'status', value: 'active', label: 'Statut: Actif' }
    ];

    renderWithProviders(
      <FilterBar 
        {...defaultProps} 
        activeFilters={activeFilters}
        searchValue="test search"
      />
    );
    
    const resetButton = screen.getByText('Réinitialiser');
    await user.click(resetButton);
    
    expect(defaultProps.onReset).toHaveBeenCalled();
  });

  it('should show filter count in button when filters are active', () => {
    const activeFilters = [
      { key: 'status', value: 'active', label: 'Statut: Actif' },
      { key: 'department', value: 'it', label: 'Département: IT' }
    ];

    renderWithProviders(
      <FilterBar {...defaultProps} activeFilters={activeFilters} />
    );
    
    const filtersButton = screen.getByText('Filtres (2)');
    expect(filtersButton).toBeInTheDocument();
  });

  it('should save filter set when clicking save button', async () => {
    const user = userEvent.setup();
    const activeFilters = [
      { key: 'status', value: 'active', label: 'Statut: Actif' }
    ];

    renderWithProviders(
      <FilterBar {...defaultProps} activeFilters={activeFilters} />
    );
    
    const filtersButton = screen.getByText('Filtres (1)');
    await user.click(filtersButton);
    
    const saveButton = screen.getByText('Sauvegarder');
    await user.click(saveButton);
    
    expect(defaultProps.onSaveFilters).toHaveBeenCalledWith('Mes filtres');
  });

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FilterBar {...defaultProps} />);
    
    // Tab vers le champ de recherche
    await user.tab();
    expect(screen.getByPlaceholderText('Rechercher...')).toHaveFocus();
    
    // Tab vers le bouton filtres
    await user.tab();
    expect(screen.getByText('Filtres')).toHaveFocus();
    
    // Ouvrir avec Enter
    await user.keyboard('{Enter}');
    expect(screen.getByText('Statut')).toBeInTheDocument();
  });

  it('should handle empty filter options gracefully', () => {
    renderWithProviders(
      <FilterBar {...defaultProps} filterOptions={[]} />
    );
    
    const filtersButton = screen.getByText('Filtres');
    expect(filtersButton).toBeDisabled();
  });
});