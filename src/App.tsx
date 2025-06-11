import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Menu, X, ExternalLink, Check, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Widget {
  id: string;
  type: 'notes' | 'links' | 'todo' | 'rss';
  title: string;
  content: any;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface Link {
  id: string;
  url: string;
  title: string;
  favicon?: string;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  backgroundColor: 'white' | 'light-gray' | 'dark-gray' | 'black';
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image?: string;
}

const STORAGE_KEY = 'personaltab-data-fixed-v1';

// Fixed dimensions - exactly 380x310 pixels
const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 310;
const WIDGET_MARGIN = 20;
const GRID_SIZE = 20; // Snap to grid for alignment

// Calculate container width to prevent horizontal overflow
const WIDGETS_PER_ROW = 3;
const CONTAINER_WIDTH = (WIDGET_WIDTH + WIDGET_MARGIN) * WIDGETS_PER_ROW;

export default function App() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [maxZIndex, setMaxZIndex] = useState(3);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [affectedWidgets, setAffectedWidgets] = useState<string[]>([]);

  const createDefaultWidgets = (): Widget[] => {
    return [
      {
        id: '1',
        type: 'notes' as const,
        title: 'Notes',
        content: { text: 'Welcome to PersonalTab!\n\nDrag widgets to move them.\nResize by dragging corners.\nClick titles to edit them.' },
        x: 0,
        y: 0,
        width: WIDGET_WIDTH,
        height: WIDGET_HEIGHT,
        zIndex: 1
      },
      {
        id: '2',
        type: 'todo' as const,
        title: 'List',
        content: { todos: [] },
        x: WIDGET_WIDTH + WIDGET_MARGIN,
        y: 0,
        width: WIDGET_WIDTH,
        height: WIDGET_HEIGHT,
        zIndex: 2
      },
      {
        id: '3',
        type: 'links' as const,
        title: 'Links',
        content: { links: [] },
        x: (WIDGET_WIDTH + WIDGET_MARGIN) * 2,
        y: 0,
        width: WIDGET_WIDTH,
        height: WIDGET_HEIGHT,
        zIndex: 3
      }
    ];
  };

  // Initialize widgets
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const data = JSON.parse(saved);
        if (data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
          setWidgets(data.widgets);
          setNextId(data.nextId || data.widgets.length + 1);
          setMaxZIndex(Math.max(...data.widgets.map((w: Widget) => w.zIndex || 0)) + 1);
          return;
        }
      }
      
      // No valid saved data, create defaults
      const defaultWidgets = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setNextId(4);
      setMaxZIndex(4);
      
    } catch (error) {
      console.error('Error loading saved data:', error);
      const defaultWidgets = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setNextId(4);
      setMaxZIndex(4);
    }
  }, []);

  // Save data whenever widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, nextId }));
    }
  }, [widgets, nextId]);

  // Snap to grid function
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Find next available aligned position for new widget
  const findNextAlignedPosition = (excludeId?: string): { x: number; y: number } => {
    const positions = widgets
      .filter(w => w.id !== excludeId)
      .map(w => ({ x: w.x, y: w.y, width: w.width, height: w.height }));
    
    // Try positions in a grid pattern with proper alignment
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < WIDGETS_PER_ROW; col++) {
        const x = col * (WIDGET_WIDTH + WIDGET_MARGIN);
        const y = row * (WIDGET_HEIGHT + WIDGET_MARGIN);
        
        // Check if this position overlaps with any existing widget
        const overlaps = positions.some(pos => 
          x < pos.x + pos.width + WIDGET_MARGIN &&
          x + WIDGET_WIDTH + WIDGET_MARGIN > pos.x &&
          y < pos.y + pos.height + WIDGET_MARGIN &&
          y + WIDGET_HEIGHT + WIDGET_MARGIN > pos.y
        );
        
        if (!overlaps) {
          return { x, y };
        }
      }
    }
    
    // Fallback: place below all existing widgets
    const maxY = Math.max(...positions.map(p => p.y + p.height), 0);
    return { x: 0, y: maxY + WIDGET_MARGIN };
  };

  // Check for widget overlaps during drag
  const getOverlappingWidgets = (draggedId: string, x: number, y: number, width: number, height: number) => {
    return widgets.filter(w => 
      w.id !== draggedId &&
      x < w.x + w.width &&
      x + width > w.x &&
      y < w.y + w.height &&
      y + height > w.y
    );
  };

  const addWidget = (type: Widget['type']) => {
    const titleMap = {
      'notes': 'Notes',
      'todo': 'List',
      'links': 'Links',
      'rss': 'RSS Feed'
    };

    const position = findNextAlignedPosition();
    const newZIndex = maxZIndex + 1;

    const newWidget: Widget = {
      id: String(nextId),
      type,
      title: titleMap[type],
      content: type === 'notes' ? { text: '' } : 
               type === 'links' ? { links: [] } : 
               type === 'rss' ? { url: '', items: [] } :
               { todos: [] },
      x: position.x,
      y: position.y,
      width: WIDGET_WIDTH,
      height: WIDGET_HEIGHT,
      zIndex: newZIndex
    };

    setWidgets(prev => [...prev, newWidget]);
    setNextId(nextId + 1);
    setMaxZIndex(newZIndex);
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  // Handle widget dragging
  const handleMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    
    e.preventDefault();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setDraggedWidget(widgetId);
    
    // Bring to front
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    updateWidget(widgetId, { zIndex: newZIndex });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedWidget) return;
    
    const container = document.getElementById('widget-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const rawX = e.clientX - containerRect.left - dragOffset.x;
    const rawY = e.clientY - containerRect.top - dragOffset.y;
    
    // Constrain to container bounds
    const maxX = CONTAINER_WIDTH - WIDGET_WIDTH;
    const x = Math.max(0, Math.min(maxX, snapToGrid(rawX)));
    const y = Math.max(0, snapToGrid(rawY));
    
    // Update drag preview
    setDragPreview({ x, y });
    
    // Find overlapping widgets and show visual feedback
    const draggedWidgetData = widgets.find(w => w.id === draggedWidget);
    if (draggedWidgetData) {
      const overlapping = getOverlappingWidgets(draggedWidget, x, y, draggedWidgetData.width, draggedWidgetData.height);
      setAffectedWidgets(overlapping.map(w => w.id));
    }
    
    // Update widget position with smooth animation
    updateWidget(draggedWidget, { x, y });
  };

  const handleMouseUp = () => {
    if (!draggedWidget) return;
    
    // Get final position
    const draggedWidgetData = widgets.find(w => w.id === draggedWidget);
    if (!draggedWidgetData) return;
    
    // Move overlapping widgets to aligned positions
    const overlappingWidgets = getOverlappingWidgets(
      draggedWidget, 
      draggedWidgetData.x, 
      draggedWidgetData.y, 
      draggedWidgetData.width, 
      draggedWidgetData.height
    );
    
    // Reposition overlapping widgets to aligned grid positions
    overlappingWidgets.forEach(widget => {
      const newPosition = findNextAlignedPosition(widget.id);
      updateWidget(widget.id, newPosition);
    });
    
    // Clean up drag state
    setDraggedWidget(null);
    setDragPreview(null);
    setAffectedWidgets([]);
  };

  // Handle resize
  const handleResize = (widgetId: string, newWidth: number, newHeight: number) => {
    updateWidget(widgetId, { 
      width: Math.max(200, snapToGrid(newWidth)), 
      height: Math.max(150, snapToGrid(newHeight))
    });
  };

  // Mouse event listeners
  useEffect(() => {
    if (draggedWidget) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [draggedWidget, dragOffset, widgets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Menu className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">PersonalTab</h1>
          </div>

          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-9 h-9 p-0"
              onMouseEnter={() => setShowAddMenu(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {showAddMenu && (
              <div 
                className="absolute right-0 -top-1 mr-10 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-50"
                onMouseEnter={() => setShowAddMenu(true)}
                onMouseLeave={() => setShowAddMenu(false)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => addWidget('notes')}
                >
                  Notes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => addWidget('todo')}
                >
                  List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => addWidget('links')}
                >
                  Links
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => addWidget('rss')}
                >
                  RSS Feed
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        id="widget-container"
        className="relative p-4 overflow-hidden"
        style={{ 
          minHeight: 'calc(100vh - 80px)', 
          width: CONTAINER_WIDTH + 40, // Add padding
          maxWidth: CONTAINER_WIDTH + 40
        }}
      >
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onRemove={removeWidget}
            onUpdate={updateWidget}
            onResize={handleResize}
            onMouseDown={handleMouseDown}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
            editTitleValue={editTitleValue}
            setEditTitleValue={setEditTitleValue}
            isDragging={draggedWidget === widget.id}
            isAffected={affectedWidgets.includes(widget.id)}
          />
        ))}
        
        {/* Drag preview overlay */}
        {dragPreview && draggedWidget && (
          <div
            className="absolute border-2 border-blue-400 border-dashed bg-blue-100/30 rounded-xl pointer-events-none"
            style={{
              left: dragPreview.x,
              top: dragPreview.y,
              width: widgets.find(w => w.id === draggedWidget)?.width || WIDGET_WIDTH,
              height: widgets.find(w => w.id === draggedWidget)?.height || WIDGET_HEIGHT,
              zIndex: 9999
            }}
          />
        )}
      </div>
    </div>
  );
}

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Widget>) => void;
  onResize: (id: string, width: number, height: number) => void;
  onMouseDown: (e: React.MouseEvent, widgetId: string) => void;
  editingTitle: string | null;
  setEditingTitle: (id: string | null) => void;
  editTitleValue: string;
  setEditTitleValue: (value: string) => void;
  isDragging: boolean;
  isAffected: boolean;
}

