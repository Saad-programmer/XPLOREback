# Root Escape — Pixel Dialogue System
## Design decisions, visual direction, assets, and implementation specification

**Document type:** UI/UX and game-art handoff  
**Project:** Xplore Labs — Root Escape  
**Component:** Pixel dialogue box (UI guide §5.6)  
**Status:** Design proposal with illustrative mockups and starter SVG assets  
**Reference:** `ui-guide.md`, especially §§1, 2, 3, 5.2, 5.4, 5.5, 5.6, 5.7 and 6

---

## 1. Executive summary

The dialogue box should feel like a small character-driven game interface, not a conventional website notification. Pixel is the guide and personality of Root Escape: the player should immediately recognize that he is speaking, understand his expression, read the line comfortably, and know how to continue.

The recommended direction is **Cosmic Character Dialogue**:

- A deep-navy dialogue surface that belongs to the existing Tokyo Night game UI.
- A dedicated portrait compartment for Pixel, with a consistent frame across all expressions.
- A compact nameplate for `Pixel`.
- A clear, high-contrast dialogue area with a typewriter effect.
- A prominent `Next` control with a step counter.
- A compact minimized state that can reopen the dialogue without covering the terminal.
- A zone-colour accent that changes with the current mission zone.

The dialogue must remain subordinate to the terminal. It can be expressive, but it must never reduce terminal readability or obscure the command area.

### Core recommendation

Implement one reusable dialogue component whose visual state is driven by data: line type, expression, text, current step, total steps, typing state, and minimized state. Do not create a separate component for every mission or dialogue category.

---

## 2. Source constraints and project context

The following decisions are grounded in the supplied Root Escape UI guide.

### 2.1 Game context

Root Escape is a browser-based educational game for learning real Linux commands. The player wakes up inside the FSTM server and progresses through missions by exploring files and directories in a terminal. The audience is mainly university students, from beginners to intermediate learners. The game supports French and English and can use Moroccan student humour and local references.

Pixel is a cute penguin in a royal-blue zip hoodie, with a backpack and a small laptop showing `>_`. His personality is that of a cocky, experienced sysadmin in a tiny body. He guides the player and reacts to mistakes.

### 2.2 Existing visual identity

The dialogue must remain part of the existing game interface:

| Role | Existing colour |
|---|---|
| Deep navy | `#0B1F3B` |
| Website background | `#070E26` |
| Card / panel | `#0E1834` |
| Game background | `#1A1B26` |
| Deep game panel | `#16161E` |
| Game panel | `#24283B` |
| Lines / borders | `#3B4261` |
| Main text | `#C0CAF5` |
| Muted text | `#9AA5CE` |
| Faint text | `#737AA2` |
| Pixel hoodie / brand blue | `#2F6FED` |
| Light blue | `#4CC9FF` |
| UI blue | `#7AA2F7` |
| Success | `#9ECE6A` |
| Warning / points | `#E0AF68` |
| Error | `#F7768E` |
| Violet | `#BB9AF7` |
| Pink | `#FF6B9D` |

Zone accents:

| Zone | Accent |
|---|---|
| Wake-up room | `#7AA2F7` |
| Archive | `#9ECE6A` |
| Search hall | `#E0AF68` |
| Pipe factory | `#BB9AF7` |
| Guarded vault | `#F7768E` |
| Detective cases | `#7DCFFF` |

The game guide specifies **JetBrains Mono** for general text and **Pixelify Sans** for titles, buttons and labels. Game panels use cut corners rather than generic rounded website cards. The dialogue should follow this language.

### 2.3 Technical constraints

- All UI artwork must have transparent backgrounds.
- No words should be baked into images. Names, dialogue, counters and button labels must be HTML text so they can be translated.
- Resizable frames should use nine-slice construction.
- The game window is at most 1320 × 900 px.
- The game must work from 375 px phone widths to large desktop screens.
- Terminal, dialogue and goal text must remain readable.
- Reduced-motion behaviour must be supported.
- Heavy effects should pause when the component is not visible.
- The app is dark-only.

---

## 3. Art direction: Cosmic Character Dialogue

### 3.1 Visual concept

Use a compact sci-fi character panel with subtle cosmic details. The dialogue surface should feel like a small communication module connected to the server world.

The panel should combine:

1. **Character presence:** Pixel's portrait is the first visual anchor.
2. **Clear information hierarchy:** name, message and action are immediately distinguishable.
3. **Game-world identity:** navy surfaces, cut corners, restrained blue/cyan glow and zone accents.
4. **Low visual noise:** avoid busy textures, excessive gradients, large glows or decorations behind text.

