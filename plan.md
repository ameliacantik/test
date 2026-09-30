Buat sebuah game browser sci-fi luar angkasa berskala besar dengan konsep utama:

PLAYER mengendalikan SATU PESAWAT LUAR ANGKASA BESAR yang berfungsi sebagai rumah, kendaraan, markas berjalan, pusat kru, laboratorium, gudang, dan alat eksplorasi.

Tujuan utama game bukan sekadar menembak musuh, tetapi menjelajahi galaksi, menemukan planet dan sistem bintang, mengungkap misteri kosmik, mengembangkan kapal, membangun hubungan dengan faksi, memperoleh teknologi baru, berdagang, bertahan hidup, dan secara bertahap membuat nama pemain menjadi bagian dari sejarah galaksi.

GAME HARUS DIRANCANG SEBAGAI PROYEK JANGKA PANJANG.
Jangan membuat struktur kode yang hanya cocok untuk prototype 1-2 level. Semua sistem harus modular, data-driven, extensible, dan mudah ditambahkan fitur baru di masa depan.

==================================================

1. VISI GAME
   ==================================================

Genre:

* Space exploration
* Open-galaxy adventure
* Sci-fi RPG
* Survival ringan
* Trading
* Ship management
* Discovery
* Optional combat
* Narrative mystery

Platform:

* Browser desktop terlebih dahulu
* Arsitektur harus memungkinkan ekspansi ke mobile/tablet di masa depan

Gaya:

* Cinematic
* Misterius
* Besar dan sunyi
* Sci-fi modern
* Menekankan sense of scale
* Dunia terasa hidup meskipun sebagian besar ruang angkasa kosong

Core fantasy:
"Pemain memiliki kapal luar angkasa besar dan benar-benar merasa sedang mengembara di galaksi."

Kapal bukan hanya icon pemain.
Kapal adalah karakter utama kedua dalam game.

==================================================
2. CORE GAME LOOP
=================

Buat gameplay loop utama:

Explore
→ Scan
→ Discover
→ Decide
→ Collect / Trade / Research
→ Upgrade Ship
→ Travel Deeper
→ Encounter New Civilization / Phenomenon
→ Unlock New Region
→ Repeat

Jangan membuat gameplay hanya:
travel → fight → loot → upgrade.

Berikan banyak kemungkinan tindakan.

Contoh:

* Menemukan planet mati
* Menemukan planet dengan kehidupan
* Menemukan asteroid field
* Menemukan abandoned station
* Menemukan kapal asing
* Menemukan sinyal misterius
* Menemukan wormhole
* Menemukan ancient structure
* Menemukan sumber energi langka
* Menemukan fenomena gravitasi
* Menemukan koloni
* Menemukan kapal karam
* Menemukan civilization yang sedang perang
* Menemukan sesuatu yang tidak seharusnya ada

==================================================
3. PLAYER SHIP
==============

Kapal pemain harus BESAR.

Bukan fighter kecil.

Kapal adalah deep-space exploration vessel.

Buat kapal memiliki:

Bridge
Engineering
Reactor
Shield Core
Navigation
Cargo Bay
Crew Quarters
Medical Bay
Science Lab
Workshop
Hangar
Drone Bay
Communication Room
Observation Deck
Mining/Extraction Module
Research Module
Storage
Life Support
Weapon Systems

Setiap modul harus bisa:

* Di-upgrade
* Rusak
* Diganti
* Dimodifikasi
* Memiliki konsumsi energi
* Memiliki konsekuensi gameplay

Contoh:

Engine Level 1:
kecepatan rendah

Engine Level 5:
lebih hemat fuel

Engine Level 10:
experimental FTL

Science Lab upgrade:
unlock planetary research

Cargo upgrade:
kapasitas lebih besar

Reactor upgrade:
memberikan energi tambahan untuk sistem kapal

==================================================
4. SHIP AS A LIVING SYSTEM
==========================

