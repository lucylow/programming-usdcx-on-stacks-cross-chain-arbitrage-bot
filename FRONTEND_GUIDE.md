# Frontend Guide - Cross-Chain Arbitrage Bot

## Overview

The frontend has been enhanced with advanced UI/UX patterns inspired by modern web applications, featuring:

- Advanced navigation with dropdown menus
- Command palette (⌘K) for quick access
- Smooth animations and transitions
- Responsive mobile design
- Professional component architecture

## New Components

### 1. Navigation Component

Location: `components/layout/Navigation.tsx`

**Features:**
- Fixed header with scroll detection
- Dropdown menus with nested navigation
- Mobile hamburger menu with slide-in panel
- Badge support for highlighting items
- Smooth animations using Framer Motion
- Active route highlighting

**Usage:**
\`\`\`tsx
import Navigation from "@/components/layout/Navigation"

// In your layout or page
<Navigation />
\`\`\`

**Navigation Structure:**
\`\`\`typescript
const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Bot",
    href: "/bot",
    icon: Bot,
    badge: "Live",
    children: [
      {
        label: "Dashboard",
        href: "/bot/dashboard",
        icon: BarChart3,
        description: "Monitor bot performance",
      },
      // More children...
    ],
  },
]
\`\`\`

### 2. Command Palette

Location: `components/CommandPalette.tsx`

**Features:**
- Keyboard shortcut (⌘K or Ctrl+K)
- Fuzzy search across commands
- Keyboard navigation (↑/↓ arrows, Enter)
- Quick access to all pages
- Search by keywords

**Usage:**
\`\`\`tsx
import CommandPalette from "@/components/CommandPalette"

// Add to your root layout
<CommandPalette />
\`\`\`

**Keyboard Shortcuts:**
- `⌘K` (Mac) or `Ctrl+K` (Windows/Linux): Toggle palette
- `↑` / `↓`: Navigate commands
- `Enter`: Execute selected command
- `Esc`: Close palette

### 3. Advanced Components

All located in `components/advanced/`:

- **WalletConnect.tsx** - Multi-wallet connection support
- **LivePriceMonitor.tsx** - Real-time price updates with charts
- **AnimatedStats.tsx** - Animated statistics with count-up
- **OpportunityAlert.tsx** - Real-time notifications

## Styling

The application uses Tailwind CSS v4 with custom design tokens:

### Color Palette
\`\`\`css
--darker: #0a0a0f;
--dark: #12121a;
--card-bg: #1a1a24;
--brand: #7c3aed;
--brand-dark: #6d28d9;
--accent: #10b981;
--error: #ef4444;
--ethereum: #627eea;
--stacks: #5546ff;
--muted-foreground: #a1a1aa;
\`\`\`

### Typography
- Primary font: Geist Sans
- Monospace font: Geist Mono

## Animation Patterns

### Hover Effects
\`\`\`tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  className="..."
>
  Content
</motion.div>
\`\`\`

### Page Transitions
\`\`\`tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
\`\`\`

### Dropdown Animations
\`\`\`tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      Dropdown content
    </motion.div>
  )}
</AnimatePresence>
\`\`\`

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Pattern
\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
\`\`\`

## Accessibility

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for menu navigation

### ARIA Labels
\`\`\`tsx
<button aria-label="Open menu" aria-expanded={isOpen}>
  <Menu />
</button>
\`\`\`

### Focus States
All interactive elements have visible focus states:
\`\`\`css
focus:outline-none focus:ring-2 focus:ring-brand
\`\`\`

## Performance Optimization

### Code Splitting
Components use dynamic imports where appropriate:
\`\`\`tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
})
\`\`\`

### Image Optimization
All images use Next.js Image component:
\`\`\`tsx
<Image
  src="/hero.png"
  alt="Hero image"
  width={1200}
  height={600}
  priority
/>
\`\`\`

### Memoization
Expensive calculations use React.memo and useMemo:
\`\`\`tsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
\`\`\`

## Best Practices

### Component Structure
\`\`\`
components/
├── layout/           # Layout components (Navigation, Footer)
├── advanced/         # Advanced features (WalletConnect, etc)
├── ui/              # UI primitives (Button, Card, etc)
└── CommandPalette.tsx
\`\`\`

### State Management
- Local state: `useState` for component-specific state
- Global state: Context API for shared state
- Server state: React Query or SWR for data fetching

### Error Handling
\`\`\`tsx
try {
  await executeAction()
  toast.success("Action completed!")
} catch (error) {
  toast.error(error.message)
  console.error("[v0] Action failed:", error)
}
\`\`\`

## Development Workflow

### Running the Application
\`\`\`bash
# Frontend only
npm run dev

# Backend only
npm run backend

# Both simultaneously
npm run dev:all
\`\`\`

### Adding New Navigation Items
1. Edit `components/layout/Navigation.tsx`
2. Add to `navigationItems` array
3. Include icon, href, and optional children

### Adding New Commands
1. Edit `components/CommandPalette.tsx`
2. Add to `commands` array
3. Include label, description, icon, action, and keywords

## Integration with Backend

The frontend connects to the backend API at `http://localhost:3001`:

\`\`\`typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function getOpportunities() {
  const response = await fetch(`${API_URL}/api/opportunities`)
  return response.json()
}
\`\`\`

## Deployment

### Environment Variables
\`\`\`env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
\`\`\`

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Vercel Deployment
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Troubleshooting

### Navigation not appearing
- Ensure Navigation component is imported in layout.tsx
- Check that the component is rendered above other content

### Command Palette not working
- Verify Framer Motion is installed
- Check browser console for errors
- Ensure CommandPalette is added to root layout

### Animations not smooth
- Check if `framer-motion` is properly installed
- Verify no CSS conflicts with `transform` or `transition`
- Test with reduced motion preference disabled

## Future Enhancements

Planned improvements:
- [ ] Dark/light theme toggle
- [ ] Breadcrumb navigation
- [ ] Notification center
- [ ] User preferences persistence
- [ ] Advanced search filters
- [ ] Real-time collaboration features

## Support

For issues or questions:
- Check documentation at `/docs`
- Review FAQ at `/faq`
- Submit issues on GitHub
- Contact team via support channel
