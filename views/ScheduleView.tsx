import React, { useState, useEffect, useMemo } from 'react';
import { GripVertical, Clock, CheckCircle2, Plus, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useScheduleStore, Task, ScheduleEvent } from '../store/useScheduleStore';
import { TaskModal } from '../components/schedule/TaskModal';
import { EventModal } from '../components/schedule/EventModal';

// Helper to convert time string to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Event with calculated position info for rendering
interface PositionedEvent extends ScheduleEvent {
  column: number;
  totalColumns: number;
}

// Calculate overlapping events and assign columns
const calculateEventPositions = (events: ScheduleEvent[]): PositionedEvent[] => {
  if (events.length === 0) return [];

  // Sort events by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const startDiff = timeToMinutes(a.timeStart) - timeToMinutes(b.timeStart);
    if (startDiff !== 0) return startDiff;
    return b.duration - a.duration; // Longer events first
  });

  const positioned: PositionedEvent[] = [];
  const columns: { end: number; events: PositionedEvent[] }[] = [];

  for (const event of sorted) {
    const start = timeToMinutes(event.timeStart);
    const end = start + event.duration;

    // Find first column where this event fits (no overlap)
    let columnIndex = columns.findIndex(col => col.end <= start);

    if (columnIndex === -1) {
      // Need a new column
      columnIndex = columns.length;
      columns.push({ end: 0, events: [] });
    }

    const positionedEvent: PositionedEvent = {
      ...event,
      column: columnIndex,
      totalColumns: 1, // Will be updated after all events placed
    };

    columns[columnIndex].end = end;
    columns[columnIndex].events.push(positionedEvent);
    positioned.push(positionedEvent);
  }

  // Now update totalColumns for overlapping groups
  // An event's totalColumns = max columns active during its time range
  for (const event of positioned) {
    const start = timeToMinutes(event.timeStart);
    const end = start + event.duration;

    // Count how many events overlap with this one
    let maxColumns = 1;
    for (const other of positioned) {
      if (other.id === event.id) continue;
      const otherStart = timeToMinutes(other.timeStart);
      const otherEnd = otherStart + other.duration;

      // Check if they overlap
      if (start < otherEnd && end > otherStart) {
        maxColumns = Math.max(maxColumns, Math.max(event.column, other.column) + 1);
      }
    }
    event.totalColumns = maxColumns;
  }

  return positioned;
};

