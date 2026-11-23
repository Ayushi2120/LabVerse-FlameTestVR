/**
 * ChemistryKnowledge.ts — AI Chemistry Assistant Intelligence & Knowledge Base for ATOM-8.
 * Provides adaptive step guidance, progressive Socratic hints, chemistry Q&A understanding,
 * and an interactive 5-question Chemistry Quiz for students.
 */

export interface QuizQuestion {
    id: number;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        question: "Which metal ion produces a characteristic bright crimson-red flame?",
        options: [
            "Sodium (Na⁺)",
            "Lithium (Li⁺)",
            "Potassium (K⁺)",
            "Copper (Cu²⁺)"
        ],
        correctIndex: 1,
        explanation: "Lithium ions (Li⁺) emit light primarily at 670.8 nm in the red spectrum, giving a vibrant crimson flame!"
    },
    {
        id: 2,
        question: "What physical process causes light emission in a flame test?",
        options: [
            "Nuclear fission inside the metal nucleus",
            "Electrons absorbing heat, getting excited, then returning to lower energy levels",
            "Combustion of pure nitrogen from surrounding air",
            "Melting of the glass and platinum wire"
        ],
        correctIndex: 1,
        explanation: "Thermal energy promotes valence electrons to higher energy orbitals; as they relax back to ground state, they emit photons of energy ΔE = hν = hc/λ!"
    },
    {
        id: 3,
        question: "Why is the platinum wire cleaned in concentrated HCl before each test?",
        options: [
            "To dissolve the platinum wire completely",
            "To convert impurities into volatile chlorides that vaporize cleanly",
            "To make the wire magnetic",
            "To cool down the wire so it doesn't melt"
        ],
        correctIndex: 1,
        explanation: "HCl reacts with metal residues to form volatile metal chlorides that vaporize in the hot flame, eliminating cross-contamination!"
    },
    {
        id: 4,
        question: "What distinctive flame color is emitted by Copper(II) Chloride (CuCl₂)?",
        options: [
            "Golden yellow",
            "Pale lilac",
            "Blue-green / Emerald",
            "Brick orange-red"
        ],
        correctIndex: 2,
        explanation: "Copper(II) ions produce brilliant blue-green emissions around 510–520 nm due to electronic transitions in the copper atoms!"
    },
    {
        id: 5,
        question: "Why is Platinum chosen as the wire material for flame testing?",
        options: [
            "It is highly reactive and burns with a bright flame",
            "It is chemically inert and has a very high melting point (1768°C)",
            "It turns green when heated",
            "It absorbs all salt moisture instantly"
        ],
        correctIndex: 1,
        explanation: "Platinum does not oxidize easily or produce any visible color of its own in the flame, making it the ideal neutral sample carrier!"
    },
    {
        id: 6,
        question: "What characteristic flame color does Sodium Chloride (NaCl) produce?",
        options: [
            "Crimson red",
            "Intense golden yellow",
            "Pale lilac",
            "Emerald green"
        ],
        correctIndex: 1,
        explanation: "Sodium ions produce an intense golden yellow flame due to strong D-line emission at 589 nm!"
    },
    {
        id: 7,
        question: "What flame color is observed for Potassium Chloride (KCl)?",
        options: [
            "Pale lilac / violet",
            "Golden yellow",
            "Scarlet red",
            "Apple green"
        ],
        correctIndex: 0,
        explanation: "Potassium ions emit characteristic pale lilac/violet light with principal wavelengths at 766 nm and 404 nm."
    },
    {
        id: 8,
        question: "Which metal ion produces a distinctive brick red / orange-red flame?",
        options: [
            "Calcium (Ca²⁺)",
            "Copper (Cu²⁺)",
            "Lithium (Li⁺)",
            "Sodium (Na⁺)"
        ],
        correctIndex: 0,
        explanation: "Calcium ions emit strong orange-red / brick red spectral bands around 622 nm!"
    },
    {
        id: 9,
        question: "What flame color is characteristic of Strontium Chloride (SrCl₂)?",
        options: [
            "Pale lilac",
            "Golden yellow",
            "Brilliant scarlet / crimson red",
            "Blue-green"
        ],
        correctIndex: 2,
        explanation: "Strontium produces an intense scarlet-red emission (606 nm and 662 nm), which is why it is used in road flares and red fireworks!"
    },
    {
        id: 10,
        question: "Why must the Bunsen burner flame be adjusted to non-luminous blue for flame tests?",
        options: [
            "To keep the laboratory cold",
            "Because complete combustion provides ~1500°C heat without yellow soot interference",
            "Because yellow flames make the platinum wire melt",
            "To make the room smell like gas"
        ],
        correctIndex: 1,
        explanation: "A non-luminous blue flame provides maximum temperature for thermal excitation without luminous soot particles masking sample colors!"
    }
];

