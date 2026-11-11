import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH = 900;
const HEIGHT = 300;
const GROUND_Y = 245;
const PLAYER_X = 82;
const PLAYER_W = 42;
const PLAYER_H = 52;

function drawDinosaur(ctx, x, y, legFrame, ducking = false) {
  const bodyH = ducking ? 28 : PLAYER_H;
  const bodyY = ducking ? y + 18 : y;

  // Tail
  ctx.fillRect(x - 12, bodyY + 23, 15, 8);
  ctx.fillRect(x - 18, bodyY + 20, 8, 8);

  // Body and neck
  ctx.fillRect(x + 7, bodyY + 16, 29, bodyH - 16);
  ctx.fillRect(x + 25, bodyY + 3, 12, 23);

  // Head
  ctx.fillRect(x + 23, bodyY, 24, 19);
  ctx.fillRect(x + 36, bodyY + 11, 14, 8);

  // Eye
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 39, bodyY + 5, 4, 4);
  ctx.fillStyle = "#333";
  ctx.fillRect(x + 41, bodyY + 6, 2, 2);

  // Legs alternate while running
  if (legFrame % 2 === 0) {
    ctx.fillRect(x + 11, bodyY + bodyH - 5, 8, 10);
    ctx.fillRect(x + 27, bodyY + bodyH - 5, 8, 5);
  } else {
    ctx.fillRect(x + 11, bodyY + bodyH - 5, 8, 5);
    ctx.fillRect(x + 27, bodyY + bodyH - 5, 8, 10);
  }
}

function drawCactus(ctx, obstacle) {
  const { x, height, width } = obstacle;
  ctx.fillStyle = "#397b45";
  ctx.fillRect(x + width * 0.38, GROUND_Y - height, width * 0.28, height);
  ctx.fillRect(x, GROUND_Y - height * 0.68, width * 0.42, 7);
  ctx.fillRect(x, GROUND_Y - height * 0.68, 7, height * 0.28);
  ctx.fillRect(x + width * 0.62, GROUND_Y - height * 0.48, width * 0.38, 7);
  ctx.fillRect(x + width * 0.86, GROUND_Y - height * 0.48, 7, height * 0.25);
}

function GameCanvas({ status, setStatus, setScore, setHighScore, night }) {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    playerY: GROUND_Y - PLAYER_H,
    velocityY: 0,
    obstacles: [],
    clouds: [{ x: 180, y: 55 }, { x: 510, y: 88 }, { x: 760, y: 45 }],
    speed: 6,
    score: 0,
    frame: 0,
    spawnIn: 80,
    legFrame: 0,
    lastScoreUpdate: 0,
  });
  const statusRef = useRef(status);
  const nightRef = useRef(night);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { nightRef.current = night; }, [night]);

  useEffect(() => {
    const resetGame = () => {
      gameRef.current = {
        playerY: GROUND_Y - PLAYER_H,
        velocityY: 0,
        obstacles: [],
        clouds: [{ x: 180, y: 55 }, { x: 510, y: 88 }, { x: 760, y: 45 }],
        speed: 6,
        score: 0,
        frame: 0,
        spawnIn: 80,
        legFrame: 0,
        lastScoreUpdate: 0,
      };
      statusRef.current = "running";
    };
    window.addEventListener("dino-game-reset", resetGame);
    return () => window.removeEventListener("dino-game-reset", resetGame);
  }, []);

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (statusRef.current === "running" && game.playerY >= GROUND_Y - PLAYER_H - 1) {
      game.velocityY = -15;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    const draw = () => {
      const game = gameRef.current;
      const isNight = nightRef.current;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Sky
      ctx.fillStyle = isNight ? "#202b3b" : "#f7f7f7";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Sun / moon
      ctx.fillStyle = isNight ? "#f5e7a1" : "#f2c94c";
      ctx.beginPath();
      ctx.arc(790, 55, 19, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = isNight ? "#526174" : "#dfe3e6";
      game.clouds.forEach((cloud) => {
        ctx.fillRect(cloud.x, cloud.y, 42, 9);
        ctx.fillRect(cloud.x + 9, cloud.y - 8, 20, 9);
        ctx.fillRect(cloud.x + 25, cloud.y - 4, 18, 8);
      });

      // Ground
      ctx.fillStyle = isNight ? "#aab2bd" : "#777";
      ctx.fillRect(0, GROUND_Y, WIDTH, 2);
      for (let i = 0; i < WIDTH; i += 38) {
        const offset = (game.frame * game.speed * 0.7) % 38;
        ctx.fillRect(i - offset, GROUND_Y + 13, 18, 2);
      }

      // Obstacles
      game.obstacles.forEach((obstacle) => drawCactus(ctx, obstacle));

      // Dinosaur
      ctx.fillStyle = isNight ? "#f0f1f3" : "#535353";
      const playerY = game.playerY;
      drawDinosaur(ctx, PLAYER_X, playerY, game.legFrame);

      // Small ground shadow
      ctx.fillStyle = isNight ? "#526174" : "#dedede";
      ctx.fillRect(PLAYER_X - 5, GROUND_Y + 3, 60, 3);

      // Canvas score
      ctx.fillStyle = isNight ? "#f0f1f3" : "#555";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`SCORE ${Math.floor(game.score).toString().padStart(5, "0")}`, WIDTH - 28, 30);
    };

    const intersects = (a, b) =>
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;

    const loop = () => {
      const game = gameRef.current;
      game.frame += 1;

      if (statusRef.current === "running") {
        // Gravity and jumping
        game.playerY += game.velocityY;
        game.velocityY += 0.72;
        if (game.playerY > GROUND_Y - PLAYER_H) {
          game.playerY = GROUND_Y - PLAYER_H;
          game.velocityY = 0;
        }

        // Move clouds
        game.clouds.forEach((cloud) => {
          cloud.x -= game.speed * 0.18;
          if (cloud.x < -55) {
            cloud.x = WIDTH + 30;
            cloud.y = 35 + Math.random() * 70;
          }
        });

        // Spawn and move obstacles
        game.spawnIn -= 1;
        if (game.spawnIn <= 0) {
          const height = 30 + Math.random() * 22;
          const width = 22 + Math.random() * 12;
          game.obstacles.push({ x: WIDTH + 10, height, width });
          game.spawnIn = 75 + Math.random() * 65 - Math.min(game.speed * 2, 30);
        }

        game.obstacles.forEach((obstacle) => { obstacle.x -= game.speed; });
        game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -5);

        // Collision box (slightly forgiving)
        const playerBox = {
          x: PLAYER_X + 7,
          y: game.playerY + 8,
          width: 34,
          height: PLAYER_H - 9,
        };
        const hit = game.obstacles.some((obstacle) => intersects(playerBox, {
          x: obstacle.x + 2,
          y: GROUND_Y - obstacle.height + 3,
          width: obstacle.width - 4,
          height: obstacle.height - 3,
        }));

        if (hit) {
          statusRef.current = "gameover";
          setStatus("gameover");
          const finalScore = Math.floor(game.score);
          const saved = Number(localStorage.getItem("dino-runner-high-score") || 0);
          if (finalScore > saved) {
            localStorage.setItem("dino-runner-high-score", String(finalScore));
            setHighScore(finalScore);
          }
        } else {
          game.score += game.speed * 0.035;
          game.speed = Math.min(6 + game.score / 180, 13);
          game.legFrame = Math.floor(game.frame / 6);
          if (game.frame - game.lastScoreUpdate > 8) {
            setScore(Math.floor(game.score));
            game.lastScoreUpdate = game.frame;
          }
        }
      }

      draw();
      animationId = requestAnimationFrame(loop);
    };

    draw();
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [setHighScore, setScore, setStatus]);

  const handlePointerDown = () => {
    if (statusRef.current === "running") jump();
  };

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={WIDTH}
      height={HEIGHT}
      onPointerDown={handlePointerDown}
      aria-label="Dinosaur runner game area. Press Space or Arrow Up to jump."
    />
  );
}

