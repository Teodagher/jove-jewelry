# Separate Admin PWA Setup

## ✅ **What We've Created:**

You now have **TWO separate PWA apps**:

### **1. Main Customer App** 🛍️
- **URL**: `maisonjove.com.au`
- **Manifest**: `/manifest.json`
- **Theme**: Ivory/Gold (#FAF9F7)
- **Icon**: Jewelry/Diamond theme
- **Purpose**: Customer shopping experience

### **2. Admin Dashboard App** ⚙️
- **URL**: `maisonjove.com.au/admin`
- **Manifest**: `/admin-manifest.json`
- **Theme**: Dark Gray (#111827)
- **Icon**: Admin/Settings theme
- **Purpose**: Business management

---

## 📱 **How to Install Both Apps:**

### **Customer App:**
1. Visit `maisonjove.com.au` on mobile
2. Tap "Add to Home Screen"
3. App name: **"Maison Jové"**
4. Icon: Light/jewelry themed

### **Admin App:**
1. Visit `maisonjove.com.au/admin` on mobile
2. Tap "Add to Home Screen"
3. App name: **"Jové Admin"**
4. Icon: Dark/admin themed

---

## 🎯 **Key Features:**

### **Separate Identities:**
- ✅ Different app names
- ✅ Different icons
- ✅ Different theme colors
- ✅ Different start URLs
- ✅ Separate on home screen

### **Admin App Shortcuts:**
When you long-press the admin app icon, you get quick access to:
- 📦 **Orders** - `/admin/orders`
- 📦 **Products** - `/admin/product-management`
- 📊 **Analytics** - `/admin/analytics`

---

## 🔧 **Technical Details:**

### **Manifest Scopes:**
```json
// Customer App
{
  "start_url": "/",
  "scope": "/"
}

// Admin App
{
  "start_url": "/admin",
  "scope": "/admin/"
}
```

This means:
- Customer app opens at homepage
- Admin app opens at `/admin` dashboard
- Each app stays within its scope

### **Theme Colors:**
```css
/* Customer App */
theme-color: #FAF9F7 (Ivory)

/* Admin App */
theme-color: #111827 (Dark Gray)
```

---

## 📝 **To-Do: Create Admin Icons**

You need to create admin-specific icons:

### **Required Sizes:**
1. `admin-icon-192x192.png` - 192x192px
2. `admin-icon-512x512.png` - 512x512px
3. `admin-icon-maskable-192x192.png` - 192x192px (with safe zone)
4. `admin-icon-maskable-512x512.png` - 512x512px (with safe zone)

### **Design Suggestions:**
- **Background**: Dark (#111827 or #1F2937)
- **Icon**: Gold/brass gear + diamond symbol
- **Style**: Professional, clean, modern
- **Purpose**: Clearly admin/management themed

### **Save to:**
```
/public/icons/admin-icon-192x192.png
/public/icons/admin-icon-512x512.png
/public/icons/admin-icon-maskable-192x192.png
/public/icons/admin-icon-maskable-512x512.png
```

---

## 🎨 **Icon Design Tool:**

Use one of these to create icons:
- **Figma** - Professional design
- **Canva** - Quick and easy
- **PWA Asset Generator** - Automated
  ```bash
  npx pwa-asset-generator admin-source.png public/icons/admin-icon --icon-only --background "#111827"
  ```

---

## ✨ **User Experience:**

### **On Home Screen:**
```
┌─────────────┐  ┌─────────────┐
│   🔷        │  │   ⚙️        │
│  Maison     │  │   Jové      │
│   Jové      │  │   Admin     │
└─────────────┘  └─────────────┘
 Customer App     Admin App
```

### **When Opened:**
- **Customer App** → Opens to homepage with bottom nav
- **Admin App** → Opens to admin dashboard with sidebar

---

## 🚀 **Install Prompts:**

### **Customer App:**
- Shows on main site after 3 seconds
- Currently **disabled** (you turned it off)
- Can re-enable in `layout.tsx`

### **Admin App:**
- Shows on `/admin` pages after 3 seconds
- **Active** - prompts admin users to install
- Dark themed modal with admin features list

---

## 📊 **Benefits:**

1. **Separate Apps** - Users can have both installed
2. **Quick Access** - Admin shortcut on home screen
3. **Context Switching** - Clear visual separation
4. **Offline Support** - Both work offline
5. **Professional** - Looks like native apps

---

## 🔐 **Security:**

- Admin app still requires authentication
- Manifest scope prevents customer app from accessing admin
- Each app maintains its own session
- Service worker respects authentication

---

## 📱 **Testing:**

### **iOS (Safari):**
1. Visit `/admin` on iPhone
2. Tap Share → Add to Home Screen
3. Verify dark icon and "Jové Admin" name
4. Open app → Should go to `/admin`

### **Android (Chrome):**
1. Visit `/admin` on Android
2. Tap "Install" banner or menu → Install
3. Verify admin icon
4. Open app → Should go to `/admin`

---

## 🎯 **Next Steps:**

1. ✅ Create admin icons (see design suggestions above)
2. ✅ Test installation on your phone
3. ✅ Verify both apps work independently
4. ✅ Check offline functionality
5. ✅ Test admin shortcuts (long-press icon)

---

## 💡 **Pro Tips:**

- **Update Manifest**: If you change icons, update `admin-manifest.json`
- **Clear Cache**: Users may need to reinstall to see icon changes
- **Test Both**: Install both apps to ensure they don't conflict
- **Shortcuts**: Admin shortcuts only work on Android (iOS doesn't support them yet)

---

**You now have a professional dual-PWA setup!** 🎉

Customer app for shopping, admin app for management - both installable, both offline-capable, both looking professional on the home screen!