Simulasikan beberapa sistem kapal:

Power
Fuel
Hull Integrity
Shield
Oxygen
Heat
Engine Condition
Crew Morale
Food/Supplies
Cargo Capacity
Sensor Range
FTL Capability

Sistem ini harus saling berhubungan.

Contoh:

Engine rusak
→ travel lebih lambat

Reactor rusak
→ beberapa module mati

Life Support rusak
→ crew dalam bahaya

Shield rusak
→ hull lebih cepat menerima damage

Crew morale rendah
→ productivity menurun

Power terlalu tinggi
→ heat meningkat

Heat terlalu tinggi
→ risiko emergency shutdown

Tujuan:
kapal terasa seperti mesin kompleks yang harus dipahami pemain.

==================================================
5. GALAXY SYSTEM
================

Jangan membuat seluruh galaksi berupa daftar planet statis.

Buat sistem GALAXY GENERATOR.

Gunakan procedural generation berbasis seed.

Setiap galaxy memiliki:

* Galaxy seed
* Star density
* Star classes
* Planet generation rules
* Civilization distribution
* Resource distribution
* Anomaly distribution
* Faction territories
* Special locations
* Hidden secrets

Star types:

* Red dwarf
* Yellow star
* Blue giant
* White dwarf
* Neutron star
* Binary star
* Brown dwarf
* Black hole

Setiap sistem bintang bisa memiliki:

* Star
* Planet
* Moon
* Asteroid
* Space station
* Debris
* Anomaly
* Alien structure

GALAXY HARUS DAPAT DIPERLUAS.

Jangan generate semua galaxy sekaligus.

Gunakan:
seed + deterministic generation + chunk/sector streaming.

==================================================
6. GALAXY MAP
=============

Buat galactic map yang menunjukkan:

* Current location
* Explored systems
* Unexplored systems
* Known civilizations
* Trade routes
* Dangerous sectors
* Anomalies
* Black holes
* Wormholes
* Missions
* Discoveries

Map harus memiliki beberapa tingkat zoom:

Galaxy
→ Sector
→ Star System
→ Planet
→ Surface / Point of Interest

Pastikan UI tetap mudah digunakan.

==================================================
7. TRAVEL SYSTEM
================

Travel bukan teleport sederhana.

Buat beberapa mode:

Sub-light travel
FTL travel
Wormhole travel
Emergency jump

Travel membutuhkan:

* Fuel
* Reactor power
* Navigation calculation
* Ship condition

FTL memiliki risiko.

Contoh:

* Jump failure
* Random anomaly
* Navigation error
* Arrival deviation
* Ship damage
* Unknown signal detection

Namun jangan membuat random event terlalu sering.

Eksplorasi harus terasa memiliki arti.

==================================================
8. PLANETS
==========

Setiap planet harus memiliki procedural properties:

Planet Type:

* Earth-like
* Desert
* Ice
* Ocean
* Volcanic
* Toxic
* Gas giant
* Barren
* Forest
* Crystal
* Radioactive
* Rogue planet
* Artificial planet
* Ancient world
* Unknown

Attributes:

* Temperature
* Gravity
* Atmosphere
* Radiation
* Water
* Organic activity
* Mineral density
* Civilization activity

Planet harus bisa menghasilkan:

* resources
* scientific discoveries
* missions
* hazards
* lore
* alien encounters
* unique visual identity

==================================================
9. PLANET LANDING
=================

Tidak semua planet harus bisa didaratkan langsung.

Gunakan kategori:

Fly-by only
Orbital exploration
Landing capable
Deep expedition

Dengan pendekatan tersebut, game dapat memiliki banyak planet tanpa memaksa semuanya memiliki full 3D surface.

Planet landing harus menjadi event penting.

Saat landing:

Player melihat:

* terrain
* atmosphere
* weather
* wildlife
* ruins
* resources
* structures
* anomalies

==================================================
10. DISCOVERY SYSTEM
====================

