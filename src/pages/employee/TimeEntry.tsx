import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Save,
  Copy,
  Calendar,
  Undo,
  Redo,
  Trash2,
  Coffee,
  Users,
  BookOpen,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  type: 'libre' | 'travail' | 'pause' | 'reunion' | 'formation' | 'indisponible';
  selected?: boolean;
}

interface DayPlanning {
  employeeId: string;
  date: string;
  creneaux: TimeSlot[];
  totaux: {
    travail: number;
    pause: number;
    reunion: number;
    formation: number;
    indisponible: number;
  };
  status: 'brouillon' | 'soumis' | 'valide';
  dateModification: number;
}

interface Template {
  id: string;
  name: string;
  creneaux: TimeSlot[];
}

const TIME_TYPES = [
  { key: 'travail', label: 'Travail', icon: '✓', color: 'bg-black text-white' },
  { key: 'pause', label: 'Pause', icon: '☕', color: 'bg-gray-600 text-white' },
  { key: 'reunion', label: 'Réunion', icon: '👥', color: 'bg-blue-500 text-white' },
  { key: 'formation', label: 'Formation', icon: '📚', color: 'bg-green-500 text-white' },
  { key: 'indisponible', label: 'Indispo', icon: '🚫', color: 'bg-red-500 text-white' }
];

