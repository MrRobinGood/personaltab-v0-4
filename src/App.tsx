import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Plus, Menu, GripVertical, X, ExternalLink, Download, Upload, Check, MoreHorizontal, Calendar, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

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

const STORAGE_KEY = 'personaltab-data-v2';
const GRID_SIZE = 20;
const WIDGET_WIDTH = 310;
const WIDGET_HEIGHT = 400;

export default function App() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    widgetId: string | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    initialX: number;
    initialY: number;
    offsetX: number;
    offsetY: number;
  }>({
    isDragging: false,
    isResizing: false,
    widgetId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    initialX: 0,
    initialY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [previewPosition, setPreviewPosition] = useState<{x: number, y: number} | null>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snap to grid function
  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Check if two rectangles overlap
  const rectanglesOverlap = (rect1: any, rect2: any) => {
    return !(rect1.x >= rect2.x + rect2.width || 
             rect2.x >= rect1.x + rect1.width || 
             rect1.y >= rect2.y + rect2.height || 
             rect2.y >= rect1.y + rect1.height);
  };

  // Find a free position for a widget
  const findFreePosition = (excludeId: string, preferredX: number, preferredY: number, width: number, height: number) => {
    const otherWidgets = widgets.filter(w => w.id !== excludeId);
    
    // Snap preferred position to grid
    const snappedX = Math.max(0, snapToGrid(preferredX));
    const snappedY = Math.max(0, snapToGrid(preferredY));
    
    // Check if preferred position is free
    const testRect = { x: snappedX, y: snappedY, width, height };
    const hasCollision = otherWidgets.some(widget => rectanglesOverlap(testRect, widget));
    
    if (!hasCollision) {
      return { x: snappedX, y: snappedY };
    }
    
    // Find nearest free position in a grid pattern
    const stepX = 330; // widget width + margin
    const stepY = 420; // widget height + margin
    const startX = 60;
    const startY = 60;
    
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        
        const gridRect = { x, y, width, height };
        const isOccupied = otherWidgets.some(widget => rectanglesOverlap(gridRect, widget));
        
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    
    // Fallback
    return { x: snappedX, y: snappedY };
  };

  const initializeDefaultWidgets = () => {
    // Clear any existing data first
    localStorage.removeItem('personaltab-data');
    localStorage.removeItem('personaltab-data-v1');
    
    const defaultWidgets: Widget[] = [
      {
        id: '1',
        type: 'notes',
        title: 'Notes',
        content: { text: 'Welcome to PersonalTab!\n\nDrag widgets by their title bar to move them.\nDrag the bottom-right corner to resize.\nClick titles to edit them.' },
        x: 60,
        y: 60,
        width: 310,
        height: 400,
        zIndex: 1
      },
      {
        id: '2',
        type: 'todo',
        title: 'List',
        content: { todos: [] },
        x: 390,
        y: 60,
        width: 310,
        height: 400,
        zIndex: 1
      },
      {
        id: '3',
        type: 'links',
        title: 'Links',
        content: { links: [] },
        x: 720,
        y: 60,
        width: 310,
        height: 400,
        zIndex: 1
      }
    ];
    setWidgets(defaultWidgets);
    setNextId(4);
    setMaxZIndex(1);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
          setWidgets(data.widgets);
          setNextId(data.nextId || 4);
          setMaxZIndex(data.maxZIndex || 1);
        } else {
          initializeDefaultWidgets();
        }
      } catch (error) {
        initializeDefaultWidgets();
      }
    } else {
      initializeDefaultWidgets();
    }
  }, []);

  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, nextId, maxZIndex }));
    }
  }, [widgets, nextId, maxZIndex]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging && !dragState.isResizing) return;

      const widget = widgets.find(w => w.id === dragState.widgetId);
      if (!widget) return;

      if (dragState.isDragging) {
        // Calculate new position based on mouse movement
        const newX = e.clientX - dragState.offsetX;
        const newY = e.clientY - dragState.offsetY;
        
        // Find the best position (snapped and collision-free)
        const bestPosition = findFreePosition(dragState.widgetId!, newX, newY, widget.width, widget.height);
        setPreviewPosition(bestPosition);

        // Update widget position in real-time (for smooth dragging)
        setWidgets(prev => prev.map(w => 
          w.id === dragState.widgetId 
            ? { ...w, x: newX, y: newY }
            : w
        ));
      } else if (dragState.isResizing) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        const newWidth = Math.max(200, snapToGrid(dragState.startWidth + deltaX));
        const newHeight = Math.max(150, snapToGrid(dragState.startHeight + deltaY));

        setWidgets(prev => prev.map(w => 
          w.id === dragState.widgetId 
            ? { ...w, width: newWidth, height: newHeight }
            : w
        ));
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging && dragState.widgetId && previewPosition) {
        // Apply the final snapped position
        setWidgets(prev => prev.map(w => 
          w.id === dragState.widgetId 
            ? { ...w, x: previewPosition.x, y: previewPosition.y }
            : w
        ));
      }

      setPreviewPosition(null);
      setDragState({
        isDragging: false,
        isResizing: false,
        widgetId: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        initialX: 0,
        initialY: 0,
        offsetX: 0,
        offsetY: 0
      });
    };

    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = dragState.isDragging ? 'move' : 'nw-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragState, widgets, previewPosition]);

  // Find the next available position for a new widget
  const findNextAvailablePosition = () => {
    const stepX = 330; // 310 + 20 margin
    const stepY = 420; // 400 + 20 margin
    const startX = 60;
    const startY = 60;
    
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + col * stepX;
        const y = startY + row * stepY;
        
        const testRect = { x, y, width: WIDGET_WIDTH, height: WIDGET_HEIGHT };
        const isOccupied = widgets.some(widget => rectanglesOverlap(testRect, widget));
        
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    
    return { 
      x: startX, 
      y: startY + Math.ceil(widgets.length / 3) * stepY
    };
  };

  const addWidget = (type: Widget['type']) => {
    const newZIndex = maxZIndex + 1;
    const titleMap = {
      'notes': 'Notes',
      'todo': 'List',
      'links': 'Links',
      'rss': 'RSS Feed'
    };

    const position = findNextAvailablePosition();

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
    setWidgets([...widgets, newWidget]);
    setNextId(nextId + 1);
    setMaxZIndex(newZIndex);
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const bringToFront = (id: string) => {
    const newZIndex = maxZIndex + 1;
    updateWidget(id, { zIndex: newZIndex });
    setMaxZIndex(newZIndex);
  };

  const handleMouseDown = (e: React.MouseEvent, widgetId: string, isResize = false) => {
    e.preventDefault();
    e.stopPropagation();

    bringToFront(widgetId);

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - widget.x;
    const offsetY = e.clientY - widget.y;

    setDragState({
      isDragging: !isResize,
      isResizing: isResize,
      widgetId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.width,
      startHeight: widget.height,
      initialX: widget.x,
      initialY: widget.y,
      offsetX,
      offsetY
    });
  };

  const handleMenuMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setShowAddMenu(true);
  };

  const handleMenuMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowAddMenu(false);
    }, 150);
  };

  // Calculate bottom padding based on widget positions
  const getBottomPadding = () => {
    if (widgets.length === 0) return 100;
    const maxBottom = Math.max(...widgets.map(w => w.y + w.height));
    return Math.max(100, maxBottom + 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Menu className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">PersonalTab</h1>
          </div>

          <div
            className="relative"
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
          >
            <Button variant="outline" size="sm" className="w-9 h-9 p-0">
              <Plus className="w-4 h-4" />
            </Button>

            {showAddMenu && (
              <div 
                className="absolute right-full top-0 mr-2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-50"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
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
        ref={containerRef}
        className="relative p-4" 
        style={{ paddingBottom: `${getBottomPadding()}px` }}
      >
        {/* Grid visualization during drag */}
        {dragState.isDragging && (
          <div 
            className="fixed inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              top: '0',
              left: '0'
            }}
          />
        )}

        {/* Preview position indicator */}
        {previewPosition && dragState.isDragging && (
          <div
            className="absolute border-2 border-dashed border-blue-400 bg-blue-100/30 rounded-lg pointer-events-none z-40"
            style={{
              left: previewPosition.x,
              top: previewPosition.y,
              width: widgets.find(w => w.id === dragState.widgetId)?.width || WIDGET_WIDTH,
              height: widgets.find(w => w.id === dragState.widgetId)?.height || WIDGET_HEIGHT,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                Drop here
              </div>
            </div>
          </div>
        )}

        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="absolute"
            style={{
              left: widget.x,
              top: widget.y,
              width: widget.width,
              height: widget.height,
              zIndex: widget.zIndex
            }}
          >
            <WidgetCard
              widget={widget}
              onRemove={removeWidget}
              onUpdate={updateWidget}
              onMouseDown={handleMouseDown}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              editTitleValue={editTitleValue}
              setEditTitleValue={setEditTitleValue}
              isDragging={dragState.isDragging && dragState.widgetId === widget.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Widget>) => void;
  onMouseDown: (e: React.MouseEvent, widgetId: string, isResize?: boolean) => void;
  editingTitle: string | null;
  setEditingTitle: (id: string | null) => void;
  editTitleValue: string;
  setEditTitleValue: (value: string) => void;
  isDragging: boolean;
}

function WidgetCard({
  widget,
  onRemove,
  onUpdate,
  onMouseDown,
  editingTitle,
  setEditingTitle,
  editTitleValue,
  setEditTitleValue,
  isDragging
}: WidgetCardProps) {
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

  return (
    <Card className={`h-full flex flex-col bg-white/95 backdrop-blur-sm shadow-lg border-2 transition-all relative ${
      isDragging ? 'border-blue-400 shadow-xl scale-105' : 'hover:border-blue-200'
    }`}>
      {/* Title Bar - Draggable */}
      <CardHeader
        className="flex-shrink-0 pb-2 cursor-move"
        onMouseDown={(e) => onMouseDown(e, widget.id, false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-gray-400" />

            {editingTitle === widget.id ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="text-sm h-6"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingTitle(null);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={saveEdit}>
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <CardTitle
                className="text-sm cursor-pointer hover:text-blue-600 flex-1"
                onClick={startEdit}
              >
                {widget.title}
              </CardTitle>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={() => onRemove(widget.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      {/* Content Area */}
      <CardContent className="flex-1 overflow-hidden pt-0">
        {widget.type === 'notes' && <NotesWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'todo' && <TodoWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'links' && <LinksWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'rss' && <RSSWidget widget={widget} onUpdate={onUpdate} />}
      </CardContent>

      {/* Resize Handle - Bottom Right Corner */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-gray-400 opacity-0 hover:opacity-60 transition-opacity"
        style={{
          background: 'linear-gradient(-45deg, transparent 30%, #9ca3af 30%, #9ca3af 70%, transparent 70%)',
          clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
        }}
        onMouseDown={(e) => onMouseDown(e, widget.id, true)}
      />
    </Card>
  );
}

function NotesWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [content, setContent] = useState(widget.content.text || '');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(widget.content.text || '');
    if (editorRef.current) {
      editorRef.current.innerHTML = formatTextToHTML(widget.content.text || '');
    }
  }, [widget.content.text]);

  const formatTextToHTML = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const extractTextFromHTML = (html: string) => {
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<br>/g, '\n')
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/&nbsp;/g, ' ');
  };

  const handleInput = () => {
    if (editorRef.current) {
      const textContent = extractTextFromHTML(editorRef.current.innerHTML);
      setContent(textContent);
      onUpdate(widget.id, { content: { text: textContent } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    if (isCtrl && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      document.execCommand('bold', false);
      handleInput();
    } else if (isCtrl && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      document.execCommand('italic', false);
      handleInput();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={editorRef}
        contentEditable
        className="flex-1 overflow-y-auto text-sm p-3 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight: '100px' }}
        suppressContentEditableWarning={true}
        placeholder="Start typing your notes..."
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
      {/* Add input at the top */}
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

      {/* Todo list */}
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
      {/* Add input at the top */}
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

      {/* Links list */}
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
      {/* RSS URL input */}
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

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {/* RSS items */}
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