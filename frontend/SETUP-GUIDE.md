# Lokolo Consumer Discovery UI - Setup Guide
**Created:** November 14, 2025
**Status:** ✅ Ready for Integration

---

## 🎯 What's Ready

All consumer discovery UI components are complete and follow your **APPROVED DESIGN SYSTEM**:

✅ **MapView.tsx** - Google Maps with custom pins
✅ **BusinessCard.tsx** - Beautiful business cards with badges
✅ **BottomSheet.tsx** - Swipeable bottom sheet
✅ **TopNavigation.tsx** - Orange gradient nav with search
✅ **page.tsx** - Main consumer discovery page
✅ **API Service** - Backend connection ready
✅ **TypeScript Types** - Full type safety
✅ **.env.local** - Environment variables configured

---

## 📂 File Locations

All files are ready in:
```
/home/claude/lokolo-platform/frontend/
```

Copy this entire directory to your local project.

---

## ⚙️ Setup Instructions

### 1. Copy Files to Your Local Project

```bash
# On your local machine, navigate to your lokolo project
cd ~/your-lokolo-project/

# Copy the entire frontend directory
# (You can use the files from this workspace)
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create `.env.local` with:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBQtT6_hjJlQK_0RP6HkWsSyGQEmen1DcFk

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Start Frontend

```bash
npm run dev
```

Frontend will run on: **http://localhost:3000**

---

## 🔧 Backend API Requirements

Your backend needs these endpoints:

### Search Nearby Businesses
```
GET /api/businesses/search?latitude={lat}&longitude={lng}&radius={km}
```

**Response:**
```json
{
  "businesses": [
    {
      "id": "uuid",
      "name": "Business Name",
      "category": "Coffee",
      "short_description": "Description",
      "status": "live",
      "is_verified": true,
      "is_featured": false,
      "location": {
        "latitude": -26.2041,
        "longitude": 28.0473,
        "address_text": "123 Street, City"
      },
      "logo_url": "https://...",
      "contacts": {
        "phone": "+27...",
        "email": "...",
        "website_url": "..."
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

## 📱 Testing

### 1. Test User Location
- Open **http://localhost:3000**
- Allow location access
- Map should center on your location

### 2. Test Business Display
- Bottom sheet should show nearby businesses
- Cards should match the approved design
- Pins should appear on map

### 3. Test Interactions
- Click map pin → card scrolls into view
- Click card → logs business ID (ready for detail page)
- Swipe bottom sheet → height changes

---

## 🎨 Design Verification

✅ Orange gradient navigation (#B85C1A → #D67B2C)
✅ Cream background (#FAF5F0)
✅ Gold pins (#F5A623) with teal centers (#156B60)
✅ Warm brown text (#2D1810)
✅ Business cards with category gradients
✅ Verified badges (teal) and Featured badges (gold)
✅ 48px+ touch targets
✅ Poppins font family
✅ 16px minimum text (prevents iOS zoom)

---

## 🚨 Troubleshooting

### Google Maps Not Loading
- Check API key in `.env.local`
- Verify API key has Maps JavaScript API enabled
- Check browser console for errors

### No Businesses Showing
- Check backend is running on port 8080
- Verify `/api/businesses/search` endpoint exists
- Check browser console for API errors
- Test endpoint directly: `curl http://localhost:8080/api/businesses/search?latitude=-26.2041&longitude=28.0473&radius=5`

### Location Not Working
- Check browser permissions
- App defaults to Johannesburg (-26.2041, 28.0473) if denied

---

## 🔄 Next Steps

1. **Copy frontend files to your local project**
2. **Install dependencies**: `npm install`
3. **Start backend**: Ensure running on port 8080
4. **Start frontend**: `npm run dev`
5. **Test the consumer discovery page**

Once this works, we can build:
- Business detail page
- Search & filters functionality
- Favorites (requires auth)
- Messaging (requires auth)
- User profile

---

## 📞 Quick Reference

**Frontend Port:** 3000
**Backend Port:** 8080
**Google Maps API Key:** AIzaSyBQtT6_hjJlQK_0RP6HkWsSyGQEmen1DcFk
**Browser API Key:** AIzaSyDUejND_sXsE449eIOEu67DmYHv9P8CY2o

**Database:** PostgreSQL with PostGIS
**DB Password:** Lokolo-DB-2025

---

## ✅ Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| MapView | ✅ Complete | Google Maps integrated |
| BusinessCard | ✅ Complete | Matches approved design |
| BottomSheet | ✅ Complete | Swipeable, responsive |
| TopNavigation | ✅ Complete | Filters ready |
| API Service | ✅ Complete | Typed, ready to use |
| Main Page | ✅ Complete | All integrated |

---

**Ready to integrate! 🚀**
