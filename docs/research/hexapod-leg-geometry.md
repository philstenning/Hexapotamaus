# Hexapod leg geometry: what the research says

Research notes for the Hexapotamaus redesign: 3-DOF legs (coxa yaw, femur pitch, tibia pitch) on Hiwonder/LewanSoul LX-16A bus servos, with Python IK on a Raspberry Pi.

Compiled 2026-11-20. **How much to trust each claim** is shown by these tags:

| Tag | Meaning |
|---|---|
| **[P]** | Primary source, full text read (paper, datasheet or source code) |
| **[A]** | Primary source, but only the abstract or bibliographic record could be read (paywalled or blocked) |
| **[S]** | Secondary: a review or another paper describing the original. Lower confidence |
| **[H]** | Hobbyist practice: open-source configs or forum lore. Not research |
| **[D]** | Derived: my own statics or geometry from first principles, not taken from a source. Check it yourself |

---

## TL;DR

1. **There is no formal standard.** No ISO, IEEE or similar standard covers hexapod body or leg geometry. There is design research (optimisation studies, gait-stability theory) and hobbyist convention, and the two mostly agree. Treat everything below as guidance.
2. **Use a "hybrid" layout: a rectangular body with the corner legs splayed (about ±45°) and the middle legs mounted further out than the corners.** Research favours hexagonal or radial layouts for turning and stability margin [A: Chu & Pang 2002] [S: Tedeschi & Carbone 2014]. A 2022 optimisation pushed the middle-leg hips outward and the corner hips inward, which makes a rectangular body more hexagonal and improves stability [P: Burkus et al. 2022]. The PhantomX (corners ±45°, middle hips 100 mm out against 60 mm at the corners) and Phoenix (±60°) open-source hexapods use this layout [H]. The original Hexapotamaus appears to have parallel legs on a rectangular frame, judging by the photos in `images/`, so this is the biggest layout change to consider.
3. **Make the femur and tibia closer in length than they were.** The original is about coxa 50 / femur 68 / tibia 193 mm, a tibia-to-(femur+tibia) ratio of **0.74**. Published optima fall between **0.5 and 0.63**:
   - femur ≈ tibia for maximum workspace [P: Liu et al. 2025] [A: Deng et al. 2014]
   - femur:tibia = 4:6 [A: Biomimetics 2026]
   - distal ratio 0.63 for rough terrain [P: Chen et al. 2022]

   As a starting point, take coxa ≈ 0.1–0.2 of total leg length and tibia ≈ 1.0–1.7 × femur.
4. **The long tibia is why the original had a dead zone near the body.** For a two-link femur/tibia chain the foot cannot get closer to the femur axis than |tibia − femur|. That is about 125 mm, and the old code found 130 mm (`MIN_REACH_RADIUS`) [D]. With more equal links the foot can be placed under or near the hip, which allows lower-torque stances and a bigger walkspace.
5. **Size the servos for the middle leg in tripod gait.** In a tripod stance the middle leg carries about **half the robot's weight** while each corner leg carries a quarter [D, and stated in P: Burkus et al. 2022]. Femur torque ≈ leg load × horizontal distance from the femur axis to the foot. With an estimated 2.2 kg robot, a middle-leg load of 1.1 kgf and a 12 cm lever, that is about 13 kg·cm, or 68% of the LX-16A's 19.5 kg·cm stall rating [P: Hiwonder manual] [D]. **Keep the feet close in (horizontal lever ≤ about 7–8 cm in tripod) or use ripple or wave gaits when carrying load.**
6. **No continuous torque rating is published for the LX-16A.** The only primary derating guidance I found is from ROBOTIS for a similar-class servo: design loads at **≤ 1/5 of stall** [P: ROBOTIS AX-12A e-manual]. For the LX-16A that would be about 4 kg·cm. Hobby hexapods clearly run hotter than this, so treat it as a conservative bound.
7. **Static stability is rarely the limit for a tripod hexapod; workspace and torque are.** With symmetric feet the tripod gait stays statically stable for strides up to about half the front-to-rear foot spacing, and widening the middle-leg stance extends this [D, building on the McGhee & Frank 1968 stability margin]. Set the stride from the leg-to-leg collision limit instead: stride ≤ neighbouring foot spacing − clearance [D].
8. **Fix the body as a parameter set before drawing.** Parameters: hip positions (x, y), hip yaw angles, coxa, femur and tibia lengths, and neutral stance radius and height. This fits your fully constrained SolidCraft workflow, and a short Python check of torque and margin (formulas below) can sweep the values before you print anything.

