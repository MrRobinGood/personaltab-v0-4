import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Plus, Menu, GripVertical, X, ExternalLink, Download, Upload, Edit2, Check, XIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import 'react-grid-layout/css/styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface NotesData {
  content: string;
}

interface LinksData {
  links: Link[];
}

interface TodosData {
  todos: Todo[];
}

interface RSSData {
  feeds: RSSFeed[];
}

type WidgetData = NotesData | LinksData | TodosData | RSSData | Record<string, never>;

interface Widget {
  id: string;
  type: 'notes' | 'links' | 'todos' | 'rss';
  title: string;
  data: WidgetData;
}

interface Note {
  id: string;
  content: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
}

interface RSSFeed {
  id: string;
  url: string;
  title: string;
  items: RSSItem[];
  lastFetched?: number;
}

interface RSSItemRaw {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const NotesWidget: React.FC<{ widget: Widget; onUpdate: (data: NotesData) => void }> = ({ widget, onUpdate }) => {
  const notesData = widget.data as NotesData;
  const [content, setContent] = useState(notesData?.content || '');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);
      const newContent = `${content.slice(0, start)}**${selectedText}**${content.slice(end)}`;
      setContent(newContent);
      onUpdate({ content: newContent });
    } else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.slice(start, end);
      const newContent = `${content.slice(0, start)}*${selectedText}*${content.slice(end)}`;
      setContent(newContent);
      onUpdate({ content: newContent });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate({ content: newContent });
  };

  return (
    <Textarea
      value={content}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Start typing your notes... (Ctrl+B for bold, Ctrl+I for italic)"
      className="min-h-[200px] resize-none border-0 focus-visible:ring-0"
    />
  );
};