export const ScheduleView: React.FC = () => {
  // Get state and actions from the store
  const {
    tasks, events, isGoogleConnected,
    addTask, updateTask, deleteTask, completeTask,
    addEvent, updateEvent, deleteEvent,
    checkGoogleAuth, connectGoogle, disconnectGoogle, syncWithGoogle, syncTasksWithGoogle
  } = useScheduleStore();

  // Check auth on mount
  useEffect(() => {
    checkGoogleAuth();
  }, [checkGoogleAuth]);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | undefined>();
  const [newEventTime, setNewEventTime] = useState<string | undefined>();
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter events for the selected date
  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDateStr);
  }, [events, selectedDateStr]);

  // Calculate positioned events with overlap handling
  const positionedEvents = useMemo(() => calculateEventPositions(filteredEvents), [filteredEvents]);

  useEffect(() => {
    // Update current time every minute for the time indicator
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync with Google every 5 minutes
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isGoogleConnected) return;

    const autoSyncInterval = setInterval(async () => {
      setIsSyncing(true);
      await syncWithGoogle();
      setIsSyncing(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoSyncInterval);
  }, [isGoogleConnected, syncWithGoogle]);

  const handleManualSync = async () => {
    if (!isGoogleConnected) return;
    setIsSyncing(true);
    // Sync the selected day (plus/minus buffer if we wanted, but let's stick to the active view)
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    await Promise.all([
      syncWithGoogle(start, end),
      syncTasksWithGoogle()
    ]);
    setIsSyncing(false);
  };

  // Sync when changing dates (debounced or immediate)
  useEffect(() => {
    if (!isGoogleConnected) return;

    // Tiny delay to avoid rapid switching spam
    const timer = setTimeout(() => {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      syncWithGoogle(start, end);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedDate, isGoogleConnected, syncWithGoogle]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  }

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  }

  const handleToday = () => {
    setSelectedDate(new Date());
  }

  // Timeline config
  const startHour = 8;
  const hourHeight = 80;

  const getEventStyle = (event: PositionedEvent) => {
    const [hours, minutes] = event.timeStart.split(':').map(Number);
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    const top = (totalMinutesFromStart / 60) * hourHeight;
    const height = (event.duration / 60) * hourHeight;

    // Calculate horizontal position based on column
    const widthPercent = 100 / event.totalColumns;
    const leftPercent = event.column * widthPercent;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `calc(16px + ${leftPercent}%)`,
      width: `calc(${widthPercent}% - 20px)`,
    };
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20';
      case 'break': return 'bg-gray-700/30 border-gray-600/50 text-gray-400 hover:bg-gray-700/50';
      case 'meeting': return 'bg-purple-500/10 border-purple-500/50 text-purple-200 hover:bg-purple-500/20';
      default: return 'bg-blue-500/10 border-blue-500/50 text-blue-200 hover:bg-blue-500/20';
    }
  };

  // Get current time indicator position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    if (hours < startHour || hours >= 23) return null;
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    return (totalMinutesFromStart / 60) * hourHeight + 20; // +20 for header offset
  };

  const currentTimePos = getCurrentTimePosition();
  const currentTimeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Handlers for Task CRUD
  const handleOpenNewTask = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  const handleDeleteTask = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    console.log('Drag Start:', taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Required for drag to work in some browsers/engines
    e.dataTransfer.setData('text/plain', String(taskId));
  };

  const handleDragEnd = () => {
    console.log('Drag End');
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropComplete = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drop Complete Triggered. draggedTaskId:', draggedTaskId);
    const droppedTaskId = draggedTaskId || Number(e.dataTransfer.getData('text/plain'));

    if (droppedTaskId) {
      completeTask(droppedTaskId);
      setDraggedTaskId(null);
    }
  };

  // Handlers for Event CRUD
  const handleOpenNewEvent = (time?: string) => {
    setEditingEvent(undefined);
    setNewEventTime(time);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setNewEventTime(undefined);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<ScheduleEvent, 'id'>, syncToGoogle: boolean) => {
    // Ensure the event has the correct date from the current view (or editing event's date)
    const dateToUse = editingEvent ? editingEvent.date : selectedDateStr;
    const finalEventData = { ...eventData, date: dateToUse };

    if (editingEvent) {
      updateEvent(editingEvent.id, finalEventData, syncToGoogle);
    } else {
      addEvent(finalEventData, syncToGoogle);
    }
  };

  const handleDeleteEvent = (syncToGoogle: boolean) => {
    if (editingEvent) {
      deleteEvent(editingEvent.id, syncToGoogle);
    }
  };

  // Handle clicking on the timeline to add an event at that time
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, hour: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const halfHour = clickY > rect.height / 2;
    const minutes = halfHour ? 30 : 0;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    handleOpenNewEvent(timeStr);
  };

  return (
    <div className="flex h-full w-full bg-[#0a0a0a] overflow-hidden rounded-xl border border-[#262626] animate-in fade-in duration-300">

      {/* LEFT PANEL: BACKLOG */}
      <div className="w-[30%] min-w-[300px] bg-[#161616] border-r border-[#262626] flex flex-col">
        <div className="h-14 flex items-center justify-between px-5 border-b border-[#262626] shrink-0">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
            Task Queue
            <span className="bg-[#262626] text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{tasks.length}</span>
          </h2>
          <button
            onClick={handleOpenNewTask}
            className="p-1.5 hover:bg-[#262626] rounded-md text-gray-400 hover:text-white transition-colors"
            title="Add new task"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleEditTask(task)}
                className={`group bg-[#202020] hover:bg-[#262626] p-3 rounded-lg border border-[#333] hover:border-gray-500 cursor-pointer transition-all duration-200 flex items-start gap-3 shadow-sm hover:shadow-md hover:translate-x-1 ${draggedTaskId === task.id ? 'opacity-50 border-dashed border-gray-500' : ''
                  }`}
              >
                <div className="mt-1 text-gray-600 group-hover:text-gray-400">
                  <GripVertical size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                    {task.title}
                    {task.googleId && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono" title="Synced with Google Tasks">
                        G
                      </span>
                    )}
                  </h3>
                  <div className={`text-[10px] inline-block px-2 py-0.5 rounded border ${task.color === 'blue' ? 'bg-blue-900/20 border-blue-800 text-blue-400' :
                    task.color === 'orange' ? 'bg-orange-900/20 border-orange-800 text-orange-400' :
                      task.color === 'emerald' ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' :
                        'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}>
                    {task.tag}
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center text-gray-600 py-8 text-sm">
                No tasks yet. Click + to add one.
              </div>
            )}
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDropComplete}
            className={`mt-8 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-gray-600 gap-2 transition-colors cursor-pointer ${draggedTaskId ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-[#262626] hover:border-gray-500 hover:bg-[#202020]'
              }`}
          >
            <span className="text-xs">{draggedTaskId ? 'Drop to Complete' : 'Drop completed tasks here'}</span>
            <CheckCircle2 size={16} className={draggedTaskId ? 'scale-125 transition-transform' : ''} />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: TIMELINE */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
        <div className="h-14 flex items-center justify-between px-6 border-b border-[#262626] shrink-0 bg-[#0a0a0a]/95 backdrop-blur z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-500" />
              <span className="font-semibold text-gray-200">Timeline</span>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center bg-[#202020] rounded-lg border border-[#333] p-0.5">
              <button onClick={handlePrevDay} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleToday} className="px-3 text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Calendar size={12} />
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </button>
              <button onClick={handleNextDay} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isGoogleConnected ? (
              <button
                onClick={disconnectGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-xs font-medium"
                title="Click to disconnect"
              >
                <CheckCircle2 size={12} />
                <span>Connected</span>
              </button>
            ) : (
              <button
                onClick={connectGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202020] border border-[#333] text-gray-400 rounded-lg hover:bg-[#262626] hover:text-white transition-colors text-xs font-medium"
              >
                Link Google Calendar
              </button>
            )}

            {isGoogleConnected && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-medium disabled:opacity-50"
                title="Sync with Google Calendar"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}

            <button
              onClick={() => handleOpenNewEvent()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors text-xs font-medium"
            >
              <Plus size={14} />
              Add Event
            </button>
            <span className="text-xs font-mono text-gray-500">
              {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="relative min-h-[1200px] w-full pb-20">

            {/* Current Time Indicator (Only show if viewing Today) */}
            {isToday && currentTimePos !== null && (
              <div
                className="absolute w-full z-10 flex items-center pointer-events-none"
                style={{ top: `${currentTimePos}px` }}
              >
                <div className="w-16 text-right pr-4 text-xs font-bold text-red-500 font-mono">{currentTimeStr}</div>
                <div className="flex-1 h-px bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
              </div>
            )}

            {/* Hour Grid */}
            {Array.from({ length: 15 }).map((_, i) => {
              const hour = startHour + i;
              const displayHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;

              return (
                <div
                  key={hour}
                  className="flex w-full group"
                  style={{ height: `${hourHeight}px` }}
                >
                  <div className="w-16 shrink-0 border-r border-[#262626] text-[10px] text-gray-500 font-mono pt-2 pr-2 text-right">
                    {displayHour}
                  </div>
                  <div
                    className="flex-1 border-b border-[#262626]/50 group-last:border-none relative hover:bg-[#161616]/30 cursor-pointer transition-colors"
                    onClick={(e) => handleTimelineClick(e, hour)}
                    title="Click to add event"
                  >
                    {/* Half-hour dashed line */}
                    <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-[#262626]/30"></div>
                  </div>
                </div>
              );
            })}

            {/* Events Layer */}
            <div className="absolute top-0 left-16 right-4 bottom-0">
              {positionedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleEditEvent(event)}
                  className={`
                    absolute rounded-md border p-2 flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:z-20
                    ${getEventColor(event.type)}
                  `}
                  style={getEventStyle(event)}
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-semibold text-sm truncate">{event.title}</span>
                    <span className="text-[10px] font-mono opacity-70">
                      {event.timeStart} - {(() => {
                        const [h, m] = event.timeStart.split(':').map(Number);
                        const date = new Date();
                        date.setHours(h, m + event.duration);
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
        initialData={editingTask}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={editingEvent ? handleDeleteEvent : undefined}
        initialData={editingEvent}
        initialTime={newEventTime}
        isGoogleConnected={isGoogleConnected}
      />
    </div>
  );
};