Discovery adalah salah satu sistem TERPENTING.

Pemain dapat menemukan:

New species
New minerals
New planets
New stars
New structures
New technologies
New anomalies
New civilizations
New historical artifacts
New signals
New cosmic phenomena

Discovery database:

Codex
Stellar Atlas
Species Database
Technology Database
Ancient History
Alien Culture
Anomaly Archive

Setiap discovery mempunyai:

* ID
* Name
* Type
* Description
* Discovery date
* Discovery location
* Rarity
* Scientific value
* Economic value
* Lore value

==================================================
11. FOG OF WAR / UNKNOWN GALAXY
===============================

Galaxy harus benar-benar belum diketahui.

Gunakan state:

Unknown
→ Detected
→ Scanned
→ Visited
→ Explored
→ Fully Surveyed

Pemain tidak langsung mengetahui semua informasi.

Sensor kapal menentukan seberapa banyak informasi yang dapat terlihat.

Upgrade sensor:

* detection range
* long-range scan
* anomaly detection
* life detection
* technology detection

==================================================
12. FACTIONS
============

Buat minimal 6 jenis faksi.

Contoh:

1. Human Federation
2. Independent Traders
3. Military Empire
4. Scientific Coalition
5. Nomadic Civilization
6. Ancient Alien Civilization

Setiap faction memiliki:

* territory
* economy
* military
* ideology
* relationships
* technology
* reputation
* unique missions
* unique ships
* unique stations

Faction harus dapat:

* berteman
* netral
* memusuhi
* berdagang
* memberikan mission
* membuka teknologi
* menutup akses wilayah

Jangan membuat faction sekadar NPC dengan warna berbeda.

==================================================
13. DYNAMIC GALAXY
==================

Galaxy harus dapat berubah dari waktu ke waktu.

Contoh:

Perang dimulai
→ trade route berubah

Koloni bangkrut
→ sistem ekonomi berubah

Pirates mengambil sektor
→ area menjadi berbahaya

Civilization menemukan teknologi baru
→ technology market berubah

Star meledak
→ sistem planet berubah

Ancient entity muncul
→ faction melakukan investigasi

Pemain harus bisa memengaruhi sebagian perubahan.

==================================================
14. CREW SYSTEM
===============

Kapal memiliki crew.

Setiap crew memiliki:

Name
Role
Skill
Personality
Origin
Morale
Relationship
Experience
Traits

Role:

* Pilot
* Engineer
* Scientist
* Doctor
* Navigator
* Security
* Trader
* Explorer
* Technician

Crew dapat:

* naik level
* cedera
* resign
* bertengkar
* membantu pemain
* menemukan event
* mendapatkan loyalty
* membuka quest

Buat sistem relationship sederhana namun dapat dikembangkan.

==================================================
15. SHIP CREW AI
================

Crew bukan hanya angka.

Saat terjadi masalah:

Engine failure
→ Engineer pergi memperbaiki

Enemy detected
→ Security bersiap

Unknown signal
→ Scientist memberikan analisis

Crew morale turun
→ muncul dialogue/event

Gunakan event-driven architecture.

==================================================
16. ECONOMY
===========

Buat ekonomi berbasis region.

Resource harga berbeda di setiap sistem.

Contoh:

Planet mining:
iron murah

Industrial world:
iron mahal

Agricultural world:
food murah

Frontier colony:
food mahal

Technology hub:
advanced components mahal

Harga dipengaruhi:

* supply
* demand
* war
* population
* events
* player actions

==================================================
17. RESOURCES
=============

Resources dibagi:

Basic
Advanced
Rare
Exotic
Alien
Ancient

Contoh:
Iron
Titanium
Water
Rare Earth
Crystal
Dark Matter
Quantum Material
Alien Artifact

Jangan membuat semua resource hanya berbeda nama.

Setiap resource harus memiliki fungsi.

==================================================
18. CRAFTING & RESEARCH
=======================

