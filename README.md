# 🚀 I Am Astronut — Space Mission Design Game

An interactive, web-based aerospace engineering and planetary exploration simulation built with real-time orbital physics, verified NASA telemetry, and photorealistic 3D WebGL terrain visualization.

Developed by **TEAM OVERRIDE**.

---

## 🌟 Key Features

- **Earth Staging & Cadet Progression:** Start on foot at **Kennedy Space Center (LC-39A)** as a Boy 👦 or Girl 👧 cadet. Locate 3 hidden rocket modules (*Cryogenic Fuselage*, *Propulsion Bell*, and *Guidance Avionics*) using holographic light pillars and distance radar to assemble your rocket and earn promotion to **Flight Astronaut**.
- **Dynamic Meteor Shower Hazards:** Relentless falling asteroids trigger as you explore for parts, featuring ground impact reticles, blast shockwaves, and a planetary deflector shield locking the rocket until meteors are evaded.
- **6 Verified NASA Planetary Destinations:** Authentic gravity ($g$), atmospheric composition, and surface coordinates sourced from NASA PDS archives:
  1. **Earth** — KSC Launch Complex 39A ($1.00g$)
  2. **Moon South Pole (Flagship)** — Malapert A Crater, $80.13^\circ\text{S}$ ($0.165g$)
  3. **The Moon** — Apollo 11 Sea of Tranquility ($0.165g$)
  4. **Mars** — Jezero Crater Delta ($0.38g$)
  5. **Europa** — Conamara Chaos Ice Sheet ($0.134g$)
  6. **Titan** — Kraken Mare Shoreline ($0.14g$)
- **Realistic 3D Surface Explorer (`[V]`):** Built with **Three.js WebGL**, allowing 360° terrain inspection and laser mineralogy spectrometer scans.
- **Indian National Flag (Tiranga 🇮🇳):** Featured on the rocket fuselage and spacesuit insignia, and plantable on every celestial body (`[F]`).
- **Gamification & Resilience:**
  - **Cadet Login & Hub:** Authenticated user accounts, guest passes, and offline classroom student keys.
  - **3 Difficulty Modes:** Easy (150 HP), Moderate (100 HP), and Difficult (75 HP).
  - **14 NASA Achievement Badges & 18 Mission Stars:** Saved permanently to `localStorage`.
  - **Non-Destructive Reset (`[X]`):** Respawn equipment pieces anytime without losing saved login credentials.

---

## 🎮 Controls

| Key | Action |
| :--- | :--- |
| `A` / `D` or `←` / `→` | Move Left / Right |
| `W` / `↑` / `Space` | Jump / Activate Jetpack |
| `E` / `Enter` | Collect Equipment / Assemble & Board Rocket |
| `F` | Plant Indian National Flag (Tiranga 🇮🇳) |
| `V` | Toggle Realistic 3D Planetary Environment View |
| `R` | Mount/Dismount Rover (or Respawn if KIA) |
| `X` | Reset Sector Equipment Hunt |
| `Esc` | Close Active Modals |

*(Full on-screen touch controls are automatically enabled on mobile devices.)*

---

## 🛠️ Tech Stack

- **Game Engine & Physics:** HTML5 Canvas 2D (60 FPS custom kinematics & particle system)
- **UI & Telemetry HUD:** React 18 (UMD) & Tailwind CSS
- **3D Visualization:** Three.js (WebGL shaders & procedural terrain)
- **Audio:** Web Audio API (procedural real-time sound synthesis)
- **Persistence & Offline:** LocalStorage API & Service Worker Progressive Web App (PWA)

---

## ⚡ Quick Start

No build tools or package installations required!

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari) or serve it with a local static server (e.g. VS Code Live Server).

---

## 👥 Team — TEAM OVERRIDE

- **Nagesh H** — *Team Owner & Lead Architect*
- **Aman Mitra** — *Core Team Member*
- **Meghana G K** — *Core Team Member*
- **Kiran Singh J** — *Core Team Member*
- **Someshwar H C** — *Core Team Member*
- **Nagashree** — *Core Team Member*
