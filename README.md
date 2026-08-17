# Fazilet Reels

Dark Instagram-style reels viewer for local repo photos, built with Svelte 5, Tailwind CSS, and Gun.

## Setup

Install dependencies when you are ready:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

## Photos

Add images to:

```text
src/lib/photos
```

Supported extensions: `avif`, `gif`, `jpeg`, `jpg`, `png`, and `webp`.

The app imports these files at build time with Vite, so restart the dev server after adding new photos.

The reel caption shows the file name without its extension. For JPEG photos, the app also reads embedded EXIF date fields in the browser and displays the captured date when available.

## Gun peer

The app defaults to:

```text
https://try.axe.eco/gun
```

You can override it with:

```bash
VITE_GUN_PEER=https://your-relay.example/gun npm run dev
```

Public Gun peers are useful for development, but for anything private or persistent, run your own relay.