Buat dua sistem:

Crafting
Research

Crafting:

* ship modules
* drones
* repair parts
* probes
* equipment

Research:

* propulsion
* weapons
* shields
* scanning
* biology
* energy
* ancient technology

Research membutuhkan:

* data
* samples
* resources
* time

==================================================
19. COMBAT
==========

Combat bukan fokus utama, tetapi tetap harus dalam.

Tipe combat:

Ship combat
Drone combat
Turret defense
Boarding
Defensive escape

Ship combat harus mempertimbangkan:

* shields
* armor
* weapons
* reactor
* heat
* crew
* positioning
* enemy systems

Buat beberapa archetype enemy:

Pirate
Military
Alien
Drone
Ancient Machine
Unknown Entity

Tambahkan possibility bahwa player memilih:
Fight
Escape
Negotiate
Hide
Hack
Distract

==================================================
20. ALIEN CIVILIZATIONS
=======================

Buat civilization system yang dapat berkembang.

Alien memiliki:

* biology
* culture
* language
* technology
* economy
* architecture
* beliefs
* behavior

Pada awal game, player tidak langsung memahami bahasa alien.

Gunakan discovery untuk memahami simbol dan bahasa.

Bahasa alien dapat menjadi puzzle ringan.

==================================================
21. MYSTERY / LORE
==================

Game harus memiliki mystery besar.

Contoh premis:

Ada jaringan struktur kuno yang tersebar di seluruh galaksi.

Tidak ada civilization modern yang mengetahui siapa pembuatnya.

Semakin jauh player menjelajah:

Ancient structure
→ strange signal
→ missing civilization
→ impossible star map
→ hidden sector
→ ancient technology
→ cosmic mystery

Lore harus diberikan sedikit demi sedikit.

Jangan langsung menjelaskan semuanya.

==================================================
22. ENDGAME
===========

Jangan membuat endgame hanya "mengalahkan final boss".

Alternatif endgame:

Become legendary explorer
Build scientific empire
Become wealthy trader
Become faction ally
Become independent explorer
Discover ancient civilization
Find hidden galaxy region
Solve the main mystery
Build the most advanced ship
Map a huge percentage of galaxy

Player harus dapat menentukan identitasnya sendiri.

==================================================
23. PROGRESSION
===============

Progression dibagi:

Ship progression
Crew progression
Knowledge progression
Reputation progression
Economic progression
Exploration progression

Gunakan progression bertahap.

Awal game:
Small capability
Limited fuel
Weak sensor
Small crew
Few destinations

Mid game:
Advanced FTL
Larger crew
Rare resources
Dangerous systems

Late game:
Unknown sectors
Ancient technology
Extreme anomalies
Massive discoveries

==================================================
24. NO ARTIFICIAL CONTENT WALL
==============================

Jangan membuat galaxy terasa kecil hanya karena jumlah content statis terbatas.

Gabungkan:

Handcrafted content
+
Procedural systems
+
Random events
+
Faction simulation
+
Discovery system
+
Narrative events

Hasilnya:
world terasa besar tanpa membutuhkan ribuan asset unik sejak awal.

==================================================
25. SAVE SYSTEM
===============

Buat save system yang robust.

Simpan:

Player state
Ship state
Modules
Crew
Inventory
Credits
Discovered systems
Planet discoveries
Codex
Faction reputation
Quest state
World events
Galaxy seed
Important decisions

Gunakan versioned save data.

Contoh:

saveVersion: 1

Agar future update tidak merusak save lama.

==================================================
26. FUTURE MULTIPLAYER READINESS
================================

GAME AWAL TETAP SINGLE PLAYER.

Namun architecture harus mempertimbangkan kemungkinan multiplayer di masa depan.

Pisahkan:

Game state
Player state
World state
Network-relevant objects

Jangan membuat seluruh logic tergantung pada DOM/UI.

