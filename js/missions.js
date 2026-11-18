// Project Horizons: Space Mission Design Game
// Real NASA Space Exploration Telemetry, Orbital Mechanics & Solar System Collectibles
// Strict fidelity to NASA & international space science archives.

const PLANETARY_DESTINATIONS = {
  earth: {
    id: 'earth',
    order: 0,
    name: 'Earth // KSC Launch Complex 39A',
    bodyName: 'Earth',
    historicalProgram: 'Apollo, Space Shuttle, Artemis & Commercial Crew',
    historicalYear: '1961 - Present',
    coordinates: '28.6083° N, 80.6043° W',
    distanceFromSun: '1.00 AU (149.6M km)',
    diameterKm: 12742,
    massKg: '5.972 × 10²⁴ kg',
    gravity: 9.80, // m/s² (1.0g)
    jumpForce: 13.5,
    atmosphere: '1.00 atm (78% N₂, 21% O₂)',
    atmDensity: 1.0,
    airDrag: 0.98,
    surfaceTemp: '288 K (15°C)',
    radiationLevel: '0.003 mSv/day (Protected by Van Allen Belts)',
    skyColors: {
      top: '#0284c7',
      bottom: '#bae6fd',
      spaceTransition: '#020617'
    },
    groundColors: {
      surface: '#334155',
      subsurface: '#1e293b',
      accent: '#22c55e',
      line: '#0284c7'
    },
    missionBrief: {
      title: 'ORBITAL COMMISSIONING AT LC-39A',
      directive: 'Kennedy Space Center Launch Complex 39A is humanity’s historic springboard to the cosmos. Before departing for deep space exploration, conduct final ground telemetry verification and gather essential propulsion and guidance avionics.',
      historicalRecord: 'LC-39A launched Apollo 11 on July 16, 1969, sending Neil Armstrong, Buzz Aldrin, and Michael Collins to the Moon. It later supported dozens of Space Shuttle missions, Hubble servicing flights, and the modern Artemis lunar return initiative.',
      scientificTarget: 'Calibrate cryogenic propellant systems and verify triple-redundant flight computer guidance.'
    },
    missionDesign: {
      concept: {
        title: 'Earth Orbit Staging & System Checkout',
        objective: 'Inject heavy spacecraft stack into Low Earth Orbit (LEO, 250 km altitude) at 7.8 km/s orbital velocity.',
        payload: 'Saturn V / SLS Multi-stage Rocket, Liquid Hydrogen Turbopumps, Flight Computers, Crew Capsule.',
        targetOrbit: 'LEO Parking Orbit (250 km × 250 km, 28.5° inclination)'
      },
      trajectory: {
        type: 'Vertical Ascent to Gravity Turn LEO Insertion',
        deltaVRequired: '9.4 km/s (including atmospheric drag and gravity losses)',
        burnDuration: '510 seconds (Stage 1 + Stage 2 burns)',
        orbitalVelocity: '7.8 km/s (28,000 km/h)',
        escapeVelocity: '11.2 km/s'
      },
      timeline: [
        { time: 'T-00:00', event: 'Main Engine Ignition & Hold-Down Release', status: 'COMPLETE' },
        { time: 'T+01:12', event: 'Max-Q (Maximum Aerodynamic Dynamic Pressure)', status: 'COMPLETE' },
        { time: 'T+02:40', event: 'Stage 1 Booster Separation (MECO)', status: 'COMPLETE' },
        { time: 'T+08:35', event: 'Stage 2 Shutdown & LEO Insertion', status: 'PENDING' },
        { time: 'T+01:30:00', event: 'Systems Diagnostic & Trans-Planetary Injection Prep', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'earth_part_1',
        name: 'Rocket Fuselage & Cryogenic Stage',
        desc: 'Core multi-stage aerospace titanium rocket fuselage & cryogenic liquid propellant tanks hidden in the western launch sector.',
        xRatio: 0.16,
        yOffset: 0,
        found: false
      },
      {
        id: 'earth_part_2',
        name: 'Rocket Engine Bell & Propulsion Unit',
        desc: 'High-thrust liquid propulsion bell nozzle & turbopump assembly positioned on the staging test platform.',
        xRatio: 0.44,
        yOffset: 0,
        found: false
      },
      {
        id: 'earth_part_3',
        name: 'Guidance Avionics & Aerodynamic Nose Cone',
        desc: 'Triple-redundant inertial guidance computer navigation avionics & aerodynamic nose cone in the eastern telemetry bay.',
        xRatio: 0.65,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_earth_ignition'
  },

  moon_south: {
    id: 'moon_south',
    order: 1,
    name: 'The Moon South Pole // Artemis & Malapert A Crater',
    bodyName: 'Lunar South Pole',
    historicalProgram: 'NASA CLPS (IM-1 Odysseus), LRO, VIPER & Artemis III',
    historicalYear: '2024 - Present (Historic Polar Landing)',
    coordinates: '80.13° S, 1.44° E (Malapert A Crater)',
    distanceFromSun: '1.00 AU (384,400 km from Earth)',
    diameterKm: 3474,
    massKg: '7.342 × 10²² kg',
    gravity: 1.62, // m/s² (0.165g - floaty lunar jumps!)
    jumpForce: 11.8,
    atmosphere: '10⁻¹⁵ atm (Ultra-high vacuum)',
    atmDensity: 0.0,
    airDrag: 0.998,
    surfaceTemp: '40 K to 310 K (-233°C in shadows, +37°C on rims)',
    radiationLevel: '1.36 mSv/day (Unshielded solar cosmic rays)',
    skyColors: {
      top: '#000000',
      bottom: '#080c1b',
      spaceTransition: '#000000'
    },
    groundColors: {
      surface: '#475569',
      subsurface: '#1e293b',
      accent: '#38bdf8',
      line: '#00e5ff'
    },
    missionBrief: {
      title: 'HISTORIC LUNAR SOUTH POLE & WATER ICE PROSPECTING',
      directive: 'Navigate the extreme shadowy topography of Malapert A crater at 80° South. Locate cryogenic volatile ice deposits inside Permanently Shadowed Regions (PSRs) and recover specialized polar exploration drills and hydrogen spectrometers.',
      historicalRecord: 'On February 22, 2024, NASA CLPS mission IM-1 "Odysseus" touched down at Malapert A crater (80.13°S)—the southernmost landing in history and the first commercial lunar touchdown. NASA’s Artemis program targets this frontier because billion-year-old water ice trapped at 40 Kelvin can be converted into breathable oxygen and liquid rocket fuel (LOX/LH₂).',
      scientificTarget: 'Prospect volatile subsurface water ice crystals and confirm solar power viability on Peaks of Eternal Light.'
    },
    missionDesign: {
      concept: {
        title: 'Artemis Polar Touchdown & ISRU Propellant Harvesting',
        objective: 'Inject into Near-Rectilinear Halo Orbit (NRHO), execute powered descent to Malapert A (80°S), and survey cryogenic ice-traps.',
        payload: 'IM-1 Odysseus Lander, VIPER Polar Exploration Rover, TRIDENT Volatiles Drill, Neutron Spectrometer.',
        targetOrbit: 'Near-Rectilinear Halo Orbit (NRHO, 3,000 km × 70,000 km, 9:2 resonance)'
      },
      trajectory: {
        type: 'Ballistic Lunar Transfer (BLT) / Direct TLI to Polar NRHO Insertion',
        deltaVRequired: '3.15 km/s (TLI) + 0.45 km/s (NRHO) + 1.90 km/s (Descent & Landing)',
        burnDuration: 'TLI Burn: ~360s; Terminal Polar Descent: ~12 mins',
        transitTime: '4.5 Days (Direct) / 3 Months (Low-energy BLT)',
        escapeVelocity: '2.38 km/s'
      },
      timeline: [
        { time: 'Day 0', event: 'Launch on SLS / Falcon 9 from KSC Pad 39A', status: 'COMPLETE' },
        { time: 'Day 0 + 45m', event: 'Trans-Lunar Injection (TLI) burn injection', status: 'COMPLETE' },
        { time: 'Day 4.5', event: 'NRHO Insertion & Polar Gateway rendezvous check', status: 'COMPLETE' },
        { time: 'Day 6.0', event: 'Powered Descent Initiation (PDI) toward Malapert A Crater', status: 'PENDING' },
        { time: 'Day 6.0 + 12m', event: 'Historic South Pole Touchdown: Odysseus & Artemis are on the Moon!', status: 'PENDING' },
        { time: 'Day 6.2', event: 'Deploy TRIDENT drill & extract subsurface cryogenic water-ice core', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'moon_south_part_1',
        name: 'Cryogenic Subsurface Water Ice Core',
        desc: 'Permanently Shadowed Region (PSR) volatile ice crystals harvested at 40 K (-233°C). The essential foundation for rocket propellant (LOX/LH₂) and life support.',
        xRatio: 0.20,
        yOffset: 0,
        found: false
      },
      {
        id: 'moon_south_part_2',
        name: 'TRIDENT 1-Meter Volatiles Prospecting Drill',
        desc: 'The Regolith and Ice Drill for Exploring New Terrains, engineered to penetrate frozen polar regolith and extract cryo-samples without thermal sublimation.',
        xRatio: 0.48,
        yOffset: 0,
        found: false
      },
      {
        id: 'moon_south_part_3',
        name: 'Neutron Spectrometer Hydrogen Detector (NSS)',
        desc: 'NASA high-sensitivity sensor that measures cosmic-ray neutron deceleration to pinpoint underground hydrogen and ice reserves hidden beneath the surface.',
        xRatio: 0.86,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_south_pole_ice'
  },

  moon: {
    id: 'moon',
    order: 2,
    name: 'The Moon // Apollo 11 Tranquility Base',
    bodyName: 'The Moon',
    historicalProgram: 'Project Apollo (Apollo 11 - 17), LRO & Artemis',
    historicalYear: '1969 - 1972 (Artemis 2024+)',
    coordinates: '0.67408° N, 23.47297° E',
    distanceFromSun: '1.00 AU (384,400 km from Earth)',
    diameterKm: 3474,
    massKg: '7.342 × 10²² kg',
    gravity: 1.62, // m/s² (0.165g - super floaty jumps!)
    jumpForce: 11.8,
    atmosphere: '10⁻¹⁵ atm (Ultra-high vacuum)',
    atmDensity: 0.0,
    airDrag: 0.998,
    surfaceTemp: '120 K to 390 K (-153°C to 117°C)',
    radiationLevel: '1.36 mSv/day (Unshielded solar cosmic rays)',
    skyColors: {
      top: '#000000',
      bottom: '#020617',
      spaceTransition: '#000000'
    },
    groundColors: {
      surface: '#94a3b8',
      subsurface: '#475569',
      accent: '#cbd5e1',
      line: '#38bdf8'
    },
    missionBrief: {
      title: 'APOLLO 11 HERITAGE & ROVER SURVEY',
      directive: 'Traverse the rolling regolith dust of the Sea of Tranquility. Survey historic artifacts left by Apollo astronauts and recover scientific telemetry instrumentation from the lunar surface.',
      historicalRecord: 'On July 20, 1969, the Apollo Lunar Module Eagle touched down with only 25 seconds of fuel remaining. Neil Armstrong uttered the immortal words: “Houston, Tranquility Base here. The Eagle has landed.” Humanity walked on another celestial world for the first time.',
      scientificTarget: 'Collect laser reflector data and regolith core samples unexposed for 3.8 billion years.'
    },
    missionDesign: {
      concept: {
        title: 'Trans-Lunar Injection & Lunar Orbit Insertion (LOI)',
        objective: 'Transfer spacecraft from LEO to Moon on a free-return trajectory, execute powered descent to Tranquility Base.',
        payload: 'Lunar Module Eagle, Lunar Roving Vehicle (LRV), Laser Ranging Retroreflector, Solar Wind Composition foil.',
        targetOrbit: 'Low Lunar Orbit (100 km circular, 0° equatorial)'
      },
      trajectory: {
        type: 'Hohmann-Class Trans-Lunar Transfer (Free-Return Trajectory)',
        deltaVRequired: '3.15 km/s (TLI) + 0.85 km/s (LOI) + 1.85 km/s (Descent)',
        burnDuration: 'TLI Burn: ~350 seconds',
        transitTime: '3.2 Days (76 hours)',
        escapeVelocity: '2.38 km/s'
      },
      timeline: [
        { time: 'T+02:44:00', event: 'Trans-Lunar Injection (TLI) Burn executed by S-IVB stage', status: 'COMPLETE' },
        { time: 'T+75:49:00', event: 'Lunar Orbit Insertion (LOI-1) retro-fire behind the Moon', status: 'PENDING' },
        { time: 'T+100:12:00', event: 'Lunar Module Undocking & Powered Descent Initiation (PDI)', status: 'PENDING' },
        { time: 'T+102:45:40', event: 'Touchdown at Tranquility Base: "The Eagle has landed"', status: 'PENDING' },
        { time: 'T+109:24:00', event: 'First EVA: One small step for man, one giant leap for mankind', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'moon_part_1',
        name: 'Laser Ranging Retroreflector',
        desc: 'Corner-cube prism array used by Earth observatories to measure Moon distance to millimeter accuracy.',
        xRatio: 0.22,
        yOffset: 0,
        found: false
      },
      {
        id: 'moon_part_2',
        name: 'Passive Seismic Experiment (PSEP)',
        desc: 'Detects moonquakes and meteorite impacts to map the lunar mantle and core boundary.',
        xRatio: 0.48,
        yOffset: 0,
        found: false
      },
      {
        id: 'moon_part_3',
        name: 'Regolith Vacuum Core Tube',
        desc: 'Pristine unoxidized titanium-rich basalt core sample from 2 meters beneath Tranquility surface.',
        xRatio: 0.88,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_moon_landing'
  },

  mars: {
    id: 'mars',
    order: 3,
    name: 'Mars // Jezero Crater Delta',
    bodyName: 'Mars',
    historicalProgram: 'Viking, Pathfinder, Opportunity, Curiosity & Perseverance',
    historicalYear: '1976 - Present',
    coordinates: '18.38° N, 77.58° E',
    distanceFromSun: '1.52 AU (227.9M km)',
    diameterKm: 6779,
    massKg: '6.417 × 10²³ kg',
    gravity: 3.72, // m/s² (0.38g)
    jumpForce: 12.5,
    atmosphere: '0.006 atm (95% CO₂, 2.6% N₂)',
    atmDensity: 0.02,
    airDrag: 0.99,
    surfaceTemp: '210 K (-63°C)',
    radiationLevel: '0.7 mSv/day (Thin CO₂ shielding)',
    skyColors: {
      top: '#7c2d12',
      bottom: '#ea580c',
      spaceTransition: '#451a03'
    },
    groundColors: {
      surface: '#c2410c',
      subsurface: '#7c2d12',
      accent: '#f97316',
      line: '#fb923c'
    },
    missionBrief: {
      title: 'JEZERO CRATER PALEO-LAKE EXPLORATION',
      directive: 'Navigate the rugged iron-oxide slopes and dry riverbed of Jezero Crater. Recover experimental technology demonstrated by NASA’s Perseverance rover and the record-breaking Ingenuity helicopter.',
      historicalRecord: 'Jezero Crater was once filled with liquid water 3.5 billion years ago, forming a prominent river delta rich in clay minerals that can preserve fossilized microbial biosignatures. In 2021, Ingenuity achieved the first powered, controlled flight on another planet.',
      scientificTarget: 'Retrieve in-situ oxygen production cells (MOXIE) and hermetically sealed sample return tubes.'
    },
    missionDesign: {
      concept: {
        title: 'Hohmann Trans-Mars Injection (TMI) & Sky Crane Entry',
        objective: 'Inject into elliptical heliocentric transfer orbit during synodic window (every 26 months), execute direct Entry, Descent & Landing (EDL).',
        payload: 'Perseverance Rover, Ingenuity Scout Helicopter, MOXIE Oxygen Synthesizer, SuperCam Spectrometer.',
        targetOrbit: 'Direct Atmospheric Entry (19,500 km/h entry speed)'
      },
      trajectory: {
        type: 'Heliocentric Type-I Hohmann Transfer Orbit',
        deltaVRequired: '3.80 km/s (TMI from LEO) + 0.15 km/s (TCM corrections)',
        burnDuration: 'TMI Burn: ~420 seconds',
        transitTime: '203 Days (approx. 7 months)',
        escapeVelocity: '5.03 km/s'
      },
      timeline: [
        { time: 'Day 0', event: 'Trans-Mars Injection (TMI) Burn at Earth Departure', status: 'COMPLETE' },
        { time: 'Day 60', event: 'Trajectory Correction Maneuver 1 (TCM-1)', status: 'COMPLETE' },
        { time: 'Day 203', event: 'Atmospheric Entry Interface (125 km altitude)', status: 'PENDING' },
        { time: 'Day 203 + 4m', event: 'Supersonic Parachute Deploy & Heat Shield Ejection', status: 'PENDING' },
        { time: 'Day 203 + 7m', event: 'Sky Crane Descent Stage Touchdown: Perseverance is on Mars', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'mars_part_1',
        name: 'MOXIE Solid Oxide Electrolyzer',
        desc: 'NASA breakthrough technology that strips oxygen atoms from atmospheric CO₂ for breathing and rocket fuel.',
        xRatio: 0.16,
        yOffset: 0,
        found: false
      },
      {
        id: 'mars_part_2',
        name: 'Ingenuity Carbon-Fiber Rotor Spare',
        desc: 'Counter-rotating 2400 RPM blade designed for aerodynamic lift in Mars’ ultra-thin 1% atmosphere.',
        xRatio: 0.48,
        yOffset: 0,
        found: false
      },
      {
        id: 'mars_part_3',
        name: 'Sealed Mars Sample Return Tube',
        desc: 'Ultra-pure titanium container holding ancient Jezero delta riverbed mudstone cores.',
        xRatio: 0.85,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_mars_pathfinder'
  },

  europa: {
    id: 'europa',
    order: 4,
    name: 'Europa // Conamara Chaos & Cryogeysers',
    bodyName: 'Europa (Jupiter IV)',
    historicalProgram: 'Voyager, Galileo Orbiter, Juno & Europa Clipper',
    historicalYear: '1995 - 2024 (Arriving 2030)',
    coordinates: '9.3° N, 274° W (Jovian Meridian)',
    distanceFromSun: '5.20 AU (778.5M km)',
    diameterKm: 3121,
    massKg: '4.800 × 10²² kg',
    gravity: 1.315, // m/s² (0.134g - floaty, slippery!)
    jumpForce: 11.2,
    atmosphere: '10⁻¹¹ atm (Tenuous O₂ from ice radiolysis)',
    atmDensity: 0.0,
    airDrag: 0.999,
    surfaceTemp: '102 K (-171°C)',
    radiationLevel: '5.4 Sv/day (Intense Jovian Van Allen radiation belts)',
    skyColors: {
      top: '#030712',
      bottom: '#082f49',
      spaceTransition: '#020617'
    },
    groundColors: {
      surface: '#38bdf8',
      subsurface: '#0369a1',
      accent: '#99f6e4',
      line: '#06b6d4'
    },
    missionBrief: {
      title: 'JOVIAN SUB-SURFACE OCEAN INVESTIGATION',
      directive: 'Step out onto the fractured ice crust of Europa directly beneath giant Jupiter. Avoid deep tidal fissures and locate scientific sensors deployed to detect warm water plumes erupting from the hidden ocean below.',
      historicalRecord: 'NASA’s Galileo mission provided definitive evidence that Europa conceals a global liquid ocean containing more water than all of Earth’s oceans combined. Europa Clipper, launched in 2024, carries ice-penetrating radar to confirm habitability.',
      scientificTarget: 'Analyze cryogeyser vapor plumes and measure ice-shell thickness via radar sounder nodes.'
    },
    missionDesign: {
      concept: {
        title: 'Mars-Earth Gravity Assist (MEGA) & Jupiter Orbit Insertion',
        objective: 'Perform complex multi-body gravity assists to reach outer solar system without prohibitive propellant masses; execute Jovian insertion burn.',
        payload: 'Ice-Penetrating Radar (REASON), MASPEX Mass Spectrometer, PIMS Magnetometer, Radiation Shielded Vault.',
        targetOrbit: 'Resonant Jovian Flyby Orbit (50+ low-altitude Europa flybys at 25 km altitude)'
      },
      trajectory: {
        type: 'Mars-Earth Gravity Assist (MEGA) Deep Space Trajectory',
        deltaVRequired: 'Launch C3 = 83.5 km²/s² + Jovian capture burn (~850 m/s)',
        transitTime: '5.5 Years (Launched Oct 2024, Arrival April 2030)',
        escapeVelocity: '2.02 km/s'
      },
      timeline: [
        { time: 'Year 0 (2024)', event: 'Earth Departure on Falcon Heavy (C3 = 83.5 km²/s²)', status: 'COMPLETE' },
        { time: 'Year 1.4 (2025)', event: 'Mars Gravity Assist Flyby (Boost velocity & change vector)', status: 'PENDING' },
        { time: 'Year 2.2 (2026)', event: 'Earth Gravity Assist Flyby (High-velocity outbound sling)', status: 'PENDING' },
        { time: 'Year 5.5 (2030)', event: 'Jupiter Orbit Insertion (JOI) Burn into Jovian radiation belt', status: 'PENDING' },
        { time: 'Year 6.0 (2031)', event: 'First Close Europa Flyby (25 km above cryogeysers)', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'europa_part_1',
        name: 'REASON Ice-Penetrating Radar Antenna',
        desc: 'High-frequency dual-channel radar node designed to penetrate 20 km into Europa’s ice shell.',
        xRatio: 0.20,
        yOffset: 0,
        found: false
      },
      {
        id: 'europa_part_2',
        name: 'Cryogeyser Mass Spectrometer (MASPEX)',
        desc: 'Sniffs vented water-vapor plumes to detect amino acids, salts, and organic compounds.',
        xRatio: 0.50,
        yOffset: 0,
        found: false
      },
      {
        id: 'europa_part_3',
        name: 'Tidal Flexure Thermal Sensor',
        desc: 'Measures Jupiter’s intense gravitational kneading that keeps Europa’s ocean liquid.',
        xRatio: 0.86,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_europa_abyss'
  },

  titan: {
    id: 'titan',
    order: 5,
    name: 'Titan // Kraken Mare Methane Coastline',
    bodyName: 'Titan (Saturn VI)',
    historicalProgram: 'Cassini-Huygens & Dragonfly',
    historicalYear: '1997 - 2017 (Dragonfly 2028+)',
    coordinates: '68.0° N, 310.0° W',
    distanceFromSun: '9.58 AU (1.43B km)',
    diameterKm: 5149,
    massKg: '1.345 × 10²³ kg',
    gravity: 1.352, // m/s² (0.138g, but 4x denser air allows gliding!)
    jumpForce: 10.5,
    atmosphere: '1.45 atm (98.4% N₂, 1.4% Methane)',
    atmDensity: 1.5,
    airDrag: 0.94, // dense atmosphere: floaty glide jumps!
    surfaceTemp: '94 K (-179°C)',
    radiationLevel: '0.001 mSv/day (Dense N₂ atmosphere absorbs all cosmic rays)',
    skyColors: {
      top: '#78350f',
      bottom: '#d97706',
      spaceTransition: '#451a03'
    },
    groundColors: {
      surface: '#78350f',
      subsurface: '#451a03',
      accent: '#fbbf24',
      line: '#f59e0b'
    },
    missionBrief: {
      title: 'HYDROCARBON SHORELINE & HUYGENS MEMORIAL',
      directive: 'Explore the shores of Kraken Mare, a colossal sea of liquid methane and ethane. Experience Titan’s dense atmosphere where human wings could sustain flight, and locate the historical Huygens landing probe.',
      historicalRecord: 'On January 14, 2005, ESA and NASA’s Huygens probe detached from the Cassini orbiter and successfully landed on Titan—humanity’s only surface landing in the outer Solar System. It transmitted photographs of rounded water-ice pebbles shaped by liquid methane rainfall.',
      scientificTarget: 'Recover the Huygens descent data capsule and prepare flight avionics for the Dragonfly octocopter.'
    },
    missionDesign: {
      concept: {
        title: 'VVEJGA Interplanetary Tour & Huygens Atmospheric Entry',
        objective: 'Slingshot past Venus, Earth, and Jupiter to achieve Saturn Orbit Insertion (SOI); detach lander capsule into Titan’s dense nitrogen atmosphere.',
        payload: 'Cassini Orbiter, Huygens Atmospheric Descent Probe, Radar Altimeter, Surface Science Package.',
        targetOrbit: 'Saturn Orbit Insertion followed by Titan Parachute Descent'
      },
      trajectory: {
        type: 'VVEJGA (Venus-Venus-Earth-Jupiter Gravity Assist Tour)',
        deltaVRequired: 'Saturn Orbit Insertion (SOI) Burn = 626 m/s',
        transitTime: '6.7 Years (Launched Oct 1997, Saturn Arrival July 2004)',
        escapeVelocity: '2.64 km/s'
      },
      timeline: [
        { time: 'Year 0.0 (1997)', event: 'Launch on Titan IV-B from Cape Canaveral', status: 'COMPLETE' },
        { time: 'Year 0.5 (1998)', event: 'Venus Flyby 1 (Gravitational boost)', status: 'COMPLETE' },
        { time: 'Year 1.7 (1999)', event: 'Venus Flyby 2 & Earth Flyby (Orbital resonance kick)', status: 'COMPLETE' },
        { time: 'Year 3.2 (2000)', event: 'Jupiter Gravity Assist (Speed increases by 2 km/s)', status: 'COMPLETE' },
        { time: 'Year 6.7 (2004)', event: 'Saturn Orbit Insertion (SOI) engine firing', status: 'COMPLETE' },
        { time: 'Year 7.2 (2005)', event: 'Huygens Probe Touchdown on Titan surface pebbles', status: 'PENDING' }
      ]
    },
    parts: [
      {
        id: 'titan_part_1',
        name: 'Huygens Descent Blackbox Recorder',
        desc: 'Historical flight telemetry recording the first atmospheric descent through Titan’s golden smog.',
        xRatio: 0.24,
        yOffset: 0,
        found: false
      },
      {
        id: 'titan_part_2',
        name: 'Methane Cryo-Condenser Valve',
        desc: 'Extracts liquid hydrocarbons directly from Kraken Mare to synthesize ultra-cold booster propellant.',
        xRatio: 0.48,
        yOffset: 0,
        found: false
      },
      {
        id: 'titan_part_3',
        name: 'Dragonfly Nuclear Rotor Avionics',
        desc: 'Autonomous rotorcraft flight controller powered by Multi-Mission Radioisotope Thermoelectric Generator (MMRTG).',
        xRatio: 0.89,
        yOffset: 0,
        found: false
      }
    ],
    badgeReward: 'badge_titan_voyager'
  }
};

// ====================================================================
// GAME EXPEDITION DIFFICULTY MODES (Easy, Moderate, Difficult)
// ====================================================================
const GAME_DIFFICULTY_MODES = {
  easy: {
    id: 'easy',
    name: 'EASY',
    subtitle: 'Cadet Flight Protocol',
    icon: '🟢',
    badge: 'REINFORCED SHIELDS',
    maxHealth: 150,
    asteroidDamageMultiplier: 0.5,
    asteroidSpeedMultiplier: 0.65,
    asteroidCountMultiplier: 0.6,
    jetpackDrainMultiplier: 0.5,
    interactionRadius: 100,
    color: '#10b981',
    description: 'Generous suit shields (150 HP), gentle asteroid showers, extended jetpack fuel and high radar sensitivity.'
  },
  moderate: {
    id: 'moderate',
    name: 'MODERATE',
    subtitle: 'NASA Flight Standard',
    icon: '🟡',
    badge: 'NOMINAL TELEMETRY',
    maxHealth: 100,
    asteroidDamageMultiplier: 1.0,
    asteroidSpeedMultiplier: 1.0,
    asteroidCountMultiplier: 1.0,
    jetpackDrainMultiplier: 1.0,
    interactionRadius: 85,
    color: '#facc15',
    description: 'Authentic NASA exploration physics, balanced meteor shower hazards, and standard suit environmental tolerance (100 HP).'
  },
  difficult: {
    id: 'difficult',
    name: 'DIFFICULTY',
    subtitle: 'Commander Hardcore',
    icon: '🔴',
    badge: 'HIGH HAZARD ENVIRONMENT',
    maxHealth: 75,
    asteroidDamageMultiplier: 1.45,
    asteroidSpeedMultiplier: 1.35,
    asteroidCountMultiplier: 1.4,
    jetpackDrainMultiplier: 1.3,
    interactionRadius: 70,
    color: '#ef4444',
    description: 'Hostile planetary conditions, fast kinetic meteor strikes, fragile suit seals (75 HP), and high survival stakes!'
  }
};
window.GAME_DIFFICULTY_MODES = GAME_DIFFICULTY_MODES;

// ====================================================================
// SOLAR SYSTEM COLLECTIBLES DATABASE (Pic 1 Inspired)
// Covers the entire Solar System with authentic NASA planetary science!
// ====================================================================
const SOLAR_SYSTEM_COLLECTIBLES = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'Yellow Dwarf Star (G2V)',
    orbitIndex: 0,
    distanceAU: '0.00 AU',
    diameterKm: '1,392,700 km',
    mass: '1.989 × 10³⁰ kg (99.8% of Solar System)',
    surfaceTemp: '5,778 K (5,505°C)',
    nasaMissions: 'Parker Solar Probe, SOHO, SDO',
    researchCenter: 'NASA Goddard Space Flight Center (GSFC)',
    funFact: 'Parker Solar Probe has flown directly into the Sun’s corona at over 600,000 km/h—the fastest human-made object in history!',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    orbitIndex: 1,
    distanceAU: '0.39 AU (57.9M km)',
    diameterKm: '4,879 km',
    mass: '3.301 × 10²³ kg',
    surfaceTemp: '100 K to 700 K (-173°C to 427°C)',
    nasaMissions: 'Mariner 10, MESSENGER, BepiColombo',
    researchCenter: 'NASA Goddard Space Flight Center (GSFC)',
    funFact: 'Mercury has virtually no atmosphere and experiences the most extreme temperature swings in the Solar System, yet water ice exists in permanently shadowed polar craters.',
    color: '#a3a3a3',
    glowColor: 'rgba(163, 163, 163, 0.4)'
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    orbitIndex: 2,
    distanceAU: '0.72 AU (108.2M km)',
    diameterKm: '12,104 km',
    mass: '4.867 × 10²⁴ kg',
    surfaceTemp: '737 K (464°C - Hottest Planet)',
    nasaMissions: 'Mariner 2, Magellan, DAVINCI+, VERITAS',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Venus rotates backwards compared to other planets, and its day (243 Earth days) is longer than its year (225 Earth days)! Atmospheric pressure is 92 times Earth’s.',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.4)'
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial Ocean Planet',
    orbitIndex: 3,
    distanceAU: '1.00 AU (149.6M km)',
    diameterKm: '12,742 km',
    mass: '5.972 × 10²⁴ kg',
    surfaceTemp: '288 K (15°C)',
    nasaMissions: 'Apollo, Landsat, Terra, Aqua, ISS',
    researchCenter: 'NASA Goddard (GSFC) & Kennedy Space Center (KSC)',
    funFact: 'The only known world where water exists in all three phases (liquid, solid, gas) simultaneously on the surface, supporting millions of species.',
    color: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.5)'
  },
  {
    id: 'moon',
    name: 'The Moon',
    type: 'Major Natural Satellite',
    orbitIndex: 3.5,
    distanceAU: '384,400 km from Earth',
    diameterKm: '3,474 km',
    mass: '7.342 × 10²² kg',
    surfaceTemp: '120 K to 390 K',
    nasaMissions: 'Apollo 11–17, Surveyor, LRO, LCROSS, Artemis',
    researchCenter: 'NASA Johnson Space Center (JSC, Houston)',
    funFact: 'Because the Moon has no atmosphere, footprints left by Apollo astronauts over 50 years ago remain completely pristine in the regolith today.',
    color: '#cbd5e1',
    glowColor: 'rgba(203, 213, 225, 0.4)'
  },
  {
    id: 'moon_south',
    name: 'Moon South Pole',
    type: 'Lunar Cryogenic Polar Basin',
    orbitIndex: 3.6,
    distanceAU: '384,400 km (80.13°S Latitude)',
    diameterKm: '3,474 km (Polar Sector)',
    mass: '7.342 × 10²² kg',
    surfaceTemp: '40 K (-233°C in shadows)',
    nasaMissions: 'CLPS IM-1 Odysseus (2024), LRO, LCROSS, VIPER, Artemis III',
    researchCenter: 'NASA Ames Research Center (ARC) & JPL (Pasadena)',
    funFact: 'Contains Permanently Shadowed Regions that have remained pitch-black and freezing at 40 Kelvin for billions of years, hoarding billions of tons of ancient cryogenic water ice for rocket fuel.',
    color: '#38bdf8',
    glowColor: 'rgba(0, 229, 255, 0.6)'
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet',
    orbitIndex: 4,
    distanceAU: '1.52 AU (227.9M km)',
    diameterKm: '6,779 km',
    mass: '6.417 × 10²³ kg',
    surfaceTemp: '210 K (-63°C)',
    nasaMissions: 'Viking 1/2, Pathfinder, Spirit, Opportunity, Curiosity, Perseverance',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Home to Olympus Mons, the largest volcano in the Solar System—three times taller than Mount Everest and roughly the size of the state of Arizona.',
    color: '#ea580c',
    glowColor: 'rgba(234, 88, 12, 0.5)'
  },
  {
    id: 'ceres',
    name: 'Ceres (Asteroid Belt)',
    type: 'Dwarf Planet & Asteroid Belt Core',
    orbitIndex: 4.8,
    distanceAU: '2.77 AU (413.7M km)',
    diameterKm: '939 km',
    mass: '9.38 × 10²⁰ kg',
    surfaceTemp: '168 K (-105°C)',
    nasaMissions: 'Dawn Spacecraft (2015-2018)',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Contains mysterious glowing bright spots in Occator Crater composed of sodium carbonate salts left behind by subsurface briny water that seeped to the surface.',
    color: '#71717a',
    glowColor: 'rgba(113, 113, 122, 0.4)'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    orbitIndex: 5,
    distanceAU: '5.20 AU (778.5M km)',
    diameterKm: '139,820 km',
    mass: '1.898 × 10²⁷ kg (318 Earths)',
    surfaceTemp: '165 K (-108°C at 1 bar)',
    nasaMissions: 'Pioneer 10/11, Voyager 1/2, Galileo, Juno, Europa Clipper',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'The Great Red Spot is a persistent anticyclonic storm larger than the entire Earth that has been raging for over 350 years.',
    color: '#ca8a04',
    glowColor: 'rgba(202, 138, 4, 0.5)'
  },
  {
    id: 'europa',
    name: 'Europa (Jupiter Moon)',
    type: 'Icy Ocean Moon',
    orbitIndex: 5.2,
    distanceAU: '5.20 AU (Orbiting Jupiter)',
    diameterKm: '3,121 km',
    mass: '4.800 × 10²² kg',
    surfaceTemp: '102 K (-171°C)',
    nasaMissions: 'Galileo, Juno, Europa Clipper (2024)',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL) & Goddard (GSFC)',
    funFact: 'Its underground ocean contains more than twice the liquid water of all Earth’s oceans combined, shielded beneath a 20-kilometer thick ice crust.',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Ringed Gas Giant',
    orbitIndex: 6,
    distanceAU: '9.58 AU (1.43B km)',
    diameterKm: '116,460 km',
    mass: '5.683 × 10²⁶ kg (95 Earths)',
    surfaceTemp: '134 K (-139°C)',
    nasaMissions: 'Pioneer 11, Voyager 1/2, Cassini-Huygens',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Saturn’s spectacular ring system spans up to 282,000 kilometers wide, yet is astonishingly thin—averaging only about 10 meters in thickness!',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.5)'
  },
  {
    id: 'titan',
    name: 'Titan (Saturn Moon)',
    type: 'Hydrocarbon Atmosphere Moon',
    orbitIndex: 6.2,
    distanceAU: '9.58 AU (Orbiting Saturn)',
    diameterKm: '5,149 km',
    mass: '1.345 × 10²³ kg',
    surfaceTemp: '94 K (-179°C)',
    nasaMissions: 'Voyager 1, Cassini-Huygens (Landed 2005), Dragonfly',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL) & Johns Hopkins APL',
    funFact: 'The only other celestial body with liquid rivers, lakes, and seas on its surface—filled not with water, but with liquid methane and ethane!',
    color: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.5)'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    orbitIndex: 7,
    distanceAU: '19.2 AU (2.87B km)',
    diameterKm: '50,724 km',
    mass: '8.681 × 10²⁵ kg (14 Earths)',
    surfaceTemp: '76 K (-197°C)',
    nasaMissions: 'Voyager 2 (1986 Flyby)',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Uranus is the only planet that rotates tilted on its side at an extreme 98° angle, causing 42 years of continuous sunlight followed by 42 years of darkness at its poles.',
    color: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.5)'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    orbitIndex: 8,
    distanceAU: '30.1 AU (4.50B km)',
    diameterKm: '49,244 km',
    mass: '1.024 × 10²⁶ kg (17 Earths)',
    surfaceTemp: '72 K (-201°C)',
    nasaMissions: 'Voyager 2 (1989 Flyby)',
    researchCenter: 'NASA Jet Propulsion Laboratory (JPL, Pasadena)',
    funFact: 'Possesses the fastest recorded supersonic winds in the Solar System, whipping methane clouds through its atmosphere at over 2,100 km/h.',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.6)'
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'Kuiper Belt Dwarf Planet',
    orbitIndex: 9,
    distanceAU: '39.5 AU (5.91B km)',
    diameterKm: '2,377 km',
    mass: '1.303 × 10²² kg',
    surfaceTemp: '44 K (-229°C)',
    nasaMissions: 'New Horizons (Historic 2015 Flyby)',
    researchCenter: 'NASA Applied Physics Lab & SwRI (Boulder, CO)',
    funFact: 'New Horizons revealed a massive heart-shaped nitrogen-ice glacier called Tombaugh Regio, complete with towering water-ice mountain ranges.',
    color: '#d4d4d8',
    glowColor: 'rgba(212, 212, 216, 0.4)'
  }
];

// NASA Achievement Badges
const NASA_BADGES = {
  badge_earth_ignition: {
    id: 'badge_earth_ignition',
    title: 'Cape Canaveral Ignition',
    program: 'NASA Apollo & Space Shuttle',
    category: 'Mission Milestone',
    desc: 'Assembled propulsion and guidance avionics at LC-39A and achieved nominal orbital trajectory.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bEarth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bEarth)" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,2"/>
      <path d="M50 20 L55 35 L45 35 Z" fill="#ef4444"/>
      <rect x="46" y="35" width="8" height="24" rx="2" fill="#f8fafc"/>
      <polygon points="44,59 40,65 46,65" fill="#ef4444"/>
      <polygon points="56,59 60,65 54,65" fill="#ef4444"/>
      <path d="M50 65 L46 78 L50 84 L54 78 Z" fill="#f97316"/>
      <path d="M50 67 L48 75 L50 78 L52 75 Z" fill="#facc15"/>
      <path d="M30 75 Q40 68 50 72 T70 75" stroke="#22c55e" stroke-width="2" fill="none"/>
      <circle cx="50" cy="22" r="1.5" fill="#ffffff"/>
    </svg>`
  },

  badge_south_pole_ice: {
    id: 'badge_south_pole_ice',
    title: 'South Pole Ice Pioneer',
    program: 'NASA Artemis & CLPS (IM-1 Odysseus)',
    category: 'Deep Polar Milestone',
    desc: 'Achieved the southernmost landing in history (80.13°S) and prospected cryogenic water ice in Permanently Shadowed Regions.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bSouthPole" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#00e5ff"/>
          <stop offset="50%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bSouthPole)" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#7dd3fc" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Polar Crater with Ice Crystals -->
      <path d="M15 72 Q35 60 55 70 T85 68 L85 92 L15 92 Z" fill="#0f172a" opacity="0.9"/>
      <ellipse cx="50" cy="74" rx="28" ry="10" fill="#030712" stroke="#00e5ff" stroke-width="1.5"/>
      <!-- Glowing Ice Crystal Shard -->
      <polygon points="50,22 58,40 50,56 42,40" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>
      <polygon points="50,22 54,40 50,56" fill="#ffffff" opacity="0.8"/>
      <!-- Drill rig / Lander Silhouette -->
      <g transform="translate(68, 52) scale(0.65)">
        <polygon points="10,0 20,20 0,20" fill="#f8fafc"/>
        <line x1="10" y1="20" x2="10" y2="35" stroke="#00e5ff" stroke-width="3"/>
        <circle cx="10" cy="35" r="3" fill="#38bdf8"/>
      </g>
      <!-- Polar Coordinates HUD Text -->
      <text x="50" y="86" text-anchor="middle" font-family="monospace" font-size="6" fill="#38bdf8" font-weight="bold">80.13°S MALAPERT A</text>
    </svg>`
  },

  badge_moon_landing: {
    id: 'badge_moon_landing',
    title: 'One Giant Leap',
    program: 'NASA Apollo 11 Mission',
    category: 'Historic Milestone',
    desc: 'Executed touchdown on Tranquility Base, surveyed the Eagle Lunar Module, and secured retroreflectors.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bMoon" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bMoon)" stroke="#e2e8f0" stroke-width="2.5"/>
      <circle cx="36" cy="38" r="8" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
      <circle cx="64" cy="30" r="5" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
      <circle cx="52" cy="62" r="11" fill="#475569" stroke="#94a3b8" stroke-width="0.8"/>
      <g transform="translate(40, 36) scale(0.65)">
        <rect x="8" y="10" width="16" height="12" rx="2" fill="#fbbf24"/>
        <path d="M6 22 L26 22 L28 32 L4 32 Z" fill="#f59e0b"/>
        <line x1="4" y1="32" x2="-2" y2="44" stroke="#e2e8f0" stroke-width="2"/>
        <line x1="28" y1="32" x2="34" y2="44" stroke="#e2e8f0" stroke-width="2"/>
        <circle cx="-2" cy="44" r="3" fill="#cbd5e1"/>
        <circle cx="34" cy="44" r="3" fill="#cbd5e1"/>
      </g>
      <circle cx="28" cy="22" r="7" fill="#0284c7"/>
      <path d="M25 20 Q28 18 31 22 Q28 26 25 24 Z" fill="#22c55e"/>
    </svg>`
  },

  badge_mars_pathfinder: {
    id: 'badge_mars_pathfinder',
    title: 'Red Planet Pathfinder',
    program: 'NASA Mars 2020 & MSL',
    category: 'Robotic Milestone',
    desc: 'Explored Jezero Crater paleo-delta, retrieved MOXIE core, and inspected Ingenuity flight rotor.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bMars" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="70%" stop-color="#9a3412"/>
          <stop offset="100%" stop-color="#431407"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bMars)" stroke="#fb923c" stroke-width="2.5"/>
      <path d="M15 65 Q35 50 55 68 T90 60 L90 85 L15 85 Z" fill="#7c2d12" opacity="0.6"/>
      <g transform="translate(34, 46) scale(0.7)">
        <rect x="6" y="10" width="32" height="14" rx="2" fill="#ffffff"/>
        <line x1="12" y1="10" x2="12" y2="0" stroke="#94a3b8" stroke-width="2"/>
        <rect x="8" y="-4" width="8" height="5" fill="#0284c7"/>
        <circle cx="8" cy="28" r="4" fill="#334155"/>
        <circle cx="22" cy="28" r="4" fill="#334155"/>
        <circle cx="36" cy="28" r="4" fill="#334155"/>
      </g>
      <g transform="translate(68, 24) scale(0.55)">
        <rect x="6" y="8" width="8" height="8" rx="1" fill="#facc15"/>
        <line x1="10" y1="8" x2="10" y2="4" stroke="#ffffff" stroke-width="1.5"/>
        <line x1="0" y1="4" x2="20" y2="4" stroke="#ffffff" stroke-width="2"/>
        <line x1="1" y1="2" x2="19" y2="2" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="7" y1="16" x2="3" y2="22" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="13" y1="16" x2="17" y2="22" stroke="#cbd5e1" stroke-width="1.5"/>
      </g>
    </svg>`
  },

  badge_europa_abyss: {
    id: 'badge_europa_abyss',
    title: 'Jovian Abyss Explorer',
    program: 'Galileo, Juno & Europa Clipper',
    category: 'Deep Ocean Milestone',
    desc: 'Surveyed the chaotic fractured ice sheets of Europa and captured active cryogeyser plume emissions.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bEuropa" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="60%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#082f49"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bEuropa)" stroke="#7dd3fc" stroke-width="2.5"/>
      <circle cx="75" cy="26" r="18" fill="#ca8a04" opacity="0.85"/>
      <path d="M57 24 Q75 22 93 25" stroke="#92400e" stroke-width="2.5" fill="none"/>
      <path d="M58 29 Q75 27 92 30" stroke="#78350f" stroke-width="2" fill="none"/>
      <ellipse cx="78" cy="30" rx="3" ry="2" fill="#ef4444"/>
      <path d="M20 70 L45 58 L55 65 L80 50" stroke="#b91c1c" stroke-width="1.8" fill="none"/>
      <path d="M35 85 L50 68 L70 78" stroke="#991b1b" stroke-width="1.5" fill="none"/>
      <path d="M32 60 Q30 38 35 25 Q38 38 38 60 Z" fill="#e0f2fe" opacity="0.85"/>
      <circle cx="34" cy="24" r="3" fill="#ffffff" opacity="0.9"/>
    </svg>`
  },

  badge_titan_voyager: {
    id: 'badge_titan_voyager',
    title: 'Titan Cassini Voyager',
    program: 'Cassini-Huygens Mission',
    category: 'Deep Space Frontier',
    desc: 'Landed on Kraken Mare shoreline, located Huygens probe, and unlocked prebiotic nitrogen atmosphere data.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bTitan" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#d97706"/>
          <stop offset="70%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#451a03"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bTitan)" stroke="#fbbf24" stroke-width="2.5"/>
      <ellipse cx="50" cy="26" rx="26" ry="6" stroke="#fef08a" stroke-width="2.5" fill="none" opacity="0.5" transform="rotate(-15 50 26)"/>
      <circle cx="50" cy="26" r="11" fill="#eab308" opacity="0.75"/>
      <path d="M10 70 Q30 65 50 70 T90 68 L90 92 L10 92 Z" fill="#1e1b4b" opacity="0.8"/>
      <path d="M15 76 Q35 72 55 76 T85 74" stroke="#38bdf8" stroke-width="1" fill="none" opacity="0.7"/>
      <path d="M30 68 L40 68 L42 62 L28 62 Z" fill="#f8fafc"/>
      <line x1="35" y1="62" x2="35" y2="52" stroke="#f8fafc" stroke-width="1.5"/>
      <circle cx="35" cy="52" r="2" fill="#ef4444"/>
    </svg>`
  },

  badge_master_explorer: {
    id: 'badge_master_explorer',
    title: 'Grand Tour Master',
    program: 'NASA Solar System Exploration',
    category: 'Elite Mastery',
    desc: 'Completed all 5 verified NASA planetary missions across the Inner, Lunar, Martian, and Outer systems.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bMaster" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#000000"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bMaster)" stroke="#fbbf24" stroke-width="3"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,4"/>
      <polygon points="50,16 54,34 72,34 58,45 63,63 50,51 37,63 42,45 28,34 46,34" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/>
      <path d="M22 62 Q50 35 78 62" stroke="#ef4444" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.5"/>
    </svg>`
  },

  badge_jetpack_ace: {
    id: 'badge_jetpack_ace',
    title: 'Acrobatic EVA Ace',
    program: 'Manned Maneuvering Unit (MMU)',
    category: 'Skill Achievement',
    desc: 'Demonstrated mastery of orbital propulsion by executing extended sustained jetpack flight.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#06b6d4" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,3"/>
      <rect x="36" y="32" width="28" height="26" rx="4" fill="#e2e8f0"/>
      <rect x="32" y="36" width="6" height="20" rx="2" fill="#94a3b8"/>
      <rect x="62" y="36" width="6" height="20" rx="2" fill="#94a3b8"/>
      <path d="M35 56 L31 74 L35 78 L39 74 Z" fill="#06b6d4"/>
      <path d="M65 56 L61 74 L65 78 L69 74 Z" fill="#06b6d4"/>
      <circle cx="50" cy="40" r="6" fill="#38bdf8"/>
    </svg>`
  },

  badge_speedy_repair: {
    id: 'badge_speedy_repair',
    title: 'Rapid Recovery Specialist',
    program: 'NASA Surface Operations',
    category: 'Speed Achievement',
    desc: 'Recovered all essential planetary equipment components in under 60 seconds of surface EVA.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#059669" stroke-width="1" stroke-dasharray="5,2"/>
      <circle cx="50" cy="52" r="22" fill="#022c22" stroke="#34d399" stroke-width="2"/>
      <rect x="47" y="24" width="6" height="6" fill="#34d399"/>
      <line x1="50" y1="52" x2="50" y2="38" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="50" y1="52" x2="60" y2="52" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="50,34 42,48 48,48 44,64 58,46 51,46" fill="#facc15" opacity="0.85"/>
    </svg>`
  },

  badge_rover_driver: {
    id: 'badge_rover_driver',
    title: 'Planetary Rover Pilot',
    program: 'ISRO & NASA Rover Operations',
    category: 'Vehicle Mastery',
    desc: 'Successfully boarded and navigated the extraterrestrial planetary rover across rugged crater basins.',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#0284c7" stroke-width="1" stroke-dasharray="4,2"/>
      <g transform="translate(25, 38) scale(0.7)">
        <rect x="10" y="14" width="50" height="12" rx="3" fill="#f8fafc"/>
        <line x1="18" y1="14" x2="22" y2="2" stroke="#38bdf8" stroke-width="3"/>
        <circle cx="22" cy="2" r="4" fill="#facc15"/>
        <circle cx="15" cy="30" r="8" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="55" cy="30" r="8" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <line x1="20" y1="26" x2="50" y2="26" stroke="#64748b" stroke-width="3"/>
      </g>
    </svg>`
  },

  badge_tiranga_planted: {
    id: 'badge_tiranga_planted',
    title: 'Tiranga Across the Cosmos',
    program: 'Indian Space Mission Milestone',
    category: 'National Achievement',
    desc: 'Proudly planted the Indian National Flag (Tiranga) on an extraterrestrial planetary body!',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <defs>
        <radialGradient id="bTiranga" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#bTiranga)" stroke="#f97316" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,2"/>
      <!-- Silver Mast -->
      <line x1="26" y1="18" x2="26" y2="82" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="26" cy="18" r="3.5" fill="#facc15"/>
      <!-- Tiranga Flag -->
      <g transform="translate(28, 20)">
        <rect x="0" y="0" width="48" height="12" fill="#FF9933" rx="1"/>
        <rect x="0" y="12" width="48" height="12" fill="#FFFFFF"/>
        <rect x="0" y="24" width="48" height="12" fill="#138808" rx="1"/>
        <!-- Ashoka Chakra -->
        <circle cx="24" cy="18" r="5" fill="none" stroke="#000080" stroke-width="1"/>
        <circle cx="24" cy="18" r="1.2" fill="#000080"/>
        <line x1="24" y1="13" x2="24" y2="23" stroke="#000080" stroke-width="0.8"/>
        <line x1="19" y1="18" x2="29" y2="18" stroke="#000080" stroke-width="0.8"/>
        <line x1="20.5" y1="14.5" x2="27.5" y2="21.5" stroke="#000080" stroke-width="0.8"/>
        <line x1="20.5" y1="21.5" x2="27.5" y2="14.5" stroke="#000080" stroke-width="0.8"/>
      </g>
      <!-- Lunar Surface & Footprints -->
      <path d="M10 82 Q50 74 90 82" stroke="#94a3b8" stroke-width="3" fill="none"/>
      <ellipse cx="45" cy="80" rx="3" ry="1.5" fill="#475569"/>
      <ellipse cx="58" cy="81" rx="3" ry="1.5" fill="#475569"/>
    </svg>`
  },

  badge_rocket_builder: {
    id: 'badge_rocket_builder',
    title: 'Cadet Rocket Engineer',
    program: 'I Am Astronut Ground Academy',
    category: 'Engineering Milestone',
    desc: 'Explored Earth base as a cadet, located all hidden rocket components, and built humanity’s launch vehicle!',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#facc15" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,2"/>
      <g transform="translate(32, 22) scale(0.75)">
        <polygon points="24,0 36,24 12,24" fill="#ef4444"/>
        <rect x="14" y="24" width="20" height="38" rx="2" fill="#f8fafc"/>
        <polygon points="8,54 14,48 14,62" fill="#0284c7"/>
        <polygon points="40,54 34,48 34,62" fill="#0284c7"/>
        <rect x="18" y="32" width="12" height="12" rx="6" fill="#38bdf8"/>
        <!-- Tools -->
        <path d="M-6 40 L4 48" stroke="#facc15" stroke-width="3"/>
        <path d="M54 40 L44 48" stroke="#facc15" stroke-width="3"/>
      </g>
    </svg>`
  },

  badge_cadet_promoted: {
    id: 'badge_cadet_promoted',
    title: 'Flight Astronaut Wings',
    program: 'I Am Astronut Commission',
    category: 'Cadet Promotion',
    desc: 'Completed training, earned the golden astronaut flight suit, and proclaimed: I AM ASTRONAUT!',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#022c22" stroke="#10b981" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#34d399" stroke-width="1" stroke-dasharray="4,2"/>
      <!-- Golden Wings -->
      <path d="M15 50 Q30 35 48 45 L50 48 L52 45 Q70 35 85 50 Q70 60 50 56 Q30 60 15 50 Z" fill="#facc15" stroke="#f59e0b" stroke-width="1.5"/>
      <!-- Center Star -->
      <polygon points="50,28 53,38 63,38 55,44 58,54 50,48 42,54 45,44 37,38 47,38" fill="#ffffff" stroke="#38bdf8" stroke-width="1"/>
    </svg>`
  },

  badge_asteroid_evader: {
    id: 'badge_asteroid_evader',
    title: 'Meteor Storm Survivor',
    program: 'Planetary Defense Division',
    category: 'Tactical Survival Mastery',
    desc: 'Dodged lethal falling asteroids raining from space, survived the meteor storm, and safely reached the rocket!',
    iconSvg: `<svg viewBox="0 0 100 100" class="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="#180d05" stroke="#ea580c" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#f97316" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Falling Meteor with Fire Tail -->
      <path d="M78 16 L38 56" stroke="#facc15" stroke-width="6" stroke-linecap="round"/>
      <path d="M78 16 L44 50" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
      <circle cx="34" cy="60" r="10" fill="#78350f" stroke="#ea580c" stroke-width="2"/>
      <circle cx="31" cy="58" r="2.5" fill="#451a03"/>
      <circle cx="37" cy="63" r="1.8" fill="#451a03"/>
      <!-- Impact Shockwave -->
      <path d="M22 68 Q34 62 46 68" stroke="#38bdf8" stroke-width="2" fill="none"/>
      <!-- Deflector Spark -->
      <polygon points="50,75 52,82 60,82 54,86 56,94 50,89 44,94 46,86 40,82 48,82" fill="#38bdf8"/>
    </svg>`
  }
};

// Global exports for all subsystems
window.PLANETARY_DESTINATIONS = PLANETARY_DESTINATIONS;
window.SOLAR_SYSTEM_COLLECTIBLES = SOLAR_SYSTEM_COLLECTIBLES;
window.NASA_BADGES = NASA_BADGES;
window.GAME_DIFFICULTY_MODES = GAME_DIFFICULTY_MODES;
