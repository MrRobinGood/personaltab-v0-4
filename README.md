# PersonalTab v0.4

A modern, customizable dashboard for organizing your digital workspace. Built with React, TypeScript, and shadcn/ui.

## Features

✅ **Drag & Drop Layout** - Widgets can be moved and resized
✅ **Notes Widget** - With markdown support (Ctrl+B for bold, Ctrl+I for italic)
✅ **Links Widget** - Add URLs with automatic favicon and title detection
✅ **Todo Lists** - Add, complete, and remove tasks
✅ **RSS Feed Reader** - Add RSS feeds and view latest items
✅ **Save/Load Backup** - Export and import your data as JSON
✅ **Editable Titles** - Click any title to edit
✅ **Local Storage** - Data persists between sessions
✅ **Responsive Design** - Works on desktop and mobile

## Quick Start

```bash
# Install dependencies
bun install  # preferred
# or npm install

# Start development server
bun dev  # preferred
# or npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Tips

1. **Adding Widgets**: Click the "+" button in the top right
2. **Moving Widgets**: Drag by the grip handle (≡ icon)
3. **Resizing**: Drag the resize handle in bottom-right corner
4. **Editing Titles**: Click any title text to edit
5. **Backup Data**: Use the "⋯" menu → "Save Backup"
6. **RSS Feeds**: Try feeds like https://feeds.bbci.co.uk/news/rss.xml

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **react-grid-layout** - Drag & drop grid
- **rss-parser** - RSS feed parsing
- **Bun** - Package manager & runtime

## File Structure

```
personaltab-v0-4/
├── public/
│   └── _redirects
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .gitignore
├── biome.json
├── components.json
├── index.html
├── netlify.toml
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Run linting
bun run lint

# Build for production
bun run build

# Preview production build
bun run preview
```

## Deployment

This project is configured for deployment on Netlify. The `netlify.toml` file contains the build configuration.

```bash
# Build for production
bun run build

# Deploy the `dist` folder to your hosting provider
```

## License

MIT

---

Enjoy your PersonalTab dashboard! 🎉
