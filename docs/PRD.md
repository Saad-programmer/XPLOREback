# Xplore Labs — Linux Game PRD

Last updated: 2026-10-30 · Author: Ali Zouhdi (Ali-Hero)

> Every `[TO FILL: ...]` marker is listed in section 17. Nothing in that list blocks the start of development in mock mode.
>
> **Remaining work for v1 (Phase A) is broken into tasks in [`HANDOFF.md`](HANDOFF.md).** Where this PRD and the code differ, the code and [`ARCHITECTURE.md`](ARCHITECTURE.md) section 7 win.

## 1. Overview

Xplore Labs is a new section of the Xplore club platform where students learn Linux by playing a game in the browser. The player types real Linux commands in a terminal to explore a server, solve missions and find hidden passwords.

A guide character, a penguin, welcomes the player, explains each mission in a dialogue box and reacts with jokes, sounds and small animations. A live map shows the folders and moves the penguin as the player types.

The game is a separate Next.js web app with its own repo, look and deploys. It is served under the Xplore domain (for example `/labs`), shares the Xplore login and saves progress, points and stickers through the existing Xplore NestJS backend. This keeps the main platform light and lets the team build and test the game without touching Xplore. Later, the same format will host other subjects, starting with SQL and a dolphin guide.

**Names:** Xplore Labs is the hub that holds all teaching games. The Linux game is the first one, working title **Root Escape** [TO FILL: final game name].

**Status (2026-10-30):** in development as a standalone app (mock mode). Build steps 0 to 7 are done and a preview runs at <https://xplore-labs.vercel.app/labs>. Step 8 is in progress: missions 1 to 5 are playable. Integration with Xplore (Phase B) needs the information in section 17. Details in section 15.

## 2. Goals, non-goals and success metrics

**Goals**

- Help beginners understand Linux by doing, not by reading.
- Teach how commands combine (pipes, redirections), not only single commands.
- Make it fun enough that students come back on their own, through humor, memes, sounds and characters.
- Run as a separate app on the Xplore domain, reusing the Xplore login, points and stickers.
- Save every player's progress so they can stop and continue on any device.
- Stay fast with many players at once (club events, a whole promotion).
- Build a reusable format so new subjects (SQL, Git, networking) can be added later.
- Let students add missions and memes without touching the game code.

**Non-goals for v1**

- No real Linux server or containers. The terminal is simulated in the browser.
- No multiplayer or co-op mode.
- No walking 2D world or game engine.
- No separate login or separate reward system. The game uses Xplore's.
- No separate backend or database. The game uses a new module in the Xplore NestJS backend.
- No SQL mode yet. It comes in a later version.

**Success metrics** (first semester after launch)

| Metric | Target |
| --- | --- |
| Students who finish mission 1 | 70% of active Xplore members |
| Students who finish all v1 missions | 30% of players |
| Players who come back the week after their first session | 40% |
| Missions or memes added by students (not the core team) | at least 5 |
| Average rating in a short in-game survey | 4 / 5 or more |

These targets are starting guesses. The team can adjust them after the first month.

## 3. Target users

The main players are ILISI students and future promotions who are logged in to Xplore.

| User | What they need | How the game helps |
| --- | --- | --- |
| Beginner (DEUST, ILISI 1) | Understand paths, folders and basic commands without fear | Story missions, live map, hints from the penguin |
| Intermediate (ILISI 2, 3) | Practice combining commands, permissions, processes | Detective cases, short-command challenges |
| Club members who like to create | Add their own missions and memes | Mission files and meme packs in a simple format |
| Club admins | Run events and see who plays | Weekly case, live event mode, simple stats page |
| Teachers (later) | See which concepts the class struggles with | Anonymous stats per concept |

The game must work on a laptop first. A phone should at least show the story and the map, even if typing is less comfortable.

## 4. Inspirations

The concept already exists in several games. Xplore Labs takes one idea from each and adds what they lack: a class community, progress tied to Xplore, a live map and local humor.

