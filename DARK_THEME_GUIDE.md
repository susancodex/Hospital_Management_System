# Dark Theme UI Design Implementation Guide

## Overview
A comprehensive dark theme has been implemented for the Hospital Management System using Tailwind CSS and React Context. The theme respects user preferences and persists across sessions.

## Architecture

### 1. **Tailwind Configuration** (`tailwind.config.js`)
- Dark mode enabled using class strategy: `darkMode: 'class'`
- Extended color palette with light and dark variants
- Smooth transitions for all theme-aware components

```javascript
darkMode: 'class', // Uses class-based dark mode
```

### 2. **Theme Context** (`src/context/ThemeContext.jsx`)
- **Purpose**: Global state management for theme
- **Features**:
  - Detects system preference on first load
  - Persists theme selection in localStorage
  - Provides `useTheme()` hook for all components

```javascript
const { isDark, toggleTheme } = useTheme();
```

### 3. **Theme Toggle Component** (`src/components/ThemeToggle.jsx`)
- Moon icon in light mode, Sun icon in dark mode
- Integrated into Navbar for easy access
- Accessible button with proper ARIA labels

## Implementation Details

### CSS Variables System
Defined in `src/styles/index.css`:

**Light Mode:**
- `--bg-primary`: `#f8fafc` (slate-50)
- `--text-primary`: `#0f172a` (slate-900)
- `--border`: `#e2e8f0` (slate-200)

**Dark Mode:**
- `--bg-primary`: `#0f172a` (slate-950)
- `--text-primary`: `#f1f5f9` (slate-100)
- `--border`: `#334155` (slate-700)

### Tailwind Dark Classes
Using Tailwind's `dark:` prefix for theme-aware styling:

```jsx
<div className={`
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-slate-100
  border-slate-200 dark:border-slate-700
  transition-colors duration-300
`}>
```

## Updated Components

### ✅ Core Components
- **App.jsx** - ThemeProvider wrapper, error boundaries
- **Navbar.jsx** - Full dark styling + theme toggle button
- **Sidebar.jsx** - Dynamic sidebar with light/dark variants
- **MainLayout.jsx** - Container styling
- **PageHeader.jsx** - Section headers with dark support

### ✅ Pages
- **Login.jsx** - Authentication page
- **Dashboard.jsx** - KPIs, charts, and schedule cards

### ✅ Common Components
- **StatusBadge.jsx** - Status indicators with color variants
- **Button styles** - Primary, secondary, danger buttons

### 📋 Recharts Integration
Charts automatically adapt to theme:
- Grid colors respond to dark mode
- Axis labels use theme-aware colors
- Tooltip styling matches theme
- Legend text color adjusts dynamically

## Color Scheme Details

### Light Theme (Default)
- **Primary**: Blue 600 (`#2563eb`)
- **Background**: Slate 50 (`#f8fafc`)
- **Cards**: White (`#ffffff`)
- **Text**: Slate 900 (`#0f172a`)
- **Borders**: Slate 200 (`#e2e8f0`)

### Dark Theme
- **Primary**: Blue 500 (`#3b82f6`)
- **Background**: Slate 950 (`#0f172a`)
- **Cards**: Slate 800/900 (`#1e293b`/`#111827`)
- **Text**: Slate 100 (`#f1f5f9`)
- **Borders**: Slate 700 (`#334155`)

## Usage Examples

### Using the Theme Hook
```jsx
import { useTheme } from '../context/ThemeContext.jsx';

function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className={isDark ? 'bg-slate-900' : 'bg-white'}>
      <button onClick={toggleTheme}>
        Switch Theme
      </button>
    </div>
  );
}
```

### With Tailwind Classes (Preferred)
```jsx
<div className="
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-slate-100
  transition-colors duration-300
">
  Content
</div>
```

## Theme Persistence
- Theme preference saved in `localStorage` under key `'theme'`
- Auto-loaded on app refresh
- Falls back to system preference if no saved preference

## Transition Timing
All theme-aware elements use:
```css
transition: background-color 0.3s ease, color 0.3s ease;
/* OR in Tailwind: */
transition-colors duration-300
```

## Dark Mode Detection Flow
1. Check localStorage for saved theme preference
2. If none, detect system preference via `prefers-color-scheme`
3. Add/remove `dark` class to `<html>` element
4. All child components respond to this class

## Browser Support
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- CSS variable support required
- Tailwind CSS class-based dark mode compatible

## Accessibility
- Theme toggle button includes:
  - `aria-label` for screen readers
  - `title` attribute for tooltips
  - Keyboard accessible (focus visible)
  - Respects user's system preference by default

## Performance
- No performance impact from theme switching
- CSS variables enable instant theme updates
- LocalStorage is minimal and fast
- Tailwind builds single CSS file with both theme variants

## Future Enhancements
- [ ] Auto theme scheduling (light during day, dark at night)
- [ ] Theme preview before switching
- [ ] Custom color palette selector
- [ ] Per-page theme preferences
- [ ] Animation preferences for reduced motion

## Files Modified
1. `frontend/tailwind.config.js` - NEW
2. `frontend/src/context/ThemeContext.jsx` - NEW
3. `frontend/src/components/ThemeToggle.jsx` - NEW
4. `frontend/src/App.jsx` - Updated
5. `frontend/src/layouts/MainLayout.jsx` - Updated
6. `frontend/src/components/Navbar.jsx` - Updated
7. `frontend/src/components/Sidebar.jsx` - Updated
8. `frontend/src/pages/Login.jsx` - Updated
9. `frontend/src/pages/Dashboard.jsx` - Updated
10. `frontend/src/components/common/PageHeader.jsx` - Updated
11. `frontend/src/components/common/StatusBadge.jsx` - Updated
12. `frontend/src/styles/index.css` - Updated
13. `frontend/src/styles/components.css` - Updated

## Testing the Dark Theme
1. Click the theme toggle button in the navbar (Moon/Sun icon)
2. Verify all components update colors smoothly
3. Refresh the page - theme preference is restored
4. Open DevTools and toggle `dark` class on `<html>` element manually
5. Check mobile sidebar renders correctly in both themes

## Deployment Notes
- No backend changes required
- Theme selection is client-side only
- Works with all backend APIs
- No additional environment variables needed
