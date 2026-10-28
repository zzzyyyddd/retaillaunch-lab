# Judge Testing Guide

## Project

**RetailLaunch Lab**

YouCam API Skin AI & eCommerce VTO Hackathon 2026

Live application: https://retaillaunch-lab.vercel.app/

Source code: https://github.com/zzzyyyddd/retaillaunch-lab

## Recommended Evaluation Flow

### 1. Explore the Landing Page

Open the live application and review the problem statement: validating fashion demand before manufacturing inventory.

### 2. Explore the Shop

Open `/shop` and select the Emerald Evening Dress sample.

### 3. Test AI Virtual Try-On

Open the virtual try-on experience and follow the upload instructions.

The application uses the real YouCam Clothes V4 API rather than a simulated image-generation response.

**Quota notice:** AI generation requires remaining YouCam API credits. If the promotional quota is exhausted, the feature may temporarily be unavailable.

### 4. Submit Purchase Intent

Choose Love It, Maybe, or Not Interested.

Changing the selection for the same product and visitor session replaces the previous active choice instead of counting another independent vote.

### 5. Review Demand Analytics

Visit `/demo/analytics` without logging in. This public read-only dashboard displays aggregated demand signals for the Emerald Evening Dress. The private retailer dashboard at `/dashboard/analytics` requires authentication.

Inspect product views, try-on starts, total intent votes, and positive vote share.

The dashboard flags small samples to avoid overstating demand confidence.

## Technical Evaluation

Review the following files:

- `src/components/VirtualTryOn.tsx`
- `src/app/api/youcam/upload/route.ts`
- `src/app/api/youcam/tryon/route.ts`
- `src/app/api/youcam/status/route.ts`
- `src/app/api/demand/intent/route.ts`
- `src/app/api/analytics/route.ts`
- `supabase/schema.sql`
- `supabase/functions.sql`

## Local Setup

Follow the root `README.md` and `docs/DATABASE_SETUP.md`.

A new Supabase project and valid YouCam credentials are required to reproduce the complete experience.

## Important Limitations

- The application is a hackathon prototype.
- Intent votes are not completed purchases.
- Sample analytics are illustrative until sufficient real responses are collected.
- Virtual try-on availability depends on YouCam API quota.
