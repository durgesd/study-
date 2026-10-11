# Pariksha Path / परीक्षा पथ

CGPSC · CG Vyapam · SSC · Railway syllabus tracker. Hindi + English, master syllabus, revision reminders, installable PWA.

## Folder structure
```
index.html              page skeleton
manifest.webmanifest    PWA install settings (name, icons, shortcuts)
sw.js                   offline cache, font cache, update + notification click
.nojekyll
css/styles.css          design system
js/i18n.js              UI text in English + Hindi (add/edit translations here)
js/data.js              CGPSC / Vyapam / SSC / Railway syllabus  ('English|हिन्दी')
js/master.js            MASTER syllabus with exam tags (C / V / S / R)
js/utils.js             helpers, icons
js/merge.js             merge engine (keeps both devices' changes)
js/store.js             storage, backup, revision + readiness logic
js/views.js             all screens
js/firebase-config.js   paste your Firebase config here to switch sync on
js/sync.js              cross-device sync (Firebase Auth + Firestore)
js/app.js               actions, reminders, focus timer, PWA install/update
firestore.rules         security rules for the cloud database
SYNC-SETUP.md           step-by-step sync setup
icons/                  app icons (normal + maskable + apple touch)
```

## Features
- Hindi / English switch (whole UI and all syllabus topics)
- Master syllabus: 138 topics from the four syllabi, each tagged with the exams that ask it, plus "readiness by exam" and overlap analysis
- Topic status, star, notes, own topics, exam countdown
- Spaced revision (1, 3, 7, 15, 30 days), daily reminder notification, due badge
- Daily planner, focus timer, streak, heatmap
- Dark / Light theme, mobile bottom navigation
- PWA: install on phone / desktop, works offline, in-app update prompt
- **PC + mobile sync** (free Firebase, one-time setup, see SYNC-SETUP.md): changes show on both devices, data is merged not overwritten
- Data in browser localStorage + automatic daily copies + Export / Import backup

## GitHub Pages
1. Extract the zip.
2. Create a repo, then **Add file → Upload files** and drag in everything, including the `css`, `js` and `icons` folders (and the hidden `.nojekyll`).
3. **Settings → Pages → Deploy from a branch → main / (root)**.
4. Open `https://<username>.github.io/<repo>/`. On phone: browser menu → Install app / Add to Home screen.

PWA install and offline mode need `https` (GitHub Pages is https). Opening `index.html` by double-click still runs the app, without install/offline.

## Editing
- Syllabus: `js/data.js` and `js/master.js`. Format `'English text|हिन्दी पाठ'` (master adds `|CVSR`).
  Progress is saved against the English text, so Hindi can be edited freely.
- After changing any file, change `CACHE` in `sw.js` (for example `pariksha-path-v5`) so users get the update.

## Data
- Saved only in the browser you use. "Clear site data" deletes it, so export a backup now and then.
- Always verify the syllabus against the latest official notification.