---

## Is there a standard?

**No.** I found no ISO, IEC, IEEE, ASTM or national standard for walking-robot body or leg geometry. Everything in this area falls into one of three groups:

- **Theory with formal definitions that everyone reuses.** The main example is the static stability margin, defined by McGhee & Frank (1968) as the shortest distance from the centre-of-mass projection to the edge of the support polygon [A: McGhee & Frank 1968] [S: Tedeschi & Carbone 2014]. Gait-stability theorems also belong here, e.g. that the wave gait is the optimally stable periodic gait [A: Song & Choi 1990] [S]. These are mathematical results, not standards.
- **Design-procedure and optimisation papers.** These pick a body shape, leg shape and segment lengths to satisfy a chosen cost function (workspace, energy, torque balance, terrain). Their answers depend on the cost function and the robot's scale, so none of them is universal [P: Tedeschi & Carbone 2014] [P: Burkus et al. 2022] [P: Liu et al. 2025].
- **Hobbyist convention.** Examples are the Lynxmotion Phoenix and Trossen PhantomX configs, and forum threads. These are useful because they are proven at your scale, but nobody derived them formally [H].

Tedeschi & Carbone's review is probably the closest thing to a "design guide". It is a weighted decision-matrix procedure, not a set of numbers. In their case study it favoured a rectangular body with "hybrid" legs [P: Tedeschi & Carbone 2014].

---

## Body layout: rectangular vs hexagonal (radial)

### Definitions

- **Rectangular (bilateral):** three legs per side along two parallel sides [P: Tedeschi & Carbone 2014, §3.1]. In the strictest version all hips point straight out (yaw 0°).
- **Hexagonal / circular (radial):** six legs spaced evenly around the body, 60° apart, all at the same radius. The body has no preferred front [P: Tedeschi & Carbone 2014, §3.1].
- **Hybrid / "oval" (what most hobby hexapods use):** a rectangular-ish body where the corner hips are yawed outward, usually ±45° to ±60°, and the middle hips often sit further from the centreline. Strictly this is just a rectangular body with splayed corner legs [H: PhantomX and Phoenix configs] [P: Burkus et al. 2022].

### What the research says

- **Chu & Pang (2002)** analysed an equilateral hexagonal model against a rectangular one. They report that the hexagonal model has **better turning ability, a higher stability margin in fault-tolerant gait, and a longer stride in certain conditions** [A: Chu & Pang 2002, IEEE T-SMC-A 32(6)]. I could only read the abstract and metadata; the full text was blocked.
- **Tedeschi & Carbone (2014)** summarise the earlier literature:
  - "Bilateral symmetry may be better suited than radial symmetry to move along a straight line. Rectangular architectures require a special gait for turning action; generally, they need four steps in order to realize a turning action."
  - Preumont et al. (1991) "proved that hexagonal hexapods can easily steer in all directions and that they have a longer stability margin."
  - Takahashi & Arai (2000) found hexagonal robots better at moving and rotating in all directions.

  [P: the review itself] [S: for the Preumont, Takahashi and Ding claims, whose originals I could not read]
- **Wang, Ding & Rovetta (2010)** compared hexagonal and rectangular robots theoretically and experimentally (NOROS prototype). They claim "advantages of hexagonal hexapod robots over rectangular ones" in stability, fault tolerance, turning and terrain adaptability [A: Robotica 28(6)].
- **Burkus et al. (2022)** ran a multi-objective optimisation (energy, body shaking, joint-torque balance) of a rectangular hexapod's geometry:
  - **Hip positions:** "The connection points of the inner legs along the y-axis are further away from the body, and those of the outer legs are closer. This more uniform distribution around the robot's center of gravity increases its stability." The optimised lateral distance between the two hips of a pair came out at about 60–64 mm for the outer pairs and about 135–139 mm for the middle pair (Table 7, two-step result).
  - **Load:** Their predecessor robot, with "legs arranged in a line on each side", had such uneven joint torques in tripod gait that the middle legs needed stronger motor units.
  - **Result:** The optimised structure cut energy per metre by 22% and joint-torque differences by 49%.

  [P: Burkus et al. 2022]
- **LAURON V** (FZI Karlsruhe) optimised its leg mounting angles to enlarge the workspace and improve the support polygon, and compared the result with the stick insect [S: via Burkus et al. 2022, which cites Roennau et al. 2013]. I could not get the angle values from the original paper.

