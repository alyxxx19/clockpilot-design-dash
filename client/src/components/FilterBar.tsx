import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  RotateCcw, 
  Calendar as CalendarIcon,
  ChevronDown,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string | string[] | Date | { start: Date; end: Date };
  displayValue: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  
  filterOptions?: FilterOption[];
  activeFilters?: ActiveFilter[];
  onFiltersChange?: (filters: ActiveFilter[]) => void;
  
  sortOptions?: { value: string; label: string }[];
  sortValue?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (value: string, direction: 'asc' | 'desc') => void;
  
  onReset?: () => void;
  onSaveFilters?: (name: string) => void;
  savedFilterSets?: { name: string; filters: ActiveFilter[] }[];
  onLoadFilterSet?: (filters: ActiveFilter[]) => void;
  
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = "Rechercher...",
  searchValue = "",
  onSearchChange,
  
  filterOptions = [],
  activeFilters = [],
  onFiltersChange,
  
  sortOptions = [],
  sortValue,
  sortDirection = 'asc',
  onSortChange,
  
  onReset,
  onSaveFilters,
  savedFilterSets = [],
  onLoadFilterSet,
  
  className = ""
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});
  const [saveFilterName, setSaveFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Initialiser les filtres temporaires
  useEffect(() => {
    const temp: Record<string, any> = {};
    activeFilters.forEach(filter => {
      temp[filter.key] = filter.value;
    });
    setTempFilters(temp);
  }, [activeFilters]);

  const handleTempFilterChange = (key: string, value: any) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    const newFilters: ActiveFilter[] = [];
    
    Object.entries(tempFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const option = filterOptions.find(opt => opt.key === key);
      if (!option) return;

      let displayValue = '';
      
      switch (option.type) {
        case 'select':
          const selectOption = option.options?.find(opt => opt.value === value);
          displayValue = selectOption?.label || value;
          break;
        case 'multiselect':
          const selectedOptions = option.options?.filter(opt => value.includes(opt.value));
          displayValue = selectedOptions?.map(opt => opt.label).join(', ') || '';
          break;
        case 'date':
          displayValue = format(value, 'dd/MM/yyyy', { locale: fr });
          break;
        case 'daterange':
          if (value.start && value.end) {
            displayValue = `${format(value.start, 'dd/MM/yyyy', { locale: fr })} - ${format(value.end, 'dd/MM/yyyy', { locale: fr })}`;
          }
          break;
        case 'boolean':
          displayValue = value ? 'Oui' : 'Non';
          break;
        default:
          displayValue = value.toString();
      }

      newFilters.push({
        key,
        label: option.label,
        value,
        displayValue
      });
    });

    onFiltersChange?.(newFilters);
    setIsFiltersOpen(false);
  };

  const removeFilter = (filterKey: string) => {
    const newFilters = activeFilters.filter(f => f.key !== filterKey);
    onFiltersChange?.(newFilters);
  };

  const handleReset = () => {
    setTempFilters({});
    onFiltersChange?.([]);
    onSearchChange?.("");
    onReset?.();
  };

  const handleSaveFilters = () => {
    if (saveFilterName.trim() && onSaveFilters) {
      onSaveFilters(saveFilterName.trim());
      setSaveFilterName("");
      setShowSaveDialog(false);
    }
  };

  const renderFilterInput = (option: FilterOption) => {
    const value = tempFilters[option.key];

    switch (option.type) {
      case 'select':
        return (
          <Select value={value || ""} onValueChange={(val) => handleTempFilterChange(option.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={option.placeholder || `Sélectionner ${option.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = value || [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((val: string) => {
                const opt = option.options?.find(o => o.value === val);
                return (
                  <Badge key={val} variant="secondary" className="text-xs">
                    {opt?.label}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => {
                        const newValues = selectedValues.filter((v: string) => v !== val);
                        handleTempFilterChange(option.key, newValues);
                      }}
                    />
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={(val) => {
              const newValues = [...selectedValues, val];
              handleTempFilterChange(option.key, newValues);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={`Ajouter ${option.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {option.options?.filter(opt => !selectedValues.includes(opt.value)).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(value, 'dd/MM/yyyy', { locale: fr }) : option.placeholder || 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => handleTempFilterChange(option.key, date)}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        );

      case 'daterange':
        const rangeValue = value || {};
        return (
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rangeValue.start ? format(rangeValue.start, 'dd/MM/yyyy', { locale: fr }) : 'Date de début'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={rangeValue.start}
                  onSelect={(date) => handleTempFilterChange(option.key, { ...rangeValue, start: date })}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rangeValue.end ? format(rangeValue.end, 'dd/MM/yyyy', { locale: fr }) : 'Date de fin'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={rangeValue.end}
                  onSelect={(date) => handleTempFilterChange(option.key, { ...rangeValue, end: date })}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case 'boolean':
        return (
          <Select value={value?.toString() || ""} onValueChange={(val) => handleTempFilterChange(option.key, val === "true")}>
            <SelectTrigger>
              <SelectValue placeholder={option.placeholder || `Sélectionner ${option.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleTempFilterChange(option.key, e.target.value)}
            placeholder={option.placeholder || option.label}
          />
        );
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Barre de recherche principale */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            {/* Bouton filtres */}
            {filterOptions.length > 0 && (
              <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-filters">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {activeFilters.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtres avancés</h4>
                      <Button variant="ghost" size="sm" onClick={() => setTempFilters({})}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {filterOptions.map(option => (
                      <div key={option.key} className="space-y-2">
                        <Label>{option.label}</Label>
                        {renderFilterInput(option)}
                      </div>
                    ))}
                    
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={() => setIsFiltersOpen(false)}>
                        Annuler
                      </Button>
                      <Button size="sm" onClick={applyFilters} data-testid="button-apply-filters">
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Tri */}
            {sortOptions.length > 0 && (
              <Select value={`${sortValue}_${sortDirection}`} onValueChange={(value) => {
                const [sortVal, direction] = value.split('_');
                onSortChange?.(sortVal, direction as 'asc' | 'desc');
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <React.Fragment key={option.value}>
                      <SelectItem value={`${option.value}_asc`}>
                        {option.label} (A→Z)
                      </SelectItem>
                      <SelectItem value={`${option.value}_desc`}>
                        {option.label} (Z→A)
                      </SelectItem>
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Boutons d'action */}
            <div className="flex items-center space-x-2">
              {(activeFilters.length > 0 || searchValue) && (
                <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              
              {onSaveFilters && activeFilters.length > 0 && (
                <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-save-filters">
                      <Save className="h-4 w-4 mr-2" />
                      Sauver
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-3">
                      <Label>Nom du filtre</Label>
                      <Input
                        value={saveFilterName}
                        onChange={(e) => setSaveFilterName(e.target.value)}
                        placeholder="Ex: Employés actifs"
                        data-testid="input-filter-name"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                          Annuler
                        </Button>
                        <Button size="sm" onClick={handleSaveFilters} data-testid="button-confirm-save">
                          Sauvegarder
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {/* Filtres actifs */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Filtres actifs :</span>
              {activeFilters.map(filter => (
                <Badge key={filter.key} variant="secondary" className="flex items-center gap-1" data-testid={`filter-chip-${filter.key}`}>
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.displayValue}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-full" 
                    onClick={() => removeFilter(filter.key)}
                    data-testid={`button-remove-filter-${filter.key}`}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Filtres sauvegardés */}
          {savedFilterSets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Filtres sauvegardés :</span>
              {savedFilterSets.map((filterSet, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => onLoadFilterSet?.(filterSet.filters)}
                  className="h-6 px-2 text-xs"
                  data-testid={`button-load-filter-${index}`}
                >
                  {filterSet.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};