export const TimeEntry: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [interval, setInterval] = useState<15 | 30 | 60>(30);
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);
  const [multipleMode, setMultipleMode] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [history, setHistory] = useState<TimeSlot[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copiedPlanning, setCopiedPlanning] = useState<TimeSlot[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Générer les créneaux horaires
  const generateTimeSlots = useCallback(() => {
    const slots: TimeSlot[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + interval;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const adjustedEndMinute = endMinute >= 60 ? endMinute - 60 : endMinute;
        const endTime = `${endHour.toString().padStart(2, '0')}:${adjustedEndMinute.toString().padStart(2, '0')}`;
        
        if (endHour < 24 || (endHour === 24 && adjustedEndMinute === 0)) {
          slots.push({
            id: `${startTime}-${endTime}`,
            start: startTime,
            end: endTime,
            type: 'libre'
          });
        }
      }
    }
    
    return slots;
  }, [interval, startHour, endHour]);

  // Initialiser les créneaux
  useEffect(() => {
    const slots = generateTimeSlots();
    setTimeSlots(slots);
    setSelectedSlots([]); // Réinitialiser la sélection
    
    // Charger les données sauvegardées
    const savedData = localStorage.getItem(`timeEntry-${selectedDate.toISOString().split('T')[0]}`);
    if (savedData) {
      const parsed: DayPlanning = JSON.parse(savedData);
      // Vérifier si les créneaux sauvegardés correspondent à l'intervalle actuel
      const savedInterval = parsed.creneaux.length > 0 ? 
        (parseInt(parsed.creneaux[1]?.start.split(':')[1]) - parseInt(parsed.creneaux[0]?.start.split(':')[1])) || 30 : 30;
      
      if (savedInterval === interval) {
        setTimeSlots(parsed.creneaux);
      }
    }
  }, [selectedDate, interval, startHour, endHour, generateTimeSlots]);

  // Charger les templates
  useEffect(() => {
    const savedTemplates = localStorage.getItem('timeEntryTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Sauvegarder dans l'historique
  const saveToHistory = (slots: TimeSlot[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...slots]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Calculer les totaux
  const calculateTotals = (slots: TimeSlot[]) => {
    const totaux = {
      travail: 0,
      pause: 0,
      reunion: 0,
      formation: 0,
      indisponible: 0
    };

    slots.forEach(slot => {
      if (slot.type !== 'libre') {
        totaux[slot.type as keyof typeof totaux] += interval;
      }
    });

    return totaux;
  };

  // Appliquer un type aux créneaux sélectionnés
  const applyTypeToSlots = (type: TimeSlot['type']) => {
    if (selectedSlots.length === 0) return;

    const newSlots = timeSlots.map(slot => 
      selectedSlots.includes(slot.id) 
        ? { ...slot, type, selected: false }
        : slot
    );

    saveToHistory(timeSlots);
    setTimeSlots(newSlots);
    setSelectedSlots([]);

    toast({
      title: "Type appliqué",
      description: `${selectedSlots.length} créneau(x) mis à jour`,
    });
  };

  // Gérer la sélection d'un créneau
  const handleSlotClick = (slotId: string) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : multipleMode 
          ? [...prev, slotId]  // Mode multiple : ajouter à la sélection
          : [slotId]           // Mode simple : remplacer la sélection
    );
  };


  // Navigation de date
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Aller à aujourd'hui
  const goToToday = () => {
    setSelectedDate(new Date());
    toast({
      title: "Navigation",
      description: "Retour à la date d'aujourd'hui",
    });
  };

  // Annuler/Refaire
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTimeSlots([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTimeSlots([...history[historyIndex + 1]]);
    }
  };

  // Copier le planning
  const copyPlanning = () => {
    setCopiedPlanning([...timeSlots]);
    toast({
      title: "Planning copié",
      description: "Vous pouvez maintenant le coller sur une autre date",
    });
  };

  // Coller le planning
  const pastePlanning = () => {
    if (copiedPlanning) {
      saveToHistory(timeSlots);
      setTimeSlots([...copiedPlanning]);
      toast({
        title: "Planning collé",
        description: "Le planning a été appliqué à cette date",
      });
    }
  };

  // Effacer la sélection
  const clearSelection = () => {
    if (selectedSlots.length > 0) {
      const newSlots = timeSlots.map(slot => 
        selectedSlots.includes(slot.id) 
          ? { ...slot, type: 'libre' as const, selected: false }
          : slot
      );
      saveToHistory(timeSlots);
      setTimeSlots(newSlots);
      setSelectedSlots([]);
    }
  };

  // Sélectionner tout
  const selectAll = () => {
    setSelectedSlots(timeSlots.map(s => s.id));
  };

  // Désélectionner tout
  const deselectAll = () => {
    setSelectedSlots([]);
  };

  // Sauvegarder comme template
  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: newTemplateName,
      creneaux: [...timeSlots]
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('timeEntryTemplates', JSON.stringify(updatedTemplates));
    
    setNewTemplateName('');
    setIsTemplateModalOpen(false);
    
    toast({
      title: "Template sauvegardé",
      description: `Le modèle "${newTemplate.name}" a été créé`,
    });
  };

  // Appliquer un template
  const applyTemplate = (template: Template) => {
    saveToHistory(timeSlots);
    setTimeSlots([...template.creneaux]);
    setIsTemplateModalOpen(false);
    
    toast({
      title: "Template appliqué",
      description: `Le modèle "${template.name}" a été appliqué`,
    });
  };

  // Supprimer un template
  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('timeEntryTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template supprimé",
      description: "Le modèle a été supprimé",
    });
  };

  // Sauvegarder les heures
  const saveTimeEntry = () => {
    const totaux = calculateTotals(timeSlots);
    
    // Vérifications
    const workMinutes = totaux.travail;
    if (workMinutes > 600) { // Plus de 10h
      toast({
        title: "Attention",
        description: "Plus de 10h de travail détectées",
        variant: "destructive"
      });
      return;
    }

    if (workMinutes > 360 && totaux.pause === 0) { // Plus de 6h sans pause
      toast({
        title: "Attention",
        description: "Pause obligatoire après 6h de travail",
        variant: "destructive"
      });
      return;
    }

    const dayPlanning: DayPlanning = {
      employeeId: 'current-user',
      date: selectedDate.toISOString().split('T')[0],
      creneaux: timeSlots,
      totaux,
      status: 'brouillon',
      dateModification: Date.now()
    };

    localStorage.setItem(`timeEntry-${dayPlanning.date}`, JSON.stringify(dayPlanning));
    
    toast({
      title: "Heures sauvegardées",
      description: "Votre planning a été enregistré avec succès",
    });
  };

  // Soumettre pour validation
  const submitForValidation = () => {
    const totaux = calculateTotals(timeSlots);
    
    if (totaux.travail === 0) {
      toast({
        title: "Erreur",
        description: "Aucune heure de travail saisie",
        variant: "destructive"
      });
      return;
    }

    const dayPlanning: DayPlanning = {
      employeeId: 'current-user',
      date: selectedDate.toISOString().split('T')[0],
      creneaux: timeSlots,
      totaux,
      status: 'soumis',
      dateModification: Date.now()
    };

    localStorage.setItem(`timeEntry-${dayPlanning.date}`, JSON.stringify(dayPlanning));
    
    toast({
      title: "Soumis pour validation",
      description: "Vos heures ont été soumises à votre superviseur",
    });
  };

  // Naviguer vers les rapports
  const handleViewReports = () => {
    navigate('/employee/reports');
  };

  // Naviguer vers le planning
  const handleViewPlanning = () => {
    navigate('/employee/planning');
  };

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 'd':
            e.preventDefault();
            deselectAll();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlots, historyIndex, history.length]);

  const totaux = calculateTotals(timeSlots);
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const currentTime = new Date();
  const currentTimeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Saisie des heures</h1>
          <p className="text-muted-foreground">Planification granulaire de votre temps de travail</p>
        </div>

        {/* Barre de contrôle */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Navigation de date */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-48 text-center">
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Aujourd'hui
                </Button>
              </div>

              {/* Intervalle */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="interval">Intervalle :</Label>
                <Select value={interval.toString()} onValueChange={(value) => setInterval(Number(value) as 15 | 30 | 60)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Plage horaire */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="timeRange">Plage :</Label>
                <Select value={startHour.toString()} onValueChange={(value) => setStartHour(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">à</span>
                <Select value={endHour.toString()} onValueChange={(value) => setEndHour(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => i).map(hour => (
                      <SelectItem key={hour} value={hour.toString()} disabled={hour <= startHour}>
                        {hour.toString().padStart(2, '0')}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode sélection */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="multipleMode">Mode multiple :</Label>
                <Switch checked={multipleMode} onCheckedChange={setMultipleMode} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{(totaux.travail / 60).toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Travail</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{(totaux.pause / 60).toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Pause</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{(totaux.reunion / 60).toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Réunion</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{(totaux.formation / 60).toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Formation</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{(totaux.indisponible / 60).toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Indispo</div>
            </CardContent>
          </Card>
        </div>

        {/* Barre d'outils */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {/* Types de créneaux */}
              {TIME_TYPES.map(type => (
                <Button
                  key={type.key}
                  variant="outline"
                  size="sm"
                  className={`${type.color} hover:opacity-80`}
                  onClick={() => applyTypeToSlots(type.key as TimeSlot['type'])}
                  disabled={selectedSlots.length === 0}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Button>
              ))}

              <div className="border-l border-border mx-2"></div>

              {/* Actions */}
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedSlots.length === 0}>
                <Trash2 className="h-4 w-4 mr-1" />
                Effacer
              </Button>
              
              <Button variant="outline" size="sm" onClick={copyPlanning}>
                <Copy className="h-4 w-4 mr-1" />
                Copier
              </Button>
              
              {copiedPlanning && (
                <Button variant="outline" size="sm" onClick={pastePlanning}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Coller
                </Button>
              )}

              <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Modèles
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modèles de planning</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Sauvegarder nouveau template */}
                    <div className="space-y-2">
                      <Label>Sauvegarder le planning actuel</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Nom du modèle"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                        <Button onClick={saveAsTemplate} disabled={!newTemplateName.trim()}>
                          Sauvegarder
                        </Button>
                      </div>
                    </div>

                    {/* Liste des templates */}
                    <div className="space-y-2">
                      <Label>Modèles existants</Label>
                      {templates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun modèle sauvegardé</p>
                      ) : (
                        <div className="space-y-2">
                          {templates.map(template => (
                            <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{template.name}</span>
                              <div className="space-x-2">
                                <Button size="sm" onClick={() => applyTemplate(template)}>
                                  Appliquer
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteTemplate(template.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="border-l border-border mx-2"></div>

              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4 mr-1" />
                Refaire
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grille de créneaux */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Créneaux horaires - {interval} minutes ({startHour.toString().padStart(2, '0')}h à {endHour === 24 ? '00h (+1j)' : endHour.toString().padStart(2, '0') + 'h'})
              {selectedSlots.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSlots.length} sélectionné(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {timeSlots.map(slot => {
                const isSelected = selectedSlots.includes(slot.id);
                const isCurrentTime = isToday && slot.start <= currentTimeString && slot.end > currentTimeString;
                const typeConfig = TIME_TYPES.find(t => t.key === slot.type);
                
                return (
                  <div
                    key={slot.id}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm font-medium
                      ${isSelected ? 'border-black ring-2 ring-black ring-opacity-20' : 'border-transparent'}
                      ${slot.type === 'libre' ? 'bg-gray-50 hover:bg-gray-100' : typeConfig?.color}
                      ${isCurrentTime ? 'ring-2 ring-blue-500' : ''}
                      hover:opacity-80
                    `}
                    onClick={() => handleSlotClick(slot.id)}
                  >
                    <div className="font-medium">
                      {slot.start} - {slot.end}
                    </div>
                    {slot.type !== 'libre' && (
                      <div className="text-xs mt-1">
                        {typeConfig?.icon} {typeConfig?.label}
                      </div>
                    )}
                    {isCurrentTime && (
                      <div className="text-xs mt-1 font-bold">
                        • MAINTENANT
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Récapitulatif du {selectedDate.toLocaleDateString('fr-FR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Première heure:</span>
                  <span className="font-medium">
                    {timeSlots.find(s => s.type !== 'libre')?.start || 'Non défini'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dernière heure:</span>
                  <span className="font-medium">
                    {[...timeSlots].reverse().find(s => s.type !== 'libre')?.end || 'Non défini'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total travaillé:</span>
                  <span className="font-medium">{(totaux.travail / 60).toFixed(1)}h</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total pauses:</span>
                  <span className="font-medium">{(totaux.pause / 60).toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Amplitude:</span>
                  <span className="font-medium">
                    {(() => {
                      const first = timeSlots.find(s => s.type !== 'libre');
                      const last = [...timeSlots].reverse().find(s => s.type !== 'libre');
                      if (first && last) {
                        const startMinutes = parseInt(first.start.split(':')[0]) * 60 + parseInt(first.start.split(':')[1]);
                        const endMinutes = parseInt(last.end.split(':')[0]) * 60 + parseInt(last.end.split(':')[1]);
                        const amplitude = (endMinutes - startMinutes) / 60;
                        return `${amplitude.toFixed(1)}h`;
                      }
                      return 'Non défini';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Statut:</span>
                  <div className="flex items-center space-x-1">
                    {totaux.travail > 0 ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">Complet</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-600">À compléter</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={handleViewPlanning}
                    >
                      Planning
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={handleViewReports}
                    >
                      Rapports
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde flottant */}
        <div className="fixed bottom-6 right-6 space-y-2">
          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            size="lg"
            onClick={submitForValidation}
            disabled={totaux.travail === 0}
          >
            <Check className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg"
            size="lg"
            onClick={saveTimeEntry}
          >
            <Save className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};