The dialogue should not imitate a generic chat widget. It is an in-game character dialogue system.

### 3.2 Shape language

- Use cut or clipped corners consistent with the game frame.
- Use a thin border, normally 1–2 px at CSS display size.
- Use small bevel/highlight details sparingly.
- Keep the portrait compartment visually separate from the text compartment.
- Avoid excessive rounded pills except for the minimized control or compact status chips.

### 3.3 Zone identity

The active zone colour should appear in only a few places:

- Dialogue frame border or a short highlighted segment.
- Pixel portrait-frame outline or glow.
- Nameplate accent.
- Optional small line-type marker.

Do not recolour Pixel's hoodie or the entire panel for every zone. Pixel remains visually consistent; the environment changes around him.

### 3.4 Dialogue line types

Use the same component for all line types. Distinguish them through a small accent treatment rather than a completely different layout.

| Type | Accent | Suggested treatment |
|---|---|---|
| Briefing | Current zone colour | Standard panel; calm introduction |
| Hint | Cyan / current zone | Small lightbulb or magnifier motif, if desired |
| Mistake reaction | Error pink/red `#F7768E` | Brief red accent; shocked, disappointed or laughing Pixel |
| Victory | Gold `#E0AF68` or success green | Warm highlight; proud or happy Pixel |

The type must also be communicated through the text and expression. Colour must not be the only signal.

---

## 4. Component anatomy

### 4.1 Desktop layout

Recommended target for a 1320 px game window:

- Dialogue panel height: **116–132 px**.
- Portrait: **76–88 px square**.
- Horizontal outer padding: **16–20 px**.
- Gap between portrait and text: **14–18 px**.
- Body text: **16 px**, line-height around **1.45**.
- Next button: **38–40 px high**.
- Minimize control: approximately **32–36 px square**.

Suggested hierarchy:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐                                               │
│  │          │  │  PIXEL   │                                               │
│  │  Pixel   │  └──────────┘                                               │
│  │ portrait │  Welcome to the archive. The last intern hid the password   │
│  │          │  in a file. Can you find it?                                │
│  └──────────┘                                      [ NEXT  1/4 ] [ – ]     │
└───────────────────────────────────────────────────────────────────────────┘
```

The nameplate should be small and close to the text. The portrait should remain the strongest visual element, but not so large that it consumes the dialogue area.

### 4.2 Phone layout

At 375 px viewport width:

- Dialogue height: **150–190 px**, depending on content.
- Portrait: **60–68 px square**.
- Outer padding: approximately **12 px**.
- Body text: **14–15 px**, line-height around **1.45**.
- Controls remain reachable at the lower-right.
- Allow the panel to grow vertically for longer French lines.

The dialogue must be placed in normal document flow below the terminal/map stack. It must not be absolutely positioned over the terminal.

Suggested phone structure:

```text
┌───────────────────────────────────┐
│            TERMINAL               │
│                                   │
│  intern@fst:~$ find . -name ...   │
│                                   │
├───────────────────────────────────┤
│  ┌──────┐  PIXEL                  │
│  │ face │  Bien joué ! Le fichier │
│  │      │  est là. Lis son contenu│
│  └──────┘  avec cat pour continuer│
│                         [NEXT 2/4]│
└───────────────────────────────────┘
```

### 4.3 Portrait compartment

- Use one fixed frame for all eight expressions.
- Keep portrait scale, crop, camera angle and lighting consistent.
- Use Pixel's bust (head and hoodie), not a tiny full-body sprite.
- Expression changes must not move the nameplate or text.
- The portrait should use `object-fit: contain` or a carefully prepared consistent sprite crop.
- Do not put expression names or other text inside the image.

### 4.4 Nameplate

- Text: `Pixel`.
- Use Pixelify Sans, approximately 14–16 px.
- Use the active zone accent.
- Keep the nameplate compact; it should not compete with the dialogue.
- Render the name as HTML text, never as part of the image.

### 4.5 Dialogue text

- Use JetBrains Mono.
- Desktop: 16 px.
- Phone: 14–15 px.
- Line-height: 1.4–1.5.
- Aim for 1–3 sentences and a maximum of approximately 200 characters.
- Keep the text area visually quiet, with no starfield or detailed illustration behind it.
- Support French and English without fixed-height clipping.

### 4.6 Next and minimize controls

**Next button**
- Clear primary action.
- Label format: `NEXT 1/4` or localized equivalent.
- Use royal blue with cyan border/highlight.
- Provide normal, hover, focus-visible and pressed states.
- During typing, the button may become `SKIP` or clicking it should reveal the full line before advancing. Pick one behaviour and apply it consistently.

**Minimize button**
- Small secondary control with a minus/collapse icon.
- Must have an accessible label such as `Minimize dialogue`.
- Do not use an icon-only control without an accessible name.

---

## 5. Dialogue states and behaviour

### 5.1 Briefing — typing

Example:

> Zzz… hein ? Oh ! Un visiteur. Bienvenue dans le serveur de la FST, stagiaire.

- Pixel: sleeping transitioning to neutral or surprised.
- Typewriter effect begins at approximately 45 characters per second.
- A small caret may blink at the end of the visible text.
- The player can skip the typewriter effect by clicking the dialogue or using the agreed keyboard action.
- Do not play a loud sound for every character. If blip sounds are enabled, throttle them and expose a sound setting.

### 5.2 Full line — ready to continue

Example:

> Le dernier stagiaire a caché le mot de passe dans un fichier. À toi de le retrouver.

- Pixel: thinking.
- Full text visible.
- Next button displays the current step, e.g. `NEXT 1/4`.
- Enter or Space advances when focus is not inside a text input.

### 5.3 Hint

Example:

> Regarde bien les fichiers cachés. Linux ne les affiche pas toujours avec une simple commande ls.

- Pixel: thinking.
- Cyan or zone-coloured hint accent.
- Do not make the hint style so different that it feels like another UI component.

### 5.4 Mistake reaction

Example:

> Aïe. Cette commande n'existe pas… Même le serveur a eu un petit moment de panique.

- Pixel: shocked or disappointed.
- Brief error accent `#F7768E`.
- Keep the text readable and avoid a large red flash.
- A reaction should not punish the player visually for experimenting; the game is educational.