**Caveat on the "turning" advantage.** The "rectangular robots need four steps to turn" claim comes from fixed-gait analyses. A modern body-frame IK controller turns a rectangular hexapod in place with a normal tripod gait by rotating the foot targets about the body centre. The Phoenix code does exactly this (`TravelRotationY`) [H: Phoenix_Code.h]. The real cost of a rectangular layout is that the **corner feet sit further from the yaw centre than the middle feet**, so for a given body rotation the corner legs need a longer stroke and they limit the turn rate [D]. On a hexagonal body all feet are at the same radius, so every leg's stroke is equal [D].

### Trade-off table

| Aspect | Rectangular, parallel legs | Hybrid (corners splayed ±45–60°, middle legs wider) | Hexagonal / radial (60° spacing, equal radius) |
|---|---|---|---|
| Straight-line walking | Good; natural forward axis [S: Tedeschi] | Good | Good in any direction, with no preferred front [S] |
| Turning in place | Corner feet travel further than middle feet, so corners limit the turn rate [D]; fixed-gait analyses need multi-step turns [S] | Better: corner feet sit closer to a common radius [D] | Best: all feet at the same radius [A: Chu & Pang] [S: Preumont] |
| Static stability margin (tripod) | Lowest; middle feet close to the centreline make the support triangle slim [D] | Higher; optimisation moved toward this shape [P: Burkus] | Highest for equal leg reach [A: Chu & Pang] |
| Leg collision / workspace overlap | Neighbouring feet on a side are spaced only by hip pitch, so stride ≤ hip pitch − clearance [D] | Splaying spreads the feet apart, allowing a longer stride for the same body length [D] | Adjacent feet sit 60° apart, a chord equal to the foot radius [D] |
| Load sharing in tripod | Middle leg carries about 2× a corner leg [P: Burkus] [D] | Same 2×, unless the middle feet are pushed further out [D] | More even when foot radii are equal [D] |
| Body volume for electronics and battery | Long box, easy to pack | Long box, easy to pack | Round or hexagonal plate; less convenient for a rectangular Pi and battery |
| CAD and IK complexity | Simplest: same offset for all legs | Per-leg hip pose (x, y, yaw); trivial in IK once parameterised | Per-leg hip pose; uniform |
| Used by | Many research robots and the original Hexapotamaus (from photos) | Lynxmotion Phoenix (±60°), Trossen PhantomX (±45°) [H] | Research platforms (NOROS, Rastgar et al. 2019) [A] |

### Concrete numbers from proven hobby designs [H]

From the Phoenix firmware configs (`Hex_Cfg.h`). X is lateral and Z is fore-aft in that code.

| Robot (servo) | Corner hips (lateral, fore-aft) | Middle hips (lateral) | Corner hip yaw | Coxa / femur / tibia (mm) |
|---|---|---|---|---|
| Trossen PhantomX (Dynamixel AX-12A/18A, 1.5–1.8 N·m stall) | ±60, ±120 mm | ±100 mm | ±45° | 52 / 66 / 133 (femur and tibia commented "MEASURE THIS!!! Guessed now") |
| Lynxmotion Phoenix (hobby PWM servos) | ±43, ±82 mm | ±63 mm | ±60° | 29 / 76 / 106 |

Both put the middle hips **about 1.5–1.7× further out than the corner hips**, the same direction the Burkus optimisation went. The PhantomX hip footprint is 240 mm long × 120 mm (corners) / 200 mm (middle) wide. Its default stance places each foot 147 mm radially from its coxa axis [H].

**Body width vs length.** I found **no research result giving an optimal length-to-width ratio**. Burkus et al. fixed the body length and optimised hip positions inside it. The CSIRO "Bullet" research hexapod is 500 × 280 mm (1.8:1) [P: Tam et al. 2020]. PhantomX hips span about 2:1 (corners) and about 1.2:1 (middle). Treat 1.5–2:1 as convention, not a finding.

---

## Leg segment lengths and ratios

### Research results

