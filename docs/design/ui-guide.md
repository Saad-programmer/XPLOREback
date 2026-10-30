# Root Escape · Xplore Labs: UI guide for designers

This document describes every part of the interface of **Xplore Labs** and its first game, **Root Escape**, so a designer (human or AI) can propose a better look. It says what each part is for, what it shows, its states and its constraints. It does **not** impose an art direction: that is the designer's job.

---

## 1. The project in one minute

- **Xplore Labs** is a web hub of teaching games made by **Xplore**, the student club of the ILISI program at **FSTM** (Faculty of Sciences and Techniques of Mohammedia, Morocco).
- **Root Escape** teaches **Linux commands**. The player wakes up inside the faculty's server and must escape, zone by zone, by typing **real Linux commands** in a terminal. Each mission ends with a password to find and type.
- **Players:** Moroccan university students, 18–24, beginners to intermediate. They play on laptops in class, at home, sometimes on phones.
- **Languages:** French and English (switchable). **Humour:** Moroccan student humour, Darija and local references (FSTM, exams, msemen, "le Président" of the club…).
- **Guide character:** **Pixel**, a cute penguin in a royal-blue zip hoodie, with a backpack and a small laptop showing `>_`. A cocky old sysadmin in a tiny body. He talks to the player in a dialogue box and reacts to mistakes with jokes. He must never look like Tux, the Linux mascot.
- **Feeling we want:** a modern indie game (think of the cosy, readable UIs of Celeste, Stardew Valley, Undertale or Hades), in **space + pixel + hacker** style. Fun, but the terminal stays easy to read: it is a learning tool.

## 2. Visual identity that exists today

### Colours

| Role | Hex | Notes |
| --- | --- | --- |
| Deep navy (backgrounds, logo) | `#0B1F3B`, site background `#070E26` | from the Xplore Labs logo |
| Card / panel | `#0E1834` | website cards and panels |
| Game background | `#1A1B26`, deep `#16161E`, panels `#24283B`, lines `#3B4261` | "Tokyo Night" palette in the game screen |
| Text | `#C0CAF5`, muted `#9AA5CE`, faint `#737AA2` | |
| Royal blue (brand) | `#2F6FED` | Pixel's hoodie, primary accents |
| Light blue | `#4CC9FF`, primary UI blue `#7AA2F7` | |
| Success | `#9ECE6A` | done, correct, terminal prompt |
| Warning / points | `#E0AF68` | points, stars, gold |
| Error | `#F7768E` | wrong command, error |
| Pink / violet accents | `#FF6B9D`, `#BB9AF7` | nebulas, capsule art |

**Zone colours** (each zone of the game has one; used for borders, labels, glows):
Wake-up room `#7AA2F7` (blue) · Archive `#9ECE6A` (green) · Search hall `#E0AF68` (gold) · Pipe factory `#BB9AF7` (violet) · Guarded vault `#F7768E` (red) · Detective cases `#7DCFFF` (cyan).

### Fonts
- **JetBrains Mono**: all text and the terminal (15 px in the terminal, 15–16 px elsewhere).
- **Pixelify Sans**: titles, buttons, labels (a placeholder: a better pixel title font can be proposed).

