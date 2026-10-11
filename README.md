# Pariksha Path — Syllabus Tracker

CGPSC · CG Vyapam · SSC · Railway ka smart syllabus tracker, revision reminders ke saath.

## Folder structure
```
index.html              page skeleton
manifest.webmanifest    install (PWA) settings
sw.js                   offline cache + notification click
.nojekyll
css/styles.css          saari styling
js/data.js              syllabus (yahan topics edit karo)
js/utils.js             helpers, icons
js/store.js             storage, backup, revision logic
js/views.js             saari screens
js/app.js               actions, reminders, focus timer
icons/                  app icons
```

## Features
- Topic status: Not started → In progress → Done, star, notes, custom topics
- **Revision reminders:** topic done karte hi 1, 3, 7, 15, 30 din baad revision schedule hota hai
- Daily reminder notification (time aap choose karo), tab title aur app icon par due count
- Daily planner, study hours, **focus timer**, streak, heatmap, exam countdown
- Dark / Light theme, mobile friendly, phone par install ho sakta hai (offline bhi chalta hai)
- Data browser me save, automatic daily copies, Export / Import backup (.json)

## GitHub Pages par chalane ke steps
1. Zip **extract** karo.
2. Naya repo banao, phir **Add file → Upload files** me extract hua poora folder content drag karo
   (folders `css`, `js`, `icons` ke saath). Commit karo.
3. **Settings → Pages → Deploy from a branch → main / (root) → Save**.
4. Link: `https://<username>.github.io/<repo>/`

Phone me link kholo → browser menu → **Add to Home screen / Install app**.

## Notifications ke baare me
Browser reminder tabhi dikha sakta hai jab app khula ho ya background me chal raha ho (installed app me behtar).
Agar reminder miss ho jaye to bhi app kholne par Revision tab, sidebar badge aur dashboard par due topics dikhte hain.

## Data ke baare me
- Progress usi browser me save hota hai. "Clear site data" karne par delete ho jata hai, isliye Settings se kabhi kabhi **Export backup** karo.
- Syllabus edit karne par progress safe rehti hai (topic ka text same rahe to).
- `sw.js` me `CACHE` ka naam badlo jab files update karo, taaki users ko naya version mile.

Syllabus commonly followed pattern par based hai. Official notification se zaroor verify karo.
