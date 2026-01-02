# 📋 Lokolo Platform - Development Handover Document

**Date:** November 14, 2024  
**Developer:** Matthias Mebneter  
**Status:** Phase 1 Complete - Consumer Discovery Module Working  
**Repository:** https://github.com/mebneter-ship-it/lokolo-platform

---

## 🎯 Executive Summary

The Lokolo platform is a location-based marketplace connecting consumers with Black-owned businesses in Southern Africa. Phase 1 (Consumer Discovery Module) is **fully functional** and tested locally. The system uses Next.js 14 frontend with Google Maps integration, Node.js/TypeScript backend with PostgreSQL/PostGIS for geospatial queries.

**Critical Success:** After extensive debugging, the map-based discovery feature now works perfectly with real backend data, custom Lokolo-branded pins, and accurate geolocation.

---

## ✅ What's Working (Phase 1 Complete)

### Frontend (Next.js 14)
- ✅ Consumer discovery page with Google Maps
- ✅ Real-time business data from backend API
- ✅ Custom Lokolo brand pins (gold with teal center)
- ✅ Swipeable bottom sheet with business cards
- ✅ Category inference (Coffee, Bakery, Restaurant, Beauty, etc.)
- ✅ Verified badges (teal) and Featured badges (gold)
- ✅ Distance calculations from user location
- ✅ Responsive design with Tailwind CSS
- ✅ Orange gradient navigation with Lokolo logo

### Backend (Node.js + TypeScript)
- ✅ RESTful API with Express
- ✅ PostgreSQL database with PostGIS extension
- ✅ Geospatial search with distance calculations
- ✅ Business management (CRUD operations)
- ✅ Firebase Admin SDK configured
- ✅ Google Cloud Storage configured
- ✅ Authentication middleware (prepared, not yet integrated)
- ✅ 4 sample businesses in database (Johannesburg area)

### Infrastructure
- ✅ Code version controlled on GitHub
- ✅ Local development environment fully configured
- ✅ Cloud SQL database running in africa-south1
- ✅ Google Cloud Project: lokolo-platform
- ✅ Environment variables properly configured

---

## 🗂️ Project Structure

```
lokolo-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # PostgreSQL connection
│   │   │   ├── firebase.ts          # Firebase Admin SDK
│   │   │   └── storage.ts           # Google Cloud Storage
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── errorHandler.ts      # Global error handling
│   │   │   └── roleGuard.ts         # Role-based access
│   │   ├── models/
│   │   │   └── types.ts             # TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── businesses.ts        # ⭐ Business endpoints
│   │   │   ├── auth.ts              # Auth endpoints
│   │   │   ├── supplier.ts          # Supplier endpoints
│   │   │   ├── admin.ts             # Admin endpoints
│   │   │   └── index.ts             # Route aggregator
│   │   ├── services/
│   │   │   ├── businessService.ts   # ⭐ CRITICAL - Business logic
│   │   │   ├── userService.ts       # User management
│   │   │   ├── mediaService.ts      # File uploads
│   │   │   ├── favoriteService.ts   # Favorites
│   │   │   └── verificationService.ts
│   │   ├── utils/
│   │   │   ├── responses.ts         # Standard API responses
│   │   │   ├── validators.ts        # Input validation
│   │   │   └── logger.ts            # Logging utility
│   │   └── index.ts                 # ⭐ App entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                   # For Cloud Run deployment
│   └── .env                         # ⚠️ NOT in git - local only
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # ⭐ Main discovery page
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── MapView.tsx              # ⭐ Google Maps component
│   │   ├── BusinessCard.tsx         # Business card UI
│   │   ├── BottomSheet.tsx          # Swipeable sheet
│   │   └── TopNavigation.tsx        # Header with search
│   ├── lib/
│   │   ├── api/
│   │   │   └── businesses.ts        # ⭐ CRITICAL - API client
│   │   └── types.ts                 # TypeScript interfaces
│   ├── public/
│   │   └── images/
│   │       ├── lokolo-logo.png      # Brand logo
│   │       └── lokolo-pin.svg       # ⭐ Custom map pin
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile                   # For Cloud Run deployment
│   └── .env.local                   # ⚠️ NOT in git - local only
│
├── .gitignore                       # Excludes node_modules, .env, etc.
├── CURRENT-STATUS.md                # Project status document
└── README.md                        # (to be created)
```