### 5.5 Victory

Example:

> Bien joué, stagiaire ! Le serveur vient de valider ton travail. Tu progresses plus vite que le précédent intern.

- Pixel: proud or happy.
- Gold/success accent.
- A small, restrained sparkle can appear around the portrait.
- Do not let dialogue effects obscure the victory panel or terminal.

### 5.6 Minimized

- Collapse to a compact pill or dock-like element.
- Show Pixel's face clearly.
- Add a short visual cue that the dialogue can be reopened.
- Reopening restores the previous dialogue line and typing/complete state.
- The minimized element must remain inside the game layout and never overlap the terminal.

### 5.7 Expression mapping

The UI guide lists eight expressions. Use them consistently:

| Expression | Suitable moments |
|---|---|
| Neutral | Ordinary explanations and transitions |
| Happy | Encouragement and positive feedback |
| Thinking | Hints, questions and investigation |
| Shocked | Unexpected commands or surprising mistakes |
| Proud | Mission completion and correct solutions |
| Disappointed | Repeated or careless mistakes, used lightly |
| Laughing | Jokes, Easter eggs and funny reactions |
| Sleeping | Idle moments or sleepy opening dialogue |

Expression should be provided by the dialogue data, not inferred from the text at runtime.

---

## 6. Interaction and accessibility rules

### 6.1 Keyboard

Recommended behaviour:

- `Enter` or `Space`: advance when the line is fully displayed.
- During typing: first press reveals the full line; a subsequent press advances.
- Do not intercept `Enter` or `Space` when focus is inside an input, textarea, button or another interactive control.
- `Escape` may minimize only if this does not conflict with another game-level shortcut.

### 6.2 Pointer and touch

- The Next button must have a comfortable hit target (ideally at least 40 px high on desktop and phone).
- The minimized control must be easy to tap.
- Avoid requiring hover to discover an action.
- Clicking the text area to skip typing is optional; if implemented, keep the button behaviour consistent.

### 6.3 Screen readers

- Put dialogue text in an appropriate live region, such as `aria-live="polite"`.
- Avoid announcing every character as it types. Prefer updating the accessible announcement once the line is complete, or expose a non-animated full-text alternative.
- Give icon-only controls descriptive accessible labels.
- Ensure focus indicators are visible against dark backgrounds.
- Do not rely on zone colour or red/green alone to communicate line type.

### 6.4 Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Show the complete line immediately, or use a non-animated reveal.
- Disable ambient glow pulsing.
- Disable portrait slide-in and crossfade if necessary.
- Avoid shaking the panel.
- Keep all controls and state changes fully functional.

