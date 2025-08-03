import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Save, Check, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { LoadingState } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProjects } from '@/hooks/useProjects';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export const TimeEntry: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { projects } = useProjects();
  const { createTimeEntry, updateTimeEntry } = useTimeEntries();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    break_start: '',
    break_end: '',
    project: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<any>(null);

  // Load existing entry for selected date
  useEffect(() => {
    const loadExistingEntry = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', selectedDate)
          .single();

        if (data) {
          setExistingEntry(data);
          setFormData({
            start_time: data.start_time || '',
            end_time: data.end_time || '',
            break_start: data.break_start || '',
            break_end: data.break_end || '',
            project: data.project || '',
            notes: data.notes || ''
          });
        } else {
          setExistingEntry(null);
          setFormData({
            start_time: '',
            end_time: '',
            break_start: '',
            break_end: '',
            project: '',
            notes: ''
          });
        }
      } catch (error) {
        // Entry doesn't exist, which is fine
        setExistingEntry(null);
      }
    };

    loadExistingEntry();
  }, [selectedDate, user]);

  const calculateTotalHours = () => {
    if (!formData.start_time || !formData.end_time) return 0;

    const start = new Date(`${selectedDate}T${formData.start_time}`);
    const end = new Date(`${selectedDate}T${formData.end_time}`);
    
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Subtract break time
    if (formData.break_start && formData.break_end) {
      const breakStart = new Date(`${selectedDate}T${formData.break_start}`);
      const breakEnd = new Date(`${selectedDate}T${formData.break_end}`);
      totalMinutes -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const validateForm = () => {
    if (!formData.start_time) {
      toast({
        title: "Erreur",
        description: "L'heure de début est obligatoire",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.project) {
      toast({
        title: "Erreur",
        description: "Le projet est obligatoire",
        variant: "destructive"
      });
      return false;
    }

    const totalHours = calculateTotalHours();
    if (formData.end_time && totalHours > 12) {
      toast({
        title: "Attention",
        description: "Plus de 12h de travail détectées",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const totalHours = calculateTotalHours();
      const entryData = {
        date: selectedDate,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        break_start: formData.break_start || null,
        break_end: formData.break_end || null,
        total_hours: totalHours,
        project: formData.project,
        notes: formData.notes || null,
        status
      };

      let success = false;
      if (existingEntry) {
        const result = await updateTimeEntry(existingEntry.id, entryData);
        success = !!result;
      } else {
        const result = await createTimeEntry(entryData);
        success = !!result;
      }

      if (success) {
        toast({
          title: status === 'draft' ? "Brouillon sauvegardé" : "Heures soumises",
          description: status === 'draft' 
            ? "Vos heures ont été sauvegardées en brouillon"
            : "Vos heures ont été soumises pour validation",
        });

        if (status === 'submitted') {
          navigate('/employee/reports');
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les heures",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingState message="Chargement..." />
        </div>
      </DashboardLayout>
    );
  }

  const totalHours = calculateTotalHours();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <BreadcrumbNav />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Saisie des heures</h1>
          <p className="text-muted-foreground">Enregistrez vos heures de travail quotidiennes</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Nouvelle entrée</span>
                {existingEntry && (
                  <span className="text-sm text-muted-foreground">(Modification)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Heure de début *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Heure de fin</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Break Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="break_start">Début pause</Label>
                  <Input
                    id="break_start"
                    type="time"
                    value={formData.break_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_start: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="break_end">Fin pause</Label>
                  <Input
                    id="break_end"
                    type="time"
                    value={formData.break_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_end: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Project Selection */}
              <div>
                <Label htmlFor="project">Projet/Activité *</Label>
                <Select value={formData.project} onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="Travail général">Travail général</SelectItem>
                    <SelectItem value="Formation">Formation</SelectItem>
                    <SelectItem value="Réunion">Réunion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ajoutez des détails sur votre journée..."
                  className="mt-1"
                />
              </div>

              {/* Summary */}
              {totalHours > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Récapitulatif</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Temps total :</span>
                      <span className="font-medium">{totalHours.toFixed(2)}h</span>
                    </div>
                    {formData.break_start && formData.break_end && (
                      <div className="flex justify-between">
                        <span>Pause :</span>
                        <span className="font-medium">
                          {(() => {
                            const breakStart = new Date(`${selectedDate}T${formData.break_start}`);
                            const breakEnd = new Date(`${selectedDate}T${formData.break_end}`);
                            const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
                            return `${Math.floor(breakMinutes / 60)}h ${Math.floor(breakMinutes % 60)}m`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {totalHours > 8 && (
                    <div className="flex items-center space-x-2 mt-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Heures supplémentaires: {(totalHours - 8).toFixed(2)}h</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder brouillon
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleSave('submitted')}
                  disabled={saving || !formData.start_time || !formData.project}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Soumettre pour validation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};