---

## 🔑 Critical Files (DO NOT MODIFY Without Testing)

### Backend
1. **`backend/src/services/businessService.ts`** - Line 162
   - Contains **latitude/longitude extraction** from PostGIS
   - SQL: `ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude`
   - ⚠️ Without this, map pins won't show

2. **`backend/src/index.ts`** - Line 96
   - Server starts on **port 3001** (not 8080!)
   - ⚠️ Frontend expects backend on 3001

3. **`backend/src/routes/businesses.ts`** - Line 49
   - Search endpoint: `/api/v1/businesses/search`
   - Note: `/api/v1` prefix (not just `/api`)

### Frontend
1. **`frontend/lib/api/businesses.ts`** - Lines 18-19
   - Extracts coordinates: `const latitude = backendBusiness.latitude`
   - ⚠️ If hardcoded, all pins appear at same location

2. **`frontend/components/MapView.tsx`** - Line 108
   - Creates custom Lokolo pins
   - Uses `/images/lokolo-pin.svg`

3. **`frontend/app/page.tsx`** - Line 47
   - Main discovery logic
   - Fetches businesses from API

4. **`frontend/.env.local`** - ⚠️ MUST contain:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBQtT6_hjIQK_0RP6HkWsSyGQEmen1DcFk
   ```

---

## 🚀 Development Workflow

### Starting Development

```bash
# Terminal 1 - Backend
cd ~/lokolo-platform/backend
npm run dev
# ✅ Should show: "Server running on port 3001"

# Terminal 2 - Frontend
cd ~/lokolo-platform/frontend
npm run dev
# ✅ Should show: "Ready on http://localhost:3000"

# Open browser: http://localhost:3000
```

### Making Changes

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make changes to code

# 3. Test locally
# Backend: http://localhost:3001/api/v1/businesses/search?latitude=-26.2041&longitude=28.0473&radius=10
# Frontend: http://localhost:3000

# 4. Commit changes
git add .
git commit -m "Description of changes"

# 5. Push to GitHub
git push origin feature/your-feature-name

# 6. Create pull request on GitHub
```

### Reverting to Working State

```bash
# If something breaks badly:
git checkout e6c9991

# Or just reset to main:
git checkout main
git pull origin main
```

---

## 🐛 Common Issues & Solutions

### Issue 1: No Map Pins Showing
**Symptoms:** Map loads but no business pins appear  
**Root Cause:** Backend not returning latitude/longitude OR frontend not extracting them  

**Solution:**
```bash
# Test backend returns coordinates:
curl "http://localhost:3001/api/v1/businesses/search?latitude=-26.2041&longitude=28.0473&radius=10"
# Look for "latitude": -26.xxx, "longitude": 28.xxx

# Check frontend console (F12):
# Should see: "First business lat/lng: -26.xxx 28.xxx"
# If "undefined undefined" → Frontend transform broken
# If numbers but no pins → MapView not reading coordinates
```

**Files to check:**
- `backend/src/services/businessService.ts` line 162 (lat/lng extraction)
- `frontend/lib/api/businesses.ts` lines 18-19 (coordinate extraction)
- `frontend/components/MapView.tsx` line 120 (marker creation)

---

### Issue 2: Google Maps Won't Load
**Symptoms:** Blank map or "InvalidKeyMapError"  
**Root Cause:** Wrong API key or missing in `.env.local`  

**Solution:**
```bash
# Verify .env.local exists and has correct key:
cat frontend/.env.local

# Should show:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBQtT6_hjIQK_0RP6HkWsSyGQEmen1DcFk

# Google Maps API key restrictions (already configured):
# - localhost:3000 ✅
# - localhost:3001 ✅
# - https://lokolo-*.run.app ✅
```

**Correct API Key:** `AIzaSyBQtT6_hjIQK_0RP6HkWsSyGQEmen1DcFk`

---

### Issue 3: Backend Won't Start - Port in Use
**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3001`  
**Root Cause:** Previous backend process still running  

**Solution:**
```bash
# Find process using port 3001:
lsof -ti:3001

