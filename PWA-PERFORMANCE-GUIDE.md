# PWA Performance Diagnostics Guide

## 🔍 Quick Performance Check

### 1. Chrome DevTools (Desktop)
```bash
# Open your PWA in Chrome
# Press F12 or Cmd+Option+I
# Go to "Lighthouse" tab
# Select "Progressive Web App" + "Performance"
# Click "Analyze page load"
```

### 2. Lighthouse CLI (Detailed Analysis)
```bash
# Build production version first
npm run build
npm start

# In another terminal, run Lighthouse
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view --preset=mobile

# For PWA-specific audit
npx lighthouse http://localhost:3000 --only-categories=pwa --view
```

### 3. Real Device Testing
```bash
# On your phone, install the PWA
# Then use Chrome Remote Debugging:

# 1. Connect phone via USB
# 2. Enable USB debugging on phone
# 3. In Chrome desktop: chrome://inspect
# 4. Select your device and PWA
# 5. Run Lighthouse from DevTools
```

---

## 📊 Key Performance Metrics to Check

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **FID (First Input Delay)**: < 100ms (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)

### PWA-Specific
- **Time to Interactive**: < 3.8s
- **Service Worker**: Registered and active
- **Cache Hit Rate**: > 80%
- **Offline Functionality**: Working

---

## 🚀 Common Performance Fixes

### 1. Image Optimization
```bash
# Check image sizes
find public -name "*.jpg" -o -name "*.png" -o -name "*.webp" | xargs ls -lh

# Optimize images (if needed)
npm install -D sharp
```

### 2. Bundle Size Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

### 3. Service Worker Caching
Check `public/sw.js`:
- Are critical assets precached?
- Is caching strategy optimal?
- Are old caches being cleaned up?

### 4. Network Requests
```javascript
// In Chrome DevTools Network tab:
// - Filter by "All"
// - Check for:
//   - Large files (> 500KB)
//   - Slow requests (> 1s)
//   - Failed requests
//   - Duplicate requests
```

---

## 🔧 Performance Monitoring Tools

### 1. Chrome DevTools Performance Tab
```
1. Open DevTools (F12)
2. Go to "Performance" tab
3. Click record (●)
4. Interact with your PWA
5. Stop recording
6. Analyze flame graph for bottlenecks
```

### 2. React DevTools Profiler
```bash
# Install React DevTools extension
# Then in your app:
# 1. Open React DevTools
# 2. Go to "Profiler" tab
# 3. Click record
# 4. Interact with app
# 5. Analyze component render times
```

### 3. Network Throttling
```
DevTools → Network tab → Throttling dropdown
- Test with "Slow 3G"
- Test with "Fast 3G"
- Test with "Offline"
```

---

## 📱 Mobile-Specific Checks

### iOS Safari
```
1. Install PWA on iPhone
2. Open Safari on Mac
3. Develop → [Your iPhone] → [Your PWA]
4. Use Web Inspector to debug
```

### Android Chrome
```
1. Install PWA on Android
2. Connect via USB
3. chrome://inspect on desktop
4. Inspect and profile
```

---

## 🎯 Current Optimizations Applied

✅ Service worker with intelligent caching
✅ Image caching (cache-first strategy)
✅ Offline fallback page
✅ Precaching of critical assets
✅ Mobile-optimized CSS
✅ Touch target optimization (44px minimum)

---

## 📈 Next Steps for Performance

1. **Run Lighthouse** - Get baseline scores
2. **Identify bottlenecks** - Focus on lowest scores
3. **Optimize images** - Convert to WebP, lazy load
4. **Code splitting** - Reduce initial bundle size
5. **CDN for static assets** - Faster delivery
6. **Database query optimization** - Faster API responses

---

## 🔍 Quick Diagnostic Commands

```bash
# Check service worker status
# In browser console:
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))

# Check cache storage
caches.keys().then(keys => console.log(keys))

# Check cache size
caches.open('jove-pwa-v1').then(cache => 
  cache.keys().then(keys => console.log('Cached items:', keys.length))
)

# Performance timing
console.log(performance.timing)
```

---

## 📊 Monitoring in Production

Consider adding:
- **Google Analytics** - User behavior
- **Sentry** - Error tracking
- **Web Vitals** - Real user metrics
- **LogRocket** - Session replay

```bash
npm install web-vitals
```

Then in your app:
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```
