import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Plus, Menu, GripVertical, X, ExternalLink, Download, Upload, Check, MoreHorizontal } from "lucide-react";

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
}

const STORAGE_KEY = 'personaltab-data';

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
  }>({
    isDragging: false,
    isResizing: false,
    widgetId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    initialX: 0,
    initialY: 0
  });
  const [maxZIndex, setMaxZIndex] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeDefaultWidgets = () => {
    const defaultWidgets: Widget[] = [
      {
        id: '1',
        type: 'notes',
        title: 'Notes',
        content: { text: 'Welcome to PersonalTab!\n\nDrag widgets by their title bar to move them.\nDrag the bottom-right corner to resize.\nClick titles to edit them.' },
        x: 60,
        y: 30,
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
        y: 30,
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
        y: 30,
        width: 310,
        height: 400,
        zIndex: 1
      }
    ];
    setWidgets(defaultWidgets);
    setNextId(4);
    setMaxZIndex(1);
  };

  const forceReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    initializeDefaultWidgets();
  };

  useEffect(() => {
    // Force reset on first load to clear any cached bad data
    const shouldForceReset = true; // Set to true to force fresh start

    if (shouldForceReset) {
      forceReset();
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.widgets && data.widgets.length === 3) {
          const convertedWidgets = data.widgets.map((w: any) => ({
            ...w,
            x: w.x || 50,
            y: w.y || 80,
            width: w.width || 280,
            height: w.height || 300,
            zIndex: w.zIndex || 1
          }));
          setWidgets(convertedWidgets);
          setNextId(data.nextId || 4);
          setMaxZIndex(data.maxZIndex || 1);
        } else {
          forceReset();
        }
      } catch (error) {
        forceReset();
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
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        updateWidget(dragState.widgetId!, {
          x: Math.max(0, dragState.initialX + deltaX),
          y: Math.max(0, dragState.initialY + deltaY)
        });
      } else if (dragState.isResizing) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        updateWidget(dragState.widgetId!, {
          width: Math.max(200, dragState.startWidth + deltaX),
          height: Math.max(150, dragState.startHeight + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        isResizing: false,
        widgetId: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        initialX: 0,
        initialY: 0
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
  }, [dragState, widgets]);

  const addWidget = (type: Widget['type']) => {
    const newZIndex = maxZIndex + 1;
    const titleMap = {
      'notes': 'Notes',
      'todo': 'List',
      'links': 'Links',
      'rss': 'RSS'
    };

    const newWidget: Widget = {
      id: String(nextId),
      type,
      title: titleMap[type],
      content: type === 'notes' ? { text: '' } : type === 'links' ? { links: [] } : { todos: [] },
      x: 20 + (widgets.length * 30),
      y: 20 + (widgets.length * 30),
      width: 310,
      height: 400,
      zIndex: newZIndex
    };
    setWidgets([...widgets, newWidget]);
    setNextId(nextId + 1);
    setMaxZIndex(newZIndex);
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

    setDragState({
      isDragging: !isResize,
      isResizing: isResize,
      widgetId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widget.width,
      startHeight: widget.height,
      initialX: widget.x,
      initialY: widget.y
    });
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
            onMouseEnter={() => setShowAddMenu(true)}
            onMouseLeave={() => setShowAddMenu(false)}
          >
            <Button variant="outline" size="sm" className="w-9 h-9 p-0">
              <Plus className="w-4 h-4" />
            </Button>

            {showAddMenu && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs whitespace-nowrap"
                  onClick={() => {
                    addWidget('notes');
                    setShowAddMenu(false);
                  }}
                >
                  📝 Notes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs whitespace-nowrap"
                  onClick={() => {
                    addWidget('todo');
                    setShowAddMenu(false);
                  }}
                >
                  ✅ List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs whitespace-nowrap"
                  onClick={() => {
                    addWidget('links');
                    setShowAddMenu(false);
                  }}
                >
                  🔗 Links
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 relative">
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
}

function WidgetCard({
  widget,
  onRemove,
  onUpdate,
  onMouseDown,
  editingTitle,
  setEditingTitle,
  editTitleValue,
  setEditTitleValue
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
    <Card className="h-full flex flex-col bg-white/95 backdrop-blur-sm shadow-lg border-2 hover:border-blue-200 transition-colors relative">
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
  const [text, setText] = useState(widget.content.text || '');

  useEffect(() => setText(widget.content.text || ''), [widget.content.text]);

  const handleChange = (newText: string) => {
    setText(newText);
    onUpdate(widget.id, { content: { text: newText } });
  };

  return (
    <Textarea
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Start typing your notes..."
      className="h-full resize-none border-0 bg-transparent focus:ring-0 text-sm"
    />
  );
}

function TodoWidget({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, updates: Partial<Widget>) => void }) {
  const [todos, setTodos] = useState<TodoItem[]>(widget.content.todos || []);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => setTodos(widget.content.todos || []), [widget.content.todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { id: String(Date.now()), text: newTodo.trim(), completed: false }];
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

  return (
    <div className="h-full flex flex-col">
      {/* Add input at the top */}
      <div className="flex items-center gap-2 mb-3">
        <Plus className="w-4 h-4 text-gray-400" />
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add item..."
          className="text-sm h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTodo();
          }}
        />
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 group">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="w-4 h-4"
            />
            <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
              {todo.text}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
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
        <Plus className="w-4 h-4 text-gray-400" />
        <Input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Add URL..."
          className="text-sm h-8 border-0 bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addLink();
          }}
        />
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
