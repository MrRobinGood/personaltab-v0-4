# PersonalTab v0.4

A beautiful, minimalist personal dashboard with drag & drop widgets for notes, lists, and links. Built with React, TypeScript, and Tailwind CSS.

![PersonalTab Dashboard](https://via.placeholder.com/800x400/f8fafc/1e293b?text=PersonalTab+Dashboard)

## ✨ Features

- **🎯 Drag & Drop Interface** - Move and resize widgets anywhere on the canvas
- **📝 Notes Widget** - Rich text editing with persistent storage
- **✅ List Widget** - Todo list with add, complete, and remove functionality
- **🔗 Links Widget** - URL management with automatic favicon detection
- **🎨 Minimalist Design** - Clean, modern interface with subtle interactions
- **💾 Local Storage** - All data persists automatically between sessions
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **⚡ Hover Actions** - Quick widget creation with hover-activated menu
- **✏️ Editable Titles** - Click any widget title to rename it

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+) or Bun runtime
- Git (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/personaltab-v0-4.git
cd personaltab-v0-4

# Install dependencies
bun install
# or npm install

# Start development server
bun dev
# or npm run dev
```

### Access the app
Open [http://localhost:5173](http://localhost:5173) in your browser

## 🎮 Usage

### Adding Widgets
1. Hover over the **+** button in the top-right corner
2. Select from the horizontal menu: 📝 Notes, ✅ List, or 🔗 Links
3. Your new widget appears and can be immediately customized

### Moving & Resizing Widgets
- **Move**: Drag widgets by their title bar (grip icon ≡)
- **Resize**: Drag the bottom-right corner of any widget
- **Edit Title**: Click on any widget title to rename it

### Widget Features

#### 📝 Notes Widget
- Rich text editing area
- Supports multi-line content
- Auto-saves as you type

#### ✅ List Widget
- Add items using the minimalist input field at the top
- Check/uncheck items to mark as complete
- Remove items with the X button (appears on hover)

#### 🔗 Links Widget
- Add URLs using the input field at the top
- Automatic favicon detection
- Click links to open in new tab
- Clean, organized link management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Storage**: Browser localStorage
- **Linting**: Biome
- **Package Manager**: Bun (preferred) or npm

## 📁 Project Structure

```
personaltab-v0-4/
├── public/
│   └── _redirects
├── src/
│   ├── components/ui/     # shadcn/ui components
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx           # Main application component
│   ├── index.css         # Global styles
│   └── main.tsx          # Application entry point
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎨 Design Philosophy

PersonalTab follows a minimalist design philosophy:
- **Clean Interface** - No visual clutter or unnecessary elements
- **Subtle Interactions** - Hover states and smooth transitions
- **Intuitive Controls** - Everything works as you'd expect
- **Focus on Content** - The interface gets out of your way

## 🔧 Development

```bash
# Run development server
bun dev

# Build for production
bun run build

# Run linting
bun run lint

# Format code
bun run format
```

## 📦 Deployment

The project is configured for easy deployment to Netlify:

```bash
# Build the project
bun run build

# The dist/ folder contains the production build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**PersonalTab v0.4** - Your minimalist personal dashboard for productivity and organization.
