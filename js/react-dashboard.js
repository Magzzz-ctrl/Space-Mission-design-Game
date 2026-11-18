// Project Horizons: Space Mission Design Game
// React 18 Unified HUD, Tactical Dashboard, Smooth Sci-Fi Cursor & Mission Command

(function() {
  'use strict';

  // React Helper Aliases
  const React = window.React;
  const ReactDOM = window.ReactDOM;

  if (!React || !ReactDOM) {
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        if (window.React && window.ReactDOM) initReactApp();
        else initStandaloneStarCursor();
      });
    } else {
      initStandaloneStarCursor();
    }
    return;
  }

  initReactApp();

  function initReactApp() {
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const h = React.createElement;

    // =========================================================================
    // STAR UTILITY: Crisp 4-Pointed & 5-Pointed Geometric Vector Stars
    // =========================================================================
    function drawStarPath(ctx, spikes, outerRadius, innerRadius) {
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();
    }

    // =========================================================================
    // COMPONENT 1: Cosmic Falling Stars Trail Cursor (Hardware-Accelerated 60-120 FPS)
    // =========================================================================
    function FallingStarsCursor() {
      const canvasRef = useRef(null);
      const isHoveredRef = useRef(false);
      const isClickingRef = useRef(false);
      const mousePos = useRef({ x: -100, y: -100 });
      const lastMousePos = useRef({ x: -100, y: -100 });
      const isVisibleRef = useRef(false);
      const starsRef = useRef([]);
      const animFrameRef = useRef(null);
      const coreRotation = useRef(0);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = window.innerWidth * dpr;
          canvas.height = window.innerHeight * dpr;
          ctx.resetTransform();
          ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize);

        document.body.classList.add('has-custom-cursor');

        // Celestial Falling Stars Color Palette
        const starPalette = [
          '#facc15', '#fde047', '#fbbf24', // Apollo Solar Gold
          '#00e5ff', '#38bdf8', '#67e8f9', // Cyber Celestial Cyan
          '#ffffff', '#f8fafc',             // Supernova Starlight White
          '#c084fc', '#f472b6'              // Deep Nebula Violet
        ];

        const spawnStarsAlongPath = (x1, y1, x2, y2, isClick = false) => {
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.hypot(dx, dy);
          const steps = isClick ? 1 : Math.max(1, Math.min(8, Math.floor(dist / 12)));

          for (let i = 0; i < steps; i++) {
            const t = steps === 1 ? 1 : i / steps;
            const px = x1 + dx * t;
            const py = y1 + dy * t;
            const count = isClick ? 1 : (dist > 30 ? 2 : 1);

            for (let c = 0; c < count; c++) {
              const swipeVx = (dx / Math.max(1, dist)) * Math.min(10, dist * 0.2);
              const swipeVy = (dy / Math.max(1, dist)) * Math.min(10, dist * 0.2);

              const vx = isClick 
                ? (Math.random() - 0.5) * 7.5 
                : (swipeVx * 0.16 + (Math.random() - 0.5) * 2.2);

              const vy = isClick 
                ? (Math.random() - 0.5) * 7.5 - 2.5 
                : (swipeVy * 0.16 - Math.random() * 2.2);

              starsRef.current.push({
                x: px + (Math.random() - 0.5) * 6,
                y: py + (Math.random() - 0.5) * 6,
                vx: vx,
                vy: vy,
                gravity: 0.13 + Math.random() * 0.08, // Gently falls downward behind the cursor
                size: isClick ? (4 + Math.random() * 7) : (3 + Math.random() * 5.5),
                color: starPalette[Math.floor(Math.random() * starPalette.length)],
                life: 1.0,
                maxLife: 1.0,
                decay: 0.018 + Math.random() * 0.018,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.16,
                spikes: Math.random() < 0.65 ? 4 : 5,
                twinkle: Math.random() * Math.PI * 2
              });
            }
          }

          if (starsRef.current.length > 200) {
            starsRef.current.splice(0, starsRef.current.length - 200);
          }
        };

        const onMouseMove = (e) => {
          const x = e.clientX;
          const y = e.clientY;
          if (!isVisibleRef.current) isVisibleRef.current = true;

          if (lastMousePos.current.x >= 0) {
            spawnStarsAlongPath(lastMousePos.current.x, lastMousePos.current.y, x, y);
          }

          lastMousePos.current.x = x;
          lastMousePos.current.y = y;
          mousePos.current.x = x;
          mousePos.current.y = y;

          const target = e.target;
          if (target) {
            const clickable = target.closest('button, a, input, select, .starmap-node, .pic-card, .clickable, .cursor-pointer, [role="button"]');
            isHoveredRef.current = !!clickable;
          }
        };

        const onMouseDown = (e) => {
          isClickingRef.current = true;
          // Celestial Starburst on click: 16 stars cascade outward and fall down
          for (let i = 0; i < 16; i++) {
            spawnStarsAlongPath(e.clientX, e.clientY, e.clientX, e.clientY, true);
          }
          if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
            window.soundEngine.playTargetLock();
          }
        };

        const onMouseUp = () => {
          isClickingRef.current = false;
        };

        const onMouseLeave = () => {
          isVisibleRef.current = false;
          lastMousePos.current = { x: -100, y: -100 };
        };

        const onMouseEnter = (e) => {
          isVisibleRef.current = true;
          lastMousePos.current = { x: e.clientX, y: e.clientY };
        };

        // Touch swipe support on tablets & phones
        const onTouchMove = (e) => {
          if (!e.touches || e.touches.length === 0) return;
          const touch = e.touches[0];
          const x = touch.clientX;
          const y = touch.clientY;
          isVisibleRef.current = true;

          if (lastMousePos.current.x >= 0) {
            spawnStarsAlongPath(lastMousePos.current.x, lastMousePos.current.y, x, y);
          }
          lastMousePos.current.x = x;
          lastMousePos.current.y = y;
          mousePos.current.x = x;
          mousePos.current.y = y;
        };

        const onTouchStart = (e) => {
          if (!e.touches || e.touches.length === 0) return;
          const touch = e.touches[0];
          lastMousePos.current.x = touch.clientX;
          lastMousePos.current.y = touch.clientY;
          mousePos.current.x = touch.clientX;
          mousePos.current.y = touch.clientY;
          for (let i = 0; i < 8; i++) {
            spawnStarsAlongPath(touch.clientX, touch.clientY, touch.clientX, touch.clientY, true);
          }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        document.documentElement.addEventListener('mouseenter', onMouseEnter);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });

        // High-Refresh Falling Stars Render Loop
        const renderLoop = () => {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

          // 1. Update and Render Falling Stars Trail in wake of cursor
          const stars = starsRef.current;
          for (let i = stars.length - 1; i >= 0; i--) {
            const s = stars[i];
            s.vy += s.gravity; // Gravity makes stars fall downward!
            s.vx *= 0.98;
            s.x += s.vx;
            s.y += s.vy;
            s.rot += s.rotSpeed;
            s.life -= s.decay;
            s.twinkle += 0.14;

            if (s.life <= 0 || s.y > window.innerHeight + 25) {
              stars.splice(i, 1);
              continue;
            }

            const alpha = Math.max(0, s.life) * (0.8 + 0.2 * Math.sin(s.twinkle));
            const rOuter = s.size * (0.45 + 0.55 * s.life);
            const rInner = rOuter * 0.35;

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 8;

            drawStarPath(ctx, s.spikes, rOuter, rInner);
            ctx.fill();

            // Luminous glistening white core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.5, rInner * 0.6), 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          // 2. Render Sleek Radiant Star Pointer at Cursor Tip (No Annoying Reticle!)
          if (isVisibleRef.current && mousePos.current.x >= 0) {
            coreRotation.current += 0.022;
            const mx = mousePos.current.x;
            const my = mousePos.current.y;
            const isHov = isHoveredRef.current;
            const isClick = isClickingRef.current;
            const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;

            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(coreRotation.current);

            const scale = isClick ? 0.75 : (isHov ? 1.35 : 1.0);
            const primaryColor = isClick ? '#facc15' : (isHov ? '#38bdf8' : '#00e5ff');

            // Soft celestial starlight halo
            const haloGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 18 * scale);
            haloGrad.addColorStop(0, primaryColor);
            haloGrad.addColorStop(0.35, isHov ? 'rgba(56, 189, 248, 0.45)' : 'rgba(0, 229, 255, 0.3)');
            haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
            ctx.fill();

            // 4-pointed radiant star spikes
            ctx.fillStyle = primaryColor;
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = 10;
            drawStarPath(ctx, 4, (9 + pulse * 2) * scale, (2.8 + pulse * 0.5) * scale);
            ctx.fill();

            // Brilliant white diamond star core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, (2.2 + pulse * 0.8) * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }

          animFrameRef.current = requestAnimationFrame(renderLoop);
        };

        animFrameRef.current = requestAnimationFrame(renderLoop);

        return () => {
          document.body.classList.remove('has-custom-cursor');
          window.removeEventListener('resize', resize);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mouseup', onMouseUp);
          document.documentElement.removeEventListener('mouseleave', onMouseLeave);
          document.documentElement.removeEventListener('mouseenter', onMouseEnter);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchstart', onTouchStart);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
      }, []);

      return h('canvas', {
        ref: canvasRef,
        id: 'cursor-star-canvas',
        className: 'fixed inset-0 pointer-events-none z-[999999] w-full h-full'
      });
    }

    // =========================================================================
    // COMPONENT 2: Top Minimalist Status HUD Bar (I Am Astronut)
    // Includes: Astronaut Callsign, Health Vital Bar, Difficulty Mode, 3D View, Radar & Telemetry
    // =========================================================================
    function TopHUD({ currentPlanet, starsCount, partsCount, telemetry, onOpenProfile, onOpenGateway, isAudioMuted, onToggleAudio, health = 100, maxHealth = 100, isDead = false, radarData = null, difficultyMode = 'moderate', onToggleDifficulty, onOpenRealisticEnv }) {
      const planet = PLANETARY_DESTINATIONS[currentPlanet] || PLANETARY_DESTINATIONS.earth;
      const stage = window.storageManager?.data?.characterStage || 'cadet';
      const gender = window.storageManager?.data?.characterGender || 'boy';
      const callsign = window.storageManager?.data?.profile?.callsign || 'Orion';
      const avatarIcon = stage === 'astronaut' ? '👨‍🚀' : (gender === 'girl' ? '👧' : '👦');
      const rankTitle = stage === 'astronaut' ? `CMDR. ${callsign}` : `CADET ${callsign}`;

      const handlePlantFlag = (e) => {
        e.stopPropagation();
        if (window.gameEngine && typeof window.gameEngine.plantIndianFlag === 'function') {
          window.gameEngine.plantIndianFlag();
        }
      };

      const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
      const diffMode = difficultyMode || 'moderate';
      const diffCfg = (window.GAME_DIFFICULTY_MODES && window.GAME_DIFFICULTY_MODES[diffMode]) || {
        name: diffMode.toUpperCase(),
        icon: '⚡',
        maxHealth: 100
      };

      return h('header', {
        className: 'absolute top-2 md:top-3 inset-x-2 md:inset-x-6 flex flex-wrap items-center justify-between gap-1.5 md:gap-2 z-30 pointer-events-none'
      }, [
        // Left: Game Branding, Callsign, Health & Difficulty Mode
        h('div', { key: 'left', className: 'flex flex-wrap items-center gap-1.5 md:gap-2 pointer-events-auto' }, [
          h('button', {
            onClick: onOpenProfile,
            className: 'flex items-center gap-2 px-2.5 py-1.5 rounded-full tactical-glass hover:border-cyan-400 transition-colors group cursor-pointer border border-cyan-500/30',
            title: 'Open Username Dashboard & Flight Records'
          }, [
            h('div', {
              className: 'w-7 h-7 rounded-full bg-slate-900 border border-cyan-400 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(6,182,212,0.6)] flex-shrink-0'
            }, avatarIcon),
            h('div', { className: 'flex flex-col text-left' }, [
              h('div', { className: 'flex items-center gap-1.5' }, [
                h('span', { className: 'text-[9px] font-mono tracking-widest text-cyan-400 uppercase leading-none group-hover:text-cyan-300 font-bold' },
                  rankTitle
                ),
                h('span', { className: 'text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-orbitron border border-amber-500/30' },
                  stage === 'astronaut' ? 'ASTRONAUT' : 'CADET'
                )
              ]),
              h('span', { className: 'font-orbitron font-bold text-xs md:text-sm text-slate-100 tracking-wider truncate max-w-[130px] sm:max-w-[180px]' },
                planet.name.toUpperCase()
              )
            ])
          ]),

          // Astronaut Vitals & Health Indicator
          h('div', {
            className: `flex items-center gap-2 px-2.5 py-1.5 rounded-full tactical-glass border transition-all ${
              isDead ? 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.7)]' : (healthPercent > 50 ? 'border-emerald-500/30' : 'border-red-500/50 bg-red-950/20 animate-pulse')
            }`
          }, [
            h('span', { className: `text-xs ${isDead ? 'animate-bounce' : ''}` }, isDead ? '💀' : '❤️'),
            h('div', { className: 'flex flex-col gap-0.5' }, [
              h('div', { className: 'flex items-center justify-between text-[9px] font-mono font-bold leading-none' }, [
                h('span', { className: isDead ? 'text-red-400 font-orbitron' : (healthPercent > 50 ? 'text-emerald-400' : 'text-amber-400') },
                  isDead ? 'KIA // 0 HP' : `${Math.round(health)}/${maxHealth} HP`
                )
              ]),
              h('div', { className: 'w-12 sm:w-16 h-1.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden' }, [
                h('div', {
                  className: `h-full rounded-full transition-all duration-300 ${
                    isDead ? 'bg-red-600' : (healthPercent > 50 ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : (healthPercent > 25 ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'))
                  }`,
                  style: { width: `${healthPercent}%` }
                })
              ])
            ])
          ]),

          // Three Game Difficulty Modes Switcher Button (User Requirement 10)
          h('button', {
            onClick: onToggleDifficulty,
            className: `flex items-center gap-1 px-2.5 py-1.5 rounded-full tactical-glass border transition-all cursor-pointer shadow-md ${
              diffMode === 'easy'
                ? 'border-emerald-400/60 bg-emerald-950/30 text-emerald-300 hover:border-emerald-300'
                : (diffMode === 'difficult'
                    ? 'border-red-500/60 bg-red-950/30 text-red-300 hover:border-red-400'
                    : 'border-amber-400/60 bg-amber-950/30 text-amber-300 hover:border-amber-300')
            }`,
            title: `Mode: ${diffCfg.name} (${diffCfg.maxHealth} HP) - Click to toggle Easy / Moderate / Difficult`
          }, [
            h('span', { className: 'text-xs' }, diffCfg.icon),
            h('span', { className: 'font-orbitron font-extrabold text-[9px] sm:text-[10px] tracking-wider' }, diffCfg.name)
          ]),

          // Realistic 3D Planetary Environment Toggle Button (Accessible on all viewports)
          h('button', {
            onClick: onOpenRealisticEnv,
            className: 'flex items-center gap-1 px-2.5 py-1.5 rounded-full tactical-glass border border-purple-400/50 hover:border-purple-300 hover:bg-purple-500/20 text-xs font-orbitron font-bold text-purple-300 hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.3)]',
            title: 'Explore Realistic 3D Planetary Environment & NASA Telemetry [Key V]'
          }, [
            h('span', { className: 'text-xs sm:text-sm' }, '🪐'),
            h('span', { className: 'text-[9px] sm:text-[10px] tracking-wider' }, '3D VIEW [V]')
          ]),

          // Quick Action: Plant Indian Flag on Surface (Requirement 6)
          h('button', {
            onClick: handlePlantFlag,
            className: 'hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full tactical-glass border border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/10 text-xs font-orbitron font-bold text-white transition-all cursor-pointer group shadow-[0_0_10px_rgba(249,115,22,0.2)]',
            title: 'Plant Indian National Flag (Tiranga) [Key F]'
          }, [
            h('span', { className: 'text-sm group-hover:scale-125 transition-transform' }, '🇮🇳'),
            h('span', { className: 'text-[11px] tracking-wider text-orange-200' }, 'PLANT FLAG [F]')
          ])
        ]),

        // Center: Equipment Navigation Radar Compass & Stars
        h('div', { key: 'center', className: 'hidden xl:flex items-center gap-3 px-4 py-1.5 rounded-full tactical-glass pointer-events-auto border border-cyan-500/20' }, [
          // Dynamic Equipment Locator Radar Compass (User Requirement: missing of rocket equipments so add rocket equipments to find by player)
          radarData?.nearestPartName ? h('div', {
            className: 'flex items-center gap-1.5 text-xs font-orbitron font-bold text-cyan-300'
          }, [
            h('span', { className: 'text-xs animate-spin', style: { animationDuration: '6s' } }, '🧭'),
            h('span', { className: 'text-[10px] tracking-wider' },
              radarData.direction >= 0
                ? `${radarData.nearestPartName.substring(0, 16).toUpperCase()} [${radarData.distanceM}m ▶]`
                : `[◀ ${radarData.distanceM}m] ${radarData.nearestPartName.substring(0, 16).toUpperCase()}`
            )
          ]) : h('div', { className: 'flex items-center gap-1.5 text-xs font-orbitron font-bold text-emerald-400' }, [
            h('span', null, '🚀'),
            h('span', { className: 'text-[10px]' }, 'ALL PARTS RECOVERED // BOARD ROCKET')
          ]),

          h('div', { className: 'w-px h-4 bg-slate-700' }),

          h('div', { className: 'flex items-center gap-1.5 text-xs font-orbitron font-bold text-amber-400' }, [
            h('span', null, '⭐'),
            h('span', null, `${starsCount}/18`)
          ]),

          h('div', { className: 'w-px h-4 bg-slate-700' }),

          h('div', { className: 'flex items-center gap-2' }, [
            h('span', { className: 'text-[10px] font-orbitron font-semibold text-slate-400 uppercase tracking-wider' }, 
              stage === 'cadet' && currentPlanet === 'earth' ? 'PARTS' : 'PAYLOAD'
            ),
            h('div', { className: 'flex items-center gap-1.5' }, [0, 1, 2].map(idx => {
              const isFound = idx < partsCount;
              return h('div', {
                key: idx,
                className: `w-2.5 h-2.5 rounded-full border transition-all duration-300 ${isFound ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_#00e5ff]' : 'bg-slate-800 border-slate-600'}`
              });
            })),
            // One-Click Equipment Reset Button (Preserves Credentials!)
            h('button', {
              onClick: () => {
                if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                  window.gameEngine.resetCurrentMission(false);
                }
              },
              className: 'flex items-center gap-1 px-2 py-0.5 ml-1 rounded-full bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-300 text-[10px] font-orbitron font-bold text-cyan-300 hover:text-white transition-all cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.3)]',
              title: 'Reset hidden rocket equipment pieces & restart hunt (keeps credentials saved!) [Key X]'
            }, [
              h('span', { className: 'text-[11px]' }, '🔄'),
              h('span', { className: 'text-[9px] tracking-wider' }, 'RESET')
            ])
          ])
        ]),

        // Right: Telemetry, Login / Cadet Gateway & Audio Controls
        h('div', { key: 'right', className: 'flex items-center gap-2 pointer-events-auto' }, [
          h('div', { className: 'px-3 py-1.5 rounded-full tactical-glass flex items-center gap-2 border border-slate-800' }, [
            h('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-ping' }),
            h('span', { className: 'text-[11px] font-mono font-medium text-slate-300' }, telemetry)
          ]),
          // Quick Reset Button (Visible on all screen sizes)
          h('button', {
            onClick: () => {
              if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                window.gameEngine.resetCurrentMission(false);
              }
            },
            'aria-label': 'Reset Sector Equipments',
            className: 'h-8 px-2.5 rounded-full tactical-glass flex items-center gap-1 text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
            title: 'Reset equipment pieces & relock rocket (preserves login!) [Key X]'
          }, [
            h('span', { className: 'text-xs' }, '🔄'),
            h('span', { className: 'hidden sm:inline font-orbitron text-[10px] font-bold' }, 'RESET')
          ]),
          h('button', {
            onClick: onOpenGateway,
            'aria-label': 'Open Cadet Login & Space Agency Gateway',
            className: 'h-8 px-2.5 rounded-full tactical-glass flex items-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer border border-cyan-500/30',
            title: 'Cadet Hub & Login Portal'
          }, [
            h('span', { className: 'text-xs' }, '🔑'),
            h('span', { className: 'hidden md:inline font-orbitron text-[10px] font-bold text-cyan-300' }, 'CADET HUB')
          ]),
          h('button', {
            onClick: onToggleAudio,
            'aria-label': 'Toggle Audio',
            className: 'w-8 h-8 rounded-full tactical-glass flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer border border-slate-800',
            title: isAudioMuted ? 'Unmute Audio' : 'Mute Audio'
          }, h('span', { className: 'text-xs' }, isAudioMuted ? '🔇' : '🔊'))
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 3: Clean Bottom Dashboard Navigation (Strictly 3 Buttons)
    // =========================================================================
    function BottomDashboardNav({ activeModal, onOpenStarMap, onOpenBadges, onOpenMissionBrief }) {
      return h('nav', {
        className: 'fixed bottom-4 left-1/2 -translate-x-1/2 bottom-nav-bar flex items-center gap-3 px-4 py-2 rounded-full z-40 pointer-events-auto react-nav',
        'aria-label': 'Primary Mission Controls'
      }, [
        h('button', {
          key: 'starmap',
          onClick: onOpenStarMap,
          className: `bottom-nav-btn group ${activeModal === 'starmap' ? 'active' : ''}`,
          title: 'Open Solar System & Trajectory Star Map'
        }, [
          h('span', { className: 'text-base group-hover:scale-110 transition-transform' }, '🗺️'),
          h('span', null, 'STAR MAP')
        ]),

        h('button', {
          key: 'badges',
          onClick: onOpenBadges,
          className: `bottom-nav-btn group ${activeModal === 'badges' ? 'active' : ''}`,
          title: 'Open NASA Achievement Badges Locker'
        }, [
          h('span', { className: 'text-base group-hover:scale-110 transition-transform' }, '🎖️'),
          h('span', null, 'BADGES')
        ]),

        h('button', {
          key: 'brief',
          onClick: onOpenMissionBrief,
          className: `bottom-nav-btn group ${activeModal === 'brief' ? 'active' : ''}`,
          title: 'View NASA Mission Brief & Objective Log'
        }, [
          h('span', { className: 'text-base group-hover:scale-110 transition-transform' }, '📋'),
          h('span', null, 'MISSION BRIEF')
        ]),

        h('button', {
          key: 'reset',
          onClick: () => {
            if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
              window.gameEngine.resetCurrentMission(false);
            }
          },
          className: 'bottom-nav-btn group text-cyan-300 hover:text-white',
          title: 'Reset sector equipments to search again (preserves login!)'
        }, [
          h('span', { className: 'text-base group-hover:rotate-180 transition-transform duration-500' }, '🔄'),
          h('span', null, 'RESET')
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 4: Tactical Star Map Modal (Free Fire-Style Drop + 4-Pillars)
    // 100% Fully Responsive Layout - Action Bar Pinned at Bottom, Never Cut Off!
    // =========================================================================
    function TacticalStarMapModal({ isOpen, onClose, currentPlanetId, onSelectDrop, onExecuteLaunch, difficultyMode, onChangeDifficulty }) {
      const [activeTab, setActiveTab] = useState('drop'); // 'drop', 'trajectory', 'collectibles'
      const [selectedPlanet, setSelectedPlanet] = useState(currentPlanetId || 'moon_south');
      const [trajPlaying, setTrajPlaying] = useState(true);
      const [selectedCollectible, setSelectedCollectible] = useState(null);

      const sphereCanvasRef = useRef(null);
      const trajCanvasRef = useRef(null);
      const animFrameRef = useRef(null);
      const angleRef = useRef(0);
      const trajProgressRef = useRef(0);

      // Reset selection when modal opens
      useEffect(() => {
        if (isOpen) {
          setSelectedPlanet(currentPlanetId || 'moon_south');
          if (window.soundEngine && typeof window.soundEngine.playRadarPing === 'function') {
            window.soundEngine.playRadarPing();
          }
        }
      }, [isOpen, currentPlanetId]);

      const planet = PLANETARY_DESTINATIONS[selectedPlanet] || PLANETARY_DESTINATIONS.moon_south;
      const isUnlocked = (window.storageManager?.data?.unlockedPlanets || ['earth']).includes(planet.id);
      const isCurrent = currentPlanetId === planet.id;

      // Rotating 3D Celestial Sphere Canvas
      useEffect(() => {
        if (!isOpen || activeTab !== 'drop' || !sphereCanvasRef.current) return;
        const canvas = sphereCanvasRef.current;
        const ctx = canvas.getContext('2d');

        const renderSphere = () => {
          angleRef.current += 0.015;
          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;
          const r = Math.min(w, h) * 0.36;

          ctx.clearRect(0, 0, w, h);

          // Tactical HUD Target Reticle
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx - r - 16, cy); ctx.lineTo(cx - r - 4, cy);
          ctx.moveTo(cx + r + 4, cy); ctx.lineTo(cx + r + 16, cy);
          ctx.moveTo(cx, cy - r - 16); ctx.lineTo(cx, cy - r - 4);
          ctx.moveTo(cx, cy + r + 4); ctx.lineTo(cx, cy + r + 16);
          ctx.stroke();

          // Planet Shaded Sphere
          const pGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.15, cx, cy, r);
          if (planet.id === 'earth') {
            pGrad.addColorStop(0, '#38bdf8'); pGrad.addColorStop(0.6, '#0284c7'); pGrad.addColorStop(1, '#082f49');
          } else if (planet.id === 'moon_south') {
            pGrad.addColorStop(0, '#a5f3fc'); pGrad.addColorStop(0.5, '#475569'); pGrad.addColorStop(1, '#020617');
          } else if (planet.id === 'moon') {
            pGrad.addColorStop(0, '#cbd5e1'); pGrad.addColorStop(0.7, '#64748b'); pGrad.addColorStop(1, '#1e293b');
          } else if (planet.id === 'mars') {
            pGrad.addColorStop(0, '#fb923c'); pGrad.addColorStop(0.7, '#c2410c'); pGrad.addColorStop(1, '#431407');
          } else if (planet.id === 'europa') {
            pGrad.addColorStop(0, '#e0f2fe'); pGrad.addColorStop(0.6, '#38bdf8'); pGrad.addColorStop(1, '#0369a1');
          } else {
            pGrad.addColorStop(0, '#fde047'); pGrad.addColorStop(0.6, '#d97706'); pGrad.addColorStop(1, '#451a03');
          }

          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          // Simulated Surface Features
          ctx.save();
          ctx.clip();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          for (let i = 0; i < 3; i++) {
            const rotX = cx + Math.sin(angleRef.current + i * 2) * 35;
            const rotY = cy + (i - 1) * 20;
            ctx.beginPath();
            ctx.ellipse(rotX, rotY, 20, 10, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Atmosphere Rim Glow
          ctx.strokeStyle = planet.id === 'moon_south' ? '#00e5ff' : 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          animFrameRef.current = requestAnimationFrame(renderSphere);
        };

        renderSphere();

        return () => {
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
      }, [isOpen, activeTab, planet]);

      // Orbital Trajectory Canvas Renderer (4-Pillars Mode)
      useEffect(() => {
        if (!isOpen || activeTab !== 'trajectory' || !trajCanvasRef.current) return;
        const canvas = trajCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth;
          canvas.height = Math.max(300, parent.clientHeight);
        }

        let frameId;
        const renderTraj = () => {
          if (trajPlaying) {
            trajProgressRef.current = (trajProgressRef.current + 0.006) % 1;
          }

          const w = canvas.width;
          const h = canvas.height;
          const cx = w * 0.35;
          const cy = h * 0.5;

          ctx.clearRect(0, 0, w, h);

          // Central Sun
          const sunGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 22);
          sunGrad.addColorStop(0, '#fef08a');
          sunGrad.addColorStop(0.5, '#eab308');
          sunGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.fill();

          // Departure Earth Orbit
          const rEarth = 75;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, rEarth, 0, Math.PI * 2);
          ctx.stroke();

          // Target Planet Orbit
          let rTarget = 145;
          if (planet.id === 'moon' || planet.id === 'moon_south') rTarget = 95;
          else if (planet.id === 'mars') rTarget = 135;
          else if (planet.id === 'europa') rTarget = 185;
          else if (planet.id === 'titan') rTarget = 225;

          ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
          ctx.beginPath();
          ctx.arc(cx, cy, rTarget, 0, Math.PI * 2);
          ctx.stroke();

          // Transfer Ellipse (Hohmann / BLT Trajectory Arc)
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.ellipse(cx + (rTarget - rEarth) / 2, cy, (rTarget + rEarth) / 2, (rTarget + rEarth) / 2.6, 0, 0, Math.PI);
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated Spacecraft along Transfer Arc
          const tAngle = Math.PI * (1 - trajProgressRef.current);
          const scX = cx + (rTarget - rEarth) / 2 + Math.cos(tAngle) * ((rTarget + rEarth) / 2);
          const scY = cy - Math.sin(tAngle) * ((rTarget + rEarth) / 2.6);

          // Spacecraft Flare
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(scX, scY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Thrust exhaust plume
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(scX, scY);
          ctx.lineTo(scX + Math.sin(tAngle) * 12, scY + Math.cos(tAngle) * 8);
          ctx.stroke();

          // HUD Coordinates overlay
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText(`Δv BURN VECTOR: ${planet.missionDesign?.trajectory?.deltaVRequired || '3.8 km/s'}`, 15, 25);
          ctx.fillText(`TRAJECTORY PHASE: ${(trajProgressRef.current * 100).toFixed(0)}%`, 15, 40);

          frameId = requestAnimationFrame(renderTraj);
        };

        renderTraj();

        return () => {
          if (frameId) cancelAnimationFrame(frameId);
        };
      }, [isOpen, activeTab, planet, trajPlaying]);

      if (!isOpen) return null;

      const nodes = [
        { id: 'earth', num: '01', name: 'EARTH', badge: 'LC-39A', sub: 'Apollo & Artemis Launch Complex • 1.0G', color: 'blue' },
        { id: 'moon_south', num: '02', name: 'MOON SOUTH POLE', badge: '⭐ NASA FLAGSHIP: 80°S MALAPERT A', sub: 'NASA CLPS IM-1 & Artemis Cryo Water Ice • 0.165G', color: 'cyan', highlight: true },
        { id: 'moon', num: '03', name: 'THE MOON', badge: 'APOLLO 11', sub: 'Sea of Tranquility • 0.165G Vacuum', color: 'slate' },
        { id: 'mars', num: '04', name: 'MARS', badge: 'JEZERO DELTA', sub: 'Perseverance & Ingenuity Ground • 0.38G', color: 'orange' },
        { id: 'europa', num: '05', name: 'EUROPA', badge: 'JUNO & CLIPPER', sub: 'Subsurface Ocean Ice Crust • 0.134G Cryogeysers', color: 'cyan' },
        { id: 'titan', num: '06', name: 'TITAN', badge: 'CASSINI-HUYGENS', sub: 'Kraken Mare Methane Sea • 0.14G Dense Atmosphere', color: 'amber' }
      ];

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-950/90 backdrop-blur-xl open pointer-events-auto'
      }, [
        h('div', {
          className: 'relative w-full max-w-5xl h-[92vh] max-h-[820px] tactical-glass rounded-2xl flex flex-col overflow-hidden corner-brackets border border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.9)]'
        }, [
          // Header Bar with Tab Buttons
          h('div', {
            key: 'header',
            className: 'px-4 py-3 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 flex-shrink-0'
          }, [
            h('div', { className: 'flex items-center gap-2' }, [
              h('span', { className: 'w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse' }),
              h('h2', { className: 'font-orbitron font-extrabold text-xs md:text-sm text-cyan-300 tracking-wider' },
                'I AM ASTRONUT // SOLAR SYSTEM EXPEDITION'
              )
            ]),

            // Mode Tabs
            h('div', { className: 'flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-orbitron font-bold' }, [
              h('button', {
                key: 'tab-drop',
                onClick: () => setActiveTab('drop'),
                className: `px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${activeTab === 'drop' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`
              }, '🎯 TACTICAL DROP'),
              h('button', {
                key: 'tab-traj',
                onClick: () => setActiveTab('trajectory'),
                className: `px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${activeTab === 'trajectory' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`
              }, '🚀 TRAJECTORY DESIGN'),
              h('button', {
                key: 'tab-coll',
                onClick: () => setActiveTab('collectibles'),
                className: `px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${activeTab === 'collectibles' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`
              }, '🪐 PLANET COLLECTIBLES')
            ]),

            h('button', {
              onClick: onClose,
              className: 'px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white font-orbitron text-xs transition-colors cursor-pointer'
            }, 'DISMISS [ESC]')
          ]),

          // TAB 1: Free Fire-Style Tactical Drop Zone (100% Fully Responsive Layout)
          activeTab === 'drop' && h('div', {
            key: 'view-drop',
            className: 'flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden min-h-0'
          }, [
            // Left Column: Verified Planetary Nodes List
            h('div', {
              className: 'lg:col-span-7 p-3 md:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-500/20 relative overflow-visible lg:overflow-hidden bg-slate-950/60 min-h-0'
            }, [
              // Three Game Difficulty Modes Selector (User Requirement: Easy, Moderate, Difficult)
              h('div', { className: 'mb-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-1.5 flex-shrink-0' }, [
                h('span', { className: 'text-[10px] font-orbitron font-bold text-slate-300 uppercase tracking-wider hidden sm:inline' }, 'MISSION DIFFICULTY:'),
                h('div', { className: 'flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end' }, [
                  { id: 'easy', label: 'EASY', icon: '🟢', hp: '150 HP' },
                  { id: 'moderate', label: 'MODERATE', icon: '🟡', hp: '100 HP' },
                  { id: 'difficult', label: 'DIFFICULT', icon: '🔴', hp: '75 HP' }
                ].map(m => {
                  const isActive = (difficultyMode || 'moderate') === m.id;
                  return h('button', {
                    key: m.id,
                    onClick: () => {
                      if (onChangeDifficulty) onChangeDifficulty(m.id);
                      if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
                        window.soundEngine.playTargetLock();
                      }
                    },
                    className: `px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      isActive
                        ? (m.id === 'easy' ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : (m.id === 'difficult' ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'))
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white'
                    }`
                  }, [
                    h('span', null, m.icon),
                    h('span', null, m.label),
                    h('span', { className: 'hidden md:inline text-[9px] opacity-75 font-mono' }, `(${m.hp})`)
                  ]);
                }))
              ]),

              h('div', { className: 'flex items-center justify-between mb-2 relative z-10 flex-shrink-0' }, [
                h('span', { className: 'text-[11px] font-orbitron font-bold text-cyan-400 tracking-widest uppercase' },
                  'SELECT DROP SECTOR [6 NASA NODES]'
                ),
                h('span', { className: 'text-[10px] font-mono text-slate-400' }, 'HELIOCENTRIC COORDINATES')
              ]),

              // Scrollable Nodes Container
              h('div', { className: 'space-y-2 overflow-y-auto pr-1 flex-1 min-h-0' }, nodes.map(n => {
                const nodePlanet = PLANETARY_DESTINATIONS[n.id];
                const unlocked = (window.storageManager?.data?.unlockedPlanets || ['earth']).includes(n.id);
                const isSelected = selectedPlanet === n.id;

                return h('div', {
                  key: n.id,
                  onClick: () => {
                    setSelectedPlanet(n.id);
                    if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
                      window.soundEngine.playTargetLock();
                    }
                  },
                  className: `p-2.5 rounded-xl tactical-glass transition-all flex items-center justify-between group cursor-pointer border ${
                    isSelected
                      ? (n.highlight ? 'border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]')
                      : (n.highlight ? 'border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-400' : 'border-slate-800 hover:border-slate-600')
                  } ${!unlocked ? 'opacity-60' : ''}`
                }, [
                  h('div', { className: 'flex items-center gap-3' }, [
                    h('div', {
                      className: `w-9 h-9 rounded-full flex items-center justify-center font-orbitron font-bold text-xs ${n.highlight ? 'bg-cyan-500/30 border border-cyan-300 text-cyan-200' : 'bg-slate-800 border border-slate-700 text-slate-300'}`
                    }, n.num),
                    h('div', null, [
                      h('div', { className: 'flex items-center gap-2' }, [
                        h('h3', { className: `font-orbitron font-bold text-xs md:text-sm ${isSelected ? 'text-cyan-300' : 'text-slate-100 group-hover:text-cyan-300'} transition-colors` }, n.name),
                        h('span', { className: `text-[9px] font-mono px-1.5 py-0.5 rounded ${n.highlight ? 'bg-cyan-900/90 text-cyan-300 font-bold border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'bg-slate-800 text-slate-300'}` }, n.badge)
                      ]),
                      h('p', { className: 'text-[11px] text-slate-400 truncate max-w-[280px] md:max-w-[360px]' }, n.sub)
                    ])
                  ]),
                  h('div', { className: 'text-right' }, [
                    unlocked
                      ? h('span', { className: 'text-xs text-emerald-400 font-bold font-mono' }, 'READY')
                      : h('span', { className: 'text-xs text-slate-500 font-bold font-mono' }, 'LOCKED')
                  ])
                ]);
              })),

              h('div', { className: 'mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500 flex-shrink-0' }, [
                h('span', null, 'NASA TRAJECTORY LOCK: ONLINE'),
                h('span', null, 'SYSTEM V2.6 // ARTEMIS SYNCHRONIZED')
              ])
            ]),

            // Right Column: Telemetry & Tactical Drop Button (100% RESPONSIVE - NEVER CUT OFF!)
            h('div', {
              className: 'lg:col-span-5 p-3 md:p-4 flex flex-col justify-between bg-slate-900/50 min-h-0 relative flex-1'
            }, [
              // Scrollable Upper Telemetry Content
              h('div', {
                className: 'modal-telemetry-scroll space-y-2 pr-1 overflow-y-auto max-h-[50vh] lg:max-h-none flex-1 min-h-0'
              }, [
                // 3D Canvas Sphere
                h('div', { className: 'flex flex-col items-center justify-center py-1 relative' }, [
                  h('canvas', { ref: sphereCanvasRef, width: 120, height: 120, className: 'w-24 h-24 md:w-28 md:h-28 mx-auto block' }),
                  h('div', { className: 'text-center mt-0.5' }, [
                    h('h3', { className: 'font-orbitron font-black text-sm md:text-base text-cyan-300 tracking-wider' }, planet.name),
                    h('p', { className: 'text-[10px] md:text-xs font-mono text-slate-400 mt-0.5' }, `${planet.historicalProgram} (${planet.historicalYear})`)
                  ])
                ]),

                // Special NASA Lunar South Pole Flagship Highlight Card (User Requirement: Landing Southern Part of the Moon by NASA)
                selectedPlanet === 'moon_south' && h('div', {
                  className: 'p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/80 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)] space-y-1'
                }, [
                  h('div', { className: 'flex items-center gap-1.5' }, [
                    h('span', { className: 'text-sm animate-bounce' }, '🌕'),
                    h('span', { className: 'text-[10px] font-orbitron font-extrabold text-cyan-300 tracking-wider uppercase' },
                      'NASA FLAGSHIP // LUNAR SOUTH POLE (80°S)'
                    )
                  ]),
                  h('p', { className: 'text-[10px] text-slate-200 leading-snug' },
                    'NASA CLPS (IM-1 Odysseus) & Artemis III historic landing at Malapert A crater rim. Permanently shadowed craters harbor ancient cryogenic water ice for rocket propellant manufacture!'
                  )
                ]),

                // 4 Grid Stats (Compact & Crisp)
                h('div', { className: 'grid grid-cols-2 gap-1.5 text-[10px] md:text-xs font-mono' }, [
                  h('div', { className: 'p-1.5 rounded-lg bg-slate-950/70 border border-slate-800' }, [
                    h('span', { className: 'text-[9px] text-slate-500 block' }, 'SURFACE GRAVITY'),
                    h('span', { className: 'text-cyan-300 font-bold' }, `${planet.gravity} m/s² (${(planet.gravity / 9.8).toFixed(2)}g)`)
                  ]),
                  h('div', { className: 'p-1.5 rounded-lg bg-slate-950/70 border border-slate-800' }, [
                    h('span', { className: 'text-[9px] text-slate-500 block' }, 'ATMOSPHERIC PRESSURE'),
                    h('span', { className: 'text-cyan-300 font-bold truncate block' }, planet.atmosphere)
                  ]),
                  h('div', { className: 'p-1.5 rounded-lg bg-slate-950/70 border border-slate-800' }, [
                    h('span', { className: 'text-[9px] text-slate-500 block' }, 'SURFACE TEMPERATURE'),
                    h('span', { className: 'text-amber-400 font-bold truncate block' }, planet.surfaceTemp)
                  ]),
                  h('div', { className: 'p-1.5 rounded-lg bg-slate-950/70 border border-slate-800' }, [
                    h('span', { className: 'text-[9px] text-slate-500 block' }, 'SOLAR DISTANCE'),
                    h('span', { className: 'text-cyan-300 font-bold' }, planet.distanceFromSun)
                  ])
                ]),

                // Mission Directive Box
                h('div', { className: 'p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-[10px] md:text-[11px]' }, [
                  h('span', { className: 'text-[9px] font-orbitron font-bold text-cyan-400 block uppercase tracking-wide mb-0.5' }, 'MISSION DIRECTIVE'),
                  h('p', { className: 'text-slate-300 leading-snug text-[10px] md:text-[11px]' }, planet.missionBrief?.directive)
                ]),

                // Asteroid Shower Hazard & Deflector Lockout Card (Clean Automatic Alert)
                h('div', {
                  className: 'p-2.5 rounded-xl bg-slate-950/90 border border-red-500/40 text-[10px] md:text-[11px] shadow-[0_0_12px_rgba(239,68,68,0.2)] space-y-1'
                }, [
                  h('div', { className: 'flex items-center justify-between' }, [
                    h('div', { className: 'flex items-center gap-1.5' }, [
                      h('span', { className: 'w-2 h-2 rounded-full bg-red-500 animate-ping' }),
                      h('span', { className: 'text-[10px] font-orbitron font-bold text-red-400 uppercase tracking-wider' },
                        '☄️ AUTOMATIC METEOR DEFENSE'
                      )
                    ]),
                    h('span', { className: 'text-[8px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold' },
                      'DEFLECTOR ACTIVE'
                    )
                  ]),
                  h('p', { className: 'text-[10px] text-slate-300 leading-snug' },
                    'Falling asteroids automatically target the player during equipment recovery! Dodge and escape all incoming asteroids to drop the rocket deflector shield and unlock takeoff.'
                  )
                ])
              ]),

              // Fixed Action Bar - Pinned at bottom so it NEVER gets cut off on any device!
              h('div', {
                className: 'modal-pinned-action-bar flex-shrink-0 pt-2 pb-1 border-t border-slate-800 bg-slate-950/98 sticky bottom-0 z-30 shadow-lg'
              }, [
                h('button', {
                  onClick: () => {
                    if (isUnlocked) onSelectDrop(planet.id);
                  },
                  disabled: !isUnlocked,
                  className: `w-full py-2.5 md:py-3 px-4 rounded-xl font-orbitron font-bold text-xs md:text-sm tracking-wider text-white transition-all cursor-pointer ${!isUnlocked ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'btn-tactical-drop shadow-[0_0_20px_rgba(14,165,233,0.6)] hover:scale-[1.01]'}`
                }, !isUnlocked
                  ? '🔒 LOCKED // LAUNCH ROCKET FROM EARTH FIRST'
                  : isCurrent
                    ? 'RE-ENTER PLANETARY DROP ZONE'
                    : 'INITIATE TACTICAL DROP // COMMENCE DESCENT'
                )
              ])
            ])
          ]),

          // TAB 2: 4-Pillars Trajectory Design (Pic 2 Specification)
          activeTab === 'trajectory' && h('div', {
            key: 'view-traj',
            className: 'flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0 bg-slate-950/70'
          }, [
            // Left: Orbit Canvas
            h('div', {
              className: 'lg:col-span-7 p-4 md:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-cyan-500/20 relative min-h-0'
            }, [
              h('div', { className: 'flex items-center justify-between mb-2 z-10 flex-shrink-0' }, [
                h('div', { className: 'flex items-center gap-2' }, [
                  h('span', { className: 'text-[10px] font-orbitron font-bold text-cyan-400 uppercase' }, 'DESTINATION:'),
                  h('select', {
                    value: selectedPlanet,
                    onChange: (e) => setSelectedPlanet(e.target.value),
                    className: 'bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-orbitron rounded px-2 py-1 focus:outline-none cursor-pointer'
                  }, nodes.map(n => h('option', { key: n.id, value: n.id }, n.name)))
                ]),
                h('button', {
                  onClick: () => setTrajPlaying(!trajPlaying),
                  className: 'px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-orbitron text-slate-300 hover:text-white transition-colors cursor-pointer'
                }, trajPlaying ? 'PAUSE TRAJECTORY' : 'PLAY TRAJECTORY')
              ]),

              // Canvas container
              h('div', { className: 'relative w-full flex-1 min-h-[220px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90' }, [
                h('canvas', { ref: trajCanvasRef, className: 'w-full h-full block' }),
                h('div', { className: 'absolute bottom-2 left-3 text-[10px] font-mono text-slate-500' },
                  'SOLAR SYSTEM SCALE: HELIOCENTRIC ORBITAL PLANE (J2000)'
                )
              ]),

              // Launch button
              h('div', { className: 'mt-2 pt-2 border-t border-slate-800 flex-shrink-0' }, [
                h('button', {
                  onClick: () => onExecuteLaunch(planet.id),
                  className: 'w-full py-2.5 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider text-white btn-tactical-drop cursor-pointer'
                }, 'EXECUTE TRANS-PLANETARY INJECTION BURN (Δv)')
              ])
            ]),

            // Right: The 4 Pillars
            h('div', { className: 'lg:col-span-5 p-4 md:p-5 overflow-y-auto space-y-3 bg-slate-900/50 min-h-0' }, [
              // Pillar 1: Concept
              h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-cyan-500/25' }, [
                h('h4', { className: 'font-orbitron font-bold text-xs text-cyan-300 uppercase mb-1' }, '🎯 1. MISSION CONCEPT'),
                h('p', { className: 'text-xs font-bold text-slate-200' }, planet.missionDesign?.concept?.title || 'Mission Staging'),
                h('p', { className: 'text-[11px] text-slate-400 mt-1 leading-relaxed' }, planet.missionDesign?.concept?.objective),
                h('div', { className: 'mt-2 text-[10px] font-mono text-slate-300 border-t border-slate-800 pt-1.5 space-y-0.5' }, [
                  h('div', null, [h('span', { className: 'text-slate-500' }, 'PAYLOAD: '), planet.missionDesign?.concept?.payload]),
                  h('div', null, [h('span', { className: 'text-slate-500' }, 'ORBIT: '), planet.missionDesign?.concept?.targetOrbit])
                ])
              ]),

              // Pillar 2: Trajectory
              h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-blue-500/25' }, [
                h('h4', { className: 'font-orbitron font-bold text-xs text-blue-300 uppercase mb-1' }, '🚀 2. ORBITAL TRAJECTORIES'),
                h('p', { className: 'text-xs font-bold text-slate-200' }, planet.missionDesign?.trajectory?.type),
                h('div', { className: 'grid grid-cols-2 gap-2 mt-2 text-[10px] font-mono text-slate-300' }, [
                  h('div', { className: 'p-1.5 rounded bg-slate-900 border border-slate-800' }, [
                    h('span', { className: 'text-slate-500 block' }, 'REQUIRED Δv'),
                    h('span', { className: 'text-cyan-300 font-bold' }, planet.missionDesign?.trajectory?.deltaVRequired)
                  ]),
                  h('div', { className: 'p-1.5 rounded bg-slate-900 border border-slate-800' }, [
                    h('span', { className: 'text-slate-500 block' }, 'TRANSIT TIME'),
                    h('span', { className: 'text-amber-400 font-bold' }, planet.missionDesign?.trajectory?.transitTime || '3.2 Days')
                  ])
                ])
              ]),

              // Pillar 3: Timeline
              h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-emerald-500/25' }, [
                h('h4', { className: 'font-orbitron font-bold text-xs text-emerald-300 uppercase mb-1.5' }, '⏱️ 3. MISSION TIMELINE'),
                h('div', { className: 'space-y-1.5' }, (planet.missionDesign?.timeline || []).map((t, idx) => h('div', {
                  key: idx,
                  className: 'p-1.5 rounded bg-slate-900/70 border border-slate-800 flex items-start gap-2 text-[10px]'
                }, [
                  h('span', { className: 'font-mono text-cyan-400 font-bold flex-shrink-0' }, t.time),
                  h('span', { className: 'text-slate-300 flex-1 leading-snug' }, t.event),
                  h('span', { className: `text-[9px] font-bold ${t.status === 'COMPLETE' ? 'text-emerald-400' : 'text-amber-400'}` }, t.status)
                ])))
              ])
            ])
          ]),

          // TAB 3: Solar System Collectibles (Pic 1 Inspired)
          activeTab === 'collectibles' && h('div', {
            key: 'view-coll',
            className: 'flex-1 p-4 md:p-6 overflow-y-auto bg-slate-950/70 min-h-0'
          }, [
            h('div', { className: 'mb-4 flex items-center justify-between' }, [
              h('h3', { className: 'font-orbitron font-bold text-xs md:text-sm text-cyan-300 uppercase tracking-wider' },
                'NASA SOLAR SYSTEM EXPLORATION & CELESTIAL ARCHIVE [NASA RESEARCH CENTERS]'
              ),
              h('span', { className: 'text-[11px] font-mono text-slate-400' }, '14 CELESTIAL SPECIMENS')
            ]),

            // Cards Grid
            h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5' },
              SOLAR_SYSTEM_COLLECTIBLES.map(item => h('div', {
                key: item.id,
                onClick: () => setSelectedCollectible(item),
                className: 'pic-card p-3 rounded-xl flex flex-col items-center justify-between text-center group cursor-pointer transition-transform hover:scale-105 border border-slate-800 hover:border-cyan-400'
              }, [
                h('div', {
                  className: 'w-16 h-16 rounded-full my-2 border border-slate-700 shadow-lg group-hover:border-cyan-400 transition-colors',
                  style: {
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${item.color} 50%, #020617 100%)`,
                    boxShadow: `0 0 16px ${item.glowColor || 'rgba(6, 182, 212, 0.4)'}`
                  }
                }),
                h('h4', { className: 'font-orbitron font-bold text-xs text-white group-hover:text-cyan-300' }, item.name),
                h('span', { className: 'text-[9px] font-mono text-slate-400 block mt-0.5' }, item.type),
                h('span', { className: 'text-[9px] font-mono text-cyan-400 mt-2 block' }, item.distanceAU)
              ]))
            )
          ])
        ]),

        // Collectible Card Modal
        selectedCollectible && h('div', {
          className: 'fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl pointer-events-auto'
        }, [
          h('div', { className: 'relative w-full max-w-md tactical-glass rounded-2xl p-6 border border-cyan-500/40' }, [
            h('div', { className: 'flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3' }, [
              h('div', null, [
                h('span', { className: 'text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-widest' }, selectedCollectible.type),
                h('h3', { className: 'font-orbitron font-black text-xl text-white' }, selectedCollectible.name)
              ]),
              h('button', {
                onClick: () => setSelectedCollectible(null),
                className: 'text-slate-400 hover:text-white font-orbitron text-xs cursor-pointer'
              }, '✕')
            ]),

            h('div', { className: 'flex justify-center my-3' }, [
              h('div', {
                className: 'w-28 h-28 rounded-full border-2 border-slate-600',
                style: {
                  background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${selectedCollectible.color} 50%, #020617 100%)`,
                  boxShadow: `0 0 25px ${selectedCollectible.glowColor || 'rgba(6, 182, 212, 0.5)'}`
                }
              })
            ]),

            h('div', { className: 'grid grid-cols-2 gap-2 text-xs font-mono mb-3' }, [
              h('div', { className: 'p-2 rounded bg-slate-900 border border-slate-800' }, [
                h('span', { className: 'text-[9px] text-slate-500 block' }, 'DISTANCE FROM SUN'),
                h('span', { className: 'text-cyan-300 font-bold' }, selectedCollectible.distanceAU)
              ]),
              h('div', { className: 'p-2 rounded bg-slate-900 border border-slate-800' }, [
                h('span', { className: 'text-[9px] text-slate-500 block' }, 'DIAMETER'),
                h('span', { className: 'text-slate-200 font-bold' }, selectedCollectible.diameterKm)
              ]),
              h('div', { className: 'p-2 rounded bg-slate-900 border border-slate-800' }, [
                h('span', { className: 'text-[9px] text-slate-500 block' }, 'MASS'),
                h('span', { className: 'text-slate-200 font-bold truncate block' }, selectedCollectible.mass)
              ]),
              h('div', { className: 'p-2 rounded bg-slate-900 border border-slate-800' }, [
                h('span', { className: 'text-[9px] text-slate-500 block' }, 'SURFACE TEMP'),
                h('span', { className: 'text-amber-400 font-bold' }, selectedCollectible.surfaceTemp)
              ])
            ]),

            h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-3' }, [
              h('span', { className: 'text-[10px] font-orbitron font-bold text-amber-400 block mb-1' }, 'EDUCATIONAL FUN FACT'),
              h('p', null, selectedCollectible.funFact)
            ]),

            h('div', { className: 'text-[10px] font-mono text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pt-1 border-t border-slate-800' }, [
              h('div', null, [
                h('span', { className: 'text-slate-500 font-bold' }, 'NASA RESEARCH CENTER: '),
                h('span', { className: 'text-amber-300 font-bold' }, selectedCollectible.researchCenter || 'NASA Jet Propulsion Laboratory')
              ]),
              h('div', null, [
                h('span', { className: 'text-slate-500 font-bold' }, 'MISSIONS: '),
                h('span', { className: 'text-cyan-300' }, selectedCollectible.nasaMissions)
              ])
            ])
          ])
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 5: NASA Badges Locker Modal (With Lunar South Pole Badge!)
    // =========================================================================
    function BadgesModal({ isOpen, onClose }) {
      const [filter, setFilter] = useState('ALL');

      if (!isOpen) return null;

      const earnedIds = window.storageManager?.data?.badges || [];
      const allBadges = Object.values(NASA_BADGES);

      const filteredBadges = allBadges.filter(b => {
        if (filter === 'UNLOCKED') return earnedIds.includes(b.id);
        if (filter === 'LOCKED') return !earnedIds.includes(b.id);
        return true;
      });

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-xl open pointer-events-auto'
      }, [
        h('div', {
          className: 'relative w-full max-w-4xl h-[90vh] max-h-[760px] tactical-glass rounded-2xl flex flex-col overflow-hidden corner-brackets border border-cyan-500/40 shadow-2xl'
        }, [
          // Header
          h('div', { className: 'px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/80 flex-shrink-0' }, [
            h('div', null, [
              h('h3', { className: 'font-orbitron font-extrabold text-sm md:text-base text-cyan-300 tracking-wider' }, 'NASA MISSION BADGES LOCKER'),
              h('p', { className: 'text-xs text-slate-400 mt-0.5' }, `ACHIEVEMENTS: ${earnedIds.length} OF ${allBadges.length} MILESTONES UNLOCKED`)
            ]),
            h('button', {
              onClick: onClose,
              className: 'px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white font-orbitron text-xs cursor-pointer'
            }, '✕ [ESC]')
          ]),

          // Filter bar & Progress
          h('div', { className: 'px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 flex-shrink-0' }, [
            h('div', { className: 'flex items-center gap-2' }, ['ALL', 'UNLOCKED', 'LOCKED'].map(f => h('button', {
              key: f,
              onClick: () => setFilter(f),
              className: `px-3 py-1 rounded-md text-xs font-orbitron font-bold cursor-pointer transition-colors ${filter === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'text-slate-400 hover:text-white'}`
            }, f))),
            h('div', { className: 'flex items-center gap-2 text-xs font-mono text-cyan-400' }, [
              h('div', { className: 'w-24 h-2 bg-slate-800 rounded-full overflow-hidden' }, [
                h('div', {
                  className: 'h-full bg-cyan-400 rounded-full transition-all duration-500',
                  style: { width: `${(earnedIds.length / allBadges.length) * 100}%` }
                })
              ]),
              h('span', null, `${Math.round((earnedIds.length / allBadges.length) * 100)}%`)
            ])
          ]),

          // Badges Grid
          h('div', { className: 'p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4' }, filteredBadges.map(b => {
            const isUnlocked = earnedIds.includes(b.id);
            return h('div', {
              key: b.id,
              className: `p-4 rounded-xl border flex items-start gap-4 transition-all ${isUnlocked ? 'tactical-glass border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-900/40 border-slate-800/80 opacity-60'}`
            }, [
              h('div', {
                className: `w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border ${isUnlocked ? 'border-cyan-400 shadow-[0_0_10px_#00e5ff]' : 'border-slate-700 grayscale'}`,
                dangerouslySetInnerHTML: { __html: b.iconSvg }
              }),
              h('div', { className: 'flex-1 min-w-0' }, [
                h('div', { className: 'flex items-center justify-between' }, [
                  h('h4', { className: `font-orbitron font-bold text-xs ${isUnlocked ? 'text-white' : 'text-slate-400'}` }, b.title),
                  h('span', { className: `text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}` },
                    isUnlocked ? 'ACQUIRED' : 'LOCKED'
                  )
                ]),
                h('span', { className: 'text-[10px] font-mono text-cyan-400 block mt-0.5' }, `${b.program} • ${b.category}`),
                h('p', { className: 'text-xs text-slate-400 mt-1 leading-snug' }, b.desc)
              ])
            ]);
          }))
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 6: Mission Briefing Modal
    // =========================================================================
    function MissionBriefModal({ isOpen, onClose, currentPlanetId }) {
      if (!isOpen) return null;
      const planet = PLANETARY_DESTINATIONS[currentPlanetId] || PLANETARY_DESTINATIONS.earth;
      const brief = planet.missionBrief;

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl open pointer-events-auto'
      }, [
        h('div', {
          className: 'relative w-full max-w-2xl max-h-[85vh] tactical-glass rounded-2xl p-6 overflow-y-auto corner-brackets border border-cyan-500/40 shadow-2xl'
        }, [
          h('div', { className: 'flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4' }, [
            h('div', null, [
              h('span', { className: 'text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-widest' }, 'NASA FLIGHT TELEMETRY ARCHIVE'),
              h('h3', { className: 'font-orbitron font-black text-lg text-white' }, brief.title)
            ]),
            h('button', {
              onClick: onClose,
              className: 'text-slate-400 hover:text-white font-orbitron text-xs cursor-pointer'
            }, '✕ [ESC]')
          ]),

          h('div', { className: 'space-y-4 text-xs' }, [
            h('div', { className: 'p-3 rounded-xl bg-slate-900/80 border border-slate-800' }, [
              h('h4', { className: 'font-orbitron font-bold text-xs text-cyan-300 mb-1' }, 'PRIMARY OPERATIONAL DIRECTIVE'),
              h('p', { className: 'text-slate-300 leading-relaxed' }, brief.directive)
            ]),

            h('div', { className: 'p-3 rounded-xl bg-slate-900/80 border border-slate-800' }, [
              h('h4', { className: 'font-orbitron font-bold text-xs text-amber-300 mb-1' }, 'VERIFIED HISTORICAL RECORD'),
              h('p', { className: 'text-slate-400 leading-relaxed' }, brief.historicalRecord)
            ]),

            h('div', { className: 'p-3 rounded-xl bg-slate-900/80 border border-slate-800' }, [
              h('h4', { className: 'font-orbitron font-bold text-xs text-emerald-300 mb-1' }, 'SCIENTIFIC TARGET'),
              h('p', { className: 'text-slate-300 leading-relaxed' }, brief.scientificTarget)
            ]),

            h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-slate-400 font-mono text-[11px]' }, [
              h('div', null, [h('span', { className: 'text-cyan-400' }, 'PROGRAM: '), planet.historicalProgram]),
              h('div', null, [h('span', { className: 'text-cyan-400' }, 'COORDINATES: '), planet.coordinates]),
              h('div', null, [h('span', { className: 'text-cyan-400' }, 'SURFACE GRAVITY: '), `${planet.gravity} m/s²`]),
              h('div', null, [h('span', { className: 'text-cyan-400' }, 'ATMOSPHERE: '), planet.atmosphere])
            ])
          ]),

          h('div', { className: 'mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3' }, [
            h('button', {
              onClick: () => {
                if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                  window.gameEngine.resetCurrentMission(false);
                }
                onClose();
              },
              className: 'px-4 py-2 rounded-xl font-orbitron text-xs text-cyan-300 hover:text-white border border-cyan-500/40 hover:bg-cyan-500/20 cursor-pointer flex items-center gap-1.5 transition-colors',
              title: 'Respawn 3 rocket equipment pieces to search again (keeps credentials saved!)'
            }, [
              h('span', null, '🔄'),
              h('span', null, 'RESET SECTOR EQUIPMENTS')
            ]),
            h('button', {
              onClick: onClose,
              className: 'px-5 py-2 rounded-xl font-orbitron font-bold text-xs text-white btn-tactical-drop cursor-pointer'
            }, 'RETURN TO SURFACE EVA')
          ])
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 7: Username Dashboard & Flight Dossier Modal (Requirement 3)
    // =========================================================================
    function UsernameDashboardModal({ isOpen, onClose, onSave, onOpenAuth }) {
      const [callsign, setCallsign] = useState('');
      const [gender, setGender] = useState('boy');
      const [stage, setStage] = useState('cadet');
      const [suitColor, setSuitColor] = useState('white');
      const [visorTint, setVisorTint] = useState('gold');
      const [currentUser, setCurrentUser] = useState(null);
      const [plantedFlags, setPlantedFlags] = useState({});

      useEffect(() => {
        if (isOpen && window.storageManager?.data) {
          const d = window.storageManager.data;
          setCallsign(d.profile?.callsign || 'Orion');
          setGender(d.characterGender || 'boy');
          setStage(d.characterStage || 'cadet');
          setSuitColor(d.profile?.suitColor || 'white');
          setVisorTint(d.profile?.visorTint || 'gold');
          setCurrentUser(d.currentUser || { username: 'Cadet Orion', isGuest: true });
          setPlantedFlags(d.plantedFlags || {});
        }
      }, [isOpen]);

      if (!isOpen) return null;

      const handleSave = () => {
        const trimmed = callsign.trim() || 'Orion';
        if (window.storageManager) {
          window.storageManager.setProfile({
            callsign: trimmed,
            suitColor,
            visorTint
          });
          window.storageManager.setCadetGender(gender);
        }
        if (window.gameEngine && window.gameEngine.player) {
          window.gameEngine.player.gender = gender;
          window.gameEngine.player.setProfile({
            callsign: trimmed,
            suitColor,
            visorTint
          });
        }
        if (onSave) onSave({ callsign: trimmed, suitColor, visorTint, gender });
        onClose();
        if (window.gameEngine && typeof window.gameEngine.showToast === 'function') {
          window.gameEngine.showToast('PROFILE SYNCHRONIZED', `Callsign: ${trimmed} • Persona: ${gender === 'girl' ? 'Girl Cadet' : 'Boy Cadet'}`);
        }
      };

      const handleGenderChange = (newGender) => {
        setGender(newGender);
        if (window.storageManager) {
          window.storageManager.setCadetGender(newGender);
        }
        if (window.gameEngine && window.gameEngine.player) {
          window.gameEngine.player.gender = newGender;
        }
      };

      const handlePlantFlagNow = () => {
        if (window.gameEngine && typeof window.gameEngine.plantIndianFlag === 'function') {
          window.gameEngine.plantIndianFlag();
          setPlantedFlags({ ...(window.storageManager?.data?.plantedFlags || {}) });
        }
      };

      const handleLogout = () => {
        if (window.storageManager) {
          window.storageManager.logout();
        }
        onClose();
        if (onOpenAuth) onOpenAuth();
      };

      const totalStars = window.storageManager?.data?.totalStars || 0;
      const badgesCount = (window.storageManager?.data?.unlockedBadges || []).length;
      const unlockedCount = (window.storageManager?.data?.unlockedPlanets || ['earth']).length;
      const earthPartsFound = (window.storageManager?.data?.partsCollected?.earth || []).length;

      const flagBodies = [
        { id: 'earth', name: 'Earth // LC-39A' },
        { id: 'moon_south', name: 'Moon South Pole // Shiv Shakti Point' },
        { id: 'moon', name: 'Moon // Sea of Tranquility' },
        { id: 'mars', name: 'Mars // Jezero Crater Delta' },
        { id: 'europa', name: 'Europa // Subsurface Ocean' },
        { id: 'titan', name: 'Titan // Kraken Mare' }
      ];

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90 backdrop-blur-xl open pointer-events-auto'
      }, [
        h('div', {
          className: 'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto tactical-glass rounded-2xl p-5 md:p-7 border border-cyan-500/40 shadow-2xl space-y-5'
        }, [
          // Header Bar
          h('div', { className: 'flex items-center justify-between pb-3 border-b border-cyan-500/20' }, [
            h('div', { className: 'flex items-center gap-2.5' }, [
              h('div', {
                className: 'w-10 h-10 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(6,182,212,0.5)]'
              }, stage === 'astronaut' ? '👨‍🚀' : (gender === 'girl' ? '👧' : '👦')),
              h('div', null, [
                h('div', { className: 'flex items-center gap-2' }, [
                  h('h3', { className: 'font-orbitron font-extrabold text-sm md:text-base text-cyan-300' }, 'I AM ASTRONUT // USER DASHBOARD'),
                  h('span', { className: 'text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono' },
                    currentUser?.isGuest ? 'GUEST CADET' : 'REGISTERED ACCOUNT'
                  )
                ]),
                h('p', { className: 'text-xs text-slate-400 font-mono mt-0.5' },
                  stage === 'astronaut'
                    ? 'COMMISSIONED FLIGHT ASTRONAUT - I AM ASTRONAUT!'
                    : 'EARTH SPACE CADET (LEVEL 1) • EXPLORING & BUILDING ROCKET'
                )
              ])
            ]),
            h('button', {
              onClick: onClose,
              className: 'text-slate-400 hover:text-white font-orbitron text-xs cursor-pointer p-1.5'
            }, '✕')
          ]),

          // Persona Selection (Boy or Girl Cadet - Requirement 2)
          h('div', { className: 'p-4 rounded-xl bg-slate-900/60 border border-slate-800' }, [
            h('div', { className: 'flex items-center justify-between mb-2' }, [
              h('label', { className: 'text-xs font-orbitron font-bold text-slate-200 uppercase tracking-wider' },
                '1. CADET EXPLORER PERSONA'
              ),
              h('span', { className: 'text-[10px] font-mono text-cyan-400' }, 'CHOICE PERSISTS ON SURFACE')
            ]),
            h('p', { className: 'text-[11px] text-slate-400 mb-3 leading-relaxed' },
              'Before becoming an astronaut, explore the Earth launch complex on foot as an aspiring boy or girl cadet to recover the 3 hidden rocket modules.'
            ),
            h('div', { className: 'grid grid-cols-2 gap-3' }, [
              h('button', {
                onClick: () => handleGenderChange('boy'),
                className: `p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${gender === 'boy' ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'}`
              }, [
                h('span', { className: 'text-2xl' }, '👦'),
                h('div', null, [
                  h('h4', { className: `font-orbitron font-bold text-xs ${gender === 'boy' ? 'text-cyan-300' : 'text-slate-200'}` }, 'BOY CADET'),
                  h('p', { className: 'text-[10px] text-slate-400 mt-0.5' }, 'Spiky hair, explorer headband, orange sneakers & scanner.')
                ])
              ]),
              h('button', {
                onClick: () => handleGenderChange('girl'),
                className: `p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${gender === 'girl' ? 'border-pink-400 bg-pink-950/40 shadow-[0_0_15px_rgba(244,114,182,0.3)]' : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'}`
              }, [
                h('span', { className: 'text-2xl' }, '👧'),
                h('div', null, [
                  h('h4', { className: `font-orbitron font-bold text-xs ${gender === 'girl' ? 'text-pink-300' : 'text-slate-200'}` }, 'GIRL CADET'),
                  h('p', { className: 'text-[10px] text-slate-400 mt-0.5' }, 'Ponytail ribbon, forehead goggles, utility suit & scanner.')
                ])
              ])
            ])
          ]),

          // Callsign & Flight Suit Customization
          h('div', { className: 'p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3' }, [
            h('label', { className: 'block text-xs font-orbitron font-bold text-slate-200 uppercase tracking-wider' },
              '2. CALLSIGN & FLIGHT SUIT CUSTOMIZATION'
            ),
            h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-3' }, [
              // Callsign Input
              h('div', null, [
                h('label', { className: 'block text-[10px] font-mono text-slate-400 mb-1' }, 'Cadet / Callsign'),
                h('input', {
                  type: 'text',
                  maxLength: 14,
                  value: callsign,
                  onChange: (e) => setCallsign(e.target.value),
                  className: 'w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-orbitron text-white focus:outline-none focus:border-cyan-400',
                  placeholder: 'Cadet Orion'
                })
              ]),
              // Suit Colorway
              h('div', null, [
                h('label', { className: 'block text-[10px] font-mono text-slate-400 mb-1' }, 'Flight Suit Colorway'),
                h('div', { className: 'flex items-center gap-2 mt-1' }, [
                  { id: 'white', name: 'Artemis White', bg: '#ffffff' },
                  { id: 'navy', name: 'Deep Space Navy', bg: '#1d4ed8' },
                  { id: 'orange', name: 'Martian Blaze', bg: '#ea580c' },
                  { id: 'cyan', name: 'Cyber Cyan', bg: '#06b6d4' },
                  { id: 'gold', name: 'Apollo Gold', bg: '#ca8a04' }
                ].map(c => h('button', {
                  key: c.id,
                  onClick: () => setSuitColor(c.id),
                  title: c.name,
                  style: { backgroundColor: c.bg },
                  className: `w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${suitColor === c.id ? 'scale-125 border-cyan-400 shadow-[0_0_8px_#00e5ff]' : 'border-slate-600 hover:scale-110'}`
                })))
              ]),
              // Visor Tint
              h('div', null, [
                h('label', { className: 'block text-[10px] font-mono text-slate-400 mb-1' }, 'Solar Visor Tint'),
                h('div', { className: 'flex items-center gap-2 mt-1' }, [
                  { id: 'gold', name: 'Solar Gold', bg: '#facc15' },
                  { id: 'cyan', name: 'Polar Cyan', bg: '#38bdf8' },
                  { id: 'emerald', name: 'Science Emerald', bg: '#34d399' },
                  { id: 'violet', name: 'Cosmic Violet', bg: '#a855f7' }
                ].map(t => h('button', {
                  key: t.id,
                  onClick: () => setVisorTint(t.id),
                  title: t.name,
                  style: { backgroundColor: t.bg },
                  className: `w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${visorTint === t.id ? 'scale-125 border-cyan-400 shadow-[0_0_8px_#00e5ff]' : 'border-slate-600 hover:scale-110'}`
                })))
              ])
            ])
          ]),

          // Indian National Flag (Tiranga) Planetary Records (Requirement 6)
          h('div', { className: 'p-4 rounded-xl bg-slate-900/60 border border-orange-500/30 space-y-3' }, [
            h('div', { className: 'flex items-center justify-between' }, [
              h('div', { className: 'flex items-center gap-2' }, [
                h('span', { className: 'text-lg' }, '🇮🇳'),
                h('h4', { className: 'text-xs font-orbitron font-bold text-orange-300 uppercase tracking-wider' },
                  'INDIAN NATIONAL FLAG (TIRANGA) EXPEDITION LOG'
                )
              ]),
              h('button', {
                onClick: handlePlantFlagNow,
                className: 'px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-orbitron text-[10px] font-bold tracking-wider cursor-pointer shadow-[0_0_10px_rgba(234,88,12,0.4)]'
              }, 'PLANT FLAG HERE 🇮🇳')
            ]),
            h('p', { className: 'text-[11px] text-slate-300 leading-relaxed' },
              'Commemorating India’s proud space milestones from Chandrayaan-3’s landing at the Lunar South Pole (Shiv Shakti point) across the solar system.'
            ),
            h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono' }, flagBodies.map(b => {
              const hasFlag = !!plantedFlags[b.id] || (b.id === 'moon' || b.id === 'moon_south');
              return h('div', {
                key: b.id,
                className: `p-2 rounded-lg border flex items-center justify-between ${hasFlag ? 'bg-orange-950/30 border-orange-500/40' : 'bg-slate-950 border-slate-800'}`
              }, [
                h('span', { className: 'truncate text-[10px] text-slate-300' }, b.name),
                hasFlag
                  ? h('span', { className: 'text-[10px] font-bold text-emerald-400 flex items-center gap-1' }, ['🇮🇳', 'ERECTED'])
                  : h('span', { className: 'text-[9px] text-slate-500' }, 'PENDING')
              ]);
            }))
          ]),

          // Progression & Stats Matrix
          h('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono' }, [
            h('div', { className: 'p-3 rounded-xl bg-slate-900/60 border border-slate-800' }, [
              h('span', { className: 'text-[10px] text-slate-400 block' }, 'DESTINATIONS'),
              h('span', { className: 'text-base font-bold text-cyan-300 font-orbitron' }, `${unlockedCount}/6`)
            ]),
            h('div', { className: 'p-3 rounded-xl bg-slate-900/60 border border-slate-800' }, [
              h('span', { className: 'text-[10px] text-slate-400 block' }, 'MISSION STARS'),
              h('span', { className: 'text-base font-bold text-amber-400 font-orbitron' }, `${totalStars}/18`)
            ]),
            h('div', { className: 'p-3 rounded-xl bg-slate-900/60 border border-slate-800' }, [
              h('span', { className: 'text-[10px] text-slate-400 block' }, 'EARTH ROCKET'),
              h('span', { className: 'text-base font-bold text-emerald-400 font-orbitron' }, `${earthPartsFound}/3 PARTS`)
            ]),
            h('div', { className: 'p-3 rounded-xl bg-slate-900/60 border border-slate-800' }, [
              h('span', { className: 'text-[10px] text-slate-400 block' }, 'BADGES'),
              h('span', { className: 'text-base font-bold text-purple-400 font-orbitron' }, `${badgesCount}/9`)
            ])
          ]),

          // Dedicated Reset Options Section (User Requirement: once user logged in save credentials and give reset option)
          h('div', { className: 'p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30 space-y-2' }, [
            h('div', { className: 'flex items-center justify-between' }, [
              h('div', { className: 'flex items-center gap-2' }, [
                h('span', { className: 'text-sm' }, '🔄'),
                h('h4', { className: 'text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider' },
                  'MISSION & EQUIPMENT RESET OPTIONS'
                )
              ]),
              h('span', { className: 'text-[9px] font-mono text-emerald-400 font-bold' }, 'CREDENTIALS 100% PRESERVED')
            ]),
            h('p', { className: 'text-[11px] text-slate-300 leading-relaxed' },
              'Reset collected equipment pieces and relock the launchpad rocket so you can search for the hidden components and dodge falling asteroids. Your login credentials, accounts, cadet callsign, and password remain completely safe.'
            ),
            h('div', { className: 'flex flex-wrap gap-2 pt-1' }, [
              h('button', {
                type: 'button',
                onClick: () => {
                  if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                    window.gameEngine.resetCurrentMission(false);
                  }
                  onClose();
                },
                className: 'px-3 py-1.5 rounded-lg border border-cyan-400 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 font-orbitron text-[10px] font-bold cursor-pointer transition-colors'
              }, '🔄 Reset Current Sector Equipments'),
              h('button', {
                type: 'button',
                onClick: () => {
                  if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                    window.gameEngine.resetCurrentMission(true);
                  }
                  onClose();
                },
                className: 'px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-950/30 text-amber-300 hover:bg-amber-500/20 font-orbitron text-[10px] font-bold cursor-pointer transition-colors'
              }, '🔄 Full Expedition Reset (Keep Login)')
            ])
          ]),

          // Bottom Action Buttons
          h('div', { className: 'pt-3 border-t border-slate-800 flex items-center justify-between' }, [
            h('button', {
              onClick: handleLogout,
              className: 'px-4 py-2 rounded-xl text-xs font-orbitron text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 cursor-pointer'
            }, 'LOGOUT / SWITCH CADET'),
            h('button', {
              onClick: handleSave,
              className: 'px-6 py-2.5 rounded-xl font-orbitron font-bold text-xs text-white btn-tactical-drop shadow-lg hover:scale-105 transition-transform cursor-pointer'
            }, 'SAVE & CLOSE DOSSIER')
          ])
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 8: Cadet Login & Account Gateway Modal (Pic 3 & Pic 4 Inspired)
    // =========================================================================
    function AuthModal({ isOpen, onClose, onLoggedIn, isMandatory = false }) {
      const [view, setView] = useState('login'); // 'login' (Pic 3 Default), 'signup', 'hub' (Pic 4)
      const [loginUser, setLoginUser] = useState('');
      const [loginPass, setLoginPass] = useState('');
      const [signupUser, setSignupUser] = useState('');
      const [signupEmail, setSignupEmail] = useState('');
      const [signupPass, setSignupPass] = useState('');
      const [signupGender, setSignupGender] = useState('boy');
      const [errorMsg, setErrorMsg] = useState('');

      useEffect(() => {
        if (isOpen) {
          setErrorMsg('');
        }
      }, [isOpen, view]);

      if (!isOpen) return null;

      const handlePlayGuest = () => {
        if (window.storageManager) {
          window.storageManager.loginGuest('Cadet Orion', 'boy');
          window.storageManager.dismissGateway();
        }
        if (window.gameEngine) {
          window.gameEngine.player.stage = 'cadet';
          window.gameEngine.player.gender = 'boy';
          window.gameEngine.player.callsign = 'Cadet Orion';
          if (typeof window.gameEngine.showToast === 'function') {
            window.gameEngine.showToast('CADET ORION: ONLINE', 'Earth launch complex ready. Locate 3 hidden rocket parts!');
          }
        }
        onClose();
        if (onLoggedIn) onLoggedIn();
      };

      const handleLoginSubmit = (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        if (!loginUser.trim()) {
          setErrorMsg('Please enter your email address or username.');
          return;
        }
        if (window.storageManager) {
          const res = window.storageManager.login(loginUser.trim(), loginPass);
          if (res.success) {
            window.storageManager.dismissGateway();
            if (window.gameEngine) {
              window.gameEngine.player.callsign = res.user.username;
              window.gameEngine.player.gender = res.user.gender;
              if (typeof window.gameEngine.showToast === 'function') {
                window.gameEngine.showToast(`WELCOME BACK, ${res.user.username.toUpperCase()}!`, 'Mission Control authenticated.');
              }
            }
            onClose();
            if (onLoggedIn) onLoggedIn();
          } else {
            setErrorMsg(res.error || 'Authentication failed.');
          }
        }
      };

      const handleSignupSubmit = (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        if (!signupUser.trim()) {
          setErrorMsg('Please enter a Cadet callsign.');
          return;
        }
        if (window.storageManager) {
          const res = window.storageManager.register(signupUser.trim(), signupEmail.trim(), signupPass, signupGender);
          if (res.success) {
            window.storageManager.dismissGateway();
            if (window.gameEngine) {
              window.gameEngine.player.callsign = res.user.username;
              window.gameEngine.player.gender = res.user.gender;
              window.gameEngine.player.stage = 'cadet';
              if (typeof window.gameEngine.showToast === 'function') {
                window.gameEngine.showToast(`CADET ${res.user.username.toUpperCase()} ENROLLED!`, 'Welcome to I Am Astronut! Search Earth for rocket parts.');
              }
            }
            onClose();
            if (onLoggedIn) onLoggedIn();
          } else {
            setErrorMsg(res.error || 'Registration failed.');
          }
        }
      };

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl open pointer-events-auto',
        onClick: (e) => {
          if (e.target === e.currentTarget && !isMandatory) onClose();
        }
      }, [
        h('div', {
          className: 'relative w-full max-w-xl max-h-[92vh] tactical-glass rounded-2xl p-6 md:p-8 overflow-y-auto corner-brackets border border-cyan-500/40 shadow-2xl space-y-4'
        }, [

          // Top Header & Dismiss / Play Button
          h('div', { className: 'flex items-center justify-between border-b border-slate-800 pb-3' }, [
            h('div', { className: 'flex items-center gap-2' }, [
              h('span', { className: 'w-2 h-2 rounded-full bg-cyan-400 animate-ping' }),
              h('span', { className: 'font-orbitron font-bold text-xs text-cyan-300 tracking-wider' }, 'I AM ASTRONUT // MISSION CONTROL')
            ]),
            h('button', {
              onClick: () => {
                if (isMandatory) handlePlayGuest();
                else onClose();
              },
              className: 'text-xs font-orbitron text-cyan-400 hover:text-cyan-300 cursor-pointer px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-colors',
              title: isMandatory ? 'Play directly as Guest Cadet' : 'Close'
            }, isMandatory ? 'Play as Guest →' : '✕')
          ]),

          // Mode Navigation Switcher Tabs (Pic 3 & Pic 4)
          h('div', { className: 'flex items-center justify-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800' }, [
            h('button', {
              type: 'button',
              onClick: () => { setView('login'); setErrorMsg(''); },
              className: `flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-colors cursor-pointer ${view === 'login' ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'text-slate-400 hover:text-white'}`
            }, '🔑 LOGIN'),
            h('button', {
              type: 'button',
              onClick: () => { setView('signup'); setErrorMsg(''); },
              className: `flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-colors cursor-pointer ${view === 'signup' ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'text-slate-400 hover:text-white'}`
            }, '✨ CREATE ACCOUNT'),
            h('button', {
              type: 'button',
              onClick: () => { setView('hub'); setErrorMsg(''); },
              className: `flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-colors cursor-pointer ${view === 'hub' ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'}`
            }, '📋 OPTIONS')
          ]),

          // VIEW 1: HUB MENU (Pic 4 Inspired)
          view === 'hub' && h('div', { className: 'space-y-4' }, [
            h('div', { className: 'text-center space-y-1' }, [
              h('h2', { className: 'font-orbitron font-black text-2xl text-white tracking-wider' }, 'I AM ASTRONUT'),
              h('p', { className: 'text-xs text-slate-300 max-w-md mx-auto leading-relaxed' },
                'Dare to explore the astronauts’ universe! Explore Earth base as a boy or girl cadet, find hidden parts to build humanity’s rocket, and reach the Moon, Mars, Europa & Titan.'
              )
            ]),

            // Card 1: Create an Account (Pic 4)
            h('div', { className: 'pic-card p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between gap-3' }, [
              h('div', null, [
                h('h4', { className: 'font-orbitron font-bold text-sm text-cyan-300' }, 'Create an Account'),
                h('p', { className: 'text-xs text-slate-400 mt-0.5' }, 'I want to create an account or I received a student key and want to use it for the first time.')
              ]),
              h('button', {
                onClick: () => setView('signup'),
                className: 'px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs text-cyan-300 border border-cyan-400 hover:bg-cyan-500/20 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              }, 'Sign Up')
            ]),

            // Card 2: I have an Account (Pic 4)
            h('div', { className: 'pic-card p-4 rounded-xl border border-red-500/30 flex items-center justify-between gap-3' }, [
              h('div', null, [
                h('h4', { className: 'font-orbitron font-bold text-sm text-red-300' }, 'I have an Account'),
                h('p', { className: 'text-xs text-slate-400 mt-0.5' }, 'I have an account and have logged in before.')
              ]),
              h('button', {
                onClick: () => setView('login'),
                className: 'px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs text-red-300 border border-red-500 hover:bg-red-500/20 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              }, 'Login')
            ]),

            // Card 3: Play Now (Pic 4)
            h('div', { className: 'pic-card p-4 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3' }, [
              h('div', null, [
                h('h4', { className: 'font-orbitron font-bold text-sm text-emerald-300' }, 'Play Now'),
                h('p', { className: 'text-xs text-slate-400 mt-0.5' }, 'I want to try the game immediately without an account.')
              ]),
              h('button', {
                onClick: handlePlayGuest,
                className: 'px-5 py-2.5 rounded-xl font-orbitron font-bold text-xs text-white btn-tactical-drop whitespace-nowrap cursor-pointer shadow-lg hover:scale-105 transition-transform'
              }, 'Start your Mission')
            ]),

            // Card 4: Reset Equipments & Progress Option (Preserves Credentials!)
            h('div', { className: 'pic-card p-4 rounded-xl border border-cyan-500/40 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3' }, [
              h('div', null, [
                h('div', { className: 'flex items-center gap-1.5' }, [
                  h('span', { className: 'text-sm' }, '🔄'),
                  h('h4', { className: 'font-orbitron font-bold text-sm text-cyan-300' }, 'Reset Rocket Equipments'),
                  h('span', { className: 'text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono' }, 'KEEPS LOGIN')
                ]),
                h('p', { className: 'text-xs text-slate-300 mt-0.5' },
                  'Reset collected equipment parts & relock rocket to replay the hunt with automatic falling asteroids. All credentials stay saved!'
                )
              ]),
              h('div', { className: 'flex gap-2 flex-shrink-0' }, [
                h('button', {
                  onClick: () => {
                    if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                      window.gameEngine.resetCurrentMission(false);
                    }
                    onClose();
                  },
                  className: 'px-3 py-2 rounded-xl font-orbitron font-bold text-xs text-cyan-300 border border-cyan-400 hover:bg-cyan-500/20 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                }, 'Reset Sector Parts'),
                h('button', {
                  onClick: () => {
                    if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                      window.gameEngine.resetCurrentMission(true);
                    }
                    onClose();
                  },
                  className: 'px-3 py-2 rounded-xl font-orbitron font-bold text-xs text-amber-300 border border-amber-500 hover:bg-amber-500/20 whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                }, 'Full Reset')
              ])
            ]),

            // Teacher Classroom Card (Pic 3 Top)
            h('div', { className: 'p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs' }, [
              h('p', { className: 'text-slate-300' }, 'Teachers: Learn how to use the game in your class in two minutes'),
              h('button', {
                onClick: () => alert('Teacher & Educator Guide: Students explore orbital mechanics, Apollo/Artemis lunar science, and engineer multi-stage rockets from Earth!'),
                className: 'px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 font-orbitron text-[11px] whitespace-nowrap cursor-pointer'
              }, 'Download')
            ])
          ]),

          // VIEW 2: LOGIN FORM (Pic 3 Inspired)
          view === 'login' && h('div', { className: 'space-y-4' }, [
            // Teacher Note at Top
            h('div', { className: 'p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between gap-3 text-xs' }, [
              h('p', { className: 'text-slate-300' }, 'Teachers: Learn how to use the game in your class in two minutes'),
              h('button', {
                onClick: () => alert('Classroom Guide: Complete guide to teaching space mission design.'),
                className: 'px-3 py-1 rounded-lg border border-cyan-400 text-cyan-300 hover:bg-cyan-500/20 font-orbitron text-[10px] cursor-pointer'
              }, 'Download')
            ]),

            // Red Box Header: LOGIN (Pic 3 Exact Visuals)
            h('div', { className: 'flex justify-center pt-2' }, [
              h('div', {
                className: 'px-10 py-2.5 rounded-xl bg-black border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] text-center'
              }, [
                h('span', { className: 'font-orbitron font-black text-lg text-white tracking-widest' }, 'LOGIN')
              ])
            ]),

            h('p', { className: 'text-center text-xs font-semibold text-slate-200' }, 'Already have an account? Please Login:'),

            // Error Message
            errorMsg && h('div', { className: 'p-2 rounded-lg bg-red-950/60 border border-red-500 text-red-300 text-xs text-center font-mono' }, errorMsg),

            // Form Fields
            h('form', { onSubmit: handleLoginSubmit, className: 'space-y-3' }, [
              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Email or Username'),
                h('input', {
                  type: 'text',
                  value: loginUser,
                  onChange: (e) => setLoginUser(e.target.value),
                  placeholder: 'Enter your email address or username',
                  className: 'w-full bg-slate-900 border-b-2 border-slate-600 focus:border-red-500 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
                })
              ]),
              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Password'),
                h('input', {
                  type: 'password',
                  value: loginPass,
                  onChange: (e) => setLoginPass(e.target.value),
                  placeholder: 'Confirm Password',
                  className: 'w-full bg-slate-900 border-b-2 border-slate-600 focus:border-red-500 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
                })
              ]),
              h('div', { className: 'text-right' }, [
                h('button', {
                  type: 'button',
                  onClick: () => alert('Password Recovery: If playing in classroom mode, ask your Flight Director / Teacher for your student key.'),
                  className: 'text-[11px] text-slate-400 hover:text-cyan-300 underline cursor-pointer'
                }, 'Forgot your password? Recover your password')
              ]),

              h('div', { className: 'pt-2 flex gap-3' }, [
                h('button', {
                  type: 'button',
                  onClick: () => setView('hub'),
                  className: 'w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white font-orbitron text-xs cursor-pointer'
                }, '← Options'),
                h('button', {
                  type: 'submit',
                  className: 'w-2/3 py-2.5 rounded-xl font-orbitron font-bold text-xs text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer'
                }, 'LOGIN')
              ])
            ]),

            // Quick Reset Shortcut (User Requirement: once logged in save credentials and give reset option)
            h('div', { className: 'p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30 flex items-center justify-between gap-2 text-xs' }, [
              h('div', null, [
                h('span', { className: 'font-orbitron font-bold text-cyan-300 block text-[11px]' }, '🔄 RESET EQUIPMENT HUNT'),
                h('span', { className: 'text-[10px] text-slate-400' }, 'Respawn 3 rocket modules in this sector (preserves login)')
              ]),
              h('button', {
                type: 'button',
                onClick: () => {
                  if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                    window.gameEngine.resetCurrentMission(false);
                  }
                  onClose();
                },
                className: 'px-3 py-1.5 rounded-lg text-[10px] font-orbitron font-bold text-cyan-300 border border-cyan-400 hover:bg-cyan-500/20 cursor-pointer whitespace-nowrap'
              }, 'Reset Parts')
            ]),

            // Teachers and Parents Note (Pic 3 Exact Text)
            h('div', { className: 'p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed' }, [
              h('span', { className: 'font-bold text-slate-200' }, 'Teachers and Parents: '),
              'Once you have registered your account, visit your profile page to create keys that you can give to players who don’t have an email address. Players who are given a student key can register their account directly.'
            ])
          ]),

          // VIEW 3: SIGN UP FORM
          view === 'signup' && h('div', { className: 'space-y-4' }, [
            h('div', { className: 'flex justify-center pt-2' }, [
              h('div', {
                className: 'px-10 py-2.5 rounded-xl bg-black border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] text-center'
              }, [
                h('span', { className: 'font-orbitron font-black text-lg text-white tracking-widest' }, 'CREATE ACCOUNT')
              ])
            ]),

            h('p', { className: 'text-center text-xs font-semibold text-slate-200' }, 'Enlist in the I Am Astronut Cadet Academy:'),

            errorMsg && h('div', { className: 'p-2 rounded-lg bg-red-950/60 border border-red-500 text-red-300 text-xs text-center font-mono' }, errorMsg),

            h('form', { onSubmit: handleSignupSubmit, className: 'space-y-3' }, [
              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Cadet Callsign / Username'),
                h('input', {
                  type: 'text',
                  maxLength: 14,
                  value: signupUser,
                  onChange: (e) => setSignupUser(e.target.value),
                  placeholder: 'e.g. Cadet Surya, Cadet Priya',
                  className: 'w-full bg-slate-900 border-b-2 border-slate-600 focus:border-cyan-400 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
                })
              ]),

              // Persona Switcher
              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Choose Cadet Persona'),
                h('div', { className: 'grid grid-cols-2 gap-2 mt-1' }, [
                  h('button', {
                    type: 'button',
                    onClick: () => setSignupGender('boy'),
                    className: `p-2 rounded-lg border text-xs font-orbitron font-bold flex items-center justify-center gap-2 cursor-pointer ${signupGender === 'boy' ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300' : 'border-slate-800 text-slate-400'}`
                  }, ['👦 Boy Cadet']),
                  h('button', {
                    type: 'button',
                    onClick: () => setSignupGender('girl'),
                    className: `p-2 rounded-lg border text-xs font-orbitron font-bold flex items-center justify-center gap-2 cursor-pointer ${signupGender === 'girl' ? 'border-pink-400 bg-pink-950/50 text-pink-300' : 'border-slate-800 text-slate-400'}`
                  }, ['👧 Girl Cadet'])
                ])
              ]),

              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Email or Student Key (Optional)'),
                h('input', {
                  type: 'text',
                  value: signupEmail,
                  onChange: (e) => setSignupEmail(e.target.value),
                  placeholder: 'student-key or email',
                  className: 'w-full bg-slate-900 border-b-2 border-slate-600 focus:border-cyan-400 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
                })
              ]),

              h('div', null, [
                h('label', { className: 'block text-xs text-slate-300 mb-1' }, 'Password'),
                h('input', {
                  type: 'password',
                  value: signupPass,
                  onChange: (e) => setSignupPass(e.target.value),
                  placeholder: 'Create password',
                  className: 'w-full bg-slate-900 border-b-2 border-slate-600 focus:border-cyan-400 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors'
                })
              ]),

              h('div', { className: 'pt-2 flex gap-3' }, [
                h('button', {
                  type: 'button',
                  onClick: () => setView('hub'),
                  className: 'w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white font-orbitron text-xs cursor-pointer'
                }, '← Options'),
                h('button', {
                  type: 'submit',
                  className: 'w-2/3 py-2.5 rounded-xl font-orbitron font-bold text-xs text-white btn-tactical-drop cursor-pointer'
                }, 'CREATE CADET ACCOUNT')
              ])
            ])
          ])
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 9: Game Over & Respawn Modal
    // User Requirement: "give health for astronut once health is lost he has to die and restart the game"
    // =========================================================================
    function GameOverModal({ isOpen, cause, onRestart }) {
      if (!isOpen) return null;

      return h('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl open pointer-events-auto'
      }, [
        h('div', {
          className: 'relative w-full max-w-md tactical-glass rounded-2xl p-6 border-2 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center space-y-4 corner-brackets'
        }, [
          // Emergency Distress Beacon
          h('div', { className: 'w-16 h-16 mx-auto rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-pulse' },
            '💀'
          ),
          h('div', { className: 'space-y-1' }, [
            h('h2', { className: 'font-orbitron font-black text-xl text-red-400 tracking-wider' }, 'EXPEDITION TERMINATED'),
            h('p', { className: 'text-xs font-mono text-red-300 uppercase tracking-widest' }, 'CRITICAL SUIT INTEGRITY BREACH // 0 HP')
          ]),
          h('div', { className: 'p-3 rounded-xl bg-slate-900/90 border border-red-500/30 text-xs text-slate-300 leading-relaxed text-left' },
            cause || 'The astronaut sustained critical environmental damage from falling asteroid impacts. Suit pressure seals failed.'
          ),
          h('p', { className: 'text-[11px] font-mono text-slate-400' },
            'Respawning will return your astronaut to the base launch pad with 100% full vital shields.'
          ),
          h('div', { className: 'pt-2 flex flex-col gap-2' }, [
            h('button', {
              onClick: onRestart,
              className: 'w-full py-3 rounded-xl font-orbitron font-extrabold text-xs text-white bg-red-600 hover:bg-red-500 border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] cursor-pointer transition-all hover:scale-[1.02]'
            }, '🔄 RESTART MISSION & RESPAWN [KEY R]'),
            h('button', {
              onClick: () => {
                if (window.gameEngine && typeof window.gameEngine.resetCurrentMission === 'function') {
                  window.gameEngine.resetCurrentMission(false);
                }
              },
              className: 'w-full py-2.5 rounded-xl font-orbitron font-bold text-xs text-cyan-300 hover:text-white bg-slate-900 border border-cyan-500/50 hover:bg-cyan-950/60 cursor-pointer transition-all'
            }, '🔄 RESET EQUIPMENTS & RESPAWN'),
            h('span', { className: 'text-[10px] font-mono text-slate-500' }, 'Press [R] to revive or tap Reset Equipments to restart part search')
          ])
        ])
      ]);
    }

    // =========================================================================
    // COMPONENT 10: Top-Level React Odyssey Application Root (Single Player Focus)
    // =========================================================================
    function NASAOdysseyApp() {
      const [currentPlanet, setCurrentPlanet] = useState('earth');
      const [starsCount, setStarsCount] = useState(0);
      const [partsCount, setPartsCount] = useState(0);
      const [telemetry, setTelemetry] = useState('9.80 m/s² [1.0G] • JETPACK: 100%');
      const [isAudioMuted, setIsAudioMuted] = useState(false);
      const [difficulty, setDifficulty] = useState(window.storageManager?.getDifficulty?.() || 'moderate');

      // Astronaut Vitals & Radar Navigation States
      const [health, setHealth] = useState(100);
      const [maxHealth, setMaxHealth] = useState(100);
      const [isDead, setIsDead] = useState(false);
      const [radarData, setRadarData] = useState(null);
      const [gameOverOpen, setGameOverOpen] = useState(false);
      const [gameOverCause, setGameOverCause] = useState('');

      // Mandatory Login Page upon entering the website (User Requirement: "to get into the website first user has to login so open a login page")
      let hasActiveSession = false;
      try { hasActiveSession = sessionStorage.getItem('I_AM_ASTRONAUT_ENTERED') === 'true'; } catch (e) {}
      const [activeModal, setActiveModal] = useState(!hasActiveSession ? 'gateway' : null); // 'starmap', 'badges', 'brief', 'profile', 'gateway'

      // Synchronize with gameEngine & storageManager
      useEffect(() => {
        const syncEngine = () => {
          if (window.gameEngine) {
            setCurrentPlanet(window.gameEngine.currentPlanetId || 'earth');
            const foundCount = window.gameEngine.world?.equipmentPieces?.filter(p => p.found)?.length || 0;
            setPartsCount(foundCount);
            setStarsCount(window.storageManager?.data?.totalStars || 0);
            if (window.storageManager?.getDifficulty) {
              setDifficulty(window.storageManager.getDifficulty());
            }
            if (window.gameEngine.player) {
              setHealth(window.gameEngine.player.health);
              setMaxHealth(window.gameEngine.player.maxHealth);
              setIsDead(window.gameEngine.player.isDead);
            }
          }
        };

        syncEngine();
        const interval = setInterval(syncEngine, 400);

        // Expose React Bridge to Window
        window.reactDashboard = {
          openStarMap: () => setActiveModal('starmap'),
          openBadges: () => setActiveModal('badges'),
          openMissionBrief: () => setActiveModal('brief'),
          openProfile: () => setActiveModal('profile'),
          openGateway: () => setActiveModal('gateway'),
          openRealisticEnv: () => {
            if (window.gameEngine && window.gameEngine.realisticEnv) {
              window.gameEngine.realisticEnv.toggle();
            }
          },
          closeAll: () => { setActiveModal(null); setGameOverOpen(false); },
          setTelemetry: (txt) => setTelemetry(txt),
          updateParts: (count) => setPartsCount(count),
          updateStars: (count) => setStarsCount(count),
          setPlanet: (pId) => setCurrentPlanet(pId),
          setDifficulty: (diff) => setDifficulty(diff),
          updateHealth: (hp, maxHp, dead) => {
            setHealth(hp);
            setMaxHealth(maxHp);
            setIsDead(dead);
          },
          updateRadar: (data) => setRadarData(data),
          openGameOver: (source, cause) => {
            setGameOverCause(cause || 'The astronaut sustained catastrophic suit decompression from falling asteroid impacts.');
            setGameOverOpen(true);
            setIsDead(true);
          },
          closeGameOver: () => {
            setGameOverOpen(false);
            setIsDead(false);
          }
        };

        return () => {
          clearInterval(interval);
          delete window.reactDashboard;
        };
      }, []);

      const handleToggleAudio = () => {
        if (window.soundEngine) {
          window.soundEngine.muted = !window.soundEngine.muted;
          setIsAudioMuted(window.soundEngine.muted);
        }
      };

      const handleToggleDifficulty = () => {
        const modes = ['easy', 'moderate', 'difficult'];
        const nextIdx = (modes.indexOf(difficulty) + 1) % modes.length;
        const nextMode = modes[nextIdx];
        setDifficulty(nextMode);
        if (window.gameEngine && typeof window.gameEngine.setDifficulty === 'function') {
          window.gameEngine.setDifficulty(nextMode);
        }
      };

      const handleSelectDifficulty = (mode) => {
        setDifficulty(mode);
        if (window.gameEngine && typeof window.gameEngine.setDifficulty === 'function') {
          window.gameEngine.setDifficulty(mode);
        }
      };

      const handleSelectDrop = (planetId) => {
        setActiveModal(null);
        if (window.gameEngine) {
          window.gameEngine.loadPlanet(planetId, true);
        }
      };

      const handleExecuteLaunch = (planetId) => {
        setActiveModal(null);
        if (window.gameEngine) {
          window.gameEngine.loadPlanet(planetId, true);
        }
      };

      const handleProfileSave = (newProfile) => {
        if (window.gameEngine && window.gameEngine.player) {
          window.gameEngine.player.setProfile(newProfile);
        }
      };

      return h('div', { className: 'react-app-root w-full h-full pointer-events-none' }, [
        // 1. Hardware-Accelerated Cosmic Falling Stars Cursor
        h(FallingStarsCursor, { key: 'cursor' }),

        // 2. Top Minimalist Status HUD
        h(TopHUD, {
          key: 'tophud',
          currentPlanet,
          starsCount,
          partsCount,
          telemetry,
          health,
          maxHealth,
          isDead,
          radarData,
          difficultyMode: difficulty,
          onToggleDifficulty: handleToggleDifficulty,
          onOpenProfile: () => setActiveModal('profile'),
          onOpenGateway: () => setActiveModal('gateway'),
          onOpenRealisticEnv: () => {
            if (window.gameEngine && window.gameEngine.realisticEnv) {
              window.gameEngine.realisticEnv.toggle();
            }
          },
          isAudioMuted,
          onToggleAudio: handleToggleAudio
        }),

        // 3. Clean Bottom Navigation Bar (Strictly 3 Buttons)
        h(BottomDashboardNav, {
          key: 'bottomnav',
          activeModal,
          onOpenStarMap: () => setActiveModal(activeModal === 'starmap' ? null : 'starmap'),
          onOpenBadges: () => setActiveModal(activeModal === 'badges' ? null : 'badges'),
          onOpenMissionBrief: () => setActiveModal(activeModal === 'brief' ? null : 'brief')
        }),

        // 4. Modals
        h(TacticalStarMapModal, {
          key: 'modal-starmap',
          isOpen: activeModal === 'starmap',
          onClose: () => setActiveModal(null),
          currentPlanetId: currentPlanet,
          onSelectDrop: handleSelectDrop,
          onExecuteLaunch: handleExecuteLaunch,
          difficultyMode: difficulty,
          onChangeDifficulty: handleSelectDifficulty
        }),

        h(BadgesModal, {
          key: 'modal-badges',
          isOpen: activeModal === 'badges',
          onClose: () => setActiveModal(null)
        }),

        h(MissionBriefModal, {
          key: 'modal-brief',
          isOpen: activeModal === 'brief',
          onClose: () => setActiveModal(null),
          currentPlanetId: currentPlanet
        }),

        h(UsernameDashboardModal, {
          key: 'modal-profile',
          isOpen: activeModal === 'profile',
          onClose: () => setActiveModal(null),
          onSave: handleProfileSave,
          onOpenAuth: () => setActiveModal('gateway')
        }),

        h(AuthModal, {
          key: 'modal-gateway',
          isOpen: activeModal === 'gateway',
          isMandatory: !hasActiveSession,
          onClose: () => {
            try { sessionStorage.setItem('I_AM_ASTRONAUT_ENTERED', 'true'); } catch (e) {}
            if (window.storageManager && !window.storageManager.isLoggedIn()) {
              window.storageManager.loginGuest('Cadet Orion', 'boy');
            }
            setActiveModal(null);
          },
          onLoggedIn: () => {
            try { sessionStorage.setItem('I_AM_ASTRONAUT_ENTERED', 'true'); } catch (e) {}
            setCurrentPlanet(window.storageManager?.data?.currentPlanet || 'earth');
            setActiveModal(null);
            if (window.gameEngine) {
              window.gameEngine.loadPlanet('earth', false);
            }
          }
        }),

        // 5. Game Over & Respawn Modal (User Requirement)
        h(GameOverModal, {
          key: 'modal-gameover',
          isOpen: gameOverOpen || isDead,
          cause: gameOverCause,
          onRestart: () => {
            setGameOverOpen(false);
            if (window.gameEngine && typeof window.gameEngine.restartGame === 'function') {
              window.gameEngine.restartGame();
            }
          }
        })
      ]);
    }

    // Mount React Root
    const container = document.getElementById('react-root');
    if (container) {
      // Hide static fallback HUD and bottom nav once React mounts
      const staticHud = document.querySelector('body > div.relative > header');
      if (staticHud) staticHud.style.display = 'none';
      const staticNav = document.querySelector('body > div.relative > nav');
      if (staticNav) staticNav.style.display = 'none';

      const root = ReactDOM.createRoot(container);
      root.render(h(NASAOdysseyApp));
      console.log('[ReactDashboard] NASA Odyssey React Dashboard & Cosmic Star Cursor Mounted Successfully.');
    }
  }

  // =========================================================================
  // Standalone Falling Stars Cursor Fallback (Offline / Low-Bandwidth Mode)
  // =========================================================================
  function initStandaloneStarCursor() {
    if (document.getElementById('cursor-star-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-star-canvas';
    canvas.className = 'fixed inset-0 pointer-events-none z-[999999] w-full h-full';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    document.body.classList.add('has-custom-cursor');

    const starPalette = ['#facc15', '#fde047', '#fbbf24', '#00e5ff', '#38bdf8', '#ffffff', '#c084fc'];
    const stars = [];
    let mouseX = -100, mouseY = -100, lastX = -100, lastY = -100;
    let isVisible = false, isHovered = false, isClicking = false, coreRotation = 0;

    function drawStar(ctx, spikes, outerRadius, innerRadius) {
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(0, -outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.lineTo(0, -outerRadius);
      ctx.closePath();
    }

    const spawnStars = (x1, y1, x2, y2, isClick = false) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const steps = isClick ? 1 : Math.max(1, Math.min(8, Math.floor(dist / 12)));

      for (let i = 0; i < steps; i++) {
        const t = steps === 1 ? 1 : i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        const count = isClick ? 1 : (dist > 30 ? 2 : 1);

        for (let c = 0; c < count; c++) {
          const swipeVx = (dx / Math.max(1, dist)) * Math.min(10, dist * 0.2);
          const swipeVy = (dy / Math.max(1, dist)) * Math.min(10, dist * 0.2);

          stars.push({
            x: px + (Math.random() - 0.5) * 6,
            y: py + (Math.random() - 0.5) * 6,
            vx: isClick ? (Math.random() - 0.5) * 7.5 : (swipeVx * 0.16 + (Math.random() - 0.5) * 2.2),
            vy: isClick ? (Math.random() - 0.5) * 7.5 - 2.5 : (swipeVy * 0.16 - Math.random() * 2.2),
            gravity: 0.13 + Math.random() * 0.08,
            size: isClick ? (4 + Math.random() * 7) : (3 + Math.random() * 5.5),
            color: starPalette[Math.floor(Math.random() * starPalette.length)],
            life: 1.0,
            decay: 0.018 + Math.random() * 0.018,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.16,
            spikes: Math.random() < 0.65 ? 4 : 5,
            twinkle: Math.random() * Math.PI * 2
          });
        }
      }
      if (stars.length > 200) stars.splice(0, stars.length - 200);
    };

    window.addEventListener('mousemove', (e) => {
      isVisible = true;
      if (lastX >= 0) spawnStars(lastX, lastY, e.clientX, e.clientY);
      lastX = e.clientX; lastY = e.clientY;
      mouseX = e.clientX; mouseY = e.clientY;
      const target = e.target;
      isHovered = !!(target && target.closest('button, a, input, select, .starmap-node, .pic-card, .clickable, .cursor-pointer, [role="button"]'));
    }, { passive: true });

    window.addEventListener('mousedown', (e) => {
      isClicking = true;
      for (let i = 0; i < 16; i++) spawnStars(e.clientX, e.clientY, e.clientX, e.clientY, true);
    });
    window.addEventListener('mouseup', () => { isClicking = false; });
    document.documentElement.addEventListener('mouseleave', () => { isVisible = false; lastX = -100; lastY = -100; });
    document.documentElement.addEventListener('mouseenter', (e) => { isVisible = true; lastX = e.clientX; lastY = e.clientY; });

    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.vy += s.gravity;
        s.vx *= 0.98;
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.rotSpeed;
        s.life -= s.decay;
        s.twinkle += 0.14;

        if (s.life <= 0 || s.y > window.innerHeight + 25) {
          stars.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, s.life) * (0.8 + 0.2 * Math.sin(s.twinkle));
        const rOuter = s.size * (0.45 + 0.55 * s.life);
        const rInner = rOuter * 0.35;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        drawStar(ctx, s.spikes, rOuter, rInner);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.5, rInner * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (isVisible && mouseX >= 0) {
        coreRotation += 0.022;
        const scale = isClicking ? 0.75 : (isHovered ? 1.35 : 1.0);
        const primaryColor = isClicking ? '#facc15' : (isHovered ? '#38bdf8' : '#00e5ff');
        const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;

        ctx.save();
        ctx.translate(mouseX, mouseY);
        ctx.rotate(coreRotation);

        const haloGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 18 * scale);
        haloGrad.addColorStop(0, primaryColor);
        haloGrad.addColorStop(0.35, isHovered ? 'rgba(56, 189, 248, 0.45)' : 'rgba(0, 229, 255, 0.3)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 18 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = primaryColor;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10;
        drawStar(ctx, 4, (9 + pulse * 2) * scale, (2.8 + pulse * 0.5) * scale);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, (2.2 + pulse * 0.8) * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