---

## 7. Visual specification

### 7.1 Colour tokens

Suggested CSS variables:

```css
:root {
  --re-dialog-bg: #0E1834;
  --re-dialog-surface: #24283B;
  --re-dialog-deep: #16161E;
  --re-dialog-border-neutral: #3B4261;

  --re-text-primary: #C0CAF5;
  --re-text-muted: #9AA5CE;
  --re-text-faint: #737AA2;

  --re-brand-blue: #2F6FED;
  --re-cyan: #4CC9FF;
  --re-success: #9ECE6A;
  --re-warning: #E0AF68;
  --re-error: #F7768E;
  --re-violet: #BB9AF7;
  --re-pink: #FF6B9D;

  --re-dialog-zone-accent: var(--re-success);
}
```

Set `--re-dialog-zone-accent` from the current mission zone.

### 7.2 Typography

| Purpose | Font | Size |
|---|---|---:|
| Dialogue body | JetBrains Mono | 16 px desktop |
| Dialogue body | JetBrains Mono | 14–15 px phone |
| Pixel name | Pixelify Sans | 14–16 px |
| Next label | Pixelify Sans | 13–14 px |
| Step counter | JetBrains Mono | 11–12 px |

Keep body text at normal or medium weight. Pixel fonts are best for short labels; do not use a decorative pixel font for long dialogue paragraphs.

### 7.3 Spacing

Use a consistent spacing scale:

- 4 px: icon/text micro-gap.
- 8 px: nameplate-to-text and small control spacing.
- 12 px: portrait/text gap on phone.
- 16 px: desktop portrait/text gap and panel padding.
- 20 px: larger desktop horizontal padding.
- 24 px: separation between major content groups where space allows.

### 7.4 Effects

Use effects sparingly:

- 1–2 px zone-coloured border.
- Very subtle outer glow, ideally no more than a few pixels beyond the frame.
- Small inner highlight along the top edge.
- No texture behind the text.
- No large blur or bloom that reduces contrast.

---

## 8. Asset handoff

### 8.1 Generated files from this design pass

The previous design pass produced:

- `dialogue_mockups.png` — a design board with desktop state studies and a phone layout.
- `rootescape_dialogue_web_assets.zip` — starter SVG UI pieces and a README.
- `pixel_expression_reference.jpg` — a visual reference sheet for the portrait crops used in the mockup.

The ZIP contains these SVG assets:

| Asset | Purpose |
|---|---|
| `frame_tl.svg` | Top-left frame corner |
| `frame_tr.svg` | Top-right frame corner |
| `frame_bl.svg` | Bottom-left frame corner |
| `frame_br.svg` | Bottom-right frame corner |
| `frame_top.svg` | Stretchable top edge |
| `frame_bottom.svg` | Stretchable bottom edge |
| `frame_left.svg` | Stretchable left edge |
| `frame_right.svg` | Stretchable right edge |
| `frame_center.svg` | Stretchable/tileable center |
| `portrait_frame.svg` | Pixel portrait frame |
| `nameplate.svg` | Blank nameplate |
| `next_normal.svg` | Normal Next button |
| `next_hover.svg` | Hover Next button |
| `next_pressed.svg` | Pressed Next button |
| `minimized_pill.svg` | Collapsed dialogue control |
| `sparkle.svg` | Optional decoration |
| `speech_tail.svg` | Optional speech-panel detail |

### 8.2 Nine-slice dimensions

The starter assets use:

- Corners: **32 × 32 px** each.
- Top/bottom strips: **100 × 8 px** each.
- Left/right strips: **8 × 100 px** each.
- Centre tile: **100 × 100 px**.

Keep corner geometry fixed. Stretch or repeat only the edge strips and centre. If implementing with CSS `border-image`, assemble a correctly ordered atlas first; the individual files in the ZIP are separate pieces, not a preassembled border-image atlas.

### 8.3 Important asset limitations

The generated files are a **starter design kit**, not a final production art pack.

1. The SVG pieces are simple vector UI elements. They establish proportions and visual direction but may need a final polish pass to match the capsule art precisely.
2. The mockup board is a visual proposal, not a responsive implementation or an exact screenshot of the live game.
3. The portrait reference image generated during the design pass is not guaranteed to be the exact previously approved Pixel expression sheet.
4. The extracted portrait crops used in the mockup include parts of their source background. They should not be treated as production-ready transparent portrait PNGs.
5. The ZIP does not contain eight final transparent portrait sprites. Export the approved Pixel expressions separately, with consistent framing, transparent alpha and matching dimensions.
6. The `nameplate.svg` is intentionally blank; render `Pixel` in HTML.
7. The button SVGs are backgrounds only; render the translated label and step counter in HTML.
8. Verify the actual nine-slice rendering in the target browser before treating the supplied source dimensions as final.

