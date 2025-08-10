<!-- Created: Initial README with Android build/run instructions. -->

# Pixel Pizza Panic (Phaser + Vite + Capacitor)

## Dev
1. Install deps
```bash
npm install
```
2. Run locally
```bash
npm run dev
```

## Build (Web)
```bash
npm run build
npm run preview
```

## Android (Capacitor)
1. Ensure Android Studio + SDK + JDK 17 installed.
2. Add Android platform (first time):
```bash
npm run cap:add:android
```
3. Build web + sync native:
```bash
npm run build
npm run cap:sync
```
4. Open Android Studio:
```bash
npm run cap:open:android
```
5. Run on emulator/device, build AAB for release.

Notes:
- Portrait orientation is recommended. If needed, set it in `android/app/src/main/AndroidManifest.xml` on the main activity.
- `vite.config.ts` uses `base: ''` to work with Capacitor assets.


