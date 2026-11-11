# Dino Runner

A Chrome-Dino-inspired endless runner built with React, JavaScript, HTML Canvas and CSS.

## Run locally

1. Install [Node.js](https://nodejs.org/) if it is not already installed.
2. Extract this ZIP folder.
3. Open the extracted `dino-runner` folder in VS Code.
4. Open the VS Code terminal in that folder.
5. Run:

   ```bash
   npm install
   npm run dev
   ```

6. Open the local URL printed in the terminal (usually `http://localhost:5173`).

## Controls

- **Space** or **Arrow Up**: jump
- **Tap / click the game area**: jump while playing
- Use the on-screen buttons to start or restart.

## Features

- Endless runner gameplay
- Jumping and obstacle collision
- Score and saved high score
- Increasing difficulty
- Day/night theme toggle
- Responsive layout

## Build for production

```bash
npm run build
npm run preview
```

The production files are generated in the `dist` folder.

## Upload to GitHub

Create an empty GitHub repository, then run these commands in this project folder:

```bash
git init
git add .
git commit -m "Add Dino Runner game"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the URL with your own repository URL.