### 8.4 Production portrait requirements

Prepare eight separate portrait assets:

- `pixel-neutral.png`
- `pixel-happy.png`
- `pixel-thinking.png`
- `pixel-shocked.png`
- `pixel-proud.png`
- `pixel-disappointed.png`
- `pixel-laughing.png`
- `pixel-sleeping.png`

Recommended export:

- Transparent PNG with alpha.
- Same canvas size for every expression (e.g. 256 × 256 px).
- Same camera angle, scale, lighting and crop.
- Bust/head/hoodie visible.
- No text, labels, UI or background.
- Leave consistent transparent breathing room.
- Check at the actual 64–88 px rendered size.

---

## 9. Animation specification

| Animation | Suggested duration / rate | Notes |
|---|---:|---|
| Typewriter | ~45 characters/sec | Match the existing UI guide |
| Portrait entrance | 180 ms | Small upward movement and fade |
| Expression change | 100 ms | Short crossfade; no layout shift |
| Button hover | 160 ms | Subtle brightness/glow |
| Button press | 120 ms | Small pressed offset or darker fill |
| Ambient border glow | 2.4 s cycle | Very subtle; optional |
| Minimize / restore | 160–200 ms | Small scale/fade transition |

### Animation rules

- Never animate the panel's height in a way that moves or covers the terminal unexpectedly.
- Reserve enough space for the longest supported line before typing begins.
- Avoid a constant blinking caret if it becomes distracting.
- Stop or pause ambient effects when the dialogue is not visible.
- Under reduced motion, use static states and instant transitions.
- Keep the typewriter effect interruptible.

---

## 10. Recommended React implementation

### 10.1 Component responsibility

Create a reusable component, for example:

```tsx
<PixelDialogue
  line={currentLine}
  step={currentStep}
  totalSteps={totalSteps}
  zoneAccent={zoneAccent}
  minimized={isMinimized}
  onNext={handleNext}
  onMinimize={handleMinimize}
  onRestore={handleRestore}
/>
```

The component should not own mission progression or command validation. Those belong to the game/mission layer. It should display the current dialogue data and report user actions through callbacks.

### 10.2 Suggested dialogue data model

```ts
type PixelExpression =
  | "neutral"
  | "happy"
  | "thinking"
  | "shocked"
  | "proud"
  | "disappointed"
  | "laughing"
  | "sleeping";

type DialogueKind =
  | "briefing"
  | "hint"
  | "mistake"
  | "victory";

type DialogueLine = {
  id: string;
  kind: DialogueKind;
  expression: PixelExpression;
  text: {
    fr: string;
    en: string;
  };
};
```

Keep the line data separate from presentation. The language selector should determine which text is rendered.

### 10.3 Suggested component state

```ts
type DialogueViewState = {
  isMinimized: boolean;
  isTyping: boolean;
  visibleCharacterCount: number;
  currentLineIndex: number;
};
```

The parent game state should own the current line sequence and mission progression. The dialogue component can own the typewriter progress and minimized presentation, or receive those values from the parent if the game needs to persist them.

### 10.4 Interaction flow

Recommended state machine:

```text
LINE_START
   |
   v
TYPING  -------- click / Enter / Space --------> LINE_COMPLETE
   |                                               |
   | typing finishes                               | Next
   v                                               v
LINE_COMPLETE                                  NEXT_LINE
                                                   |
                                      more lines? --+-- no --> SEQUENCE_COMPLETE
                                                   |
                                                  yes
                                                   v
                                               LINE_START

Any visible state -- Minimize --> MINIMIZED
MINIMIZED -- Restore --> previous visible state
```

Important: when the player minimizes and restores the panel, restore the same line and the same typing progress. Do not restart the dialogue unexpectedly.

### 10.5 Keyboard implementation notes

- `Enter` or `Space` advances when the line is complete.
- During typing, the first activation reveals the full line.
- A second activation advances to the next line.
- Ignore these shortcuts when focus is inside an input, textarea, select, or another interactive control.
- Do not prevent normal terminal typing or command submission.

### 10.6 Responsive implementation

Use CSS grid or flexbox, not fixed pixel positioning for the complete panel.