### Shapes and effects
- Game panels and buttons have **cut corners** (angled, like sci-fi UI), not round corners.
- The website uses round corners, soft glows and a starfield background.
- Custom **pixel-art cursors** (arrow, hand in Pixel's sleeve, padlock, hourglass).

### Art that already exists (style references)
- **Capsule art**: cosmic scene with nebulas, planets, floating cubes, and the "RootEscape" logo with Pixel. Vibrant cartoon game art with pixel touches.
- **Pixel the mascot**: a full design board and 8 expressions (neutral, happy, thinking, shocked, proud, disappointed, laughing, sleeping), soft-shaded cartoon style.
- **Six floating islands** (isometric, one per zone) used on the mission map: a cosy server bedroom, an archive library, a search hall with a giant magnifier, a pipe factory, a guarded vault, a detective office with msemen and mint tea.

All new art must match this family: **soft-shaded cartoon game art with subtle pixel-art touches, deep navy space, neon blue/violet/pink glows.**

## 3. Technical rules the design must respect

1. **No text inside images.** All words are added by code (two languages, and they change). Images are frames, icons, illustrations and backgrounds only.
2. **Transparent backgrounds** for all UI pieces (PNG or WebP with alpha). Icons can be SVG.
3. **Resizable frames:** boxes change size with the screen and the text length, so frames should work as **9-slice** pieces (corners that stay fixed, edges that stretch or repeat). Draw corners and edges so they can be cut.
4. **Screens:** from phones (375 px wide) to large monitors (1920 px). The game screen is max 1320 × 900 px; on phones its panels stack vertically.
5. **Readability first:** the terminal text, the dialogue text and the goal must stay perfectly readable (high contrast, no busy texture behind text).
6. **Reduced motion:** every animation needs a still version. Heavy effects pause when not visible.
7. **Light:** UI images should be small (a frame piece is a few KB, a background a few hundred KB).
8. **Dark only:** the whole app is dark.

---

## 4. Website pages

These pages have a **navbar** at the top, a **footer** at the bottom and an animated **starfield** behind (navy sky, slow nebula glows, twinkling and drifting stars, rare shooting star).

### 4.1 Navbar (top of every website page)
- **Left:** Xplore Labs logo, links "Games" and "Missions" (the current page is underlined).
- **Right:** language switch (FR/EN), the player: round avatar, name, "Level N" and a small XP bar (points), a menu with settings (sound, meme sounds, reduced motion, classic cursor, language) and "Back to Xplore".
- **Phone:** a menu button opens a side drawer with the same content.

### 4.2 Intro video (first visit only)
A short full-screen logo video with a Skip button. Then it fades into the hub.

### 4.3 Games hub (`/labs/games`)
- A grid of **game cards**. Each card: a 16:10 image (the game's capsule art), the game name, its subject (Linux, SQL…), a badge "Play now" or "Coming soon".
- **Hover:** a small fake terminal typing commands appears over the image, with Pixel.
- Games not ready yet show a simple icon instead of art, dimmed.
- A last dashed card **"Your game here"** invites students to propose a game.

### 4.4 Game details page (`/labs/games/linux`)
- Big capsule art on the left; on the right: subject tag, title, short pitch, facts (number of missions, guide name, "runs in the browser"), the player's progress bar (pixel-style segments), buttons **Play now / Continue**, **More info**, **Mission map**.
- **More info** unfolds a long formatted text (story, what you learn, how to play, a table of zones, points, good to know).

### 4.5 Mission map (`/labs/linux/missions`)
- The six **floating islands**, gently floating, linked by a **glowing route** (green where the player has been, dotted ahead).
- On each island, **level nodes**: round buttons with the mission number.
  - **Done:** green, 1 to 3 stars below.
  - **Open:** pulsing blue glow, **Pixel standing on it** ("you are here").
  - **Locked:** dark with a padlock.
  - The last level of a zone is a **bigger node** (like a boss).
- Each island has a **name label** (pill shape) under it; zones without missions yet say "Soon".
- **Phone:** the islands form a vertical zigzag.

### 4.6 Mission panel (opens when clicking a level node)
A side panel (bottom sheet on phones) with:
- Zone tag, mission number and title.
- Two **tabs**: **Mission** (goal, stars, best score, hints used, a Play or Replay button; for a locked mission: "Finish mission N first") and **Recap**, locked with a padlock until the mission is done (list of commands learned with examples, a "Key idea" box, and "Your solution": the commands the player typed, shown like a terminal).

### 4.7 Footer
Logo and tagline, copyright, and **credit tickets**: pill-shaped cards with a spinning gradient border, GitHub avatar, a badge (crown for the founder, `</>` for developers), "Founded by" / "Developed by", name and GitHub handle. Also a round **back-to-top** button and a **"Your feedback"** button.

---

## 5. Game screens

These screens are fully game-styled (no website navbar).

### 5.1 Title screen (`/labs/linux`)
- Full-screen **capsule art** (with its logo and Pixel), slowly zooming, slight parallax with the mouse, twinkling stars on top; a dark gradient at the bottom.
- **"Press Enter to start"** (blinking), then a vertical **menu**: Continue (with the next mission name under it), New game, Missions, Settings, Quit. The selected item has a small triangle cursor and a soft highlight.
- **Settings** opens as a small floating panel (checkboxes and language). **New game** asks for confirmation in a dialog.
- **Phone:** the art shows at the top, the menu below.
- *Planned:* title music.

### 5.2 Game screen: layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← [Xplore Labs]  3. The hidden scroll     (I) Intern 35 pts  [🎯 Goal]       │ ← TOP BAR
│                                           [Hint 0/3] 🔊 ⚙ ↻ ⛶ ⤢              │
│                                  Password [__________] [Unlock]   ✓ Saved   │ ← password + save status
├─────────────────────────────────────────┬────────────────────────────────────┤
│ FST server, Linux 6.1. Type help…       │ ~/door-1                           │
│ intern@fst:~$ ls -a                     │  □ /                               │
│ .  ..  .secret_scroll  notes.txt        │  └□ home                           │
│ intern@fst:~$ _                         │    └□ intern   ← Pixel here        │
│                                         │       ○ notes.txt                  │
│             TERMINAL (55%)              │           LIVE MAP (45%)           │
├─────────────────────────────────────────┴────────────────────────────────────┤
│ [Pixel face] Pixel                                                           │
│              Welcome to the archive. The last intern hid…    [Next 1/2] [–]  │ ← DIALOGUE BOX
└──────────────────────────────────────────────────────────────────────────────┘
```

The whole screen sits in one framed window (cut corners, thin border in the zone colour) centred on a dark background, max 1320 × 900 px. A **Maximize** button makes it fill the screen. On phones: top bar, terminal, map and dialogue are stacked.

### 5.3 Top bar
- **Left:** back button (← + Xplore Labs logo, back to the title screen), mission number (zone colour) and title (pixel font).
- **Right:** player chip (avatar letter, name, points in gold), **Goal** button (opens a small popover with the mission goal), **Hint N/3** button (becomes **Answer** after the last hint), icon buttons: sound on/off, settings, restart, full screen, maximize.
- **Second row:** the **password box** (label, input, "Unlock" button with cut corners) and the **save status** ("Saving…", "Saved", "Offline").

### 5.4 Terminal (the heart of the game)
- A real terminal: dark background, JetBrains Mono 15 px.
- **Prompt** `intern@fst:~$` in green and blue. While typing, the **command word turns green if it exists, red if not**.
- Output looks exactly like real Linux (English), errors in red (`cat: x: No such file or directory`).
- **Tab** completes names, ↑/↓ browse history; text can be selected and copied.
- Constraints: maximum readability, no texture behind text, the text area must not shrink. Decoration can only live **around** it (frame, header, bezel, scanlines option…).

### 5.5 Live map (right panel)
- The current folder path at the top (`~/door-1`).
- A **tree of folders and files** revealed only as the player explores ("fog of war"): folders are small squares, files small circles, unexplored folders end with "…", the current folder is highlighted.
- **Pixel's face** marks the current folder. He **slides** to the new folder on `cd`, takes out a **magnifier** on `grep`/`find`, **panics** on `rm`, **dances** on victory, **sleeps** after 60 s without typing.
- Subtle dotted grid background.

### 5.6 Dialogue box (bottom)
- **Portrait** on the left: Pixel's bust (head and hoodie, 80 px) in a small frame with cut corners and a glow in the zone colour. The **expression changes** with each line (8 expressions).
- **Name** "Pixel" in the zone colour (pixel font), then the **text**, which appears letter by letter (typewriter, about 45 letters per second, with soft "blip" sounds). Lines are 1 to 3 sentences, up to ~200 characters, in French or English.
- **Next** button (with "1/4" step counter) and a **minimize** button: the box shrinks to a small pill with Pixel's face to reopen it, so it never hides the terminal.
- Kinds of lines: briefing (start of mission), hints, reactions to mistakes and jokes, victory lines.
- Height today: about 110 px on desktop.

### 5.7 Effects and overlays
- **Shake:** the screen shakes on a wrong command.
- **Pipe combo:** a banner when 3+ commands are chained with `|`.
- **`rm -rf /`:** the screen "melts" then rewinds (a big joke moment).
- **`sl`:** a little train crosses the screen.
- **Confetti** on victory.
- **Meme stickers:** a sticker image pops next to the dialogue for 2–3 s with a sound (placeholders today: we want original stickers).
- **Vim trap:** typing `vim` opens a fake vim screen that only `:q!` closes.

### 5.8 Victory panel (end of a mission)
A centred panel over the game: "Mission complete", points earned (or "already done before: no new points"), **"What you learned"** (one sentence), then buttons **Next mission**, **Mission map**, **Replay**. Confetti behind.

### 5.9 Small dialogs and states
- **Confirm dialog:** "Start this mission again?" with two buttons (cancel is the safe default).
- **Loading:** "Booting the server…".
- **Error:** the mission could not start.
- **Locked mission:** message with a link to the map.

---

## 6. What we expect from a design proposal

For the part being redesigned:
1. **Mockups** of the part in context (desktop, and phone when relevant), in every state listed above, with **real-length text** (French is longer than English).
2. **Separate assets** ready for the web: frames as 9-slice pieces (state the slice sizes), icons, decorations, all on transparent backgrounds, no text inside.
3. **A short spec:** colours (hex), sizes and spacing, fonts, animations (what moves, how long, and the still version).
4. The design should feel like **one family** with the capsule art, Pixel and the islands.