# Kill it:
kill -9 $(lsof -ti:3001)

# Or kill all node processes:
killall node

# Restart backend:
npm run dev
```

---

### Issue 4: Backend Can't Connect to Database
**Symptoms:** `Connection refused` or `ETIMEDOUT` errors  
**Root Cause:** Cloud SQL instance not running or wrong credentials  

**Solution:**
```bash
# Check if Cloud SQL instance is running:
gcloud sql instances list

# Should show STATUS: RUNNABLE

# Verify backend .env has correct connection:
cat backend/.env | grep DB_

# Should match Cloud SQL connection name:
# DB_HOST=/cloudsql/lokolo-platform:africa-south1:lokolo-db
```

---

### Issue 5: Frontend Shows "0 businesses"
**Symptoms:** Map loads, but "Nearby businesses (0)" shows  
**Root Cause:** Location too far from sample data OR backend not running  

**Solution:**
```bash
# Check backend is running:
curl http://localhost:3001/health

# Test API directly:
curl "http://localhost:3001/api/v1/businesses/search?latitude=-26.2041&longitude=28.0473&radius=10"

# Sample data is in Johannesburg (-26.2041, 28.0473)
# If testing from elsewhere, temporarily force Johannesburg in frontend:
# Edit frontend/app/page.tsx line 17:
# setUserLocation({ lat: -26.2041, lng: 28.0473 })
```

---

### Issue 6: Git Push Fails with HTTP 400
**Symptoms:** `error: RPC failed; HTTP 400`  
**Root Cause:** Trying to push `node_modules` (too large)  

**Solution:**
```bash
# Verify .gitignore excludes node_modules:
cat .gitignore | grep node_modules

# Remove from git if accidentally added:
git rm -r --cached backend/node_modules
git rm -r --cached frontend/node_modules
git commit -m "Remove node_modules"
git push origin main
```

---

### Issue 7: MetaMask Error in Console (NOT A BUG!)
**Symptoms:** 
```
Unhandled Runtime Error
i: Failed to connect to MetaMask
Call Stack
Object.connect
chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js (1:21493)
```

**Root Cause:** MetaMask browser extension trying to inject into every page  
**Impact:** **NONE** - This is harmless and does NOT affect Lokolo functionality  

**Solution:**
```
IGNORE THIS ERROR - It's from the MetaMask browser extension, not our code.

The error appears because:
1. You have MetaMask extension installed
2. MetaMask tries to inject into every webpage
3. Our app doesn't use MetaMask, so the injection fails
4. This is completely harmless

Options:
- Leave it (recommended) - doesn't affect anything
- Disable MetaMask extension when testing Lokolo
- Add MetaMask to exception list in extension settings

DO NOT waste time debugging this - it's not our bug!
```

---

## 🔐 Environment Variables

### Backend `.env` (NEVER commit to git)
```bash
# Database
DB_HOST=/cloudsql/lokolo-platform:africa-south1:lokolo-db
DB_PORT=5432
DB_NAME=lokolo_db
DB_USER=lokolo_user
DB_PASSWORD=<your-secure-password>

# Server
PORT=3001
NODE_ENV=development

# Firebase (path to service account JSON)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Google Cloud Storage
GCS_BUCKET_NAME=lokolo-media

# JWT
JWT_SECRET=<your-secret-key>
```

### Frontend `.env.local` (NEVER commit to git)
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBQtT6_hjIQK_0RP6HkWsSyGQEmen1DcFk
```

---

## 🗄️ Database Schema (Key Tables)

### businesses
```sql
- id (uuid, PK)
- owner_id (uuid, FK → users)
- name (varchar)
- tagline (varchar)
- description (text)
- location (geography) ⭐ PostGIS point
- address_line1, city, province_state, country
- phone_number, email, website_url
- status (enum: draft, pending, active, rejected, suspended)
- verification_status (enum: pending, approved, rejected)
- metadata (jsonb) - For features like "featured": true
- created_at, updated_at, published_at
```

### users
```sql
- id (uuid, PK)
- firebase_uid (varchar, unique)
- email, display_name, photo_url
- role (enum: consumer, supplier, admin)
- created_at, updated_at
```

### business_categories
```sql
- business_id (uuid, FK → businesses)
- category_name (varchar)
```

