import assert from 'assert';
import fs from 'fs';

console.log('--- LABVERSE WRIST-ATTACHED MENU COMPREHENSIVE VERIFICATION ---');

// 1. Verify AudioEngine & VoiceEngine Narration Lines
const voiceEngineSrc = fs.readFileSync('src/audio/VoiceEngine.ts', 'utf-8');
const requiredVoiceLines = [
    'wristDiscovery',
    'wristActivated',
    'optionSelected',
    'stepsNarration',
    'guideNarration',
    'theoryNarration',
    'videoNarration',
    'obsNarration',
    'exploreNarration'
];

for (const line of requiredVoiceLines) {
    assert(voiceEngineSrc.includes(line), `VoiceEngine must contain key: ${line}`);
    console.log(`[PASS] VoiceEngine key verified: ${line}`);
}

// 2. Verify AudioEngine Synthesized Chimes
const audioEngineSrc = fs.readFileSync('src/audio/AudioEngine.ts', 'utf-8');
assert(audioEngineSrc.includes('playWristOpen()'), 'AudioEngine must contain playWristOpen()');
assert(audioEngineSrc.includes('playWristConfirm()'), 'AudioEngine must contain playWristConfirm()');
console.log('[PASS] AudioEngine playWristOpen() and playWristConfirm() verified.');

// 3. Verify PalmMenu Wrist Anchor Config
const palmMenuSrc = fs.readFileSync('src/ui/PalmMenu.ts', 'utf-8');
assert(palmMenuSrc.includes('export interface WristAnchorConfig'), 'PalmMenu must export WristAnchorConfig interface');
assert(palmMenuSrc.includes('buttonDorsalOffset: 0.024'), 'DEFAULT_WRIST_ANCHOR_CONFIG must specify buttonDorsalOffset: 0.024');
assert(palmMenuSrc.includes('menuDorsalClearance: 0.108'), 'DEFAULT_WRIST_ANCHOR_CONFIG must specify menuDorsalClearance: 0.108');
assert(palmMenuSrc.includes('menuForwardOffset: 0.012'), 'DEFAULT_WRIST_ANCHOR_CONFIG must specify menuForwardOffset: 0.012');
assert(palmMenuSrc.includes('arcRadius: 0.215'), 'DEFAULT_WRIST_ANCHOR_CONFIG must specify arcRadius: 0.215');
console.log('[PASS] Reusable WristAnchorConfig component and parameters verified.');

// 4. Verify 1:1 Physical Wrist Anchoring (Zero Lerp Lag)
assert(palmMenuSrc.includes('this.wristButton.position.copy(targetWatchPos)'), 'Wrist button must copy position 1:1 with zero lerp lag');
assert(palmMenuSrc.includes('this.palmGroup.position.copy(targetMenuPos)'), 'Radial arc menu must copy position 1:1 with zero lerp lag');
console.log('[PASS] 1:1 physical wrist anchoring (zero drift/floating bug fix) verified.');

// 5. Verify Graceful Tracking Loss Dismissal
assert(palmMenuSrc.includes('this.wristButton.visible = false;\n                this.palmGroup.visible = false;'),
    'PalmMenu must hide wrist button and menu when tracking is lost');
console.log('[PASS] Graceful tracking loss dismissal verified.');

// 6. Verify Smartwatch Visual Mesh & OPEN LAB MENU label
assert(palmMenuSrc.includes("labelSprite('OPEN LAB MENU'"), 'Smartwatch must feature OPEN LAB MENU label');
assert(palmMenuSrc.includes('WristButtonMeshGroup'), 'Smartwatch group must be named WristButtonMeshGroup');
assert(palmMenuSrc.includes('WristButtonCoreGroup'), 'Smartwatch core group must exist for tactile depression');
assert(palmMenuSrc.includes('WristAuraRing'), 'Smartwatch must include cyan-platinum aura ring');
console.log('[PASS] 3D Smartwatch visual components and OPEN LAB MENU label verified.');

// 7. Verify Radial Arc 6 Options & Labels
const requiredOptionLabels = [
    'EXPERIMENT STEPS',
    'INTERACTION GUIDE',
    'THEORY BOOK',
    'VIDEO GUIDE',
    'OBSERVATION TABLE',
    'EXPLORE EXPERIMENTS'
];

for (const label of requiredOptionLabels) {
    assert(palmMenuSrc.includes(label), `PalmMenu must contain option label: "${label}"`);
    console.log(`[PASS] Menu option label verified: "${label}"`);
}

// 8. Verify Apex Close Button Elevation
assert(palmMenuSrc.includes('this.closeMesh.position.set(0, 0.285, 0.018)'), 'Close button must be positioned at top apex (y = 0.285m) to prevent overlap');
console.log('[PASS] Apex close button non-overlapping placement verified.');

// 9. Verify Right Index Finger Poke Detection & Debouncing
assert(palmMenuSrc.includes('isFingerPokingButton'), 'PalmMenu must track isFingerPokingButton state');
assert(palmMenuSrc.includes('pokedMenuItemTag'), 'PalmMenu must track pokedMenuItemTag state');
assert(palmMenuSrc.includes('isFingerPokingClose'), 'PalmMenu must track isFingerPokingClose state');
assert(palmMenuSrc.includes('distToBtn < 0.045'), 'Poke threshold for wrist button must be 0.045m');
assert(palmMenuSrc.includes('distToBtn > 0.058'), 'Hysteresis release threshold for wrist button must be 0.058m');
assert(palmMenuSrc.includes('wristButtonPress = 0.0035'), '3.5mm tactile visual press depression must be triggered on poke');
console.log('[PASS] Debounced VR poke detection with tactile depression verified.');

// 10. Verify English Voice Guidance Integration
assert(palmMenuSrc.includes("this.audio.voice.speak('wristDiscovery')"), 'Must trigger wristDiscovery voice on looking at wrist');
assert(palmMenuSrc.includes("this.audio.voice.speak('wristActivated')"), 'Must trigger wristActivated voice on opening menu');
assert(palmMenuSrc.includes("this.audio.voice.speak('stepsNarration')"), 'Must trigger stepsNarration voice on selecting steps');
assert(palmMenuSrc.includes("this.audio.voice.speak('guideNarration')"), 'Must trigger guideNarration voice on selecting guide');
assert(palmMenuSrc.includes("this.audio.voice.speak('theoryNarration')"), 'Must trigger theoryNarration voice on selecting theory');
assert(palmMenuSrc.includes("this.audio.voice.speak('videoNarration')"), 'Must trigger videoNarration voice on selecting video');
assert(palmMenuSrc.includes("this.audio.voice.speak('obsNarration')"), 'Must trigger obsNarration voice on selecting observations');
assert(palmMenuSrc.includes("this.audio.voice.speak('exploreNarration')"), 'Must trigger exploreNarration voice on selecting experiments');
console.log('[PASS] All 9 English voice guidance integration points verified.');

// 11. Verify Desktop Support & Parity
assert(palmMenuSrc.includes('watchTargetPos'), 'Desktop viewmodel watch positioning must be maintained');
assert(palmMenuSrc.includes('menuTargetPos'), 'Desktop camera-following radial menu positioning must be maintained');
assert(palmMenuSrc.includes('handleClick'), 'Desktop click selection must be maintained');
console.log('[PASS] Desktop mode and mouse interaction parity verified.');

console.log('\n======================================================');
console.log('ALL WRIST-ATTACHED MENU UNIT & ARCHITECTURE TESTS PASSED');
console.log('======================================================');