| Source | What we take from it |
| --- | --- |
| [OverTheWire Bandit](https://overthewire.org/wargames/bandit/) | Find the password to unlock the next level |
| [Terminus (MIT)](https://web.mit.edu/mprat/Public/web/Terminus/Web/main.html) | Folders as places, a story around basic commands |
| [Bashcrawl](https://gitlab.com/slackermedia/bashcrawl) | Every action is a real command the player can reuse |
| [cmdchallenge](https://cmdchallenge.com) | Short one-line puzzles with instant feedback |
| [SadServers](https://sadservers.com) | Fix a broken server (later, advanced mode) |
| [Learn Git Branching](https://learngitbranching.js.org) | Layout: terminal on one side, live animated picture on the other |
| [Oh My Git!](https://ohmygit.org) | A technical topic that feels like a real game |
| Bitburner, Hacknet | Dark hacker atmosphere, sidebar and status bar |
| Undertale, Animal Crossing, Pokemon | Dialogue box with portrait, typewriter text and talk blips |
| Duolingo | A mascot whose mood reacts to the player |
| Friv, Y8 | Game hub with a grid of game cards |
| Tokyo Night, Catppuccin, Dracula | Terminal color themes |

## 5. Game modes and core gameplay

v1 ships the story campaign with the live map. Detective cases follow right after, and the other modes come later.

**Core loop of one mission**

1. The penguin gives a short briefing: the story, the goal and the place on the map.
2. The player types commands. The map, the penguin and the sounds react to each command.
3. After 2 or 3 failed tries, the penguin offers a hint. Hints cost a few bonus points.
4. The player finds the goal (a password, a file, a fixed state). The game checks it.
5. Victory: animation, sound, points. The penguin names the concept learned in 1 sentence.
6. The next mission unlocks. Progress is saved.

**Modes**

| Mode | Description | Level | Version |
| --- | --- | --- | --- |
| Story campaign | "Lost in the server": the player wakes up inside a server and must escape, zone by zone | Beginner | v1 |
| Live map | Folder tree next to the terminal, the penguin moves as the player types | All | v1 |
| Detective cases | A funny crime on the "FST server", solved with grep, find, sort and pipes | Intermediate | v2 |
| Case of the week | 1 short case for the whole club each week, shown on the Xplore home page | All | v2 |
| Short-command challenge | Solve a task with the shortest command; best scores shown | Intermediate | v2 (maybe) |
| Rescue the server | A broken system to diagnose and fix | Advanced | v3 |
| Graduation mission | Final mission done in a real Linux running in the browser | All | v3 |
| SQL mode | Same format with the dolphin guide and a real SQL engine in the browser | All | v3 |
| Co-op permission heist | 2 players with different users and rights must help each other | Intermediate | later |
| Walking world | The penguin walks around a 2D world | All | later |

**Story campaign zones (v1)**

| Zone | Theme | Commands taught |
| --- | --- | --- |
| 1. The wake-up room | Where am I? | pwd, ls, cd, cat, clear |
| 2. The archive | Files everywhere | ls -l, ls -a, mkdir, touch, cp, mv, rm, hidden files |
| 3. The search hall | Find the needle | find, grep, head, tail, wc |
| 4. The pipe factory | Combine everything | pipes, >, >>, sort, uniq |
| 5. The guarded vault | Who can open this? | whoami, chmod, ownership, permission denied |

## 6. Guide characters

Each game has its own guide character who talks to the player in a dialogue box at the bottom of the screen. The Linux guide is a penguin; the SQL guide (later) is a dolphin.

**Design rule:** both characters are original designs made for Xplore. The penguin can be inspired by the Linux penguin idea but must not copy Tux. The MySQL dolphin is an Oracle brand mascot, so the dolphin must have its own name and look.

| | Penguin (Linux) | Dolphin (SQL, later) |
| --- | --- | --- |
| Name | **Pixel** (kept unless the club picks another name; one constant in `src/games/linux/meta.ts`) | [TO FILL: dolphin name] |
| Personality | Confident, a bit cocky old sysadmin in a tiny body | Calm, smart, a bit nerdy, loves order and tables |
| Running joke | Thinks sudo fixes everything, and is always wrong | Gets offended when a DELETE has no WHERE |
| Look | Royal-blue zip hoodie, backpack, small laptop showing `>_` | Glasses, holds a tablet with tables |
| Talk blips | Short, high and cute | Soft and bubbly |

**Recurring character:** **le Président**, the club's president, never seen on screen. He inspects desks, loves msemen and "never smiles". Used as a running joke in the dialogue and as a suspect in the bonus detective case. Jokes about him stay friendly, and he must agree to them before launch (section 7: memes about real people only with their agreement).

**Dialogue box**

- Portrait of the character on the left, text on the right.
- Text appears with a typewriter effect and talk blips. Click or Enter shows the full line at once; a second press goes to the next line.
- The character changes expression for each line.
- The box can be minimized so it never hides the terminal.
- **Redesign (built 2026-10-31, [`HANDOFF.md`](HANDOFF.md) task T1):** a "capsule console" look. Cut corners; a lit "signal rail" on top; Pixel in a docking bay with a glowing floor; a `PIXEL // GUIDE` name tag with an icon per kind of line; "PASSER" while typing, then "SUIVANT 2/4"; minimized to Pixel's round face. The accent colour follows the kind of line: briefing = zone colour (on the top strip and the name tag only, so a pink or gold zone never looks like a mistake or a victory), hint = cyan, mistake = pink, victory = gold with sparkles. Enter or Space advance the dialogue when the player is not typing. Design preview: `docs/design/dialogue-preview.html`.

**Expressions (minimum set):** neutral, happy, thinking, shocked, proud, disappointed, laughing, sleeping.

**What the guide does in each mission**

1. Briefing: story and goal.
2. Hints after 2 or 3 failed tries, from vague to precise.
3. Reactions to classic mistakes (section 7).
4. Victory line + the concept learned in 1 sentence.

**Small animations**

| Trigger | Penguin animation |
| --- | --- |
| No typing for 60 s | Falls asleep, says "type something..." |
| cd | Slides on its belly to the new folder on the map |
| rm | Panics and hides |
| grep or find | Takes out a magnifying glass |
| Permission denied | A door slams in its face |
| Wrong password | Shakes its head |
| Mission success | Victory dance + confetti |

The character art is original AI-generated art made for the club: a design board and 8 expressions in `public/games/linux/characters/pixel/source/`, cut into one face per mood by `node scripts/cut-mascot.mjs`. A Rive version with animated moods can replace the faces later.

## 7. Humor, memes and sounds

Humor is part of the teaching, not decoration: each joke is tied to a mistake or a concept so the lesson sticks. The humor tone is **Moroccan student humor**: Darija touches ("safi", "wach normal?", "khoya", "hchouma") and local references (FSTM, exams and deliberations, msemen, mint tea, le Président), mixed with classic dev jokes. The server's own files (logs, notes, TODO lists) stay in English, like a real server; only the dialogue is translated.

**Reactions to classic mistakes**

| Player types | Game reaction | Lesson shown after |
| --- | --- | --- |
| `rm -rf /` | Screen "melts", dramatic sound, meme, then rewind | Why this command is dangerous |
| sudo on everything | "Sudo is not a personality." | sudo is for admin tasks only |
| `sl` instead of `ls` | A small train crosses the screen | Typos, and the real joke command sl |
| vim or vi | "You are stuck in vim forever..." with sad violin | How to quit with `:q!` |
| cd into a file | "That is a file, not a folder." | Files vs folders |
| Permission denied | A bouncer blocks the door: "Your name is not on the list." | Permissions |
| Unknown command | Random funny line from a pool | Use help or man |

**Sounds**

- Success ding, error bonk, combo sound for chained pipes, zone victory sound.
- Talk blips for each character.
- Short suspense music near the goal.
- One global mute, synced with the Xplore mute setting if it exists. Sound is off by default in class mode. [TO FILL: does Xplore already store a mute setting, and where]

**Community memes**

- Meme packs: each promotion can add its own pack (images, lines, sounds) as content files.
- Meme of the week: students submit, admins approve, the winner gets Xplore points or a sticker.
- Unlockable reactions: finishing a zone unlocks a new victory sound or animation.
- Funny fails wall: the funniest wrong commands of the week, anonymous.

**Meme reactions (sound + sticker)**

A meme reaction plays a short sound and shows a sticker next to the talking penguin for 2 to 3 s. Each game keeps its memes and sounds in its own asset folder, plus a list file that links game events to assets. Adding a meme means dropping the files and adding 1 line, with no code change.

```yaml
# public/games/linux/memes/memes.yaml
- event: give_up            # player asks for the full answer
  sound: sounds/laughing-cat.mp3
  sticker: memes/laughing-cat.png
  chance: 0.7               # not every time, so it stays funny
- event: rm_rf_root
  sound: sounds/dramatic.mp3
  sticker: memes/this-is-fine.png
- event: mission_success_no_hint
  sound: sounds/applause.mp3
  sticker: memes/penguin-flex.png
```

| Event | When it fires | Example reaction |
| --- | --- | --- |
| give_up | Player gives up and asks for the full answer (not on normal hints) | Laughing cat sound + sticker, then the answer |
| rm_rf_root | Player types `rm -rf /` | Dramatic sound, screen melt, meme |
| sudo_spam | sudo used 3 times in a row | Penguin facepalm sticker |
| vim_trap | vim or vi | Sad violin, stuck sticker |
| mission_success_no_hint | Mission done without hints | Applause, flex sticker |
| idle_60s | No typing for 60 s | Snoring sound, sleeping penguin |

- Mocking memes play only on give_up, never on normal hints, so beginners are not afraid to ask for help.
- A separate **meme sounds on/off** setting, besides the main mute, for people who play in class.
- Asset files are original, free-licensed ([Kenney](https://kenney.nl), [freesound](https://freesound.org)) or recorded and drawn by club members. Famous meme clips and photos are not used as-is.

**Rules**

- Jokes target the command or the situation, never the player.
- Memes about real people only with their agreement.
- Each meme or line is rare and picked at random so it stays funny.
- No copyrighted sounds or images (movie clips, famous songs).
- Student submissions go through admin approval before they appear.

## 8. Screens, visual style and typing feedback

The game app has its own unique look, separate from the Xplore design. Since it is a separate app, the Xplore sidebar is not shown: a slim game top bar links back to Xplore and shows the player. The game area uses the Learn Git Branching layout: terminal on the left, live map on the right, dialogue box at the bottom.

**Game screen areas**

| Area | Content |
| --- | --- |
| Top bar | Back button (← + Xplore Labs logo, to the title screen), mission number and name, player avatar and points, Objective button (shows the goal), hint, mute, settings, restart, full screen, maximize |
| Terminal (left, about 55% width) | Prompt, command input, output, history with arrow keys, Tab completion |
| Live map (right, about 45% width) | Folder tree of the current mission, penguin avatar at the current folder. "Fog of war": it shows only what the player has discovered (`ls`, `cd`, `cat`, `find`, files created), so it never gives the answer away |
| Dialogue box (bottom) | Character portrait, name tag, typewriter text, skip / next button with step counter, minimize button (redesign: section 6) |
| Overlays | Victory screen, memes, confetti, zone transition |

Mock-up of the game screen (mission 3):

```text
+--------+---------------------------------------------------------------+
| Game   | Zone 2 Archive / Mission 3: The hidden scroll   Ali 450 pts [⤢]|
| menu   | Goal: find the hidden password                                |
|        +-------------------------------+-------------------------------+
|        | TERMINAL                      | LIVE MAP                      |
|        | intern@fst:~$ ls              | /                             |
|        | notes.txt                     | └ home                        |
|        | intern@fst:~$ ls -a           |   └ [intern]  ● penguin here  |
|        | .  ..  .secret_scroll ...     |       ├ .secret_scroll (goal) |
|        | intern@fst:~$ cat .secret...  |       └ notes.txt             |
|        | k7Qx-PENGU-42                 |                               |
|        +-------------------------------+-------------------------------+
| Exit   | (penguin, proud) Files that start with a dot are hidden.      |
|        | ls -a shows them. Now type the password.            [Next]    |
+--------+---------------------------------------------------------------+
```

**Maximize and restore**

- By default the game screen sits in the middle of the page, with mission info around it.
- A maximize icon (2 diagonal arrows pointing to the corners) in the top-right corner expands the game screen to fill the whole browser window.
- In maximized mode the icon changes to restore (arrows pointing inward); clicking it returns to the default middle screen. Esc also restores.
- A separate option uses the browser Fullscreen API to hide the browser bar too.
- The choice is remembered per player (settings).

**Intro video (Labs entrance)**

Xplore Labs opens with a short intro video before the hub, like a console boot screen. The video is `XploreLabs_Intro_16x9_sound.mp4` (with sound, about 1.6 MB). It is the only intro file; the older silent version was removed.

- First visit to `/labs`: the video plays at once, full screen, with sound.
- Browsers block autoplay with sound until the visitor has interacted with the site. Then the same video plays muted, and the first click or key press turns the sound on.
- A Skip button (and Esc) is always visible. When the video ends or is skipped, it fades into the hub.
- Plays on the first visit only (remembered on the device). After that, `/labs` opens straight on the hub.
- Reduced motion: no video, the hub opens directly.
- Performance and safety: the hub renders first and stays usable underneath; the video loads only when needed (`preload="none"` until the start screen shows); if the video fails to load, the hub appears at once.
- Files live in `public/intro/` and are served at `/labs/intro/...`.

**Labs home (game hub)**

The first page of Xplore Labs, at `/labs`, works like game portals such as Friv or Y8: a grid of rectangle game cards, one per game.

- Background of the website pages: a calm, living starfield in the deep blue of the Xplore Labs logo (drifting stars, soft nebula glows, a rare shooting star), like a dimmed view of the title screen's galaxy. It pauses when hidden and stays still with reduced motion.
- A navbar on every website page (hub, game details, mission map): Xplore Labs logo, Games and Missions links, language switch, and the player (avatar, name, level and XP bar from the server points) with a menu for the settings and "Back to Xplore". On phones the links and settings move into a side drawer.
- Each card: the game's capsule art (`public/games/<game>/cover/`), game name, subject tag (Linux, SQL, Git...), status badge (Play now, Coming soon). Games without capsule art yet show a simple icon.
- Hover or focus: a short looping preview (a tiny terminal typing commands for Linux) appears over the capsule art.
- Click: opens the game details page.

**Game details page** (`/labs/games/<game>`)

- The capsule art, next to: subject tag, title, 1 to 2 sentences, facts (number of missions, guide, runs in the browser), the player's progress, and a **Play now** button ("Continue" once started) that opens the game's title screen. Coming-soon games show a disabled button.
- A **More info** button opens a longer description written in Markdown (story, what you learn, how to play, points, good to know), one file per language: `src/games/<game>/content/about.<lang>.md`. `npm run content` checks these files (headings, no raw HTML).
- A link to the mission map when the game has one.
- A last card "Your game here" invites students to propose and build new games.
- Cards come from a list file (`src/shared/games.ts`), so adding a game to the hub is 1 entry.

**Game title screen (Linux game)**

Opened by "Play now" on the game details page, like a console game start screen.

- The game's capsule art fills the screen: it already shows the logo and the mascot. It moves a little: a slow zoom, a small parallax with the mouse, and twinkling stars on top. On phones the whole art shows at the top over a blurred copy of itself.
- Below the logo: "Press Enter to start", then a menu: Continue, New game, Missions, Settings (sound, meme sounds, language, reduced motion), Quit (back to the game details page).
- Title music (coming): starts with "Press Enter", fades out as soon as the player leaves the title screen; its own "Music" switch in Settings, on by default.
- Performance: one optimized image and CSS animations; everything pauses when a mission loads; reduced motion shows the still art.
- Later, a layered version of the art (sky, nebula, planets, logo, animated mascot) can replace the flat image with the same layout.

**Other pages**

- Mission map: a world of floating islands, one per zone, each showing its Linux ideas (home folder, hidden files, search, pipes, permissions, a log investigation). The islands float gently; a glowing route links the levels in order (lit where the player has been, dotted ahead), and zones without missions yet say "Soon". Each level is a node on its island: done (green, 1 to 3 stars: 3 without hints, 2 with one, else 1), open (pulsing, with Pixel standing on the next one) or locked (padlock). The last level of a zone is a bigger node. On phones the islands form a vertical zigzag.
- Mission panel: clicking a node opens a side panel (from the bottom on phones) with two tabs. **Mission**: the goal, stars, best score, hints used and Play or Replay. **Recap**, locked with a padlock until the mission is done: "What you learned" (each command the mission teaches, what it does, an example, and the key idea) and "Your solution" (the commands the player typed in their shortest winning run).
- Profile panel: skill stickers, best scores, unlocked sounds.
- Admin page (v2): weekly case, meme approval, simple stats.

**Visual style**

Two styles, kept apart (full guide for designers: [`design/ui-guide.md`](design/ui-guide.md)):

- **Game screens** (title screen, game screen): own design tokens (colors, fonts, spacing) as CSS variables, CSS modules and [augmented-ui](https://augmented-ui.com) (pure CSS, sci-fi clipped corners). No component library.
- **Website pages** (hub, game details, mission map): Tailwind CSS v4 + shadcn/ui, with a few [8bitcn](https://www.8bitcn.com) pixel components as accents, on a living starfield in the logo's deep navy. Tailwind's reset never leaks into the game screens.
- Each zone has its own accent color: wake-up room blue `#7AA2F7`, archive green `#9ECE6A`, search hall gold `#E0AF68`, pipe factory violet `#BB9AF7`, guarded vault red `#F7768E`, detective cases cyan `#7DCFFF`.
- Terminal colors inspired by Tokyo Night.
- Fonts: JetBrains Mono for the terminal and text, Pixelify Sans for titles and buttons (placeholder until the club picks a title font), both self-hosted.
- Pixel-art cursors for the whole app (arrow, hand in Pixel's sleeve, padlock, hourglass), with a "Classic cursor" setting.
- Original art only: capsule art, Pixel's faces and the six mission-map islands are AI-generated for the club; placeholder sounds and stickers are synthesized or drawn by the team.
- Optional CRT effect (scanlines, glow) as a setting, off by default. A reduced-motion setting turns off shakes and heavy animations.

**What happens while typing**

| Event | Feedback |
| --- | --- |
| Typing a known command | Command word turns green before Enter |
| Typing an unknown command | Command word turns red |
| Tab | Completes file and folder names |
| cd | Penguin slides to the folder on the map |
| mkdir, touch | New node pops in on the map |
| rm | Node breaks into pixels and disappears |
| Pipe chain of 3 or more | Combo counter and combo sound |
| Error | Small screen shake and bonk sound |
| Goal reached | Confetti, ding, victory dance |

## 9. v1 mission list

v1 has 10 missions across 5 zones plus 1 bonus detective case. Each mission takes 5 to 15 min. The story texts are first drafts the team can rewrite. Detailed designs of missions 6 to 11 are in [`HANDOFF.md`](HANDOFF.md).

| # | Zone | Mission (id) | Goal | Main commands | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Wake-up room | Hello, world? (`wake-up-hello-world`) | Find where you are and read the welcome note | pwd, ls, cat | done |
| 2 | Wake-up room | The first door (`wake-up-first-door`) | Move into the right folder and read the key | cd, cd .., ls | done |
| 3 | Archive | The hidden scroll (`archive-hidden-scroll`) | Find a hidden file that holds the password | ls -a, cat | done |
| 4 | Archive | Moving day (`archive-moving-day`) | Tidy the intern's desk by following `TODO.txt` | mkdir, mv, cp, touch | done |
| 5 | Archive | Clean up, carefully (`archive-clean-up`) | Delete only the empty copies, keep the real grades | rm, ls -l | done |
| 6 | Search hall | Needle in the logs | Find the line with the password in a big log file | grep, head, tail | to do |
| 7 | Search hall | Lost file | Find a file by name somewhere deep in the tree | find | to do |
| 8 | Pipe factory | Count the intruders | Count unique IP addresses in a log | cat, sort, uniq, wc, pipes | to do |
| 9 | Pipe factory | Save the evidence | Write filtered results to a file | >, >>, grep | to do |
| 10 | Guarded vault | Let me in | Read a protected file by changing its permissions | whoami, ls -l, chmod | to do |
| Bonus | Detective | Who ate the last msemen? | Use the club logs to name the culprit (le Président is a suspect) | grep, sort, uniq, pipes | to do |

**Rewards (proposal)**

| Action | Xplore points |
| --- | --- |
| Mission done | 10 |
| Mission done without hints | +5 |
| Zone done | 20 + skill sticker |
| Weekly case done | 15 |

[TO FILL: confirm point values with the Xplore admins so they fit the existing point system]

## 10. Command engine requirements

The command engine is a simulated Linux shell written in TypeScript. It runs fully in the browser on a virtual file system, so nothing can harm a real machine. Its output must look like real Linux so the skills transfer.

**Parts**

1. Virtual file system: a tree of folders and files in memory, with name, content, owner, group, permissions, hidden flag and size. Loaded from the mission file at start.
2. Parser: splits input into commands, arguments, flags, quotes, pipes (`|`) and redirections (`>`, `>>`).
3. Interpreter: runs each command on the file system, passes output through pipes and writes redirections.
4. Event bus: every command sends an event (command, arguments, result, error type) that the map, the penguin, sounds, memes and the goal checker listen to.
5. Goal checker: after each command, checks if the mission goal is met.

**Commands for v1**

| Group | Commands |
| --- | --- |
| Navigation | pwd, ls (-l, -a, -la), cd (., .., ~, absolute and relative paths), clear |
| Reading | cat, head (-n), tail (-n), wc (-l, -w, -c), echo |
| Files | mkdir (-p), touch, cp, mv, rm (-r, -f, -rf) |
| Search | grep (-i, -n, -v, -r, -c), find (-name, -type) |
| Text | sort (-r, -n), uniq (-c) |
| Permissions | whoami, chmod (numeric and symbolic), ls -l output |
| Help | help, man (short custom pages), history |
| Fun | sl, sudo (always refused with a joke), vim and vi (fake trap), exit |

**Rules**

- Error messages copy real Linux wording, for example `No such file or directory` and `Permission denied`.
- A command not in the list returns `command not found` + a funny line + a tip to use help.
- Each command is its own module with a small interface (name, run function, help text), so adding a command does not touch the others.
- The engine has no link to the UI or to Xplore. It only emits events. This keeps it testable and reusable for other games.
- Unit tests for the parser and each command are required before v1 ships.

## 11. Mission content format

Missions, dialogues, reactions and meme packs are data files, not code. A student can add a mission by writing one file and opening a pull request, without knowing the engine.

Each mission file holds: id, zone, title, story text, dialogue lines with expressions, the starting file system, the goal, hints, reactions specific to the mission, and rewards.

Example of a mission file (format proposal, YAML):

```yaml
id: archive-hidden-scroll
zone: archive
order: 3
title: The hidden scroll
guide: penguin
briefing:
  - { mood: neutral, text: "The intern hid the next password. Classic intern." }
  - { mood: thinking, text: "It is somewhere in /home/intern, but you will not see it with a normal ls." }
filesystem:
  /home/intern:
    notes.txt: "Nothing here. Or is there?"
    .secret_scroll: "{{password}}"
start_dir: /home/intern
goal:
  type: password
  value: "{{password}}"   # generated per player
hints:
  - "Some files start with a dot..."
  - "Try ls with an option that shows all files."
  - "Type: ls -a"
reactions:
  - { on: "rm .secret_scroll", mood: shocked, text: "You deleted the evidence! Let me put it back..." }
rewards: { points: 10, no_hint_bonus: 5 }
concept: "Files starting with a dot are hidden. ls -a shows them."
```

**Goal types for v1:** `password` (player submits a value), `file_exists`, `file_absent`, `file_content` (equals or contains), `cwd` (current folder), `permission` (octal mode), `command_used` (a command or a pipe of a given length was used), and `all` (several goals at once).

**Fields added during the build** (the real schema is `src/games/linux/content/schema.ts`): `objective` (the goal in one line), `victory` (lines after success), `solution` (commands that solve the mission, played at build time and shown when the player gives up), and `recap` (each command taught, what it does, an example) for the mission map. Text is `{ en, fr }`.

**Global content files:** reactions to classic mistakes, unknown-command lines, meme packs (`memes.yaml` + assets), man pages.

All player-facing text lives in content files so the game can be translated. The game is in **French and English** (English is the fallback).

## 12. Architecture, integration and player progress

The game is a separate Next.js app in its own repo, served under the Xplore domain with Next.js [Multi-Zones](https://nextjs.org/docs/app/guides/multi-zones). Xplore stays light and unchanged; the only shared part is the NestJS backend, which gets a new `labs` module.

```text
                 Player browser on the Xplore domain
                 (one login cookie or token for both apps)
                      |                          |
           all other pages              /labs/* (Multi-Zones rewrite)
                      v                          v
        +------------------------+   +---------------------------+   +-------------+
        | Xplore app (Next.js)   |   | Labs game app (Next.js)   |-->| Mock mode   |
        | existing, unchanged    |   | engine, UI, bridge        |   | localStorage|
        | + link + /labs rewrite |   | own repo, style, deploy   |   | (dev only)  |
        +------------------------+   +---------------------------+   +-------------+
                      |                          | API calls with the login token
                      v                          v
        +-----------------------------------------------------------------+
        | Xplore NestJS backend                                           |
        |  existing modules: auth, users, points, stickers                |
        |  NEW labs module: progress, submissions, rewards, rate limits   |
        +-----------------------------------------------------------------+
                                     |
                                     v
                     Xplore database [TO FILL] + new labs tables
```

The player sees one site. The team develops, tests and deploys the game on its own, then connects it with a rewrite rule and the real bridge.

**How the two apps connect**

- Routing: the game app uses `basePath: '/labs'`. Xplore's `next.config` rewrites `/labs/*` to the game app. [TO FILL: path `/labs` or a subdomain like `labs.<domain>`, and the domain]
- Login: the game reuses the session issued by NestJS. On the same domain the cookie is shared automatically; with a subdomain the cookie must be set for the parent domain and NestJS must allow CORS. [TO FILL: cookie or token, its name, how it is verified]
- Navigation: the Xplore sidebar gets a "Teaching games" link to `/labs`; the game top bar links back to Xplore. Switching apps is a normal page load.
- Hosting: [TO FILL: where Xplore and NestJS are hosted (Vercel, VPS, Docker...) and how a second Next.js app is deployed next to them]

**Bridge interface**

The game code only talks to the bridge. Two implementations exist: the mock bridge (localStorage, used now) and the API bridge (calls NestJS, used at integration). Switching is one environment variable: `NEXT_PUBLIC_LABS_BRIDGE=mock|api`.

| Bridge function | Purpose | Proposed NestJS endpoint |
| --- | --- | --- |
| getCurrentPlayer() | Id, name, promotion, avatar, points | `GET /labs/me` (wraps the existing user service) [TO FILL: existing user endpoint] |
| getProgress(game) | Done missions, scores, current mission, unlocks | `GET /labs/progress/:game` |
| startMission(missionId) | Gets the player's personal values (passwords) for the mission | `POST /labs/missions/:id/start` |
| saveCheckpoint(missionId, state) | Saves an in-progress mission | `PUT /labs/missions/:id/checkpoint` |
| submitMission(missionId, answer, stats) | Checks the answer, saves the result, gives points and stickers | `POST /labs/missions/:id/submit` |
| getSettings() / saveSettings() | Mute, meme sounds, reduced motion, language, maximized | `GET` and `PUT /labs/settings` |

Points and stickers are given only by the server inside `submit`, by calling the existing points and stickers services. [TO FILL: names of the existing points and stickers services or endpoints]

**Saving player progress**

- Every player has their own progress, saved on the server and linked to their Xplore account, so they can continue on any device.
- Mission completed: saved on the server through `submit` (status, score, hints used, time, best command length).
- Mission in progress: the virtual file system and position are saved in localStorage after each command, and sent to the server as a checkpoint when the player leaves the page or every 2 min. A refresh never loses work.
- If a save fails (bad network), it is queued in localStorage and retried; the UI shows a small "saving..." / "saved" indicator.
- In mock mode, all of this is stored in localStorage only, with the same data shape as the server.
- Personal passwords: the server computes them as `HMAC(secret, userId + missionId)`, sends them in `start`, and checks them again in `submit`. In mock mode the game uses a fixed local secret.

**Data model** (new tables in the Xplore database; names and types to adapt to the existing ORM [TO FILL: Prisma, TypeORM or other])

| Table | Main columns | Notes |
| --- | --- | --- |
| labs_progress | user_id, game, current_mission_id, missions_done, total_points, updated_at | 1 row per player and game; unique (user_id, game) |
| labs_mission_result | user_id, mission_id, game, status, best_score, hints_used, attempts, best_time_s, shortest_cmd_len, first_completed_at | Unique (user_id, mission_id); points given only the first time |
| labs_checkpoint | user_id, mission_id, state_json, updated_at | Latest in-progress state; deleted when the mission is done |
| labs_submission | id, user_id, mission_id, success, created_at | Used for rate limits and stats; old rows can be cleaned up |
| labs_unlock | user_id, item_type (sticker, sound, meme), item_id, unlocked_at | Unlockable rewards |
| labs_settings | user_id, muted, meme_sounds, reduced_motion, language, maximized | Can move to existing user settings if they exist |
| labs_weekly_case, labs_meme | (v2) | Weekly cases and approved memes |

Missions themselves are not stored in the database: they are content files in the game repo, identified by a stable `mission_id`.

## 13. Tech stack

No game engine. The game is a Next.js app like Xplore, with a few focused libraries, and the backend part is a NestJS module inside the existing Xplore backend.

**Game app (new repo)**

| Part | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.4 (App Router, Cache Components) + React 19 | Same family as Xplore, supports Multi-Zones and `basePath` [TO FILL: Xplore's Next.js version, to match it] |
| Language | TypeScript (strict) | Many rules in the command engine |
| Rendering | Game pages as client components; static pages prerendered | The game runs in the browser, the server stays light |
| Game styling | CSS modules + CSS variables (own tokens) + augmented-ui | Unique game look, no conflict with Xplore |
| Website styling | Tailwind CSS v4 + shadcn/ui (+ 8bitcn accents), reset scoped to `.site` | Fast, consistent website pages |
| State | Zustand | Small, simple store for game state |
| Terminal UI | xterm.js | Real terminal look, history, colors |
| Shell simulation | Own TypeScript engine (section 10) | Safe, free, full control over reactions |
| Live map | d3-hierarchy (tree layout) + SVG | Animated folder tree |
| Character art | One WebP face per mood (Rive later) | Light, no runtime; Rive can replace it with the same moods |
| Backgrounds | Canvas 2D starfield; capsule art with CSS motion on the title screen | Living backgrounds without video |
| Effects | canvas-confetti, Web Animations API | Victory effects, shakes, transitions (GSAP was not needed) |
| Sound | Howler.js | Sound effects, blips, memes, music, mute |
| Content | YAML (js-yaml) validated with Zod at build time | Students add missions; bad files fail the build, not the game |
| Markdown | react-markdown + remark-gfm | "More info" pages of each game |
| Unit tests | Vitest | Engine, parser, commands, goal checker |
| End-to-end tests | Playwright | Play missions 1 to 3 automatically |
| Code quality | ESLint + Prettier | Same style for all contributors |
| Package manager | npm | |
| Preview hosting | Vercel (<https://xplore-labs.vercel.app/labs>) | Free previews of every pull request |

**Backend (existing Xplore repo, at integration)**

| Part | Choice | Why |
| --- | --- | --- |
| Framework | NestJS, new `labs` module | Reuses auth, users, points, stickers |
| Validation | class-validator DTOs | Standard in NestJS |
| Rate limiting | @nestjs/throttler | Stops brute force on submissions |
| Database and ORM | [TO FILL: database and ORM used by Xplore] | New labs tables (section 12) |
| Cache | Redis, only if needed (later) | Leaderboards and heavy reads |

**Later versions:** SQL mode with sql.js or PGlite in the browser (v3), real Linux in the browser with v86 or WebVM (v3), a 2D world with Phaser, PixiJS or a Godot web export (later).

**Not used:** Unity, Unreal, Coherent Gameface (made for native game engines, not browser apps), Godot for the core game (weak text input on mobile web), heavy UI component libraries, real Linux servers with containers.

## 14. Anti-cheat, security and many players

The design already scales well: the whole shell runs in each player's browser, so the server only receives a few small requests per mission. Points are always decided by the server, never by the browser.

**Anti-cheat and fairness**

- Passwords are personal: `HMAC(secret, userId + missionId)`, checked again by the server in `submit`. Sharing a password does not work for someone else.
- A mission gives points only once per player.
- Leaderboards never rank by speed alone: personal records, shortest commands and class goals instead.
- The funny fails wall is anonymous.
- Hints cost bonus points but never block progress.

**Security**

- Every labs endpoint requires the Xplore login and uses the user id from the verified token, never from the request body.
- Inputs validated with DTOs; checkpoint state limited in size (for example 200 KB).
- Rate limits with @nestjs/throttler: for example 10 submissions per min per player and mission.
- The HMAC secret lives only in NestJS environment variables.
- No user-written code runs on the server; the shell is fully client-side.

**Handling many players**

| Part | Why it holds | What to do if it grows |
| --- | --- | --- |
| Command engine | Runs in each browser, costs the server nothing | Nothing |
| Game files (JS, sounds, Rive, images) | Static files cached by the browser and a CDN | Compress sounds, lazy-load zones |
| API calls | About 3 to 5 small calls per mission | Add NestJS instances behind a load balancer (stateless API) |
| Database | Small rows, indexed on (user_id, mission_id) | Clean old submissions; read replica if needed |
| Leaderboards | Computed every few minutes, not on each request | Cache in Redis |
| Club event peaks | Everyone starts at once | Load test before events |

**To discuss later:** expected players at peak, load testing with k6 before a big event, monitoring and error tracking (for example Sentry), and backups of the labs tables. [TO FILL: expected players at a club event]

## 15. Roadmap and milestones

v1 is the only committed scope. Each later phase starts only when the gate before it is passed. Dates will be added once the team size and hours per week are known.

**Status of v1, Phase A (2026-10-30)** — build steps from [`ARCHITECTURE.md`](ARCHITECTURE.md) section 5:

| Step | Content | Status |
| --- | --- | --- |
| 0–2 | Project setup, command engine, bridge + progress store | done |
| 3–5 | Content loader, missions 1–3, game screen, fun layer (reactions, memes, sounds, effects) | done |
| 6–7 | Title screen, intro video, hub, game details page, mission map with recaps, footer, cursors | done |
| 8 | Missions 4 to 10 + bonus case | in progress: missions 4–5 done, 6 to 10 and the bonus case to do |
| 9 | Playwright e2e, README, CONTRIBUTING | to do |
| UI | Dialogue box redesign | done |

Every remaining task is specified in [`HANDOFF.md`](HANDOFF.md). Phase B (NestJS `labs` module, api bridge, `/labs` rewrite in Xplore) starts after v1 Phase A.

| Phase | Content | Gate to the next phase |
| --- | --- | --- |
| v1 Core game | Command engine, mock bridge, mission loader, 10 missions + bonus case; game screen with terminal, live map, penguin dialogue, sounds, memes; title screen, intro video and Labs hub; progress saving, NestJS labs module, `/labs` on the Xplore domain | Launched at a club event, feedback collected |
| v2 Community | Detective cases, Case of the week on the Xplore home page, meme packs, meme of the week, fails wall, short-command challenge, admin page | 30% of players finish v1, students start adding content |
| v3 New subjects | SQL game with the dolphin guide, Rescue the server mode, graduation mission in real Linux in the browser | SQL game stable, team picks the next subject |
| Later | Co-op permission heist, walking 2D world, Git and networking games, teacher stats page | — |

## 16. Risks

The biggest risk is not the code: it is writing enough good missions and keeping the game alive after the first team graduates.

| Risk | Level | Fallback |
| --- | --- | --- |
| Mission writing takes longer than coding | High | Data-driven missions, mission template, ask club members to contribute |
| Team leaves after graduation | High | Clear README, contribution guide, each promotion owns a meme pack and new cases |
| Simulated shell feels fake | Medium | Copy real output and errors, graduation mission in real Linux (v3) |
| Students share answers | Medium | Per-player passwords, server-side checks |
| Humor gets old or offensive | Medium | Random rare reactions, meme approval, new packs each year |
| Integration with Xplore is harder than planned | Medium | Bridge interface and mock bridge from day 1 |
| Copyrighted assets | Medium | Original characters, free-licensed or self-recorded sounds |
| Scope creep (co-op, 3D, many games) | Medium | Strict v1 scope in section 2, new ideas go to a backlog |
| Performance on low-end laptops | Low | Light animations, galaxy paused when not visible, CRT off by default, reduced motion |

## 17. Information to fill

Nothing blocks the start: the game app can be built today in mock mode.

**Known**

- Xplore frontend: Next.js.
- Xplore backend: NestJS.
- Decision: the game is a separate Next.js app on the Xplore domain (section 12).
- Team: Ali + 1 teammate during development; the Xplore developer joins at integration.
- Repo: private `Ali-Dev06/Xplore-Labs` on GitHub; previews on Vercel.

**To start development (quick decisions)**

- [ ] Final name of the Linux game (working title: Root Escape) (section 1)
- [x] Repo name and owner: `Ali-Dev06/Xplore-Labs` (private)
- [x] Package manager: npm; Next.js 16.4 (match Xplore's version at integration if needed) (section 13)
- [x] Game language: French and English, English fallback (section 11)
- [x] Humor tone: Moroccan student humor, Darija and local references, with dev jokes (section 7)
- [x] Penguin name: Pixel (section 6)
- [ ] Le Président agrees to be a running joke (section 6)

**For integration (ask the Xplore developer)**

- [ ] How login works: cookie or token, its name, how NestJS verifies it (section 12)
- [ ] Existing endpoint or service for the current user (section 12)
- [ ] Existing services or endpoints for points and stickers (section 12)
- [ ] Database and ORM used by NestJS (sections 12, 13)
- [ ] OK to add a `labs` module and new tables to the NestJS backend
- [ ] Domain, and path `/labs` or subdomain (section 12)
- [ ] Hosting of Xplore and NestJS, and how to deploy a second Next.js app next to it (section 12)
- [ ] Point values that fit the Xplore point system (section 9)
- [ ] Where user settings like mute are stored, if anywhere (section 7)

**Nice to know**

- [x] Who designs the characters: AI-generated art made for the club (section 6)
- [ ] Who records sounds and makes original meme stickers (placeholders today)
- [ ] Title music file and its licence (section 8)
- [ ] Game title font (section 8; Pixelify Sans is the placeholder)
- [ ] Landing page at `/labs` (it redirects to the hub `/labs/games` until it exists)
- [ ] Hours per week, to date the roadmap (section 15)
- [ ] Expected players at a club event (section 14)
- [ ] Who approves memes and weekly cases

## 18. Instructions for Claude Code

Development happens in 2 phases with 2 prompts. Phase A builds the whole game in a new repo with the mock bridge. Phase B, later, adds the NestJS `labs` module in the Xplore backend and connects the two.

> **Phase A is under way** (setup and steps 0 to 7 are done). To continue it, do not paste Prompt A again: follow [`HANDOFF.md`](HANDOFF.md). Prompt A and the structure below are kept as the original plan; the real structure is in [`ARCHITECTURE.md`](ARCHITECTURE.md) sections 2 and 7 (for example, website pages live in `app/(site)`, the hub is `/labs/games`).

**Setup**

1. Save this file as `docs/PRD.md` in a new private repo (for example `xplore-labs`).
2. Fill the "To start" items of section 17, or let Claude Code use the defaults: npm, French + English, working title Root Escape, placeholder penguin name.
3. Install the design skills in the repo (read any community SKILL.md before installing it):
   - `npx skills add anthropics/skills --skill frontend-design`
   - `npx skills add anthropics/skills --skill algorithmic-art`
   - `npx -y skills add lottiefiles/motion-design-skill --skill motion-design --agent claude-code`
4. Open Claude Code in the repo and paste Prompt A.

**Prompt A: build the game app (now)**

```markdown
Read docs/PRD.md fully. We are building Xplore Labs, a hub of teaching games,
starting with a Linux learning game (working title Root Escape). It is a
standalone Next.js app that will later be served at /labs on the Xplore domain
(Next.js Multi-Zones). Xplore itself is Next.js + NestJS; we do not touch it
in this phase.

Before writing code:
1. Propose the project structure (PRD 18), main types (virtual file system,
   command, mission, events, bridge, progress, game registry, meme events)
   and the build order.
2. Create a CLAUDE.md with the project rules below.
3. Wait for my approval.

Project rules:
- Next.js App Router, TypeScript strict, basePath '/labs'.
- One folder per game in src/games/<game>, shared code in src/shared,
  assets in public/games/<game>/ (memes, sounds, characters, cover).
- Game screens are client components; the engine has zero UI or network code.
- All game code talks to Xplore only through the bridge interface (PRD 12).
- NEXT_PUBLIC_LABS_BRIDGE=mock uses localStorage, same data shape as the
  future API. The api bridge is a stub for now.
- Player progress: autosave in-progress state after each command, save results
  on mission completion, retry failed saves, show a saved indicator (PRD 12).
- Mission content in YAML, validated with Zod at build time (PRD 11).
- Meme reactions come from public/games/linux/memes/memes.yaml (PRD 7).
- Own design tokens as CSS variables, CSS modules, augmented-ui. No heavy UI kit.
  Use the installed design skills for the title screen, hub and animations.
- No copyrighted assets. Use placeholders for character art, memes and sounds.
- Vitest for the engine, Playwright for missions 1 to 3.

Build order, one step at a time, tests passing before the next:
1. Command engine: virtual FS, parser (quotes, pipes, > and >>), interpreter,
   v1 commands (PRD 10), event bus, goal checker. Unit tests.
2. Bridge interface, mock bridge, progress store with autosave and retry.
3. Mission loader + Zod schema, missions 1 to 3, personal passwords
   (mock secret).
4. Game screen: top bar, xterm.js terminal, D3 live map, dialogue box with
   typewriter and expressions (placeholder art), maximize and restore (PRD 8).
5. Reactions to classic mistakes, meme reactions from memes.yaml, sounds with
   Howler, global mute and meme sounds toggle, victory effects, reduced motion.
6. Linux title screen with animated galaxy, logo and menu (PRD 8).
7. Intro video before the hub (start screen, skip, first visit only,
   replay link, PRD 8), Labs home hub with game cards, hover previews and
   intro panel (PRD 8), and the mission map page.
8. Missions 4 to 10 and the bonus case.
9. Playwright tests, README and CONTRIBUTING (how to add a mission, a meme,
   or a new game).
```

**Prompt B: connect to Xplore (later, in the Xplore backend repo)**

```markdown
Read docs/PRD.md sections 12 and 14 from the xplore-labs repo.
Add a NestJS module named labs to this backend.

Before writing code, explore this repo and tell me: how auth works, the
current user service, the points and stickers services, the ORM and the
migration process. Then propose the plan and wait for approval.

Build: the labs tables (PRD 12 data model) with migrations; the endpoints
in PRD 12 with DTO validation and the existing auth guard; personal
passwords with HMAC (secret from env); points and stickers given only in
submit and only once per mission; @nestjs/throttler on submit; unit and
e2e tests. Then write the api bridge in xplore-labs and the /labs rewrite
in the Xplore next.config.
```

**Project structure**

```text
xplore-labs/
  docs/PRD.md
  CLAUDE.md
  app/                           Next.js routes (basePath /labs)
    page.tsx                     Labs home: game hub with cards
    linux/page.tsx               Linux title screen (galaxy, logo, menu)
    linux/missions/page.tsx      mission map
    linux/[missionId]/page.tsx   game screen
    sql/ ...                     later games, same pattern
  src/
    shared/
      bridge/                    types.ts, mock-bridge.ts, api-bridge.ts
      progress/                  progress store, autosave, retry queue
      sound/                     Howler wrapper, mute, meme sounds toggle
      memes/                     memes.yaml loader, meme reaction player
      ui/                        top bar, maximize/restore, dialogue box, overlays
      theme/                     shared tokens
      games.ts                   game registry for the hub cards
    games/
      linux/
        engine/                  vfs, parser, commands/, interpreter, events, goals
        content/                 missions/*.yaml, reactions, man-pages
        ui/                      terminal, live map, title screen, galaxy
        theme/                   zone colors
      sql/                       (later)
      git/                       (later)
  public/
    intro/                       Labs intro video (sound + silent) and poster
    games/
      linux/
        memes/                   stickers + memes.yaml
        sounds/                  effects, meme sounds, music
        characters/              penguin (Rive files)
        cover/                   hub card thumbnail and preview
  tests/                         vitest unit tests, playwright e2e
```

**Environment variables**

| Name | App | Example |
| --- | --- | --- |
| NEXT_PUBLIC_LABS_BRIDGE | game | `mock` now, `api` at integration |
| NEXT_PUBLIC_LABS_API_URL | game | Xplore NestJS URL [TO FILL] |
| GITHUB_TOKEN | game (server only) | read-only token for the footer's "Developed by" list (the repo is private); without it a fallback list shows |
| NEXT_PUBLIC_FEEDBACK_URL | game | link of the "Your feedback" button (hidden when empty) |
| LABS_HMAC_SECRET | NestJS | long random string, never in the frontend |

**Definition of done for v1:** 10 missions + bonus case playable start to end, progress kept after a refresh and on another device (api mode), all tests green, Lighthouse performance score of 90 or more on the game page, and a student who never used Linux can finish zone 1 without help.