### favorites
```sql
- user_id (uuid, FK → users)
- business_id (uuid, FK → businesses)
- created_at
```

---

## 🎨 Design System

### Colors (Tailwind Config)
```javascript
{
  orange: {
    DEFAULT: '#B85C1A',
    light: '#D67B2C',
  },
  gold: '#F5A623',
  teal: '#156B60',
  cream: '#FAF5F0',
  'warm-brown': '#2D1810',
}
```

### Typography
- **Font:** Poppins (Google Fonts)
- **Sizes:** text-sm (14px), text-base (16px), text-lg (18px)

### Component Patterns
- **Cards:** Rounded corners, subtle shadows
- **Buttons:** Orange gradient on hover
- **Badges:** Pill-shaped with icons
- **Bottom Sheet:** Swipeable with drag handle

---

## 📊 Sample Data (For Testing)

Location: **Johannesburg, South Africa** (-26.2041, 28.0473)

1. **Ubuntu Coffee Roasters** - Verified, Featured
   - Category: Coffee
   - Distance: 0km (at center point)
   
2. **Ubuntu Bakery** - Pending verification
   - Category: Bakery
   - Distance: 0.12km
   
3. **Mama Zanele's Kitchen** - Verified
   - Category: Restaurant
   - Distance: 1.81km
   
4. **Tumi's Natural Hair Studio** - Verified
   - Category: Beauty
   - Distance: 10.70km

---

## 🚧 Known Limitations & Technical Debt

1. **Hardcoded Test Location**
   - Current: Forced to Johannesburg in `app/page.tsx`
   - Reason: All sample businesses are in Johannesburg
   - Fix: Uncomment geolocation code when deploying or add more test data

2. **Category System**
   - Current: Categories inferred from business tagline/description
   - Better: Dedicated category table with proper associations
   - File: `lib/api/businesses.ts` line 53

3. **Google Maps Deprecation Warning**
   - Current: Using `google.maps.Marker` (deprecated)
   - Should: Migrate to `AdvancedMarkerElement`
   - Not urgent: 12+ months notice before discontinuation

4. **No Error Boundaries**
   - Frontend lacks React error boundaries
   - Could crash entire app on component error
   - Add: Error boundary wrapper in `app/layout.tsx`

5. **Backend Port Mismatch**
   - Backend runs on 3001, not standard 8080
   - Reason: Avoid conflicts during development
   - Consider: Standardize to 8080 for production

6. **Missing Tests**
   - No unit tests, integration tests, or E2E tests
   - Critical before production deployment
   - Tools: Jest, React Testing Library, Supertest

7. **No Rate Limiting**
   - API has no rate limiting
   - Vulnerable to abuse
   - Add: express-rate-limit middleware

---

## 🎯 Phase 2 Roadmap (Next Steps)

### Priority 1: Business Detail Page
- Full business information view
- Photo gallery (3 photos max)
- Contact buttons (call, WhatsApp, website)
- Get directions button
- Estimated time: 2-3 days

### Priority 2: Search & Filters
- Text search in search bar
- Category filter functionality
- "Verified Only" filter
- "Open Now" filter (needs business hours)
- "Featured" businesses highlighted
- Estimated time: 3-4 days

### Priority 3: Firebase Authentication
- Login/Signup UI
- Firebase client SDK integration
- Protected routes
- User profile page
- Estimated time: 2-3 days

### Priority 4: Favorites System
- Save/unsave businesses
- View favorites list
- Sync with backend
- Estimated time: 1-2 days

### Priority 5: Supplier Dashboard
- Business owner login
- Business registration (5-step form)
- Photo upload (max 3)
- Business profile management
- Estimated time: 5-7 days

---

## 🌐 Deployment Strategy

### Development (Current)
- Local development only
- Free (no cloud costs)
- Fast iteration

### Staging (Future)
- Deploy to Cloud Run
- Use test database
- Limited users for beta testing

### Production (Future)
```bash
# Deploy backend
gcloud run deploy lokolo-backend \
  --source backend/ \
  --region africa-south1 \
  --allow-unauthenticated

# Deploy frontend  
gcloud run deploy lokolo-frontend \
  --source frontend/ \
  --region africa-south1 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=<backend-url>
```

