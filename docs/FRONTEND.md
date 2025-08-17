# Frontend Documentation

## Overview
Modern Next.js 14 dashboard built with TypeScript, shadcn/ui components, and Tailwind CSS. Provides comprehensive analytics visualization for e-commerce funnel analysis with real-time updates and interactive charts.

## Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for full type safety
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for data visualization
- **Data Fetching**: React Query (TanStack Query) for server state
- **Real-time**: WebSocket integration for live updates

## Project Structure

### Core Directories
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components
- `hooks/` - Custom React hooks for data and state management
- `lib/` - Utility functions, API client, and type definitions

### Component Architecture
```
components/
├── ui/           # shadcn/ui component library
├── layout/       # Header, sidebar, navigation components
├── dashboard/    # Analytics-specific dashboard components
└── charts/       # Data visualization chart components
```

## Key Pages

### Dashboard Overview (`/dashboard`)
Main analytics dashboard with KPI cards, trend charts, and real-time metrics. Provides high-level view of funnel performance and key business metrics.

### Funnel Analysis (`/dashboard/funnel`)
Detailed funnel visualization showing user progression through each step. Includes conversion rates, drop-off analysis, and device-based segmentation.

### Sentiment Analysis (`/dashboard/sentiment`)
Comprehensive sentiment analysis across all funnel pages. Features sentiment distribution charts, trend analysis, and page-specific insights.

### User Analytics (`/dashboard/users`)
User behavior analysis with journey patterns, similar user recommendations, and detailed interaction tracking.

## Component Categories

### Layout Components (`components/layout/`)
- **Header**: Main navigation with user profile and settings
- **Sidebar**: Navigation menu with active page indicators
- **Real-time Status**: Live connection status and data refresh indicators

### Dashboard Components (`components/dashboard/`)
- **Overview Stats**: KPI cards with trend indicators and sparklines
- **Live Metrics**: Real-time metrics with WebSocket updates
- **Dropoff Analysis**: Interactive funnel step analysis
- **Sentiment Analysis**: Sentiment distribution and trend visualization
- **User Behavior**: User journey patterns and interaction heatmaps
- **Similar Users**: ML-powered user similarity recommendations
- **User Journey Patterns**: Complete user path visualization
- **Real-time Alerts**: Live notification system for significant events

### Chart Components (`components/charts/`)
- **Funnel Visualization**: Multi-step funnel with conversion rates
- **Sentiment Chart**: Sentiment analysis with categorical breakdown

### UI Components (`components/ui/`)
Complete shadcn/ui component library including:
- Form controls (Button, Input, Select, Checkbox, Switch)
- Layout (Card, Tabs, Accordion, Separator)
- Feedback (Toast, Alert, Progress, Skeleton)
- Overlay (Dialog, Popover, Tooltip, Sheet)
- Navigation (Breadcrumb, Pagination, Command)
- Data display (Table, Badge, Avatar, Chart)

## Custom Hooks

### Data Fetching (`hooks/use-dashboard-data.ts`)
React Query hooks for API data fetching with caching, error handling, and automatic refetching. Includes hooks for:
- Dashboard metrics and KPIs
- Funnel analysis data
- User behavior analytics
- Sentiment analysis results

### Real-time Data (`hooks/use-real-time-data.ts`)
WebSocket integration for live data updates. Manages connection state, reconnection logic, and real-time metric updates.

### WebSocket Management (`hooks/use-websocket.ts`)
Low-level WebSocket hook with connection management, error handling, and automatic reconnection.

### UI Utilities (`hooks/use-mobile.tsx`, `hooks/use-toast.ts`)
Responsive design utilities and notification management.

## API Integration

### API Client (`lib/api.ts`)
Axios-based API client with:
- Request/response interceptors
- Error handling and retry logic
- TypeScript integration
- Base URL configuration

### Type Definitions (`lib/types.ts`)
Complete TypeScript interfaces matching backend Pydantic models:
- User and session models
- Analytics data structures
- API request/response types
- Chart data interfaces

### Utilities (`lib/utils.ts`)
Helper functions for:
- CSS class name merging (clsx integration)
- Data formatting and transformation
- Date/time utilities
- Responsive breakpoint helpers

## Styling System

### Tailwind Configuration (`tailwind.config.ts`)
Custom design system with:
- Brand color palette
- Typography scale
- Spacing system
- Component variants
- Dark/light theme support

### Global Styles (`app/globals.css`, `styles/globals.css`)
Base styles and CSS custom properties for:
- Theme variables (colors, fonts, spacing)
- Component base styles
- Responsive utilities
- Animation definitions

## Theme System

### Theme Provider (`components/theme-provider.tsx`)
Dark/light mode support with:
- System preference detection
- Manual theme switching
- Local storage persistence
- Seamless theme transitions

## Performance Optimizations

### Data Management
- React Query caching reduces API calls
- Optimistic updates for better UX
- Background data refetching
- Stale-while-revalidate strategy

### Rendering
- Next.js App Router for optimized routing
- Component lazy loading where appropriate
- Image optimization with Next.js Image component
- CSS-in-JS elimination for better performance

### Real-time Updates
- Efficient WebSocket connection management
- Selective re-rendering based on data changes
- Debounced updates to prevent UI thrashing

## Development Workflow

### Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - ESLint code checking
- `npm run type-check` - TypeScript compilation check

### Code Standards
- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Prettier for code formatting
- Component-first architecture

## Responsive Design
- Mobile-first approach with Tailwind CSS
- Breakpoint-based layouts
- Touch-friendly interactive elements
- Optimized for tablet and desktop experiences

## Accessibility
- Semantic HTML structure
- ARIA labels and roles where needed
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme support

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox layouts
- WebSocket API support required for real-time features