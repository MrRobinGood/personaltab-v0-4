import type React from "react";
import { useState, useEffect } from "react";
import { Plus, Menu, X, ExternalLink, Check } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Widget {
  id: string;
  type: 'notes' | 'links' | 'todo';
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
}

const STORAGE_KEY = 'personaltab-data-v8';

export default function App() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const createDefaultWidgets = (): Widget[] => {
    return [
      {
        id: '1',
        type: 'notes',
        title: 'Notes',
        content: { text: 'Welcome to PersonalTab!\n\nThis is a responsive layout that works properly.\nYou can add notes, todos, and links.\nClick titles to edit them.' }
      },
      {
        id: '2',
        type: 'todo',
        title: 'Todo List',
        content: { todos: [] }
      },
      {
        id: '3',
        type: 'links',
        title: 'Links',
        content: { links: [] }
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
          return;
        }
      }
      
      // No valid saved data, create defaults
      const defaultWidgets = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setNextId(4);
      
    } catch (error) {
      console.error('Error loading saved data:', error);
      const defaultWidgets = createDefaultWidgets();
      setWidgets(defaultWidgets);
      setNextId(4);
    }
  }, []);

  // Save data whenever widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, nextId }));
    }
  }, [widgets, nextId]);

  const addWidget = (type: Widget['type']) => {
    const titleMap = {
      'notes': 'Notes',
      'todo': 'Todo List',
      'links': 'Links'
    };

    const newWidget: Widget = {
      id: String(nextId),
      type,
      title: titleMap[type],
      content: type === 'notes' ? { text: '' } : 
             type === 'links' ? { links: [] } : 
             { todos: [] }
    };

    setWidgets([...widgets, newWidget]);
    setNextId(nextId + 1);
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
              onMouseLeave={() => setTimeout(() => setShowAddMenu(false), 150)}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {showAddMenu && (
              <div 
                className="absolute right-full top-0 mr-2 bg-white border rounded-lg shadow-lg p-1 flex gap-1 z-50"
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
                  Todo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs whitespace-nowrap"
                  onClick={() => addWidget('links')}
                >
                  Links
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onRemove={removeWidget}
              onUpdate={updateWidget}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              editTitleValue={editTitleValue}
              setEditTitleValue={setEditTitleValue}
            />
          ))}
        </div>
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
    <Card className="h-96 flex flex-col bg-white/95 backdrop-blur-sm shadow-lg border-2 hover:border-blue-200 transition-all">
      <CardHeader className="flex-shrink-0 pb-2">
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
      completed: false
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
            <span className={`text-sm flex-1 ${todo.completed ? 'line-through opacity-60' : ''}`}>
              {todo.text}
            </span>
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