Semua core gameplay logic harus berada di layer yang dapat dipindahkan ke server authority jika multiplayer ditambahkan di masa depan.

==================================================
27. PERFORMANCE
===============

Karena game berjalan di browser:

Jangan render seluruh galaxy.

Gunakan:

* lazy loading
* procedural generation
* sector streaming
* object pooling
* level of detail
* instancing
* texture optimization
* culling

Hanya aktifkan simulasi detail untuk area sekitar player.

Galaxy jauh cukup menggunakan data ringan.

==================================================
28. TECHNICAL ARCHITECTURE
==========================

Gunakan architecture modular.

Contoh:

/core
/game
/world
/galaxy
/stars
/planets
/ships
/crew
/combat
/factions
/economy
/research
/missions
/discovery
/events
/save
/ui
/audio
/rendering
/data

Pisahkan:

Game Logic
Rendering
UI
Data
Persistence

Jangan hardcode seluruh game di satu file.

==================================================
29. DATA-DRIVEN DESIGN
======================

Gunakan data object/config untuk:

Ships
Modules
Planets
Stars
Resources
Factions
Crew
Enemies
Missions
Technology
Discoveries
Events

Contoh konsep:

PlanetDefinition
StarDefinition
ShipModuleDefinition
FactionDefinition
ResourceDefinition
MissionDefinition
DiscoveryDefinition

Dengan ini konten baru dapat ditambahkan tanpa mengubah core engine.

==================================================
30. EVENT SYSTEM
================

Buat global event bus.

Contoh events:

PLAYER_ENTERED_SYSTEM
PLAYER_DISCOVERED_PLANET
SHIP_DAMAGED
CREW_INJURED
FACTION_RELATION_CHANGED
RESOURCE_SOLD
ANOMALY_DETECTED
MISSION_COMPLETED
ANCIENT_SIGNAL_FOUND

Sistem event harus dapat digunakan oleh berbagai modul.

==================================================
31. QUEST SYSTEM
================

Quest harus bersifat modular.

Quest types:

Exploration
Delivery
Research
Rescue
Combat
Investigation
Trading
Diplomacy
Survey
Mystery

Quest dapat memiliki branching outcomes.

Contoh:

Investigate signal
→ Ignore
→ Study signal
→ Follow signal
→ Sell information
→ Report to faction

Pilihan pemain dapat menghasilkan konsekuensi.

==================================================
32. UI/UX
=========

UI utama harus terasa seperti spaceship interface.

Screen utama:

* Cockpit
* Galaxy Map
* Ship Systems
* Crew
* Inventory
* Mission Log
* Codex
* Research
* Faction Relations
* Market

HUD jangan terlalu ramai.

Pemain harus dapat memahami kondisi kapal dalam beberapa detik.

Gunakan hierarchy visual:
Critical
Warning
Normal
Informational

==================================================
33. VISUAL DIRECTION
====================

Visual harus memberikan rasa skala.

Gunakan:

* Large star fields
* Nebula
* Planet silhouettes
* Distant stars
* Ship interior lighting
* Holographic maps
* Subtle particles
* Cinematic camera movement

Prioritaskan readability daripada visual overload.

==================================================
34. AUDIO
=========

Audio harus banyak menggunakan ambient sound.

Di deep space:

* low engine hum
* reactor sound
* navigation beeps
* radio noise
* distant cosmic ambience

Saat menemukan sesuatu:
audio berubah secara halus.

Jangan membuat musik terus-menerus penuh.
Gunakan silence sebagai bagian dari atmosphere.

==================================================
35. RANDOM EVENTS
=================

Buat event generator.

Contoh:

* Distress signal
* Pirate ambush
* Unknown transmission
* Space storm
* Drifting survivor
* Derelict ship
* Ancient probe
* Resource anomaly
* Faction patrol
* Wormhole opening
* Strange biological signal

Event memiliki rarity.

Common
Uncommon
Rare
Very Rare
Legendary
Unique