export interface StepGuidance {
    title: string;
    text: string;
    hint: string;
}

export class ChemistryKnowledge {
    /**
     * CURRENT STEP EXPLANATION
     * Explains ONLY the student's current experiment step based on real active state.
     * Does NOT treat completed steps as pending or tell student to do what is already done.
     */
    public static getContextualCurrentStep(ctx: any): { reply: string; emotion: 'speaking' | 'happy' } {
        if (!ctx) {
            return {
                reply: "Beep-whirr! Welcome to the lab! You are currently at the initialization stage. Please put on your safety gloves to begin.",
                emotion: 'speaking'
            };
        }

        if (ctx.state === 'ORIENTATION' || ctx.state === 'STARTING') {
            return {
                reply: "Current Step: Workstation Initialization. You are currently at the orientation stage. Click or poke 'START EXPERIMENT' on the holographic screen in front of you to initialize our Chemistry workstation.",
                emotion: 'speaking'
            };
        }

        if (!ctx.areGlovesEquipped) {
            return {
                reply: "Current Step: Laboratory Safety Preparation. You are currently at the personal safety preparation stage. In wet chemistry, wearing nitrile protective gloves before handling glassware, reagents, or apparatus protects skin against chemical irritation and prevents natural oils from contaminating pure salts.",
                emotion: 'speaking'
            };
        }

        if (ctx.isExperimentCompleted || (ctx.completedSalts && ctx.completedSalts.length >= 6)) {
            return {
                reply: "Current Step: Practical Completed! 🎉 All six flame test mystery samples have been analyzed and identified. Full observations and spectral data are safely archived in your 3D Lab Notebook on the right table.",
                emotion: 'happy'
            };
        }

        if (ctx.isFlameResultObserved) {
            const name = ctx.currentSaltName || 'metal salt';
            const flame = ctx.observedFlameColor || ctx.currentFlameColorName || 'characteristic';
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Current Step: Observation Analysis & Recording. You have observed the brilliant ${flame} flame emitted by ${name} (${mystery}). You are currently at the observation recording step, analyzing this spectral result in the 3D result card and recording it into the lab records before proceeding.`,
                emotion: 'happy'
            };
        }

        if (ctx.isWireInFlame) {
            return {
                reply: "Current Step: Optical Flame Observation. The platinum wire loop is actively in the flame! Thermal energy is exciting valence electrons to higher orbitals. You are currently observing the distinctive photon emission color burst as electrons relax back to ground state.",
                emotion: 'speaking'
            };
        }

        if (!ctx.isWireGrabbed && !ctx.isWireDipped) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Current Step: Tool Acquisition (Platinum Loop). Gloves are safely equipped. You are currently on the tool preparation step for ${mystery}. The platinum wire inoculating loop on the table stand is clean, inert, and ready to be picked up.`,
                emotion: 'speaking'
            };
        }

