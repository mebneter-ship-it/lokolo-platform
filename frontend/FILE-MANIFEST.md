# Lokolo Consumer UI - Complete File Manifest

## 📁 Directory Structure

```
frontend/
├── .env.local                          # ✅ Environment variables
├── app/
│   ├── layout.tsx                      # ✅ Root layout with fonts
│   ├── globals.css                     # ✅ Global styles with Poppins
│   └── page.tsx                        # ✅ Main consumer discovery page
├── components/
│   ├── MapView.tsx                     # ✅ Google Maps with custom pins
│   ├── BusinessCard.tsx                # ✅ Business card component
│   ├── BottomSheet.tsx                 # ✅ Swipeable bottom sheet
│   └── TopNavigation.tsx               # ✅ Navigation with search
├── lib/
│   ├── types.ts                        # ✅ TypeScript definitions
│   └── api/
│       └── businesses.ts               # ✅ API service layer
├── public/
│   └── images/                         # For logos/assets
├── package.json                        # ✅ Dependencies defined
├── tailwind.config.js                  # ✅ Design system colors
├── tsconfig.json                       # ✅ TypeScript config
├── next.config.js                      # ✅ Next.js config
└── postcss.config.js                   # ✅ PostCSS config
```

---

## 🎯 Key Files Explained

### 1. Environment Configuration

**File:** `.env.local`
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBQtT6_hjJlQK_0RP6HkWsSyGQEmen1DcFk
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 2. Main Consumer Page

**File:** `app/page.tsx`
- Manages user location
- Fetches nearby businesses from backend
- Integrates all components
- Handles pin & card interactions

### 3. Components

#### MapView (`components/MapView.tsx`)
- Google Maps JavaScript API
- Custom gold/teal pins
- User location marker
- Pin click handlers
- Map styling

#### BusinessCard (`components/BusinessCard.tsx`)
- Category-based gradients
- Verified/Featured badges
- Distance display
- Rating display
- Click handlers

#### BottomSheet (`components/BottomSheet.tsx`)
- Touch-based dragging
- Snap points (20vh, 40vh, 80vh)
- Auto-scroll to selected business
- Loading & empty states
- Smooth animations

#### TopNavigation (`components/TopNavigation.tsx`)
- Orange gradient background
- Logo placeholder (80x80)
- Search input (16px to prevent iOS zoom)
- Quick filters (Nearby, Verified, Open, Featured)
- Filter button

### 4. API Service

**File:** `lib/api/businesses.ts`

Methods:
- `searchBusinesses(params)` - Main search with filters
- `getBusinessById(id)` - Single business
- `getFeaturedBusinesses(lat, lng)` - Featured only
- `getVerifiedBusinesses(lat, lng)` - Verified only

### 5. Type Definitions

**File:** `lib/types.ts`

Types:
- `Business` - Complete business model
- `BusinessListResponse` - API response
- `SearchParams` - Search filters
- `MapBounds` - Map boundaries

---

## 🎨 Design System Implementation

### Colors (Tailwind Config)
```javascript
colors: {
  orange: '#B85C1A',      // Brand
  gold: '#F5A623',        // Primary CTA, pins
  teal: '#156B60',        // Verified badges, trust
  'light-gold': '#FDB750', // Hover states
  'dark-orange': '#8F4814', // Active states
  cream: '#FAF5F0',       // Background
  'map-bg': '#E8DED0',    // Map placeholder
  'text-primary': '#2D1810', // Main text
  'text-secondary': '#8B7968', // Meta info
  border: '#E8DED0',      // Borders
  disabled: '#C4B5A6',    // Disabled elements
}
```

### Fonts
- Primary: Poppins (400, 600, 700)
- Secondary: Montserrat (400, 600)
- Loaded via Google Fonts in `globals.css`

### Spacing
- 4px - Tight
- 8px - Close
- 12px - Cards gap
- 16px - Standard padding
- 24px - Sections
- 32px - Major sections

### Touch Targets
- Minimum: 44px × 44px
- Comfortable: 48px × 48px
- Large: 56px × 56px

---

## 🔗 Backend Integration Points

### Required Endpoints

#### 1. Search Businesses
```
GET /api/businesses/search
Query params: latitude, longitude, radius, category, verified_only, open_now, featured, page, limit
```

#### 2. Get Business by ID
```
GET /api/businesses/:id
```

### Expected Response Format

```typescript
{
  businesses: Business[],
  total: number,
  page: number,
  limit: number
}

// Business object
{
  id: string,
  name: string,
  category: string,
  short_description: string,
  status: 'live' | 'pending' | etc,
  is_verified: boolean,
  is_featured: boolean,
  rating?: number,
  logo_url?: string,
  location: {
    latitude: number,
    longitude: number,
    address_text: string
  },
  contacts?: {
    phone?: string,
    email?: string,
    website_url?: string
  },
  created_at: string,
  updated_at: string
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Copy all files to local project
- [ ] Run `npm install`
- [ ] Configure `.env.local` with correct API keys
- [ ] Verify backend is running on port 8080
- [ ] Test backend `/api/businesses/search` endpoint

### Testing
- [ ] Start frontend with `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Allow location access in browser
- [ ] Verify map loads correctly
- [ ] Check businesses appear in bottom sheet
- [ ] Test pin clicks → card highlighting
- [ ] Test card clicks → console log
- [ ] Test bottom sheet dragging
- [ ] Test on mobile device (important!)

### Mobile Testing
- [ ] Test on actual phone (not just DevTools)
- [ ] Verify touch targets are easy to tap
- [ ] Check text is readable (minimum 12px)
- [ ] Test bottom sheet swipe gesture
- [ ] Verify no horizontal scroll
- [ ] Check fonts load correctly

---

## 📱 Mobile-First Optimizations

### Implemented
✅ 16px input font size (prevents iOS zoom)
✅ Tap highlight colors
✅ Momentum scrolling
✅ Touch-optimized drag handle
✅ Responsive font sizes
✅ Large touch targets (48px+)
✅ Sticky navigation
✅ No horizontal overflow

### Performance
- Map loads asynchronously
- Markers update efficiently
- Smooth animations (CSS transforms)
- Lazy loading ready

---

## 🔄 Next Features to Build

### Phase 1 (Current) ✅
- ✅ Consumer discovery page
- ✅ Map with pins
- ✅ Business cards
- ✅ Location-based search

### Phase 2 (Next)
- [ ] Business detail page
- [ ] Search functionality
- [ ] Category filters
- [ ] "Open Now" filter

### Phase 3 (Future)
- [ ] User authentication (Firebase)
- [ ] Favorites system
- [ ] Messaging
- [ ] User profile

---

## 💡 Development Tips

### Quick Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Common Issues

**Issue:** Google Maps not loading
**Fix:** Check API key, enable Maps JavaScript API in Google Cloud Console

**Issue:** Businesses not showing
**Fix:** Verify backend running, check `/api/businesses/search` endpoint

**Issue:** Location permission denied
**Fix:** App defaults to Johannesburg, user can manually search location later

**Issue:** Bottom sheet not dragging
**Fix:** Test on actual touch device, not mouse

---

## 📝 Notes for Matthias

1. **All files are in `/home/claude/lokolo-platform/frontend/`**
2. **Design matches APPROVED-DESIGN-SPEC.md exactly**
3. **Backend connection configured for localhost:8080**
4. **Google Maps API key already in .env.local**
5. **Ready to copy to your local project and run**

Test on your local machine first, then we can tackle the next features!

---

**Status:** ✅ COMPLETE & READY FOR INTEGRATION
**Last Updated:** November 14, 2025
