import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Menu, X, ExternalLink, Check, Calendar, GripHorizontal } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
  id: string;
  type: 'notes' | 'links' | 'todo' | 'rss';
  title: string;
  content: any;
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

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

const STORAGE_KEY = 'personaltab-data-v15';

export default function App() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: LayoutItem[] }>({});
  const [nextId, setNextId] = useState(1);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Track original positions to restore them if needed
  const [originalLayouts, setOriginalLayouts] = useState<{ [key: string]: LayoutItem[] }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const createDefaultWidgets = (): { widgets: Widget[], layouts: { [key: string]: LayoutItem[] } } => {
    const defaultWidgets = [
      {
        id: '1',
        type: 'notes' as const,
        title: 'Notes',
        content: { text: 'Welcome to PersonalTab!\n\nDrag widgets to move them.\nResize by dragging corners.\nClick titles to edit them.' }
      },
      {
        id: '2',
        type: 'todo' as const,
        title: 'List',
        content: { todos: [] }
      },
      {
        id: '3',
        type: 'links' as const,
        title: 'Links',
        content: { links: [] }
      }
    ];

    // Fixed-size layouts that prevent auto-resizing
    const createLayoutItem = (id: string, x: number, y: number, w: number, h: number): LayoutItem => ({
      i: id,
      x,
      y,
      w,
      h,
      minW: w,  // Minimum width = current width
      maxW: w,  // Maximum width = current width  
      minH: h,  // Minimum height = current height
      maxH: h,  // Maximum height = current height
      static: false // Allow dragging but prevent resizing
    });

    const defaultLayouts = {
      lg: [
        createLayoutItem('1', 0, 0, 4, 12),
        createLayoutItem('2', 4, 0, 4, 12),
        createLayoutItem('3', 8, 0, 4, 12)
      ],
      md: [
        createLayoutItem('1', 0, 0, 6, 12),
        createLayoutItem('2', 6, 0, 6, 12),
        createLayoutItem('3', 0, 12, 6, 12)
      ],
      sm: [
        createLayoutItem('1', 0, 0, 12, 12),
        createLayoutItem('2', 0, 12, 12, 12),
        createLayoutItem('3', 0, 24, 12, 12)
      ],
      xs: [
        createLayoutItem('1', 0, 0, 12, 12),
        createLayoutItem('2', 0, 12, 12, 12),
        createLayoutItem('3', 0, 24, 12, 12)
      ],
      xxs: [
        createLayoutItem('1', 0, 0, 12, 12),
        createLayoutItem('2', 0, 12, 12, 12),
        createLayoutItem('3', 0, 24, 12, 12)
      ]
    };

    return { widgets: defaultWidgets, layouts: defaultLayouts };
  };

  // Initialize widgets and layouts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const data = JSON.parse(saved);
        if (data.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
          setWidgets(data.widgets);
          setLayouts(data.layouts || {});
          setNextId(data.nextId || data.widgets.length + 1);
          return;
        }
      }
      
      // No valid saved data, create defaults
      const { widgets: defaultWidgets, layouts: defaultLayouts } = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
      setNextId(4);
      
    } catch (error) {
      console.error('Error loading saved data:', error);
      const { widgets: defaultWidgets, layouts: defaultLayouts } = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setLayouts(defaultLayouts);
      setNextId(4);
    }
  }, []);

  // Save data whenever widgets or layouts change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layouts, nextId }));
    }
  }, [widgets, layouts, nextId]);

  const addWidget = (type: Widget['type']) => {
    const titleMap = {
      'notes': 'Notes',
      'todo': 'List',
      'links': 'Links',
      'rss': 'RSS Feed'
    };

    const newWidget: Widget = {
      id: String(nextId),
      type,
      title: titleMap[type],
      content: type === 'notes' ? { text: '' } : 
             type === 'links' ? { links: [] } : 
             type === 'rss' ? { url: '', items: [] } :
             { todos: [] }
    };

    // Create fixed-size layout item that won't auto-resize
    const createFixedLayoutItem = (id: string, x: number, y: number, w: number, h: number): LayoutItem => ({
      i: id,
      x,
      y,
      w,
      h,
      minW: w,
      maxW: w,
      minH: h,
      maxH: h,
      static: false
    });

    // Calculate next position for each breakpoint
    const newLayouts = { ...layouts };
    
    // For lg: 3 widgets per row (4 columns each)
    const lgLayouts = newLayouts.lg || [];
    const lgCount = lgLayouts.length;
    const lgRow = Math.floor(lgCount / 3);
    const lgCol = lgCount % 3;
    const lgY = lgRow * 12;
    const lgX = lgCol * 4;
    
    newLayouts.lg = [...lgLayouts, createFixedLayoutItem(String(nextId), lgX, lgY, 4, 12)];
    
    // For md: 2 widgets per row (6 columns each)
    const mdLayouts = newLayouts.md || [];
    const mdCount = mdLayouts.length;
    const mdRow = Math.floor(mdCount / 2);
    const mdCol = mdCount % 2;
    const mdY = mdRow * 12;
    const mdX = mdCol * 6;
    
    newLayouts.md = [...mdLayouts, createFixedLayoutItem(String(nextId), mdX, mdY, 6, 12)];
    
    // For sm, xs, xxs: 1 widget per row (full width)
    ['sm', 'xs', 'xxs'].forEach(breakpoint => {
      const existingLayouts = newLayouts[breakpoint] || [];
      const count = existingLayouts.length;
      
      newLayouts[breakpoint] = [...existingLayouts, createFixedLayoutItem(String(nextId), 0, count * 12, 12, 12)];
    });

    setWidgets(prev => [...prev, newWidget]);
    setLayouts(newLayouts);
    setNextId(nextId + 1);
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setLayouts(prev => {
      const newLayouts = { ...prev };
      Object.keys(newLayouts).forEach(breakpoint => {
        newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== id);
      });
      return newLayouts;
    });
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  // Handle drag start - save original positions
  const onDragStart = (layout: LayoutItem[], oldItem: LayoutItem, newItem: LayoutItem, placeholder: LayoutItem, e: MouseEvent, element: HTMLElement) => {
    setIsDragging(true);
    setDraggedItemId(oldItem.i);
    setOriginalLayouts({ ...layouts });
  };

  // Handle drag stop - decide whether to keep new position or revert
  const onDragStop = (layout: LayoutItem[], oldItem: LayoutItem, newItem: LayoutItem, placeholder: LayoutItem, e: MouseEvent, element: HTMLElement) => {
    setIsDragging(false);
    setDraggedItemId(null);
    
    // Check if the item was actually moved to a significantly different position
    const originalItem = originalLayouts[getCurrentBreakpoint()]?.find(item => item.i === oldItem.i);
    
    if (originalItem) {
      const xDiff = Math.abs(newItem.x - originalItem.x);
      const yDiff = Math.abs(newItem.y - originalItem.y);
      
      // If the movement is minimal (just from hover effects), revert to original position
      if (xDiff < 2 && yDiff < 2) {
        setLayouts(originalLayouts);
        return;
      }
    }
    
    // Preserve the original size constraints when updating position
    const updatedLayout = layout.map(item => {
      if (item.i === newItem.i) {
        const originalConstraints = originalLayouts[getCurrentBreakpoint()]?.find(orig => orig.i === item.i);
        return {
          ...item,
          minW: originalConstraints?.minW || item.w,
          maxW: originalConstraints?.maxW || item.w,
          minH: originalConstraints?.minH || item.h,
          maxH: originalConstraints?.maxH || item.h
        };
      }
      return item;
    });
    
    // Keep the new layout with preserved size constraints
    setLayouts(prev => ({
      ...prev,
      [getCurrentBreakpoint()]: updatedLayout
    }));
  };

  // Get current breakpoint (simplified)
  const getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 'lg';
    if (width >= 996) return 'md';
    if (width >= 768) return 'sm';
    if (width >= 480) return 'xs';
    return 'xxs';
  };

  // Handle layout changes during drag - be more conservative
  const onLayoutChange = (layout: LayoutItem[], allLayouts: { [key: string]: LayoutItem[] }) => {
    // Only update layouts if we're not dragging, or if this is the final drop
    if (!isDragging) {
      // Preserve size constraints for all items
      const preservedLayouts = { ...allLayouts };
      
      Object.keys(preservedLayouts).forEach(breakpoint => {
        preservedLayouts[breakpoint] = preservedLayouts[breakpoint].map(item => {
          const existingItem = layouts[breakpoint]?.find(existing => existing.i === item.i);
          if (existingItem) {
            return {
              ...item,
              minW: existingItem.minW || item.w,
              maxW: existingItem.maxW || item.w,
              minH: existingItem.minH || item.h,
              maxH: existingItem.maxH || item.h
            };
          }
          return item;
        });
      });
      
      setLayouts(preservedLayouts);
    }
  };

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

      <div className="p-4">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          onDragStart={onDragStart}
          onDragStop={onDragStop}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
          rowHeight={30}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={true}
          isResizable={false}  // Disable resizing completely
          compactType={null}   // Disable compacting
          preventCollision={true}
          allowOverlap={false}
          draggableHandle=".drag-handle"
          autoSize={false}     // Disable auto-sizing
          verticalCompact={false}  // Disable vertical compacting
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetCard
                widget={widget}
                onRemove={removeWidget}
                onUpdate={updateWidget}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                editTitleValue={editTitleValue}
                setEditTitleValue={setEditTitleValue}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Widget>) => void;
  editingTitle: string | null;
  setEditingTitle: (id: string | null) => void;
  editTitleValue: string;
  setEditTitleValue: (value: string) => void;
}

function WidgetCard({
  widget,
  onRemove,
  onUpdate,
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
    <Card className="h-full flex flex-col bg-white/95 backdrop-blur-sm shadow-lg border-2 hover:border-blue-200 transition-all">
      {/* Draggable area above title */}
      <div className="drag-handle cursor-move bg-gray-50/50 hover:bg-gray-100/70 transition-colors border-b border-gray-100 p-2 flex items-center justify-center group">
        <GripHorizontal className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>

      <CardHeader className="flex-shrink-0 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
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

      <CardContent className="flex-1 overflow-hidden pt-0">
        {widget.type === 'notes' && <NotesWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'todo' && <TodoWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'links' && <LinksWidget widget={widget} onUpdate={onUpdate} />}
        {widget.type === 'rss' && <RSSWidget widget={widget} onUpdate={onUpdate} />}
      </CardContent>
    </Card>
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