        if (!ctx.isWireDipped) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            const letter = ctx.currentSaltLetter || 'A';
            return {
                reply: `Current Step: Sample Collection for ${mystery}. You are holding the clean platinum inoculating loop. You are currently at the sample collection step, touching the loop to the salt crystals in watch glass ${letter} so sample grains adhere to the loop.`,
                emotion: 'speaking'
            };
        }

        if (!ctx.isWireGrabbed && ctx.isWireDipped) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Current Step: Coated Wire Handling. Your platinum wire loop is coated with crystals of ${mystery}. You are currently at the sample handling step, ready to pick up the coated wire from the stand to bring it to the Bunsen burner.`,
                emotion: 'speaking'
            };
        }

        if (!ctx.isBurnerLit) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Current Step: Burner Ignition. Your platinum loop is coated with crystals of ${mystery}. You are currently at the heat source ignition step, igniting the Bunsen burner to produce the high-temperature non-luminous blue flame required for thermal excitation.`,
                emotion: 'speaking'
            };
        }

        if (!ctx.isWireInFlame && !ctx.isFlameResultObserved) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Current Step: Flame Test Heating. Your sample is loaded with ${mystery} and the burner is lit with a non-luminous blue flame. You are currently at the flame heating step, introducing the coated loop into the hottest outer cone (~1500°C) of the flame.`,
                emotion: 'speaking'
            };
        }

        return {
            reply: `Current Step: ${ctx.currentStepTitle || 'Practical Testing'}. ${ctx.currentStepDescription || 'You are actively performing the flame test practical.'}`,
            emotion: 'speaking'
        };
    }

    /**
     * Backward-compatible alias for getContextualCurrentStep.
     */
    public static getContextualStep(ctx: any): { reply: string; emotion: 'speaking' | 'happy' } {
        return ChemistryKnowledge.getContextualCurrentStep(ctx);
    }

    /**
     * Contextual Socratic Hint based on CURRENT step and live experiment state.
     */
    public static getContextualHint(ctx: any, tier: number = 1): { reply: string; emotion: 'thinking' | 'speaking' | 'happy' } {
        if (!ctx || !ctx.areGlovesEquipped) {
            return {
                reply: "Nitrile gloves are essential in wet chemistry! They protect your skin from chemical exposure and prevent natural skin oils from contaminating pure salts.",
                emotion: 'thinking'
            };
        }

        if (ctx.isFlameResultObserved) {
            const saltIdx = ctx.currentSaltIndex ?? ctx.saltIndex ?? 0;
            const hintText = ChemistryKnowledge.getProgressiveHint(saltIdx, tier);
            return {
                reply: `Hint for ${ctx.currentMysteryName || 'this salt'}: ${hintText}`,
                emotion: 'thinking'
            };
        }

        if (!ctx.isWireGrabbed && !ctx.isWireDipped) {
            return {
                reply: "Look at the table stand: pick up the platinum wire! Platinum has an extremely high melting point (1768°C) and is chemically inert, so it will not impart any color of its own to the flame!",
                emotion: 'thinking'
            };
        }

        if (!ctx.isWireDipped) {
            return {
                reply: `Follow the cyan 3D beacon pointing to watch glass ${ctx.currentSaltLetter || 'A'}. Gently touch the wire loop to the crystals of ${ctx.currentMysteryName || 'the target salt'} to coat it.`,
                emotion: 'thinking'
            };
        }

        if (!ctx.isBurnerLit) {
            return {
                reply: "We need a non-luminous blue flame (complete combustion) so the flame's own color does not mask the subtle emission wavelengths of the metal ions.",
                emotion: 'thinking'
            };
        }

        if (!ctx.isWireInFlame && !ctx.isFlameResultObserved) {
            return {
                reply: "Aim for the outer cone of the blue flame right at the top of the inner cone, where temperatures reach ~1500°C for maximum thermal excitation!",
                emotion: 'thinking'
            };
        }

        if (ctx.isWireInFlame) {
            return {
                reply: "Notice the sudden burst of light! Thermal energy has promoted valence electrons to higher orbitals, and they are now releasing discrete photons as they relax.",
                emotion: 'speaking'
            };
        }

        if (ctx.isExperimentCompleted) {
            return {
                reply: "All six mystery salts have been analyzed! Review the 3D Lab Notebook on the right table to see your full spectroscopy report.",
                emotion: 'happy'
            };
        }

        return {
            reply: "Observe closely! In flame tests, every element's valence electron arrangement creates a unique optical emission fingerprint.",
            emotion: 'thinking'
        };
    }

    /**
     * Contextual Flame Explanation for the CURRENT salt.
     * Only reveals the observed flame color if it has actually been observed!
     */
    public static getContextualFlameExplanation(ctx: any): { reply: string; emotion: 'speaking' | 'happy' } {
        if (!ctx) {
            return {
                reply: "In a flame test, thermal energy excites metal valence electrons to higher orbitals. When they relax back, they emit photons: ΔE = hc/λ!",
                emotion: 'speaking'
            };
        }

        if (ctx.isExperimentCompleted) {
            return {
                reply: "Spectroscopy complete! You observed Lithium (Crimson Red), Sodium (Golden Yellow), Potassium (Pale Lilac), Calcium (Brick Red), Copper (Blue-Green), and Strontium (Scarlet Red). Each color represents a unique atomic fingerprint!",
                emotion: 'happy'
            };
        }

        if (ctx.isFlameResultObserved) {
            const name = ctx.currentSaltName || 'Metal Chloride';
            const formula = ctx.currentSaltFormula || 'MCl';
            const flame = ctx.observedFlameColor || ctx.currentFlameColorName || 'characteristic';
            return {
                reply: `Bleep-boop! ${ctx.currentMysteryName || 'This salt'} is ${name} (${formula})! It produced a brilliant ${flame} flame. Flame heat vaporized the salt, promoting valence electrons to excited quantum states. As they relaxed to ground state, they emitted photons of ${flame} light (ΔE = hc/λ)!`,
                emotion: 'happy'
            };
        }

        // Flame not yet observed for current salt - do NOT spoil the color!
        const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
        return {
            reply: `Whirr-click! We are preparing to test ${mystery}. To observe its emission spectrum, coat the platinum wire with sample crystals and bring it into the blue burner flame! I won't reveal the secret flame color until you observe it!`,
            emotion: 'speaking'
        };
    }

    /**
     * Contextual Theory Explanation relevant to the CURRENT step.
     */
    public static getContextualTheory(ctx: any): { reply: string; emotion: 'speaking' | 'happy' } {
        if (!ctx) {
            return {
                reply: "Atomic emission spectroscopy reveals the unique electronic transitions of metal cations when heated in a flame.",
                emotion: 'speaking'
            };
        }

        if (ctx.isExperimentCompleted || (ctx.completedSalts && ctx.completedSalts.length >= 6)) {
            return {
                reply: "Atomic emission spectroscopy is foundational to modern science: astronomers analyze starlight absorption and emission lines to determine the chemical composition and temperature of distant stars and galaxies!",
                emotion: 'happy'
            };
        }

        if (!ctx.areGlovesEquipped || (!ctx.isWireGrabbed && !ctx.isWireDipped)) {
            return {
                reply: "In atomic spectroscopy, contamination control is vital. Platinum wires and clean gloves ensure no foreign alkali metal residues create false emission lines in our observations.",
                emotion: 'speaking'
            };
        }

        if (!ctx.isWireDipped) {
            return {
                reply: `Metal chloride salts (${ctx.currentSaltFormula || 'MCl'}) are selected because chlorides have relatively low lattice energies, allowing them to vaporize and dissociate into gaseous metal atoms easily in the flame.`,
                emotion: 'speaking'
            };
        }

        if (!ctx.isBurnerLit) {
            return {
                reply: "A non-luminous blue Bunsen flame undergoes complete combustion (CH₄ + 2O₂ → CO₂ + 2H₂O), generating ~1500°C without soot (unburnt carbon) that would produce interfering yellow blackbody radiation.",
                emotion: 'speaking'
            };
        }

        if (ctx.isWireInFlame || ctx.isFlameResultObserved) {
            return {
                reply: "Bohr's atomic theory states electrons occupy quantized energy levels (n = 1, 2, 3...). Flame heat excites electrons (E₂). Returning to ground state (E₁) releases a photon satisfying Planck's relation: ΔE = E₂ - E₁ = h·ν = hc/λ, forming a discrete emission line!",
                emotion: 'speaking'
            };
        }

        if (ctx.isExperimentCompleted) {
            return {
                reply: "Atomic emission spectroscopy is foundational to modern science: astronomers analyze starlight absorption and emission lines to determine the chemical composition and temperature of distant stars and galaxies!",
                emotion: 'happy'
            };
        }

        return {
            reply: "Bohr's quantum model explains that each chemical element has a distinct electron configuration, so each metal ion emits unique, quantized wavelengths of light when heated.",
            emotion: 'speaking'
        };
    }

    /**
     * Contextual Educational Video guidance.
     * Shows video information or clearly states if offline/unavailable.
     */
    public static getContextualVideo(ctx: any): { reply: string; emotion: 'speaking' | 'thinking'; videoInfo: { title: string; topic: string; status: string } } {
        const mystery = ctx?.currentMysteryName || `Mystery Salt ${ctx?.currentSaltLetter || 'A'}`;
        const title = "Class 10 Chemistry: Flame Test & Spectroscopy Practical Guide";
        const topic = `Flame emission demonstration and procedure for ${mystery}`;
        const status = "Offline Mode: Video stream is not pre-bundled in this standalone workstation build. The live interactive 3D simulation on your bench provides the complete procedural demonstration!";

        return {
            reply: `🎬 Educational Video: "${title}". Notice: Local video stream is not pre-bundled in this offline workstation build. You have the full live 3D laboratory simulation active right in front of you!`,
            emotion: 'speaking',
            videoInfo: { title, topic, status }
        };
    }

    /**
     * Actual available experiments in LABVERSE.
     */
    public static getContextualExperiments(_ctx?: any): { reply: string; emotion: 'speaking' | 'happy'; experiments: { id: string; name: string; status: string; url: string; description: string }[] } {
        const activeExp = _ctx?.experimentName || 'Flame Test';
        const experiments = [
            {
                id: 'flame_test',
                name: 'Flame Test (Metal Chlorides)',
                status: activeExp.includes('Litmus') ? 'AVAILABLE' : 'ACTIVE',
                url: './index.html',
                description: 'Identification of metal cations (Li, Na, K, Ca, Cu, Sr) via Bunsen burner atomic flame emission spectroscopy.'
            },
            {
                id: 'litmus_test',
                name: 'Litmus Paper Acid-Base Test',
                status: activeExp.includes('Litmus') ? 'ACTIVE' : 'AVAILABLE',
                url: './litmus.html',
                description: 'Qualitative analysis of acidic and basic solutions using red and blue litmus indicator paper.'
            }
        ];

        return {
            reply: "🧪 LABVERSE Practical Experiments:\n1. 🟢 Flame Test (Active Workstation) — Metal cation emission spectroscopy.\n2. 📘 Litmus Paper Test (Available) — Acid-base testing with red & blue indicators.\nSelect an experiment to view details or switch practicals!",
            emotion: 'speaking',
            experiments
        };
    }

    /**
     * Contextual Quiz Questions prioritized by the student's current experiment progress.
     */
    public static getContextualQuizQuestions(ctx: any): QuizQuestion[] {
        const saltIdx = ctx?.currentSaltIndex ?? ctx?.saltIndex ?? 0;
        const saltLetter = ctx?.currentSaltLetter || String.fromCharCode(65 + saltIdx);

        // Map salt letter to question id
        const letterToQId: Record<string, number> = {
            'A': 1, // Lithium
            'B': 6, // Sodium
            'C': 7, // Potassium
            'D': 8, // Calcium
            'E': 4, // Copper
            'F': 9  // Strontium
        };

        const targetQId = letterToQId[saltLetter] || 1;
        const matchedQ = QUIZ_QUESTIONS.find(q => q.id === targetQId);
        const others = QUIZ_QUESTIONS.filter(q => q.id !== targetQId);

        if (matchedQ) {
            return [matchedQ, ...others];
        }
        return [...QUIZ_QUESTIONS];
    }

    /**
     * Context-aware experiment step guidance based on current practical state.
     */
    public static getStepGuidance(state: string, saltIndex: number, areGlovesEquipped: boolean): StepGuidance {
        if (state === 'ORIENTATION' || state === 'STARTING') {
            return {
                title: "Welcome to LABVERSE!",
                text: "Click or poke 'START EXPERIMENT' on the screen in front of you to initialize our Chemistry workstation!",
                hint: "Look at the large holographic orientation screen directly in front of the table."
            };
        }

        if (!areGlovesEquipped) {
            return {
                title: "Step 1: Laboratory Safety",
                text: "Safety first! Please equip the blue nitrile gloves located on the left dispenser station.",
                hint: "Reach to the dispenser box on the left bench to put on your safety gloves."
            };
        }

        if (state === 'GLOVES_EQUIPPED' || state === 'SELECT_WIRE') {
            return {
                title: "Step 2: Platinum Wire",
                text: "Grab the platinum loop wire from the stand. Platinum is inert and won't color our test flame!",
                hint: "Pick up the wire by clicking with mouse or pinching with your VR hand."
            };
        }

        if (state === 'DIP_SALT') {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const names = [
                'Mystery Salt A (Lithium)',
                'Mystery Salt B (Sodium)',
                'Mystery Salt C (Potassium)',
                'Mystery Salt D (Calcium)',
                'Mystery Salt E (Copper)',
                'Mystery Salt F (Strontium)'
            ];
            const letter = letters[saltIndex] || 'A';
            const name = names[saltIndex] || `Mystery Salt ${letter}`;
            return {
                title: `Step 3: Dip into ${name}`,
                text: `Dip the platinum wire loop into ${name} to coat the tip with sample crystals!`,
                hint: `Bring the wire tip directly over watch glass ${letter}. Follow the cyan target beacon!`
            };
        }

        if (state === 'TO_BURNER') {
            return {
                title: "Step 4: Flame Heating",
                text: "Bring the coated platinum wire into the hottest outer cone of the Bunsen burner flame!",
                hint: "Make sure the Bunsen burner is switched ON, then move the wire tip into the blue flame zone."
            };
        }

        if (state === 'FLAME_REACTION' || state === 'OBSERVATION') {
            return {
                title: "Step 5: Emission Observation",
                text: "Observe the characteristic flame color! Thermal energy has excited the metal valence electrons.",
                hint: "Check the 3D Lab Book on the right lectern to compare the flame color with spectral records."
            };
        }

        if (state === 'CLEAN_WIRE') {
            return {
                title: "Step 6: Clean Wire",
                text: "Dip the wire in hydrochloric acid to clean it before testing the next sample!",
                hint: "Cleaning prevents cross-contamination between different metal ions."
            };
        }

        if (state === 'COMPLETE') {
            return {
                title: "Experiment Complete! 🎉",
                text: "You've successfully identified all metal ions! Click 'Take Quiz' to test your mastery!",
                hint: "Press 'Take Quiz' on my console or poke me anytime to review any salt."
            };
        }

        return {
            title: "Flame Test Assistant",
            text: "I'm ATOM-8! How can I help you with your Chemistry practical today?",
            hint: "You can ask for hints, next steps, or question any chemistry concept!"
        };
    }

    /**
     * Progressive 3-tier Socratic hint system (hints without spoiling answers immediately).
     */
    public static getProgressiveHint(saltIndex: number, level: number): string {
        const HINTS = [
            // Salt A: Lithium
            [
                "Observe the warmth of the hue. Is it a deep, intense red or a soft orange?",
                "This alkali metal is famous for powering lightweight rechargeable batteries in modern electronics and smartphones!",
                "With an atomic number of 3 and an intense emission peak at 670.8 nm, this element is Lithium (Li)!"
            ],
            // Salt B: Sodium
            [
                "Notice the brilliant, intense golden-yellow glow that completely dominates the flame.",
                "This metal ion is abundant in seawater and everyday household table seasoning!",
                "With strong D-line emission at 589 nm, element #11 on the periodic table is Sodium (Na)!"
            ],
            // Salt C: Potassium
            [
                "Look for a delicate, pale lilac or soft violet tint that requires careful observation.",
                "This essential nutrient is found in bananas and is key to biological nerve transmission.",
                "Emitting violet wavelengths at 766 nm and 404 nm, element #19 is Potassium (K)!"
            ],
            // Salt D: Calcium
            [
                "Notice the warm, earthy brick-red to orange flame with characteristic flashes.",
                "This alkaline earth metal is essential for human bones, teeth, and limestone cliffs.",
                "With strong molecular and atomic bands around 622 nm, this element is Calcium (Ca)!"
            ],
            // Salt E: Copper
            [
                "Behold the striking, cool blue-green emerald flash in the flame cone!",
                "This transition metal was historically alloyed with tin to form bronze and coats ancient domes with green patina.",
                "With atomic emission bands centered at 510–520 nm, this element is Copper (Cu)!"
            ],
            // Salt F: Strontium
            [
                "Look closely at the deep scarlet-red, noticeably more vivid than lithium's pink-red hue.",
                "This alkaline earth metal is heavily used in pyrotechnics and emergency highway flare signals for maximum visibility.",
                "Emitting powerful spectral lines at 606 nm and 662 nm, this element is Strontium (Sr)!"
            ]
        ];

        const saltHints = HINTS[saltIndex] || HINTS[0];
        const safeLevel = Math.max(0, Math.min(2, level));
        return saltHints[safeLevel];
    }

    /**
     * Natural semantic question answering for student voice & text queries with full live context.
     */
    public static answerQuestion(rawQuery: string, stateOrCtx: any, saltIndex?: number): { reply: string; emotion: 'happy' | 'thinking' | 'speaking' | 'question' } {
        const q = rawQuery.toLowerCase().trim();
        const ctx = typeof stateOrCtx === 'object' ? stateOrCtx : { state: stateOrCtx, saltIndex: saltIndex ?? 0, areGlovesEquipped: true };

        // Greetings & Identity
        if (q.includes('who are you') || q.includes('your name') || q.includes('what are you')) {
            return {
                reply: "Beep-boop! I'm ATOM-8, your loyal AI Chemistry companion droid! I'm here to guide your experiments, explain atomic phenomena, and test your knowledge!",
                emotion: 'happy'
            };
        }

        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greet')) {
            const mystery = ctx.currentMysteryName || 'Flame Test';
            return {
                reply: `Greetings, scientist! We are working on ${mystery}. Ready to explore atomic spectroscopy? Ask me anything or click Next Step!`,
                emotion: 'happy'
            };
        }

        // Guidance & Next Step
        if (q.includes('next step') || q.includes('what do i do') || q.includes('what next') || q.includes('how to start') || q.includes('guide')) {
            const step = this.getContextualStep(ctx);
            return {
                reply: step.reply,
                emotion: step.emotion
            };
        }

        // Hints
        if (q.includes('hint') || q.includes('clue') || q.includes('help me identify')) {
            const hint = this.getContextualHint(ctx, 1);
            return {
                reply: hint.reply,
                emotion: hint.emotion
            };
        }

        // Flame explanation
        if (q.includes('flame test') || q.includes('why this flame') || q.includes('explain flame')) {
            const expl = this.getContextualFlameExplanation(ctx);
            return {
                reply: expl.reply,
                emotion: expl.emotion
            };
        }

        // Theory
        if (q.includes('theory') || q.includes('quantum') || q.includes('planck') || q.includes('bohr model')) {
            const th = this.getContextualTheory(ctx);
            return {
                reply: th.reply,
                emotion: th.emotion
            };
        }

        // Why flame test works / Physics
        if (q.includes('why') && (q.includes('color') || q.includes('light') || q.includes('flame'))) {
            return {
                reply: "When metal ions are heated, their electrons absorb thermal energy and jump to higher excited orbitals. When they relax back to ground state, they release that energy as photons of specific wavelengths: ΔE = hν = hc/λ!",
                emotion: 'speaking'
            };
        }

        if (q.includes('excitation') || q.includes('bohr') || q.includes('ground state') || q.includes('photon')) {
            return {
                reply: "Bohr's atomic model explains this! Quantized electron shells mean each element has a unique set of energy transitions, creating a distinct optical 'fingerprint' or line spectrum!",
                emotion: 'happy'
            };
        }

        // Wire & HCl
        if (q.includes('platinum') || (q.includes('why') && q.includes('wire'))) {
            return {
                reply: "Platinum has an extremely high melting point of 1768°C and is chemically unreactive. It doesn't oxidize or impart any color of its own to the flame!",
                emotion: 'speaking'
            };
        }

        if (q.includes('hcl') || q.includes('acid') || q.includes('clean')) {
            return {
                reply: "Concentrated HCl converts metal impurities into metal chlorides, which are highly volatile and vaporize cleanly off the wire in the flame!",
                emotion: 'speaking'
            };
        }

        // Specific Elements
        if (q.includes('copper') || q.includes('cucl2') || q.includes('blue') || q.includes('green')) {
            return {
                reply: "Copper(II) ions produce an emerald blue-green flame with peak emission around 510–520 nm, characteristic of d-block transition metal transitions!",
                emotion: 'happy'
            };
        }

        if (q.includes('lithium') || q.includes('licl') || q.includes('crimson')) {
            return {
                reply: "Lithium produces a brilliant crimson-red flame at 670.8 nm! It is commonly used in aerospace alloys and lithium-ion batteries.",
                emotion: 'happy'
            };
        }

        if (q.includes('sodium') || q.includes('nacl') || q.includes('yellow')) {
            return {
                reply: "Sodium emits an intense 589 nm yellow doublet (D-lines). It is so powerful that even trace amounts of sodium will turn a flame bright yellow!",
                emotion: 'speaking'
            };
        }

        if (q.includes('potassium') || q.includes('kcl') || q.includes('lilac') || q.includes('violet')) {
            return {
                reply: "Potassium emits a pale lilac or violet flame with spectral lines at 766 nm and 404 nm. Often cobalt blue glass is used to filter out sodium glare!",
                emotion: 'speaking'
            };
        }

        if (q.includes('calcium') || q.includes('cacl2') || q.includes('brick') || q.includes('orange')) {
            return {
                reply: "Calcium gives a distinct brick-red or orange-red flame with strong spectral bands around 622 nm!",
                emotion: 'speaking'
            };
        }

        if (q.includes('strontium') || q.includes('srcl2') || q.includes('scarlet')) {
            return {
                reply: "Strontium produces an intense, bright scarlet-red flame with strong lines at 606 nm and 662 nm, which is why it is used in red fireworks!",
                emotion: 'happy'
            };
        }

        // Burner
        if (q.includes('burner') || q.includes('bunsen') || q.includes('flame zone')) {
            return {
                reply: "The non-luminous blue flame is oxidizing and reaches up to 1400°C! The cooler yellow flame is reducing and produces unburnt carbon soot.",
                emotion: 'speaking'
            };
        }

        // Safety
        if (q.includes('safety') || q.includes('glove') || q.includes('goggle')) {
            return {
                reply: "Always wear safety goggles and nitrile gloves when handling metal chloride salts and concentrated hydrochloric acid!",
                emotion: 'speaking'
            };
        }

        // Default friendly fallback
        return {
            reply: `Beep-whirr! That's fascinating! In flame spectroscopy, each element reveals its atomic identity through its unique photon emissions. Try testing the salts or ask me for a hint!`,
            emotion: 'happy'
        };
    }
}