| Source | Kind | Finding |
|---|---|---|
| Liu, Yang, Wang & Feng 2025 (arXiv 2507.16328), 3-DOF coxa/femur/tibia hexapod leg | [P] | Workspace is largest when **femur = tibia**. With coxa 0.1–0.2 of total length, **tibia 0.40–0.45** of total. Average manipulability peaks at tibia ≈ 0.45 and falls as the coxa ratio grows. Body flexibility is also best at tibia ≈ 0.40–0.45. |
| Deng et al. 2014, *Robot* 36(5), hydraulic hexapod | [A] | Reasonable range: coxa 0–0.1 and thigh (femur) 0.4–0.5 of total. Built leg ratio **0.09 : 0.455 : 0.455**. |
| Biomimetics 11(5):352 (2026), spider-inspired hexapod | [A] | Compared six femur:tibia ratios at fixed total length. Chose **4:6** for forward reach, foot lift, stride potential and compactness. |
| Chen et al. 2022, *Bioinspir. Biomim.* 17:066009, two-link planar leg on rocky terrain | [P] | Optimal **distal segment = 0.63 of femur+tibia length**, which lets the leg cross rocks 37% of leg length in diameter. Intertidal crab walking legs cluster at the same 0.63. |
| Burkus et al. 2022, hexapod with zero-length coxa | [P] | Optimised femur 141–167 mm and tibia 121–140 mm (Table 7), so **femur slightly longer than tibia**. Femur and tibia lengths were tuned separately for the middle and outer pairs. |

**Summary:** keep the coxa short (≤ 0.2 of total), and the femur and tibia **similar in length**, with the tibia between 1.0× and about 1.7× the femur. Equal lengths maximise workspace; a longer tibia helps clearance and rough-terrain stepping.

### Where the original Hexapotamaus sits

From [`packages/robot/src/leg_calculations_2.py`](../../packages/robot/src/leg_calculations_2.py):

- coxa (motor 1 to motor 2) 50 mm; `legcalculations.py` says 40
- femur (motor 2 to motor 3) 68 mm; 70 in the older file
- tibia straight-line length 193.5 mm, a bent part with a 36° offset
- `MAX_REACH_RADIUS` 261 mm and `MIN_REACH_RADIUS` 130 mm

| Design | Coxa : femur : tibia (fraction of total) | Tibia / (femur + tibia) | Tibia / femur |
|---|---|---|---|
| Hexapotamaus v1 | 0.16 : 0.22 : 0.62 | **0.74** | 2.85 |
| PhantomX [H] | 0.21 : 0.26 : 0.53 | 0.67 | 2.0 |
| Phoenix [H] | 0.14 : 0.36 : 0.50 | 0.58 | 1.4 |
| Chen et al. optimum [P] | n/a | 0.63 | 1.7 |
| 4:6 design [A] | n/a | 0.60 | 1.5 |
| Liu et al. / Deng et al. [P/A] | 0.1–0.2 : ~0.45 : ~0.45 | 0.50 | 1.0 |

Consequences of the long tibia and short femur [D]:

- **Dead zone near the body.** In the femur–tibia plane the foot can only reach an annulus from |tibia − femur| to tibia + femur around the femur axis: 125–261 mm here. That is why the code needed `MIN_REACH_RADIUS = 130`. Feet cannot be tucked in under the hips, and that is exactly the stance that minimises femur torque.
- **Large knee torque for any tibia lean.** The knee moment arm is tibia × sin(lean), so a 193 mm tibia leaning 20° gives a 6.6 cm lever.
- **The robot tends to stand with the feet far out**, which raises both femur and knee torque (see the torque section).

### Relating segments to body size, clearance and stride [D]

These are first-principles relations, not sourced rules:

- **Ground clearance.** In a "spider" stance (femur roughly horizontal, tibia roughly vertical), body clearance ≈ tibia vertical length − (femur-axis height above the body underside). Clearance therefore comes mostly from the tibia, which argues against shortening it too far.
- **Stride.** With a coxa-yaw-driven stride, stride ≈ 2 · R_foot · sin(Δψ/2), where R_foot is the horizontal distance from the coxa axis to the foot and Δψ is the coxa yaw swing used. Longer stance radius gives more stride, but also more torque.
- **Collision limit.** Neighbouring legs on one side are in opposite phase in tripod, so their feet approach each other by a full stride. Stride ≤ (neutral foot-to-foot spacing) − (foot and link clearance). Splaying the corner legs raises the foot-to-foot spacing without lengthening the body. OpenSHC formalises this as the "walkspace": the largest per-leg workspace polygon with no overlap between legs, which then caps the stride [P: Tam et al. 2020].
- **Minimum hip pitch.** The LX-16A body is 45.22 × 24.72 × 36.3 mm [P: Hiwonder manual]. The coxa servo plus bracket sets a hard minimum spacing between hips on the same side, roughly 50–60 mm depending on orientation.