- Desktop: portrait column, text column, action column.
- Phone: compact portrait and text row, with actions below or aligned to the bottom-right.
- Allow the panel to grow vertically when French text wraps.
- Keep the terminal and map in their own layout regions.
- Do not use `position: fixed` or absolute overlay positioning for the main dialogue panel.

### 10.7 Suggested CSS variables and responsive rules

```css
.pixel-dialogue {
  --dialog-accent: var(--re-dialog-zone-accent);
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  min-height: 116px;
  padding: 12px 16px;
  color: var(--re-text-primary);
  background: var(--re-dialog-bg);
  border: 1px solid var(--dialog-accent);
}

.pixel-dialogue__text {
  min-width: 0;
  font-family: "JetBrains Mono", monospace;
  font-size: 16px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .pixel-dialogue {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px 12px;
    padding: 12px;
    min-height: 150px;
  }

  .pixel-dialogue__actions {
    grid-column: 2;
    justify-self: end;
  }

  .pixel-dialogue__text {
    font-size: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-dialogue *,
  .pixel-dialogue *::before,
  .pixel-dialogue *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a starting point. Adapt the selectors and breakpoints to the actual game's CSS architecture.

---

## 11. Acceptance checklist

### Visual

- [ ] Dialogue belongs to the existing Root Escape visual family.
- [ ] Pixel's portrait is recognizable and consistently framed.
- [ ] All eight expressions fit the same portrait frame.
- [ ] Zone accent changes correctly.
- [ ] Dialogue text is readable against a quiet background.
- [ ] Frame corners remain crisp when resized.
- [ ] No image contains translated text or UI labels.

### Behaviour

- [ ] Typewriter runs at approximately 45 characters per second.
- [ ] Player can reveal the full line immediately.
- [ ] Next advances the dialogue sequence and shows the correct step count.
- [ ] Minimize and restore preserve the current line and progress.
- [ ] The portrait expression changes per line.
- [ ] Briefing, hint, mistake and victory styles remain part of one component.
- [ ] Keyboard shortcuts do not interfere with terminal input.

### Responsive

- [ ] Works inside the 1320 px desktop game window.
- [ ] Works at 375 px phone width.
- [ ] French text wraps without clipping.
- [ ] Panel grows when needed.
- [ ] Dialogue never overlays or hides the terminal.
- [ ] Controls remain tappable on phone.

### Accessibility and performance

- [ ] Reduced-motion mode has a still version.
- [ ] Buttons have visible focus states and accessible names.
- [ ] Screen readers do not announce each typed character.
- [ ] Decorative animation pauses when not visible.
- [ ] Portraits and UI assets are optimized for web delivery.

---

## 12. Final decisions and priorities

### Decisions to keep

1. **One reusable dialogue component** for every mission and dialogue type.
2. **Pixel portrait on the left** on desktop, with a smaller portrait on phone.
3. **Zone-coloured accent** instead of recolouring the complete component.
4. **JetBrains Mono for dialogue**, Pixelify Sans for the name and short labels.
5. **Typewriter at about 45 characters per second**, interruptible by the player.
6. **Next with step counter** and a separate minimize/restore action.
7. **Normal document flow**, never an overlay that hides the terminal.
8. **A single consistent portrait frame** for all eight expressions.
9. **Reduced-motion support** for every animation.

### Recommended implementation order

**Phase 1 — Functional component**
- Implement the responsive layout.
- Add text, name, Next, minimize and restore.
- Add keyboard support and step counter.
- Verify terminal is never covered.

**Phase 2 — Pixel integration**
- Export the eight approved transparent portraits.
- Implement expression mapping.
- Add typewriter behaviour and line types.

**Phase 3 — Visual polish**
- Integrate and validate the nine-slice frame.
- Add zone accents, button states and subtle glow.
- Add portrait and button transitions.

**Phase 4 — Quality assurance**
- Test 375 px, intermediate tablet widths and desktop.
- Test long French lines and English lines.
- Test keyboard, touch and screen-reader behaviour.
- Test reduced motion and low-performance devices.

### Final recommendation

Prioritize a stable, readable and reusable dialogue component before adding decorative effects. Pixel's portrait, expression and writing are what make the dialogue memorable; the frame and glow should support those elements, not compete with them.

The generated mockups and SVG starter assets are useful as a visual direction and implementation starting point. Before production, replace the illustrative portrait crops with the approved transparent Pixel expression sprites and validate the frame assets in the actual game layout.