export default function App() {
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    Number(localStorage.getItem("dino-runner-high-score") || 0)
  );
  const [night, setNight] = useState(false);

  const startGame = () => {
    // The canvas loop reads this fresh game state on the next frame.
    window.dispatchEvent(new Event("dino-game-reset"));
    setScore(0);
    setStatus("running");
  };

  return (
    <main className={`app ${night ? "night" : ""}`}>
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <div>
            <p className="eyebrow">ARCADE CLASSIC</p>
            <h1>Dino Runner</h1>
          </div>
        </div>
        <button className="theme-button" onClick={() => setNight((value) => !value)}>
          {night ? "☀ Day mode" : "☾ Night mode"}
        </button>
      </div>

      <section className="game-card">
        <div className="game-heading">
          <div>
            <p className="eyebrow">READY, SET, RUN</p>
            <h2>How far can you go?</h2>
          </div>
          <div className="scores">
            <div><span>SCORE</span><strong>{String(score).padStart(5, "0")}</strong></div>
            <div><span>BEST</span><strong>{String(highScore).padStart(5, "0")}</strong></div>
          </div>
        </div>

        <div className="canvas-wrap">
          <GameCanvas
            status={status}
            setStatus={setStatus}
            setScore={setScore}
            setHighScore={setHighScore}
            night={night}
          />
          {status !== "running" && (
            <div className="game-overlay">
              {status === "ready" ? (
                <>
                  <div className="dino-icon">🦖</div>
                  <h3>Your run starts here</h3>
                  <p>Jump over the cacti and keep going!</p>
                  <button className="primary-button" onClick={startGame}>Start game</button>
                </>
              ) : (
                <>
                  <div className="game-over-icon">✦</div>
                  <h3>Game over</h3>
                  <p>You scored <strong>{score}</strong> points. Ready for another run?</p>
                  <button className="primary-button" onClick={startGame}>Play again</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="controls">
          <span><kbd>SPACE</kbd> or <kbd>↑</kbd> to jump</span>
          <span>Tap the game area on mobile</span>
        </div>
      </section>

      <footer>
        <span>Made for fun with React</span>
        <span>Keep running. Beat your best.</span>
      </footer>
    </main>
  );
}
