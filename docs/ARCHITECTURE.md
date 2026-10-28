# RetailLaunch Lab Architecture

## Overview

RetailLaunch Lab combines AI-powered fashion visualization with pre-production demand analytics.

## Components

| Component | Technology | Responsibility |
|---|---|---|
| Web application | Next.js, React, TypeScript | Shopper and retailer interfaces |
| Authentication | Supabase Auth | Retailer login |
| Database | Supabase PostgreSQL | Campaigns, products, votes, quotas |
| Virtual try-on | YouCam Clothes V4 | AI garment visualization |
| Analytics | Next.js API, Recharts | Demand metrics and visualization |
| Hosting | Vercel | Public web deployment |

## Virtual Try-On Flow

1. A shopper selects a fashion product.
2. The shopper uploads a photo.
3. The Next.js server validates the upload request.
4. The server initializes an image upload through YouCam.
5. The image is uploaded to the authorized upload destination.
6. The server reserves a quota unit through PostgreSQL.
7. The server creates a YouCam Clothes V4 task.
8. The client polls the task-status endpoint.
9. The generated image is displayed when processing succeeds.

YouCam credentials remain on the server.

## Purchase-Intent Flow

1. The shopper selects Love It, Maybe, or Not Interested.
2. The application associates the request with a visitor session.
3. The server validates the product and event.
4. A PostgreSQL RPC serializes changes for the visitor and product.
5. The visitor's previous intent is replaced with the latest choice.

A partial unique index provides an additional database-level guarantee against multiple active intent choices.

## Demand Analytics

The dashboard aggregates product views, try-on starts, and purchase-intent votes.

The system reports positive vote share and warns when the sample is too small for meaningful conclusions.

These signals represent expressed interest, not confirmed purchases.

## Security and Limits

- API keys are not exposed to the browser.
- Supabase Row Level Security protects application tables.
- Sensitive RPC execution is restricted.
- Server-side quota counters limit YouCam usage.
- Uploaded images are processed through the YouCam integration.

## Deployment

The application is deployed on Vercel and remains accessible without a locally running laptop.

Production URL: https://retaillaunch-lab.vercel.app/
