import React, { useState } from 'react';
import { Calendar, Clock, Bell, Droplets, Bug, Scissors, Pill, Sun, CloudRain, AlertTriangle, Plus, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface ScheduleTask {
  id: string;
  type: 'watering' | 'fertilizing' | 'pesticide' | 'pruning' | 'harvesting' | 'inspection';
  title: string;
  description: string;
  date: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const CropMonitoringSchedule: React.FC = () => {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState<ScheduleTask[]>([
    {
      id: '1',
      type: 'watering',
      title: t('scheduleWatering'),
      description: t('scheduleWateringDesc'),
      date: new Date(),
      completed: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'inspection',
      title: t('scheduleInspection'),
      description: t('scheduleInspectionDesc'),
      date: new Date(Date.now() + 86400000),
      completed: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'fertilizing',
      title: t('scheduleFertilizing'),
      description: t('scheduleFertilizingDesc'),
      date: new Date(Date.now() + 172800000),
      completed: false,
      priority: 'medium'
    },
    {
      id: '4',
      type: 'pesticide',
      title: t('schedulePesticide'),
      description: t('schedulePesticideDesc'),
      date: new Date(Date.now() + 259200000),
      completed: false,
      priority: 'low'
    }
  ]);

  const [showAddTask, setShowAddTask] = useState(false);

  const getTaskIcon = (type: ScheduleTask['type']) => {
    switch (type) {
      case 'watering': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'fertilizing': return <Pill className="w-4 h-4 text-green-500" />;
      case 'pesticide': return <Bug className="w-4 h-4 text-orange-500" />;
      case 'pruning': return <Scissors className="w-4 h-4 text-purple-500" />;
      case 'harvesting': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'inspection': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: ScheduleTask['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tomorrow');
    }
    
    return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : language === 'kn' ? 'kn-IN' : language === 'ta' ? 'ta-IN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const addNewTask = (type: ScheduleTask['type']) => {
    const newTask: ScheduleTask = {
      id: Date.now().toString(),
      type,
      title: t(`schedule${type.charAt(0).toUpperCase() + type.slice(1)}`),
      description: t(`schedule${type.charAt(0).toUpperCase() + type.slice(1)}Desc`),
      date: new Date(Date.now() + 86400000),
      completed: false,
      priority: 'medium'
    };
    setTasks(prev => [...prev, newTask]);
    setShowAddTask(false);
  };

  const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => a.date.getTime() - b.date.getTime());
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('monitoringSchedule')}
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowAddTask(!showAddTask)}
            className="h-8"
          >
            {showAddTask ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddTask && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg animate-fade-in">
            {(['watering', 'fertilizing', 'pesticide', 'pruning', 'harvesting', 'inspection'] as const).map(type => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => addNewTask(type)}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                {getTaskIcon(type)}
                <span className="text-xs capitalize">{type}</span>
              </Button>
            ))}
          </div>
        )}

        {pendingTasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noScheduledTasks')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleComplete(task.id)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  {getTaskIcon(task.type)}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{task.title}</span>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(task.date)}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleComplete(task.id)}
                  className="h-7 w-7 p-0"
                >
                  <Check className="w-4 h-4 text-primary" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">{t('completedTasks')} ({completedTasks.length})</p>
            <div className="space-y-1">
              {completedTasks.slice(0, 3).map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs line-through flex-1">{task.title}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTask(task.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CropMonitoringSchedule;