==================================================
36. UNIQUE DISCOVERIES
======================

Beberapa discovery harus unik.

Contoh:

"The Silent Planet"

Planet yang tidak memiliki sinyal radio tetapi semua teknologi di permukaannya masih aktif.

Setelah ditemukan:

* Codex entry created
* Quest chain unlocked
* Factions become interested
* New research unlocked
* Future events reference the discovery

Discovery penting harus memiliki CONSEQUENCE.

==================================================
37. WORLD MEMORY
================

Galaxy harus mengingat tindakan pemain.

Contoh:

Player membantu colony.

Beberapa jam kemudian:

* colony berkembang
* new station dibangun
* trade route berubah
* NPC mengingat player

Player menghancurkan pirate base:

* pirates retaliate
* trade route menjadi lebih aman
* faction reputation berubah

Ini membuat dunia terasa persistent.

==================================================
38. CONTENT GENERATION
======================

Buat generator untuk:

Star system
Planet
Moon
Asteroid field
Space station
Alien ruins
Derelict ship
Mission
Random event

Gunakan seed.

Contoh:

Galaxy Seed:
GALAXY-847291

Jika seed sama:
basic world structure tetap konsisten.

==================================================
39. SAFE RANDOMNESS
===================

Procedural generation jangan menghasilkan dunia yang tidak masuk akal.

Gunakan rules.

Contoh:

Gas giant:
tidak menggunakan normal surface landing

Black hole:
sangat berbahaya

Extreme radiation:
membutuhkan technology tertentu

Civilization capital:
lebih padat

Dead systems:
resource rendah tetapi anomaly mungkin tinggi

==================================================
40. DIFFICULTY
==============

Tidak semua area harus dapat dijangkau sejak awal.

Gunakan natural gating:

Fuel capacity
FTL range
Shield strength
Radiation resistance
Sensor technology
Crew capability
Navigation technology

Jangan hanya gunakan "level required".

Biarkan kapal berkembang secara nyata.

==================================================
41. PLAYER FREEDOM
==================

Player tidak harus mengikuti satu jalur.

Player dapat menjadi:

Explorer
Scientist
Trader
Miner
Diplomat
Mercenary
Treasure Hunter
Independent Captain
Faction Agent

Jangan paksa semua player memainkan game dengan cara sama.

==================================================
42. LONG-TERM WORLD DESIGN
==========================

Design game supaya dapat menerima expansion:

Expansion 1:
New faction

Expansion 2:
New galaxy region

Expansion 3:
New alien species

Expansion 4:
Planet surface gameplay

Expansion 5:
Fleet system

Expansion 6:
Player-owned space station

Expansion 7:
Multiplayer

Expansion 8:
Procedural civilization simulation

Core architecture harus mempermudah penambahan semua itu.

==================================================
43. DEVELOPMENT ROADMAP
=======================

Jangan langsung membuat semuanya.

Gunakan fase.

PHASE 1 — CORE PROTOTYPE

Implement:

* basic ship
* galaxy map
* star system
* travel
* simple planets
* scan
* basic resources
* save/load

Goal:
Player sudah dapat:
spawn → travel → scan → discover → kembali → save.

PHASE 2 — SHIP MANAGEMENT

Tambah:

* power
* fuel
* hull
* shield
* modules
* repairs
* upgrades

PHASE 3 — EXPLORATION

Tambah:

* procedural galaxy
* planetary generation
* anomaly
* discovery
* codex
* random events

PHASE 4 — ECONOMY

Tambah:

* stations
* markets
* resources
* trading
* missions

PHASE 5 — CREW

Tambah:

* crew
* roles
* morale
* events
* relationships

PHASE 6 — FACTIONS

Tambah:

* reputation
* territory
* diplomacy
* faction missions
* faction economy

PHASE 7 — NARRATIVE

Tambah:

* main mystery
* lore
* branching quest
* ancient civilization