### Leg orientation: "insectoid" (sprawled) vs "mammalian" (legs under body)

- CSIRO's Bullet hexapod can switch configuration. Experiments show the **mammalian** configuration uses less power, while the **insectoid** one is more stable at low step frequencies and faster at top speed [P: Tam et al. 2020].
- The pitch joints of an insectoid (yaw-pitch-pitch) leg "are required to bear the body weight, even when stationary", which costs energy compared with the mammalian configuration [P: Tam et al. 2020].
- For a 3-DOF yaw-pitch-pitch leg like yours, the practical lever is how far out the feet stand: further out means wider support and more torque [D].

---

## Stability and gait implications

### Definitions

- **Static stability margin (SSM):** the shortest distance from the ground projection of the centre of mass to the edge of the support polygon. Introduced by McGhee & Frank (1968) [A: Math. Biosci. 3:331–351] [S: Tedeschi & Carbone 2014].
- **Duty factor β:** the fraction of the cycle a leg spends on the ground. β ≥ 0.5 is walking [P: Tedeschi & Carbone 2014].
- **Gaits** [P: Burkus et al. 2022, §4]:
  - **wave:** one leg in the air at a time, β = 5/6, slowest and most stable
  - **ripple:** two legs in the air at a time, one per side, four on the ground
  - **tripod:** three legs in the air at a time, β = 1/2, fastest
- **Optimality:** the wave gait is the optimally stable gait among periodic gaits of 2n-legged walkers [A: Song & Choi 1990, IEEE T-SMC 20:888–902] [S]. An earlier numerical result for hexapods is credited to Bessonov & Umnov (1973) [S].

### Tripod support triangle [D]

Put the centre of mass at the origin, with x forward and y lateral. The stance tripod has:

- front-corner foot at (+a, +W_c)
- rear-corner foot at (−a, +W_c)
- middle foot on the other side at (0, −W_m)

- Margin to the side edge (corner–corner) = W_c.
- Margin to each diagonal edge (corner–middle), with the body shifted forward by x₀ during stance:

  **SSM_diag = (a·W_m − (W_c + W_m)·|x₀|) / √(a² + (W_c + W_m)²)**

- The margin reaches zero at |x₀| = a·W_m / (W_c + W_m). The largest statically stable tripod **stroke** is therefore

  **s_max = 2·a·W_m / (W_c + W_m)**

  which equals `a` when W_c = W_m.

Worked numbers (mm):

| a | W_c | W_m | SSM at mid-stance | s_max | SSM at end of an 80 mm stroke |
|---|---|---|---|---|---|
| 150 | 150 | 150 | 67 | 150 | 31 |
| 150 | 150 | 200 | 79 | 171 | 42 |
| 150 | 120 | 200 | 85 | 188 | 49 |

**Takeaways:**

- **Widening the middle-leg stance raises both the tripod margin and the stable stroke**, which agrees with the Burkus optimisation.
- For typical hobby strides (50–100 mm) on flat ground, the tripod stays statically stable with margin to spare. **Leg-to-leg collision and servo torque will limit the design first.**
- The margin is zero the instant the support set changes unless feet overlap in time. Lee, Liao & Chen (1988) analyse this tripod case specifically [A: IEEE J-RA 4:427–434].

### Gait choice and geometry

| Gait | Legs on ground | Worst per-leg load (flat, symmetric) | Stability | Notes |
|---|---|---|---|---|
| Tripod | 3 | **Middle leg ≈ mg/2**, corners ≈ mg/4 [D] [P: Burkus "nearly twice the load"] | Lowest margin of the three | Fastest. The rectangular layout makes the middle-leg overload worse |
| Ripple | 4 (2 per side) | ≈ mg/4, more uniform [P: Burkus chose ripple for this reason] | Medium | Good default for a heavy robot on LX-16As |
| Wave | 5 | ≈ mg/5 | Highest (optimal among periodic gaits) [A: Song & Choi] | Slow; good for testing and payloads |

**Why the middle leg carries half the weight [D].** Moments about the body's long axis must balance. The two same-side corner legs act at lateral distance W_c and the middle leg at W_m. With W_c = W_m and the centre of mass centred: F_middle = F_front + F_rear, and all three sum to mg, so F_middle = mg/2. Pushing the middle foot further out (W_m > W_c) **does not** reduce the middle leg's share; it stays mg/2 by the same moment balance. What it does is increase the margin and let the middle foot be placed with a shorter femur lever relative to its own hip, if the hip is moved outward with it.