const LinksWidget: React.FC<{ widget: Widget; onUpdate: (data: LinksData) => void }> = ({ widget, onUpdate }) => {
  const linksData = widget.data as LinksData;
  const [links, setLinks] = useState<Link[]>(linksData?.links || []);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const getFavicon = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
    }
  };

  const getTitleFromUrl = async (url: string): Promise<string> => {
    try {
      // For demo purposes, extract domain name as title
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Untitled Link';
    }
  };

  const addLink = async () => {
    if (!newUrl.trim()) return;

    const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
    const title = await getTitleFromUrl(url);
    const favicon = getFavicon(url);

    const newLink: Link = {
      id: generateId(),
      title,
      url,
      favicon
    };

    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    onUpdate({ links: updatedLinks });
    setNewUrl('');
    setIsAdding(false);
  };

  const removeLink = (id: string) => {
    const updatedLinks = links.filter(link => link.id !== id);
    setLinks(updatedLinks);
    onUpdate({ links: updatedLinks });
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group">
          {link.favicon && (
            <img src={link.favicon} alt="" className="w-4 h-4" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{link.title}</div>
            <div className="text-xs text-muted-foreground truncate">{link.url}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 h-6 w-6"
            onClick={() => window.open(link.url, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 h-6 w-6"
            onClick={() => removeLink(link.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Enter URL..."
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
            autoFocus
          />
          <Button size="icon" onClick={addLink}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      )}
    </div>
  );
};

const TodosWidget: React.FC<{ widget: Widget; onUpdate: (data: TodosData) => void }> = ({ widget, onUpdate }) => {
  const todosData = widget.data as TodosData;
  const [todos, setTodos] = useState<Todo[]>(todosData?.todos || []);
  const [newTodo, setNewTodo] = useState('');

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo: Todo = {
      id: generateId(),
      text: newTodo,
      completed: false
    };

    const updatedTodos = [...todos, todo];
    setTodos(updatedTodos);
    onUpdate({ todos: updatedTodos });
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    onUpdate({ todos: updatedTodos });
  };

  const removeTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    onUpdate({ todos: updatedTodos });
  };

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
            className="rounded"
          />
          <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
            {todo.text}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 h-6 w-6"
            onClick={() => removeTodo(todo.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <Button size="icon" onClick={addTodo}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const RSSWidget: React.FC<{ widget: Widget; onUpdate: (data: RSSData) => void }> = ({ widget, onUpdate }) => {
  const rssData = widget.data as RSSData;
  const [feeds, setFeeds] = useState<RSSFeed[]>(rssData?.feeds || []);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const addFeed = async () => {
    if (!newFeedUrl.trim()) return;

    setLoading(true);
    try {
      // For now, just add a demo feed since RSS parsing requires CORS handling
      const newFeed: RSSFeed = {
        id: generateId(),
        url: newFeedUrl,
        title: 'RSS Feed',
        items: [
          {
            title: 'Sample RSS Item',
            link: '#',
            contentSnippet: 'This is a demo RSS item. Real RSS parsing requires proper CORS setup.'
          }
        ],
        lastFetched: Date.now()
      };

      const updatedFeeds = [...feeds, newFeed];
      setFeeds(updatedFeeds);
      onUpdate({ feeds: updatedFeeds });
      setNewFeedUrl('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add RSS feed:', error);
      alert('Failed to add RSS feed. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const removeFeed = (id: string) => {
    const updatedFeeds = feeds.filter(feed => feed.id !== id);
    setFeeds(updatedFeeds);
    onUpdate({ feeds: updatedFeeds });
  };

  return (
    <div className="space-y-4">
      {feeds.map((feed) => (
        <div key={feed.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{feed.title}</h4>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFeed(feed.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {feed.items.slice(0, 5).map((item) => (
              <div key={`${item.link}-${item.title}`} className="p-2 bg-muted/50 rounded text-xs">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline line-clamp-2"
                >
                  {item.title}
                </a>
                {item.contentSnippet && (
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {item.contentSnippet.slice(0, 100)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            placeholder="Enter RSS feed URL..."
            onKeyDown={(e) => e.key === 'Enter' && addFeed()}
            autoFocus
          />
          <Button size="icon" onClick={addFeed} disabled={loading}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add RSS Feed
        </Button>
      )}
    </div>
  );
};

const EditableTitle: React.FC<{ title: string; onSave: (newTitle: string) => void; isMainTitle?: boolean }> = ({ title, onSave, isMainTitle = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSave = () => {
    onSave(editTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="h-6 text-sm font-semibold"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
          <XIcon className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {isMainTitle ? (
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => setIsEditing(true)}>
          {title}
        </h1>
      ) : (
        <CardTitle className="text-sm cursor-pointer" onClick={() => setIsEditing(true)}>
          {title}
        </CardTitle>
      )}
      <Edit2 className={`${isMainTitle ? 'h-4 w-4' : 'h-3 w-3'} opacity-0 group-hover:opacity-50 cursor-pointer`} onClick={() => setIsEditing(true)} />
    </div>
  );
};

const WidgetCard: React.FC<{
  widget: Widget;
  onUpdate: (id: string, data: WidgetData) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}> = ({ widget, onUpdate, onUpdateTitle, onDelete }) => {
  const renderWidget = () => {
    switch (widget.type) {
      case 'notes':
        return <NotesWidget widget={widget} onUpdate={(data) => onUpdate(widget.id, data)} />;
      case 'links':
        return <LinksWidget widget={widget} onUpdate={(data) => onUpdate(widget.id, data)} />;
      case 'todos':
        return <TodosWidget widget={widget} onUpdate={(data) => onUpdate(widget.id, data)} />;
      case 'rss':
        return <RSSWidget widget={widget} onUpdate={(data) => onUpdate(widget.id, data)} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <EditableTitle
            title={widget.title}
            onSave={(newTitle) => onUpdateTitle(widget.id, newTitle)}
          />
          <div className="flex items-center gap-1">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing drag-handle" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDelete(widget.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderWidget()}
      </CardContent>
    </Card>
  );
};

export default function App() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
  const [mainTitle, setMainTitle] = useState('PersonalTab');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('personaltab-widgets');
    const savedLayouts = localStorage.getItem('personaltab-layouts');

    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // Create initial default widgets
      const defaultWidgets: Widget[] = [
        {
          id: generateId(),
          type: 'notes',
          title: 'Notes',
          data: {}
        },
        {
          id: generateId(),
          type: 'todos',
          title: 'Todo List',
          data: {}
        },
        {
          id: generateId(),
          type: 'links',
          title: 'Quick Links',
          data: {}
        }
      ];
      setWidgets(defaultWidgets);

      // Set default layout for the 3 widgets side by side
      const defaultLayout = {
        lg: [
          { i: defaultWidgets[0].id, x: 0, y: 0, w: 4, h: 6 },
          { i: defaultWidgets[1].id, x: 4, y: 0, w: 4, h: 6 },
          { i: defaultWidgets[2].id, x: 8, y: 0, w: 4, h: 6 }
        ]
      };
      setLayouts(defaultLayout);
    }

    if (savedLayouts) {
      setLayouts(JSON.parse(savedLayouts));
    }
  }, []);

  // Save data to localStorage when widgets or layouts change
  useEffect(() => {
    localStorage.setItem('personaltab-widgets', JSON.stringify(widgets));
  }, [widgets]);

  useEffect(() => {
    localStorage.setItem('personaltab-layouts', JSON.stringify(layouts));
  }, [layouts]);

  const addWidget = (type: Widget['type']) => {
    const titles = {
      notes: 'Notes',
      links: 'Quick Links',
      todos: 'Todo List',
      rss: 'RSS Feeds'
    };

    const newWidget: Widget = {
      id: generateId(),
      type,
      title: titles[type],
      data: {}
    };

    setWidgets([...widgets, newWidget]);
  };

  const updateWidget = (id: string, data: WidgetData) => {
    setWidgets(widgets.map(widget =>
      widget.id === id ? { ...widget, data } : widget
    ));
  };

  const updateWidgetTitle = (id: string, title: string) => {
    setWidgets(widgets.map(widget =>
      widget.id === id ? { ...widget, title } : widget
    ));
  };

  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
  };

  const onLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  };

  const saveBackup = () => {
    const backup = {
      widgets,
      layouts,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `personaltab-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const loadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        setWidgets(backup.widgets || []);
        setLayouts(backup.layouts || {});
      } catch (error) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <EditableTitle
            title={mainTitle}
            onSave={(newTitle) => setMainTitle(newTitle)}
            isMainTitle={true}
          />

          <div className="flex items-center gap-2">
            <div
              className="relative"
              onMouseEnter={() => setShowAddMenu(true)}
              onMouseLeave={() => setShowAddMenu(false)}
            >
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>

              {showAddMenu && (
                <div className="absolute right-full top-0 mr-2 bg-background border rounded-lg shadow-lg px-2 py-1 flex items-center gap-1 z-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => addWidget('notes')}
                  >
                    📝 Notes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => addWidget('todos')}
                  >
                    ✅ Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => addWidget('links')}
                  >
                    🔗 Links
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => addWidget('rss')}
                  >
                    📰 RSS
                  </Button>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={saveBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Save Backup
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById('backup-input')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Load Backup
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm('This will reset to the default 3 widgets. Are you sure?')) {
                      localStorage.removeItem('personaltab-widgets');
                      localStorage.removeItem('personaltab-layouts');
                      // Create default widgets
                      const defaultWidgets: Widget[] = [
                        {
                          id: generateId(),
                          type: 'notes',
                          title: 'Notes',
                          data: {}
                        },
                        {
                          id: generateId(),
                          type: 'todos',
                          title: 'Todo List',
                          data: {}
                        },
                        {
                          id: generateId(),
                          type: 'links',
                          title: 'Quick Links',
                          data: {}
                        }
                      ];
                      setWidgets(defaultWidgets);

                      // Set default layout for the 3 widgets side by side
                      const defaultLayout = {
                        lg: [
                          { i: defaultWidgets[0].id, x: 0, y: 0, w: 4, h: 6 },
                          { i: defaultWidgets[1].id, x: 4, y: 0, w: 4, h: 6 },
                          { i: defaultWidgets[2].id, x: 8, y: 0, w: 4, h: 6 }
                        ]
                      };
                      setLayouts(defaultLayout);
                    }
                  }}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset to Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <input
        id="backup-input"
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={loadBackup}
      />

      <main className="container mx-auto px-4 py-6">
        <ResponsiveReactGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={42}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          draggableHandle=".drag-handle"
          resizeHandles={['se']}
        >
          {widgets.map((widget, index) => {
            // Use layout data if available, otherwise default positioning
            const layout = layouts.lg?.find(l => l.i === widget.id) ||
                          { w: 4, h: 6, x: (index % 3) * 4, y: 0, minW: 2, minH: 3 };

            return (
              <div key={widget.id} data-grid={layout}>
                <WidgetCard
                  widget={widget}
                  onUpdate={updateWidget}
                  onUpdateTitle={updateWidgetTitle}
                  onDelete={deleteWidget}
                />
              </div>
            );
          })}
        </ResponsiveReactGridLayout>
      </main>
    </div>
  );
}
