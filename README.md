# Demo Project: Hotel Guest/Bookings Management App

Built in Vite with React, TypeScript and a Supabase database. Uses React Query, React Hook Form, Recharts, Styled Components, and other libraries to render a fully-featured app for hotel staff managing property bookings, guest information, check-ins/check-outs, cabin listings, and sales data. Includes the ability to add other employee user accounts and to do basic management of those accounts such as updating name, password, and personal avatar.

## Preview
[Play around with this app on Netlify](https://hotel-oasis-demo.netlify.app/). 

## Local Installation
node v. 25.1.0 suggested.
Requires an API Key to a properly set up Supabase database to run locally, and a user account in the database to login.

```
npm install
npm run dev
```

## Roadmap

- User-facing companion website for guests to browse properties and make bookings
- React Query v4 -> v5 upgrade
- Further TypeScript enhancements

## Bugs Being Monitored

- On Firefox: error message logged "Cookie '\_\_cf_bm has been rejected for invalid domain" for each image served from Supabase data buckets. Bug caused by Cloudflare bots/Supabase and cannot be resolved from app itself. Watching progress of resolution here: https://github.com/supabase/supabase/issues/37312