---

## Servo and torque considerations for the LX-16A

### Datasheet values [P: Hiwonder LX-16A user manual, in this repo]

| Parameter | Value |
|---|---|
| Stall torque | **19.5 kg·cm @ 7.4 V**; 17 kg·cm @ 6 V |
| Supply voltage | 6–8.4 V. A 2S LiPo is within range; torque falls toward 17 kg·cm as the pack sags |
| Speed | 0.19 s / 60° @ 7.4 V |
| Stall current | 2.4–3 A. 18 servos could pull tens of amps at worst case, so size the BEC/regulator and wiring |
| No-load current | 100 mA |
| Range | 0–240° (0–1000 counts) |
| Accuracy | 0.3° |
| Mass | 54 g, so 18 servos ≈ 0.97 kg before frame, Pi and battery |
| Size | 45.22 × 24.72 × 36.3 mm |
| Protection | "Avoid stalling and overheat" |

Hiwonder publishes **no rated or continuous torque**, only stall. For a comparable bus servo, ROBOTIS's AX-12A manual (1.5 N·m ≈ 15.3 kg·cm stall) states: "Stable motions are possible with robots designed for loads with 1/5 or less of the stall torque" [P: ROBOTIS e-manual]. I found no equivalent Hiwonder statement.

### Simple static torque model [D]

Per stance leg, with F the vertical load on that leg:

- **Femur (hip-pitch) servo:** τ_femur ≈ F · d_f, where d_f = horizontal distance from the femur axis to the foot contact.
- **Tibia (knee) servo:** τ_tibia ≈ F · d_t, where d_t = horizontal distance from the knee axis to the foot = L_tibia · sin(tibia lean from vertical).
- **Coxa (yaw) servo:** close to zero for pure vertical load on flat ground. It carries the propulsion and turning friction forces, plus bending on its bearing, so check bracket stiffness rather than torque.

Vertical load per leg:

- tripod: F_middle = mg/2, F_corner = mg/4
- ripple: about mg/4
- wave: about mg/5

Leave headroom for acceleration, foot impact and the legs' own mass. The ROBOTIS ≤ 1/5-stall figure is the conservative bound. Many hobby hexapods run nearer 1/3–1/2 of stall in practice; **that is a hobbyist observation I could not source.**

### Worked example [D]

**Assumption:** total mass 2.2 kg (0.97 kg of servos + Pi + battery + frame). **Weigh the real robot and redo this.**

| Stance | d_f (femur lever) | Tripod middle leg (1.1 kgf) | Tripod corner leg (0.55 kgf) | Ripple leg (0.55 kgf) |
|---|---|---|---|---|
| Femur horizontal, tibia vertical (v1 femur 6.8 cm) | 6.8 cm | 7.5 kg·cm (38% of stall) | 3.7 kg·cm (19%) | 3.7 kg·cm (19%) |
| Moderate sprawl | 12 cm | **13.2 kg·cm (68%)** | 6.6 kg·cm (34%) | 6.6 kg·cm (34%) |
| Wide sprawl (v1 can reach 26 cm) | 18 cm | **19.8 kg·cm (> stall)** | 9.9 kg·cm (51%) | 9.9 kg·cm (51%) |

Knee servo with the v1 193 mm tibia leaning 20°: d_t = 19.35 · sin 20° ≈ 6.6 cm, which gives 7.3 kg·cm on a tripod middle leg.

**Allowable lever for a target torque:** d_max = τ_allow / F.

- Target ⅓ of stall (6.5 kg·cm): tripod middle leg d_max ≈ 5.9 cm; ripple d_max ≈ 11.8 cm.
- Target ⅕ of stall (3.9 kg·cm): tripod middle leg d_max ≈ 3.5 cm.

**Design implications [D]:**

1. Choose segment lengths so the feet can comfortably stand **close in under the femur axis** (horizontal lever ≈ the femur length or less). That requires a femur and tibia nearer to equal than in v1.
2. If you want tripod speed, keep the robot light (every 100 g saved takes about 0.5 kg·cm off the middle femurs at d = 10 cm), or let the middle legs stand closer in than the corners.
3. Run at 7.4–8.4 V, not 6 V, for the extra 15% torque.
4. Use the LX-16A's temperature and voltage readback to watch the middle-leg femurs during gait tests.

