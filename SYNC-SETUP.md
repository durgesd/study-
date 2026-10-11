# PC aur Mobile ka data sync karna (Firebase, free)

App ko khud ka cloud nahi chahiye hota, isliye Google ka free **Firebase** use hota hai.
Setup ek hi baar karna hai, lagbhag 10 minute. Free "Spark" plan is app ke liye kaafi hai.

## Setup
1. **console.firebase.google.com** par jao, **Add project** karo (Google Analytics band rakh sakte ho).
2. **Build → Authentication → Get started → Sign-in method** me **Email/Password** ko Enable karo.
   (Chaho to **Google** bhi enable kar sakte ho.)
3. **Authentication → Settings → Authorized domains → Add domain**: apni GitHub Pages site daalo,
   jaise `username.github.io`.
4. **Build → Firestore Database → Create database** → *Production mode* → apne paas ka region (jaise Mumbai).
5. Firestore ke **Rules** tab me jao, jo likha hai wo hata kar is zip ki `firestore.rules` file ka
   poora content paste karo, phir **Publish**.
6. **Project settings (gear icon) → Your apps → Web (`</>`)** me app register karo.
   Jo `firebaseConfig` milega use `js/firebase-config.js` me paste karo:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```
7. Is file ko GitHub par upload (commit) karo. `sw.js` me `CACHE` ka naam ek number badha do
   (jaise `pariksha-path-v5`) taaki phone/PC par naya version aaye.

## Use karna
- PC par app kholo → **Backup & Settings → Sync across devices** → email + password se **Create account**.
- Mobile par app kholo → usi email/password se **Sign in**.
- Dono device ka purana data **mil jata hai**, kuch delete nahi hota. Uske baad har badlav kuch second me
  dusre device par dikhta hai.

## Kaise kaam karta hai
- Har topic, task aur note par "last edit" ka time lagta hai. Do device ka data milate waqt har cheez ka
  naya version rakha jata hai. Ek device par add kiya hua kaam dusre par delete nahi hota.
- Offline rehne par badlav device par rehte hain aur internet aate hi merge ho jate hain.
- Agar **ek hi topic** ko do device par lagbhag ek saath badlo, to jo baad me badla wahi rehta hai.
- **Erase all progress**, **Import backup** ya **Restore** karne par wo version sab device par laagu ho jata hai
  (naya reset jeetta hai). Isliye erase se pehle backup file zaroor rakho.
- Theme, language aur notification reminder har device par alag rehte hain.

## Suraksha
- `firebaseConfig` ki values secret nahi hoti, public site me dikhna normal hai.
- Data `firestore.rules` se bandha hai: sirf login kiya hua aap apna document padh/likh sakte ho.
- Password Firebase sambhalta hai, app me kahin save nahi hota.
- Backup file (Export) phir bhi kabhi kabhi download karte raho.

## Problem aaye to
| Message | Kya karna hai |
|---|---|
| This website is not allowed yet | Step 3 me apna `username.github.io` jodo |
| Sign-in method is not enabled | Step 2 me Email/Password enable karo |
| cloud database refused access | Step 5 ke rules Publish karo |
| Sync problem (kuch aur) | Settings me "Sync now" dabao, internet check karo |
