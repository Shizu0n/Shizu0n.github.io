# Shizu0n CV | Personal Portfolio

Live Website: https://shizu0n.vercel.app

![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A single-page portfolio with a black-and-white editorial aesthetic, focused on scroll-based visual storytelling, smooth motion, and a curated project showcase.

## Table of Contents

- [Project Purpose](#project-purpose)
- [Goals and Scope](#goals-and-scope)
- [Stack and Tools](#stack-and-tools)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Build and Deployment](#build-and-deployment)
- [Engineering Practices](#engineering-practices)
- [Author](#author)
- [License](#license)

## Project Purpose

This project was created to present the profile, technical capabilities, and selected work of **Paulo Shizuo** in a professional and authorial format.

More than a standard profile page, this portfolio is designed as a visual reading experience with emphasis on:

- strong typographic hierarchy;
- smooth, purposeful motion with Framer Motion;
- consistent minimalist visual direction;
- performance and responsiveness;
- maintainable structure through reusable components and contexts.

## Goals and Scope

### Primary goals

- showcase selected projects with context and visual direction;
- communicate technical depth in a concise format;
- provide direct contact via form (EmailJS) with a mailto fallback;
- keep the codebase scalable for future content and layout evolution.

## Stack and Tools

### Front-end

- React 19
- TypeScript (strict)
- Vite 7
- Framer Motion 12
- Lenis (smooth scroll)
- Tailwind CSS 4 (globally imported)

### Code quality and consistency

- ESLint
- Prettier
- TypeScript type-check (tsc --noEmit)

### Integrations

- GitHub API (profile, repositories, and metrics)
- EmailJS (contact form delivery)

## Architecture

Main application structure:

```text
src/
  App.tsx
  main.tsx
  index.css
  components/
    Nav.tsx
    ScrollProgress.tsx
    Footer.tsx
  contexts/
    TranslationContext.tsx
    GitHubContext.tsx
  hooks/
    useContactForm.ts
  sections/
    HeroSection.tsx
    AboutSection.tsx
    SkillsSection.tsx
    ProjectsSection.tsx
    ContactSection.tsx
  styles/
    variables.css
  types/
    index.ts
```

### Composition flow

- main.tsx: React entry point wrapped with React.StrictMode.
- App.tsx: initializes Lenis and composes providers + global layout.
- TranslationProvider and GitHubProvider: expose global text and data state.
- sections/: narrative blocks of the single-page experience.
- components/: reusable navigation and progress UI elements.

## Key Features

- Scroll-driven hero storytelling using useScroll, useSpring, and useTransform.
- Fixed navigation with:
  - active section highlight via IntersectionObserver;
  - fullscreen mobile menu;
  - accessible behavior (including Escape to close menu).
- Top reading progress indicator.
- About section powered by dynamic GitHub statistics.
- Projects section with curated case studies and external links.
- Contact section with:
  - EmailJS form submission;
  - basic client-side validation;
  - automatic mailto fallback when EmailJS is not configured.
- Local caching for GitHub API data (5 minutes) for better performance.
- Keyboard accessibility support through a skip link.

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (or equivalent)

## Local Setup

```bash
npm install
npm run dev
```

Local URLs:

- development: http://localhost:3000
- production preview: http://localhost:4173

## Available Scripts

```bash
npm run dev          # start development server
npm run build        # create production build
npm run preview      # preview production build
npm run type-check   # run TypeScript checks
npm run lint         # run ESLint
npm run lint:fix     # auto-fix lint issues
npm run format       # format with Prettier
npm run format:check # check formatting
npm run clean        # remove dist directory
npm run security:check # detect tracked secrets and risky VITE usage
```

## Environment Variables

To enable full API and contact features, create a .env file at the project root.

Security rule: any variable starting with VITE_ is public in the frontend bundle. Never put private keys in VITE_ vars.

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_CHAT_API_URL=http://localhost:3000

ALLOWED_ORIGINS=https://shizu0n.vercel.app,https://shizu0n.github.io,http://localhost:3000,http://127.0.0.1:3000

GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_or_service_role_key

GROQ_API_KEY=gsk_your_groq_key_here
OPENROUTER_API_KEY=sk-or-your_openrouter_key_here
CF_ACCOUNT_ID=your_cloudflare_account_id_here
CF_WORKERS_AI_TOKEN=your_cloudflare_workers_ai_token_here
```

If these variables are not set, the contact flow automatically falls back to mailto.

Before deploy or opening PRs, run:

```bash
npm run security:check
```

## Build and Deployment

Production build:

```bash
npm run build
```

Current Vite setup includes:

- base: /
- target: esnext
- vendor chunk split for react and react-dom

## Engineering Practices

- clear domain-based separation (components, sections, contexts, hooks, types);
- explicit TypeScript typing in core structures;
- local caching strategy to reduce GitHub API requests;
- motion designed for readability and pacing;
- centralized visual styling in index.css and CSS variables;
- quality checks through linting, formatting, and type validation scripts.

## Author

**Paulo Shizuo Vasconcelos Tatibana**

- GitHub: https://github.com/Shizu0n
- LinkedIn: https://www.linkedin.com/in/paulo-shizuo/

## License

This project is licensed under the MIT License. See the LICENSE file for details.


