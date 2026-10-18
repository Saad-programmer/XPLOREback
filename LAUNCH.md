# How to run Xplore Labs on your computer

## 1. Install once

- **Node.js 20 or newer**: https://nodejs.org (take the LTS version)
- **Git**: https://git-scm.com

Check that they work:

```bash
node --version
git --version
```

## 2. Get the project

First time only:

```bash
git clone https://github.com/Ali-Dev06/Xplore-Labs.git
cd Xplore-Labs
npm install
```

Already have it? Get the latest version:

```bash
git checkout main
git pull
npm install
```

## 3. Start the game

```bash
npm run dev
```

Wait for `Ready`, then open: **http://localhost:3000/labs**

> Opening `http://localhost:3000` alone shows a 404. That is normal: the app lives under `/labs`.

Missions you can open directly:

- http://localhost:3000/labs/linux/wake-up-hello-world
- http://localhost:3000/labs/linux/wake-up-first-door
- http://localhost:3000/labs/linux/archive-hidden-scroll

Stop the server with `Ctrl + C` in the terminal.

## 4. Good to know

- **Progress is saved in your browser** (mock mode, no account needed). To start from zero: open the browser DevTools (F12) > Application > Local Storage > `localhost:3000` > clear it. A private window also starts fresh.
- **Sound is off by default.** Turn it on with the speaker button or the gear menu.
- **Test a branch that is not merged yet** (for example a pull request):

  ```bash
  git fetch
  git checkout <branch-name>
  npm install
  npm run dev
  ```

## 5. Run the checks (optional)

```bash
npm test
npm run lint
npm run build
```

## Problems?

| Problem | Fix |
| --- | --- |
| `Port 3000 is in use` | Close the other server, or run `npm run dev -- -p 3001` and use `http://localhost:3001/labs` |
| `Content has N problem(s)` | A mission or meme file has a mistake. The message says which file and which line. |
| Errors after `git pull` | Run `npm install` again |
| Page looks broken after switching branch | Stop the server, delete the `.next` folder, run `npm run dev` again |
