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
    }
];

export interface StepGuidance {
    title: string;
    text: string;
    hint: string;
}

export class ChemistryKnowledge {
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
     * Natural semantic question answering for student voice & text queries.
     */
    public static answerQuestion(rawQuery: string, state: string, saltIndex: number): { reply: string; emotion: 'happy' | 'thinking' | 'speaking' | 'question' } {
        const q = rawQuery.toLowerCase().trim();

        // Greetings & Identity
        if (q.includes('who are you') || q.includes('your name') || q.includes('what are you')) {
            return {
                reply: "Beep-boop! I'm ATOM-8, your loyal AI Chemistry companion droid! I'm here to guide your experiments, explain atomic phenomena, and test your knowledge!",
                emotion: 'happy'
            };
        }

        if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greet')) {
            return {
                reply: "Greetings, scientist! Ready to discover the secrets of atomic spectroscopy? Ask me anything or let's test a sample!",
                emotion: 'happy'
            };
        }

        // Guidance & Next Step
        if (q.includes('next step') || q.includes('what do i do') || q.includes('what next') || q.includes('how to start') || q.includes('guide')) {
            const step = this.getStepGuidance(state, saltIndex, true);
            return {
                reply: `${step.title}: ${step.text}`,
                emotion: 'speaking'
            };
        }

        // Hints
        if (q.includes('hint') || q.includes('clue') || q.includes('help me identify')) {
            const hint = this.getProgressiveHint(saltIndex, 1);
            return {
                reply: `Here's a clue: ${hint}`,
                emotion: 'thinking'
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