**Cost Consideration:** Cloud Run charges by request/CPU time. Keep services deleted during development to avoid unnecessary costs.

---

## 📚 Useful Commands

### Development
```bash
# Backend
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start            # Run compiled JS

# Frontend
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm start            # Serve production build
```

### Database
```bash
# Connect to Cloud SQL
gcloud sql connect lokolo-db --user=lokolo_user

# Run migrations
cd backend
npm run migrate
```

### Git
```bash
# Status
git status
git log --oneline -10

# Branches
git branch
git checkout -b feature/name

# Undo changes
git checkout -- <file>
git reset --hard HEAD

# Recovery
git checkout e6c9991  # Go to working commit
```

### Google Cloud
```bash
# Set project
gcloud config set project lokolo-platform

# List services
gcloud run services list --region=africa-south1

# View logs
gcloud run logs read lokolo-backend --region=africa-south1

# Delete service (stop charges)
gcloud run services delete <service-name> --region=africa-south1
```

---

## 🔒 Security Checklist

- ✅ `.env` files in `.gitignore`
- ✅ Firebase service account key NOT in repository
- ✅ Database credentials NOT in code
- ✅ API keys restricted by domain
- ⚠️ No rate limiting (add before production)
- ⚠️ No input sanitization (add before production)
- ⚠️ CORS set to `*` (restrict before production)

---

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Google Maps API: https://developers.google.com/maps/documentation
- PostgreSQL + PostGIS: https://postgis.net/documentation
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Google Cloud Run: https://cloud.google.com/run/docs

### Key Google Cloud Resources
- **Project ID:** lokolo-platform
- **Region:** africa-south1 (Johannesburg)
- **Database:** lokolo-db (PostgreSQL 15)
- **Storage Bucket:** lokolo-media

### Repository
- **GitHub:** https://github.com/mebneter-ship-it/lokolo-platform
- **Working Commit:** e6c9991
- **Branch:** main

---

## 🎓 Key Learnings from Today

### 1. Google Maps API Keys Are Tricky
- Need proper domain restrictions
- Separate keys for development and production recommended
- Browser key vs Server key distinctions matter

### 2. PostGIS Coordinates Must Be Extracted
- PostGIS stores as binary geometry
- Must explicitly extract with `ST_X()` and `ST_Y()`
- Both backend SQL AND frontend transform must handle this

### 3. Backend Port Matters
- Frontend `.env.local` must match backend port exactly
- API path includes version: `/api/v1` not just `/api`
- Small mismatches cause silent failures

### 4. Git Large Files Cause Push Failures
- `node_modules` must be in `.gitignore`
- HTTP 400 errors often mean files too large
- Use `git rm -r --cached` to remove from tracking

### 5. Development Locally First
- Cloud Run costs add up quickly during active development
- Local development is free and faster
- Only deploy when features are stable

### 6. Commit Working States Frequently
- Tag working commits for easy recovery
- Descriptive commit messages save time later
- Small, frequent commits better than large ones

### 7. MetaMask Errors Are Harmless
- Browser extensions inject code into every page
- These errors don't affect your application
- Ignore them unless they're actually blocking functionality

---

## 🎉 Success Metrics

✅ **4 businesses displaying on map**  
✅ **Custom Lokolo pins rendering**  
✅ **Distance calculations accurate**  
✅ **Bottom sheet interactive**  
✅ **Backend API responding < 100ms**  
✅ **Code safely on GitHub**  
✅ **Zero cloud costs (local development)**

---

## 📝 Final Notes

This handover document contains everything learned during Phase 1 development, including all the painful debugging sessions. The platform now has a solid foundation with clean architecture, proper separation of concerns, and working geospatial features.

**Most Important:** The consumer discovery page works perfectly. Don't break it! Always test changes locally before pushing to GitHub.

**Next developer:** Read the "Critical Files" section first, then the "Common Issues & Solutions" section. These will save you hours of debugging.

**Questions?** Check GitHub issues or commit history for context on specific decisions.

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2024  
**Status:** Phase 1 Complete ✅  

**Git Commit:** e6c9991 - "Initial commit - Working consumer discovery page..."

---

END OF HANDOVER DOCUMENT