PHASE 8 — POLISH

Tambah:

* advanced rendering
* particles
* sound
* animations
* UI polish
* performance optimization

==================================================
44. MVP
=======

MVP HARUS TETAP MENYENANGKAN.

MVP minimal:

1 controllable ship
1 galaxy
20–50 star systems generated
5 planet types
5 resource types
1 small faction
10 random events
basic upgrade system
basic exploration
save/load
galaxy map
codex

Jangan mengejar 1000 fitur sebelum core loop menyenangkan.

==================================================
45. IMPORTANT DESIGN RULE
=========================

Setiap fitur baru harus melewati pertanyaan:

"Apakah fitur ini membuat pemain merasa lebih seperti kapten kapal luar angkasa yang benar-benar menjelajahi galaksi?"

Jika tidak, fitur tersebut bukan prioritas.

==================================================
46. TECH STACK
==============

Untuk browser game, gunakan teknologi modern yang cocok untuk WebGL/WebGPU.

Gunakan:

* TypeScript
* HTML/CSS
* WebGL atau WebGPU based rendering
* modular game architecture
* local persistence untuk prototype
* scalable backend interface untuk future online features

Renderer harus dipisahkan dari game logic.

==================================================
47. DEVELOPMENT RULES FOR AI CODER
==================================

Saat mengembangkan game:

1. Jangan menghasilkan satu file monolitik.
2. Jangan hardcode seluruh content.
3. Jangan membuat sistem procedural yang tidak deterministic.
4. Jangan membuat UI menjadi tempat penyimpanan game logic.
5. Jangan menghapus architecture lama hanya karena fitur baru ditambahkan.
6. Buat interface dan types yang jelas.
7. Gunakan reusable components.
8. Gunakan constants/configuration untuk balancing.
9. Buat system dapat dites secara terpisah.
10. Setiap fitur baru harus kompatibel dengan save system.
11. Pertahankan backward compatibility save ketika memungkinkan.
12. Optimalkan browser performance sejak awal.
13. Hindari simulasi objek yang terlalu jauh dari player.
14. Jangan membuat seluruh galaxy aktif bersamaan.
15. Pisahkan content data dari engine logic.

==================================================
48. PRIORITY ORDER
==================

Prioritas pengembangan:

1. Fun exploration
2. Ship feeling
3. Galaxy navigation
4. Discovery
5. Progression
6. World simulation
7. Factions
8. Story
9. Combat
10. Expansion systems

Combat tidak boleh mengambil alih identitas game.

==================================================
49. FINAL EXPERIENCE
====================

Saat player memainkan game, pengalaman idealnya terasa seperti:

"Di sini saya sedang berada di ujung galaksi.
Saya melihat sistem bintang yang belum pernah saya datangi.
Sensor saya menangkap sesuatu.
Saya tidak tahu apa itu.
Saya bisa mendekat.
Saya bisa pergi.
Saya bisa menyelidikinya.
Dan keputusan saya mungkin mengubah sesuatu."

Game harus memberikan sense of:

* scale
* discovery
* curiosity
* uncertainty
* ownership
* progression
* consequence

==================================================
50. FINAL INSTRUCTION TO AI DEVELOPER
=====================================

Bangun game secara bertahap.

Jangan mencoba membuat seluruh game sekaligus.

Mulai dari vertical slice yang benar-benar playable:

SHIP
→ GALAXY MAP
→ STAR SYSTEM
→ TRAVEL
→ PLANET
→ SCAN
→ DISCOVERY
→ RETURN
→ UPGRADE
→ SAVE

Setelah vertical slice stabil, baru tambahkan sistem lain satu per satu.

Setiap fase harus:

* playable
* modular
* testable
* performant
* extensible
* compatible dengan future content

Target akhirnya adalah sebuah browser space exploration game yang dapat berkembang dari prototype kecil menjadi universe besar dengan banyak sistem tanpa harus membongkar foundation project.