---

## Open questions and what to decide in the design

1. **Target total mass.** Weigh v1 or estimate v2. Everything above scales linearly with it.
2. **Layout.** Choose rectangular-parallel (v1), hybrid (corners at ±30–60°, middle hips wider), or full hexagonal. Recommended: hybrid. Make these named parameters in the sketch:
   - corner hip yaw
   - corner hip (x, y)
   - middle hip y
3. **Segment lengths.** Pick total leg reach first (v1 was about 260 mm from the femur axis). Then aim for coxa ≈ 0.1–0.2 of total and tibia ≈ 1.0–1.7 × femur. Check the coxa against the space needed for the femur servo bracket and the LX-16A body.
4. **Neutral stance.** Choose stance radius and body height. These set the torque, the stride, the stability margin and the collision limit, so pick them before the segment lengths are final.
5. **Primary gait.** If tripod, size the middle legs for mg/2. If ripple, loads even out. Whether the middle legs should have their own geometry (Burkus tuned the inner and outer pairs separately) is worth considering.
6. **Coxa yaw range and mounting.** With splayed corners, check that the corner coxa yaw range (the LX-16A has 240°) covers both forward stride and the in-place turn arcs.
7. **Unverified items worth chasing if they matter:**
   - full texts of Chu & Pang 2002 and Wang, Ding & Rovetta 2010 (numeric hexagonal vs rectangular margins)
   - Roennau et al. 2013 (LAURON V optimised mounting angles)
   - the Biomimetics 2026 4:6 paper's metrics
   - a measured continuous-torque or thermal limit for the LX-16A

---

## Sources

Standards and definitions

- McGhee, R. B., & Frank, A. A. (1968). *On the stability properties of quadruped creeping gaits.* Mathematical Biosciences 3, 331–351. https://doi.org/10.1016/0025-5564(68)90090-4 [A: metadata only; definition of SSM as described by Tedeschi & Carbone]
- Song, S.-M., & Choi, B. S. (1990). *The optimally stable ranges of 2n-legged wave gaits.* IEEE Trans. Systems, Man, and Cybernetics 20, 888–902. https://doi.org/10.1109/21.105087 [A]
- Song, S.-M., & Waldron, K. J. (1989). *Machines That Walk: The Adaptive Suspension Vehicle.* MIT Press. ISBN 9780262192743 [not read; cited only as background]
- Lee, T.-T., Liao, C.-M., & Chen, T.-K. (1988). *On the stability properties of hexapod tripod gait.* IEEE J. Robotics and Automation 4, 427–434. https://doi.org/10.1109/56.808 [A]

Body layout

- Chu, S. K.-K., & Pang, G. K.-H. (2002). *Comparison between different model of hexapod robot in fault-tolerant gait.* IEEE Trans. SMC Part A 32(6), 752–756. https://doi.org/10.1109/TSMCA.2002.807066. Record: https://manuscript.isc.ac/Inventory/49/1139247.htm. Full text (blocked to me): https://hub.hku.hk/bitstream/10722/42946/1/82670.pdf [A]
- Tedeschi, F., & Carbone, G. (2014). *Design Issues for Hexapod Walking Robots.* Robotics 3(2), 181–206. https://doi.org/10.3390/robotics3020181. Full text read from https://shura.shu.ac.uk/14366/1/Carbone%20design%20issues%20for%20hexapod%20walking%20robots.pdf [P]
- Wang, Z.-Y., Ding, X.-L., & Rovetta, A. (2010). *Analysis of typical locomotion of a symmetric hexapod robot.* Robotica 28(6), 893–907. https://doi.org/10.1017/S0263574709990725 [A]
- Preumont, A., Alexandre, P., & Ghuys, D. (1991). *Gait analysis and implementation of a six leg walking machine.* Proc. ICAR'91, Pisa, vol. 2, 941–945. [S: known only via Tedeschi & Carbone 2014]
- Takahashi, Y., & Arai, T. (2000). *Development of multi-limb robot with omnidirectional manipulability and mobility.* Proc. IEEE/RSJ IROS 2000, vol. 3, 2012–2017. [S: via Tedeschi & Carbone 2014]
- Burkus, E., Odry, Á., Awrejcewicz, J., Kecskés, I., & Odry, P. (2022). *Mechanical Design and a Novel Structural Optimization Approach for Hexapod Walking Robots.* Machines 10(6), 466. https://doi.org/10.3390/machines10060466. Full text read from https://publicatio.bibl.u-szeged.hu/38665/1/machines-10-00466-v3.pdf [P]
- Roennau, A., Heppner, G., Pfotzer, L., & Dillmann, R. (2013). *LAURON V: Optimized Leg Configuration for the Design of a Bio-Inspired Walking Robot.* Proc. CLAWAR 2013, Sydney. [S: via Burkus et al. 2022]
- Rastgar, H., Naeimi, H., & Agheli, M. (2019). *Characterization, validation, and stability analysis of maximized reachable workspace of radially symmetric hexapod machines.* Mechanism and Machine Theory 137, 315–335. https://doi.org/10.1016/j.mechmachtheory.2019.01.033 [A]
- Tam, B., Talbot, F., Steindl, R., Elfes, A., & Kottege, N. (2020). *OpenSHC: A Versatile Multilegged Robot Controller.* arXiv:2006.04424. https://arxiv.org/abs/2006.04424 [P]