function WidgetCard({
  widget,
  onRemove,
  onUpdate,
  onResize,
  onMouseDown,
  editingTitle,
  setEditingTitle,
  editTitleValue,
  setEditTitleValue,
  isDragging,
  isAffected
}: WidgetCardProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const startEdit = () => {
    setEditingTitle(widget.id);
    setEditTitleValue(widget.title);
  };

  const saveEdit = () => {
    if (editTitleValue.trim()) {
      onUpdate(widget.id, { title: editTitleValue.trim() });
    }
    setEditingTitle(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: widget.width,
      height: widget.height
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = resizeStart.width + deltaX;
    const newHeight = resizeStart.height + deltaY;
    
    onResize(widget.id, newWidth, newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  return (
    <div
      className={`absolute bg-white/95 backdrop-blur-sm shadow-lg border-2 rounded-xl transition-all duration-200 ${
        isDragging ? 'cursor-grabbing shadow-2xl scale-105 border-blue-400' : 
        isAffected ? 'border-orange-400 shadow-orange-200 animate-pulse' :
        'cursor-grab hover:border-blue-200'
      }`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        zIndex: widget.zIndex,
        transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)'
      }}
      onMouseDown={(e) => onMouseDown(e, widget.id)}
    >
      {/* Header - Full width drag area */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 rounded-t-xl cursor-grab">
        <div className="flex items-center gap-2 flex-1">
          <Menu className="w-3 h-3 text-gray-400" />
          {editingTitle === widget.id ? (
            <div className="flex items-center gap-1 flex-1 no-drag">
              <Input
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                className="text-sm h-6"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditingTitle(null);
                }}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={saveEdit}>
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <h3
              className="text-sm font-medium cursor-pointer hover:text-blue-600 flex-1 no-drag"
              onClick={startEdit}
            >
              {widget.title}
            </h3>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 no-drag"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(widget.id);
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 overflow-hidden no-drag" style={{ height: widget.height - 60 }}>
        {widget.type === 'notes' && <NotesWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'todo' && <TodoWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'links' && <LinksWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'rss' && <RSSWidget widget={widget} onUpdate={onUpdate} />}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize no-drag hover:bg-blue-200 rounded-tl-lg"
        onMouseDown={handleResizeStart}
        style={{
          background: 'linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 40%, transparent 40%, transparent 60%, #ccc 60%, #ccc 70%, transparent 70%)'
        }}
      />
    </div>
  );
}

function NotesWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [content, setContent] = useState(widget.content.text || '');

  useEffect(() => {
    setContent(widget.content.text || '');
  }, [widget.content.text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate(widget.id, { content: { text: newContent } });
  };

  return (
    <div className="h-full">
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder="Start typing your notes..."
        className="h-full resize-none border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
      />
    </div>
  );
}

function TodoWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [todos, setTodos] = useState<TodoItem[]>(widget.content.todos || []);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => setTodos(widget.content.todos || []), [widget.content.todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { 
      id: String(Date.now()), 
      text: newTodo.trim(), 
      completed: false,
      backgroundColor: 'white' as const
    }];
    setTodos(updated);
    onUpdate(widget.id, { content: { todos: updated } });
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    onUpdate(widget.id, { content: { todos: updated } });
  };

  const removeTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    onUpdate(widget.id, { content: { todos: updated } });
  };

  const cycleBackgroundColor = (id: string) => {
    const colorCycle: TodoItem['backgroundColor'][] = ['white', 'light-gray', 'dark-gray', 'black'];
    const updated = todos.map(t => {
      if (t.id === id) {
        const currentIndex = colorCycle.indexOf(t.backgroundColor);
        const nextIndex = (currentIndex + 1) % colorCycle.length;
        return { ...t, backgroundColor: colorCycle[nextIndex] };
      }
      return t;
    });
    setTodos(updated);
    onUpdate(widget.id, { content: { todos: updated } });
  };

  const getBackgroundClasses = (backgroundColor: TodoItem['backgroundColor'], completed: boolean) => {
    const baseClasses = "text-sm flex-1 cursor-pointer select-none p-2 rounded transition-colors";
    const completedClass = completed ? 'line-through opacity-60' : '';
    
    switch (backgroundColor) {
      case 'white':
        return `${baseClasses} bg-white text-black border ${completedClass}`;
      case 'light-gray':
        return `${baseClasses} bg-gray-200 text-black ${completedClass}`;
      case 'dark-gray':
        return `${baseClasses} bg-gray-600 text-white ${completedClass}`;
      case 'black':
        return `${baseClasses} bg-black text-white ${completedClass}`;
      default:
        return `${baseClasses} bg-white text-black border ${completedClass}`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add item..."
          className="text-sm h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTodo();
          }}
        />
        <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={addTodo} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="w-4 h-4 flex-shrink-0"
            />
            <div 
              className={getBackgroundClasses(todo.backgroundColor, todo.completed)}
              onClick={() => cycleBackgroundColor(todo.id)}
              title="Click to change background color"
            >
              {todo.text}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={() => removeTodo(todo.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [links, setLinks] = useState<Link[]>(widget.content.links || []);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => setLinks(widget.content.links || []), [widget.content.links]);

  const addLink = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http')) url = `https://${url}`;

    const newLink: Link = {
      id: String(Date.now()),
      url,
      title: url,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16`
    };

    const updated = [...links, newLink];
    setLinks(updated);
    onUpdate(widget.id, { content: { links: updated } });
    setNewUrl('');
  };

  const removeLink = (id: string) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    onUpdate(widget.id, { content: { links: updated } });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Add URL..."
          className="text-sm h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addLink();
          }}
        />
        <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={addLink} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 group">
            <img src={link.favicon} alt="" className="w-4 h-4" />
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex-1 truncate"
            >
              {link.title}
            </a>
            <ExternalLink className="w-3 h-3 text-gray-400" />
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => removeLink(link.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RSSWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [url, setUrl] = useState(widget.content.url || '');
  const [items, setItems] = useState<RSSItem[]>(widget.content.items || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrl(widget.content.url || '');
    setItems(widget.content.items || []);
  }, [widget.content]);

  const fetchRSSFeed = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url.trim())}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.status === 'ok') {
        const rssItems: RSSItem[] = data.items.slice(0, 5).map((item: any) => ({
          title: item.title || 'No title',
          link: item.link || '#',
          description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No description',
          pubDate: item.pubDate || new Date().toISOString(),
          image: item.thumbnail || item.enclosure?.link || ''
        }));
        
        setItems(rssItems);
        onUpdate(widget.id, { content: { url: url.trim(), items: rssItems } });
      } else {
        setError('Failed to fetch RSS feed. Please check the URL.');
      }
    } catch (err) {
      setError('Error fetching RSS feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="RSS feed URL..."
          className="text-sm h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchRSSFeed();
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={fetchRSSFeed}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 && !loading && !error && (
          <div className="text-sm text-gray-500 text-center py-4">
            Enter an RSS feed URL above to get started
          </div>
        )}
        
        {items.map((item, index) => (
          <div key={index} className="p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-start gap-2">
              {item.image && (
                <img 
                  src={item.image} 
                  alt="" 
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline line-clamp-2 block"
                >
                  {item.title}
                </a>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.pubDate)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}