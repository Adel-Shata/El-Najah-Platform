<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# El-Najah — Project Conventions

## What this is
A bilingual (Arabic + English) educational and examination platform.
Framework: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion + next-intl.

## Working with this codebase

### Routing
- All routes are inside `src/app/[locale]/` and prefixed with the locale (`/en/...` or `/ar/...`).
- The default locale is `en`. The root URL `/` redirects to `/en` via next-intl middleware.
- Add a new page by creating a folder + `page.tsx` under `[locale]/`.
- Static params for locales are generated in `src/app/[locale]/layout.tsx`.

### Internationalization
- All user-facing strings live in `messages/en.json` and `messages/ar.json`.
- Use `useTranslations("namespace")` in client components, `getTranslations("namespace")` in server components.
- For locale-aware links, import `Link` from `@/i18n/routing` (not `next/link`).
- For programmatic navigation, use `useRouter` and `usePathname` from `@/i18n/routing`.
- Use `dir="rtl"` correctly. Tailwind's `rtl:` and `ltr:` variants, and `ms-*`/`me-*` for logical margins, are preferred over `ml-*`/`mr-*`.

### Design system
- All design tokens are defined in `src/app/globals.css` as CSS variables.
- Reference them via Tailwind's `bg-surface`, `text-text-muted`, `border-border`, etc.
- Never hardcode hex codes inline. Use a token.
- Typography: Inter + Fraunces (English), Cairo + Amiri (Arabic). Loaded via `next/font/google` in `[locale]/layout.tsx`.
- For the full design rules, see `~/.config/opencode/skills/design-system/SKILL.md`.

### Components
- `src/components/header.tsx` and `footer.tsx` are used in the locale layout.
- Section components (hero, features, stats, cta) live in `src/components/sections/`.
- Reusable motion primitives live in `src/components/motion.tsx` (`FadeIn`, `StaggerGroup`, `StaggerItem`).
- `cn()` utility lives in `src/lib/utils.ts`.

### Animations
- Use Framer Motion for entrance, hover, and stagger animations.
- Animate `opacity` and `transform` only. Never `width`, `height`, `top`, `left`.
- The design system skill specifies timing: 400ms ease-out for entrance, 150-200ms for hover.
- Always respect `prefers-reduced-motion` (handled in `globals.css`).

### Forms
- The contact form is a client component in `src/components/contact-form.tsx`. Currently it simulates submission. Wire it to a real API route when ready.

### Build & lint
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — run ESLint
