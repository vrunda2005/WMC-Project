# WMC-Project

This repository contains a React frontend (Client) and an Express/MongoDB backend (Server) for the WMC project.

This README describes the technologies used, how to run both client and server locally (Windows - PowerShell), environment variables required, main scripts, and the server API endpoints.

## Table of Contents

- Project structure
- Tech stack & main libraries
- Environment variables
- Client (React + Vite)
  - Install & run
  - Important dependencies
- Server (Express + MongoDB)
  - Install & run
  - Important dependencies
  - API endpoints
- Notes

## Project structure

Top-level folders:

- `Client/` - React application built with Vite
- `Server/` - Express backend with routes, controllers and MongoDB models

Inside `Client/` is the Vite React app source (src, package.json, vite.config.js). Inside `Server/` are server sources and `server.js` entry point.

## Tech stack & main libraries

- Frontend

  - React (v18)
  - Vite (dev server & build)
  - TailwindCSS, Sass, PostCSS
  - React Router, React Bootstrap, Bootstrap
  - Axios for HTTP requests
  - react-leaflet + leaflet for maps
  - chart.js + react-chartjs-2 for charts
  - react-toastify, sweetalert2 for notifications
  - framer-motion for animations

- Backend
  - Node.js + Express
  - MongoDB via Mongoose
  - dotenv for configuration
  - bcrypt for password hashing
  - jsonwebtoken for JWT auth
  - multer / express-fileupload for handling file uploads
  - cloudinary (for file/image hosting)
  - cookie-parser, cors

## Environment variables

The server expects several environment variables (typically in a `.env` file located in `Server/`):

- `PORT` - (optional) server port, default 5000
- `MONGODB_URI` - MongoDB connection string
- `SECRET_KEY` - Secret for JWT or other signing
- `CLIENT_ORIGIN` - Frontend origin to allow in CORS (e.g. `http://localhost:5173` or deployed URL)
- `CLOUDINARY_CLOUTD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Make sure to create `Server/.env` with the variables above before running the server.

## Client (React + Vite)

Location: `Client/`

Install dependencies:

```powershell
cd Client
npm install
```

Run development server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
```

Preview built app:

```powershell
npm run preview
```

Important client scripts (from `Client/package.json`):

- `dev` - start Vite dev server
- `build` - build production bundle
- `preview` - preview production build
- `lint` - run ESLint

Key client dependencies (selected):

- `react`, `react-dom`
- `vite`, `@vitejs/plugin-react`
- `axios`
- `react-router-dom`
- `tailwindcss`, `postcss`, `autoprefixer`, `sass`
- `react-leaflet`, `leaflet`
- `chart.js`, `react-chartjs-2`
- `react-toastify`, `sweetalert2`

## Server (Express + MongoDB)

Location: `Server/`

Install dependencies:

```powershell
cd Server
npm install
```

Start server (development):

```powershell
npm run dev
```

Or using start script (nodemon is used):

```powershell
npm start
```

Key server scripts (from `Server/package.json`):

- `start` - runs `nodemon server.js` (development)
- `dev` - same as start (nodemon)

Key server dependencies (selected):

- `express`
- `mongoose`
- `dotenv`
- `cors`
- `cookie-parser`
- `bcrypt`
- `jsonwebtoken`
- `multer` / `express-fileupload`
- `cloudinary`
- `nodemon` (dev-runner)

Server entry: `Server/server.js` sets up middleware and attaches the router from `Server/routes/allRoutes.js`.

### Middleware configured in server

- `express.json()` and `express.urlencoded()` for body parsing
- `cookie-parser()` for cookie parsing
- `cors()` configured to allow `CLIENT_ORIGIN` and `http://localhost:5173` with credentials
- `express-fileupload` configured to use temp files

### Environment-driven Cloudinary setup

Cloudinary is configured using environment variables `CLOUDINARY_CLOUTD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

## API Endpoints

The server exposes multiple endpoints mounted at the root (`/`). Below is a listing (from `Server/routes/allRoutes.js`).

- Authentication

  - POST `/register` - register a new user
  - POST `/login` - login and receive token/cookies
  - GET `/api/me` - check token / get current user (protected by `checkToken`)

- Users

  - GET `/getallusers` - list all users
  - GET `/getalluser/:email` - get a user by email
  - PUT `/updateuser/:email` - update a user by email

- Donations

  - PUT `/donate/:username` - add a donation for a username
  - GET `/total-donations` - get total donations
  - GET `/user-donations` - get donations for the authenticated user

- Membership & Quiz

  - POST `/cancel` - cancel membership
  - POST `/quizPoints` - submit quiz points

- Events

  - GET `/api/events` - list events
  - POST `/api/events` - create an event
  - DELETE `/api/events/:id` - delete an event
  - PUT `/api/events/:id` - update an event
  - POST `/api/eventRegister` - register a user for an event

- Stories

  - GET `/stories` - list stories
  - POST `/stories` - add a story
  - DELETE `/stories/:id` - remove a story

- Inquiries

  - POST `/api/inquiries` - add an inquiry
  - GET `/admin/inquiries` - get inquiries (admin)

- News

  - POST `/news` - add news
  - GET `/news` - get news
  - PUT `/news/:id` - update news
  - DELETE `/news/:id` - delete news

- Volunteers
  - GET `/api/volunteers` - list volunteers
  - POST `/api/volunteers` - add volunteer request
  - DELETE `/api/volunteers/:id` - delete volunteer
  - POST `/api/volunteers/:id/reject` - reject volunteer
  - POST `/api/volunteers/:id/approve` - approve volunteer
  - GET `/VolunteerRequests` - list volunteer requests

Note: Some endpoints expect authentication via JWT or other session mechanism. The `checkToken` middleware is applied to `/api/me` and may be used in other controllers.

## Running both client and server locally

Run the server in one terminal and the client in another. Example (PowerShell):

```powershell
# Terminal 1 - server
cd Server; npm install; npm run dev

# Terminal 2 - client
cd Client; npm install; npm run dev
```

Make sure `Server/.env` contains `MONGODB_URI` and Cloudinary + SECRET_KEY values. Set `CLIENT_ORIGIN=http://localhost:5173` for local dev or add your deployed client origin.
