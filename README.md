# Muskii Nails Beauty

Role & Goal:
Act as a Lead Full-Stack Software Engineer and Senior UI/UX Designer. Build a highly polished, responsive, and secure e-commerce web application titled "Nail by Muskii". The application must combine high aesthetic appeal with enterprise-grade Supabase backend security, flawless performance on low-end hardware, and complete e-commerce functionality.

---

### 1. Visual Identity, Logos & Aesthetics
* Brand & Logo Asset Rules:
  - Header Logo Placeholder: Leave an image asset component `<HeaderLogo />` configured to display the primary store logo (Asset to be supplied later). Fallback text: "Nail by Muskii".
  - Dev Section Logo Placeholder: Leave an image asset component `<DevLogo />` configured to display the developer logo (Asset to be supplied later). Fallback text: "MAN.DEV".
  - Logo Styling: Render brand text and accents using a texture matching bright golden and rich warm brown.
* UI/UX Rules:
  - Palette: Clean, flat base colors with warm brown tones and bright metallic gold accents.
  - Strict Exclusions: NO gradients, NO purple/blue color combinations, NO glassmorphism, NO floating background orbs, and NO fake template filler/junk.
  - Typography: Use one clean sans-serif font family (e.g., Plus Jakarta Sans or Inter). Maintain strict readability (line-height 1.5–1.6) and structured visual hierarchy.
* Visual Background Concept:
  - Incorporate a 3D visual background with a "water glass" ripple effect (fluid optics) using warm brown and bright gold highlights.
* Tone of Voice:
  - Write all copy in plain, direct English. Avoid corporate hype words ("revolutionize", "empower", "next-gen").

---

### 2. High-Performance Engine (Low-End & Mobile Devices)
To ensure the 3D water glass background and UI run smoothly (60fps) on budget budget Android, iOS, Windows, and smart display devices:
* WebGL Optimization Strategy:
  - Use Three.js or WebGL with adaptive pixel ratio capped at Math.min(window.devicePixelRatio, 2).
  - Implement dynamic Resolution Scaling: If FPS drops below 45fps, scale canvas resolution to 0.75x automatically.
  - Disable heavy post-processing effects (bloom, SSAO, complex shaders) on mobile user-agents.
  - Set `powerPreference: "high-performance"` and `precision: "mediump"` for WebGLRenderer.
* DOM & Layout Performance:
  - Use `content-visibility: auto` on offscreen sections.
  - Touch Target Guidelines: Minimum 48x48px on touch inputs with zero horizontal overflow.

---

### 3. Product Catalog, Customization & Discovery
* Visual Content:
  - Display actual product photography/renders for artificial nails instead of generic icons or emojis.
* Customization Engine:
  - Nail Sizing Tool: Select sizes (XS, S, M, L, or custom measurements in mm).
  - Nail Customization: Options for Shape (Almond, Coffin, Stiletto, Square) and Finish (Glossy, Matte).
* Intelligent Recommendations:
  - Choosing a specific nail design dynamically reveals a "Suggested Styles" panel featuring matching color palettes in varied designs.
* Localized Currency:
  - Formatted in Pakistani Rupees (e.g., "PKR 2,800").

---

### 4. Supabase Backend Architecture & Gamified Spin Wheel
* Supabase Authentication:
  - Enable Supabase Auth for signup/login (Email/Password or Magic Link).
* Gamified Onboarding (Lucky Spin Wheel):
  - Trigger Condition: Pops up immediately upon first-time user login.
  - Spin Slice Options:
    1. 5% Off
    2. 10% Off
    3. 15% Off
    4. Free Delivery
    5. Mega Prize: 20% Off
    6. Better Luck Next Time
  - Backend Anti-Cheat Logic:
    - Save spin state directly in Supabase database (`user_spins` table).
    - Database rule enforces `has_spun = true` per user ID. Prevent frontend manipulation—discourage re-spinning via page refresh or local storage wipes. Apply discount codes directly to the user profile.

---

### 5. Ordering, Cart & Checkout Flow
* Sliding Side-Cart:
  - Shows items in PKR, selected sizes/shapes, applied spin discount code, and subtotals.
* Form Verification at Checkout:
  - Step 1: Delivery Address (Full Name, House/Street, Area, City, Postal Code).
  - Step 2: Active Phone Number (Regex validation for Pakistani mobile numbers: e.g., `+92` or `03xx-xxxxxxx`).
* Instagram Link Integration:
  - Store Instagram: `https://www.instagram.com/nail_diaries_by_muskiii?igsh=Mnd3MXkzMHNiazZ6`

---

### 6. Enterprise Security & Database Anti-Tamper System
* Supabase Row-Level Security (RLS):
  - Enable RLS on every table (`profiles`, `orders`, `products`, `user_spins`).
  - Users can read public products, but can ONLY read/write their OWN profile, cart, and order records (`auth.uid() = user_id`).
* Front-End Source & Asset Protection:
  - Disable context menu (right-click), text highlight selection on images/product text, and standard inspector keys (`F12`, `Ctrl+Shift+I`, `Ctrl+U`).
  - Obfuscate JavaScript output bundles.
* Database Anti-Tampering & Price Integrity:
  - Price Validation: Never compute total order values solely on the client side. Compute all order totals on the server/Supabase Edge Functions using database prices to prevent users from altering price payloads.
  - SQL Injection & XSS Protection: Use parameterized queries through Supabase SDK and sanitize all form fields (DOMPurify).
  - Session Protection: HttpOnly, Secure, SameSite=Strict cookie handling.
  - API Rate Limiting: Rate-limit authentication attempts and spin execution to block bot/brute-force attacks.

---

### 7. Footer & Developer Section
* Developer Profile Card:
  - Developer Logo: `<DevLogo />` (Placeholder ready for logo file upload)
  - Developer Name: MAN.DEV
  - Email: ahsansmit64@gmail.com
  - Portfolio: https://portfolio-4-jet-rho.vercel.app/
  - Fiverr: https://www.fiverr.com/mohammad_ahsan6/buying?source=avatar_menu_profile
  - LinkedIn: https://www.linkedin.com/in/muhammad-ahsan-622880409/
  - Instagram: https://www.instagram.com/man.devs/?hl=en'    first pic is the logo of the website and the second pic is the logo of the devs

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://muskii-shine.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5d5ff795-0a85-4fbd-a04d-7df564bd630d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