Leg segment ratios

- Liu, X., Yang, X., Wang, W., & Feng, W. (2025). *Design and Dimensional Optimization of Legged Structures for Construction Robots.* arXiv:2507.16328. https://arxiv.org/html/2507.16328v1 [P]
- Deng, Z., Liu, Y., Gao, H., Zhao, L., Ding, L., & Yu, H. (2014). *On the Segment Length Ratio of the Walking Leg of a Hydraulically Actuated Hexapod Robot.* Robot 36(5), 544–551. https://robot.sia.cn/EN/10.13973/j.cnki.robot.2014.0544 [A]
- (2026). Spider-leg-inspired hexapod leg study. Biomimetics 11(5), 352. https://www.mdpi.com/2313-7673/11/5/352 [A: search-result abstract only; authors and exact title not verified]
- Chen, Y., Clifton, G., Graf, N. M., Durand, K., Taylor, J., Gong, Y., Grezmak, J. E., & Daltorio, K. A. (2022). *Optimal planar leg geometry in robots and crabs for idealized rocky terrain.* Bioinspiration & Biomimetics 17, 066009. https://doi.org/10.1088/1748-3190/ac8f04. Full text: https://engineering.case.edu/sites/default/files/015_Chen_2022_Bioinspir._Biomim._17_066009%5B1%5D.pdf [P]

Servos (datasheets)

- Hiwonder. *LX-16A Serial Bus Servo User Manual* (spec table, §2.1). Local copy: [`LX-16A Serial Bus Servo/.../LX-16A Serial Bus Servo User Manual.pdf`](../../LX-16A%20Serial%20Bus%20Servo/LX-16A%20Serial%20Bus%20Servo/1.LX-16A%20User%20Manual/1.LX-16A%20Bus%20Servo%20Manual/LX-16A%20Serial%20Bus%20Servo%20User%20Manual.pdf) [P]
- ROBOTIS. *AX-12/AX-12A e-manual.* https://emanual.robotis.com/docs/en/dxl/ax/ax-12a/ [P: "loads with 1/5 or less of the stall torque" guidance]

Hobby reference designs [H]

- KurtE/Arduino_Phoenix_Parts, PhantomX config: https://github.com/KurtE/Arduino_Phoenix_Parts/blob/35eb0e1a93af1d32a9ef6e2501a3c74fdbd27eca/Phoenix/PhantomX_V2_Commander_AX12_Stock/Hex_Cfg.h
- KurtE/Arduino_Phoenix_Parts, Lynxmotion Phoenix config: https://github.com/KurtE/Arduino_Phoenix_Parts/blob/35eb0e1a93af1d32a9ef6e2501a3c74fdbd27eca/Phoenix/Phoenix_PS2_SSC32/Hex_Cfg.h
- Phoenix gait engine (body-rotation turning, `TravelRotationY`): https://github.com/KurtE/Arduino_Phoenix_Parts/blob/35eb0e1a93af1d32a9ef6e2501a3c74fdbd27eca/Phoenix/Phoenix_Code.h

Project files

- Original leg constants: [`packages/robot/src/leg_calculations_2.py`](../../packages/robot/src/leg_calculations_2.py) and [`packages/robot/src/legcalculations.py`](../../packages/robot/src/legcalculations.py)
- Photos of v1 (body layout inferred from these): [`images/`](../../images/)
