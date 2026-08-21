import React, { useEffect, useRef, useState } from "react";
import "./styles.css";

type Screen = "start" | "mode" | "fighter" | "game" | "winner";
type Mode = "1P" | "2P";
type Fighter = "manyu" | "ninjacat";

type TrailPoint = {
  x: number;
  y: number;
};

const WIN_SCORE = 5;

const BALL_LEFT = 7;
const BALL_RIGHT = 93;

const PADDLE_LEFT = 16;
const PADDLE_RIGHT = 84;

const TRAIL_LENGTH = 6;

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");

  const [mode, setMode] = useState<Mode>("1P");

  const [fighter, setFighter] =
    useState<Fighter>("manyu");

  const [manyuScore, setManyuScore] =
    useState(0);

  const [ninjaScore, setNinjaScore] =
    useState(0);

  const [winner, setWinner] =
    useState<Fighter | null>(null);

  const [trail, setTrail] =
    useState<TrailPoint[]>([]);

  const pitchRef =
    useRef<HTMLDivElement | null>(null);

  const animationRef =
    useRef<number | null>(null);

  const lastTimeRef =
    useRef<number | null>(null);

  const playingRef =
    useRef(false);

  const manyuX = useRef(50);
  const ninjaX = useRef(50);

  const ballX = useRef(50);
  const ballY = useRef(50);

  const ballVX = useRef(28);
  const ballVY = useRef(52);

  const manyuScoreRef = useRef(0);
  const ninjaScoreRef = useRef(0);

  const scoringRef = useRef(false);

  const trailRef =
    useRef<TrailPoint[]>([]);

  const trailTimerRef =
    useRef(0);

  /* ==================================================
     POSITION OBJECTS
  ================================================== */

  function updateObjects() {
    const manyu =
      document.getElementById("manyuPaddle");

    const ninja =
      document.getElementById("ninjaPaddle");

    const ball =
      document.getElementById("pongBall");

    if (manyu) {
      manyu.style.left =
        `${manyuX.current}%`;
    }

    if (ninja) {
      ninja.style.left =
        `${ninjaX.current}%`;
    }

    if (ball) {
      ball.style.left =
        `${ballX.current}%`;

      ball.style.top =
        `${ballY.current}%`;
    }
  }

  /* ==================================================
     TRAIL
  ================================================== */

  function clearTrail() {
    trailRef.current = [];
    trailTimerRef.current = 0;

    setTrail([]);
  }

  function updateTrail(dt: number) {
    trailTimerRef.current += dt;

    if (
      trailTimerRef.current < 0.03
    ) {
      return;
    }

    trailTimerRef.current = 0;

    const next = [
      {
        x: ballX.current,
        y: ballY.current,
      },

      ...trailRef.current,

    ].slice(0, TRAIL_LENGTH);

    trailRef.current = next;

    setTrail(next);
  }

  /* ==================================================
     RESET BALL
  ================================================== */

  function resetBall(
    direction?: "up" | "down"
  ) {
    ballX.current = 50;
    ballY.current = 50;

    ballVX.current =
      (Math.random() > 0.5 ? 1 : -1) *
      (24 + Math.random() * 10);

    if (direction === "up") {
      ballVY.current = -52;
    }

    else if (direction === "down") {
      ballVY.current = 52;
    }

    else {
      ballVY.current =
        Math.random() > 0.5
          ? 52
          : -52;
    }

    scoringRef.current = false;

    clearTrail();
  }

  /* ==================================================
     WINNER
  ================================================== */

  function finishGame(
    who: Fighter
  ) {
    playingRef.current = false;

    clearTrail();

    setWinner(who);

    setScreen("winner");
  }

  /* ==================================================
     SCORE
  ================================================== */

  function scoreManyu() {
    if (scoringRef.current) return;

    scoringRef.current = true;

    const next =
      manyuScoreRef.current + 1;

    manyuScoreRef.current = next;

    setManyuScore(next);

    if (next >= WIN_SCORE) {
      finishGame("manyu");
      return;
    }

    resetBall("down");
  }

  function scoreNinja() {
    if (scoringRef.current) return;

    scoringRef.current = true;

    const next =
      ninjaScoreRef.current + 1;

    ninjaScoreRef.current = next;

    setNinjaScore(next);

    if (next >= WIN_SCORE) {
      finishGame("ninjacat");
      return;
    }

    resetBall("up");
  }

  /* ==================================================
     GAME LOOP
  ================================================== */

  function gameLoop(
    time: number
  ) {
    if (!playingRef.current) {
      return;
    }

    if (
      lastTimeRef.current === null
    ) {
      lastTimeRef.current = time;
    }

    let dt =
      (
        time -
        lastTimeRef.current
      ) / 1000;

    lastTimeRef.current = time;

    dt = Math.min(dt, 0.03);

    /* ==============================
       AI
    ============================== */

    if (mode === "1P") {
      const aiIsManyu =
        fighter === "ninjacat";

      const aiX =
        aiIsManyu
          ? manyuX
          : ninjaX;

      const difference =
        ballX.current -
        aiX.current;

      /*
        Not perfect on purpose.
        Gives player a chance.
      */

      const aiSpeed = 38;

      if (
        Math.abs(difference) > 4
      ) {
        aiX.current +=
          Math.sign(difference) *
          aiSpeed *
          dt;
      }

      aiX.current =
        Math.max(
          PADDLE_LEFT,

          Math.min(
            PADDLE_RIGHT,
            aiX.current
          )
        );
    }

    /* ==============================
       MOVE BALL
    ============================== */

    ballX.current +=
      ballVX.current * dt;

    ballY.current +=
      ballVY.current * dt;

    updateTrail(dt);

    /* ==============================
       SIDE WALLS
    ============================== */

    if (
      ballX.current <= BALL_LEFT
    ) {
      ballX.current = BALL_LEFT;

      ballVX.current =
        Math.abs(ballVX.current);
    }

    if (
      ballX.current >= BALL_RIGHT
    ) {
      ballX.current = BALL_RIGHT;

      ballVX.current =
        -Math.abs(ballVX.current);
    }

    /* ==============================
       PADDLE COLLISIONS
    ============================== */

    const paddleHalfWidth = 14;

    /* MANYU TOP */

    if (
      ballVY.current > 0 &&
      ballY.current >= 84 &&
      ballY.current <= 94 &&
      Math.abs(
        ballX.current -
        ninjaX.current
      ) <= paddleHalfWidth
    ) {
      ballY.current = 94;

      ballVY.current =
        -Math.abs(
          ballVY.current
        ) * 1.02;

      const offset =
        (
          ballX.current -
          manyuX.current
        ) /
        paddleHalfWidth;

      ballVX.current +=
        offset * 8;
    }

    /* NINJACAT BOTTOM */

 if (
      ballVY.current > 0 &&
      ballY.current >= 84 &&
      ballY.current <= 94 &&
      Math.abs(
        ballX.current -
        ninjaX.current
      ) <= paddleHalfWidth
    ) {
      ballY.current = 94;

      ballVY.current =
        -Math.abs(
          ballVY.current
        ) * 1.02;


      const offset =
        (
          ballX.current -
          ninjaX.current
        ) /
        paddleHalfWidth;

      ballVX.current +=
        offset * 8;
    }

    /* ==============================
       GOALS
    ============================== */

    if (
      ballY.current < 4
    ) {
      scoreNinja();
    }

    if (
      ballY.current > 96
    ) {
      scoreManyu();
    }

    updateObjects();

    animationRef.current =
      requestAnimationFrame(
        gameLoop
      );
  }

  /* ==================================================
     START MATCH
  ================================================== */

  function startMatch() {
    manyuScoreRef.current = 0;
    ninjaScoreRef.current = 0;

    setManyuScore(0);
    setNinjaScore(0);

    manyuX.current = 50;
    ninjaX.current = 50;

    setWinner(null);

    lastTimeRef.current = null;

    resetBall();

    setScreen("game");
  }

  /* ==================================================
     MAIN MENU
  ================================================== */

  function mainMenu() {
    playingRef.current = false;

    if (
      animationRef.current !== null
    ) {
      cancelAnimationFrame(
        animationRef.current
      );
    }

    animationRef.current = null;

    lastTimeRef.current = null;

    clearTrail();

    setWinner(null);

    setManyuScore(0);
    setNinjaScore(0);

    manyuScoreRef.current = 0;
    ninjaScoreRef.current = 0;

    manyuX.current = 50;
    ninjaX.current = 50;

    setScreen("start");
  }

  /* ==================================================
     START GAME LOOP
  ================================================== */

  useEffect(() => {
    if (screen !== "game") {
      return;
    }

    playingRef.current = true;

    lastTimeRef.current = null;

    const timer =
      window.setTimeout(() => {

        updateObjects();

        animationRef.current =
          requestAnimationFrame(
            gameLoop
          );

      }, 100);

    return () => {
      window.clearTimeout(timer);

      playingRef.current = false;

      lastTimeRef.current = null;

      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    screen,
    mode,
    fighter
  ]);

  /* ==================================================
     PADDLE CONTROL
  ================================================== */

  function movePaddle(
    clientX: number,
    clientY: number
  ) {
    if (
      !pitchRef.current ||
      screen !== "game"
    ) {
      return;
    }

    const rect =
      pitchRef.current
        .getBoundingClientRect();

    let x =
      (
        (
          clientX -
          rect.left
        ) /
        rect.width
      ) * 100;

    x = Math.max(
      PADDLE_LEFT,

      Math.min(
        PADDLE_RIGHT,
        x
      )
    );

    const y =
      clientY -
      rect.top;

    /* ==============================
       1 PLAYER
    ============================== */

    if (mode === "1P") {

      if (
        fighter === "manyu"
      ) {
        manyuX.current = x;
      }

      else {
        ninjaX.current = x;
      }
    }

    /* ==============================
       2 PLAYER
    ============================== */

    else {

      if (
        y <
        rect.height / 2
      ) {
        manyuX.current = x;
      }

      else {
        ninjaX.current = x;
      }
    }

    updateObjects();
  }

  /* ==================================================
     UI
  ================================================== */

  return (
    <div className="app">

      <div
        ref={pitchRef}
        className="pitch"

        onPointerDown={(e) =>
          movePaddle(
            e.clientX,
            e.clientY
          )
        }

        onPointerMove={(e) => {

          if (
            e.buttons === 1 ||
            e.pointerType === "touch"
          ) {
            movePaddle(
              e.clientX,
              e.clientY
            );
          }

        }}
      >

        {/* BACKGROUND */}

        <img
          className="arena-background"
          src="/background2.png"
          alt=""
          draggable={false}
        />

        {/* =========================================
            START SCREEN
        ========================================= */}

        {screen === "start" && (

          <div className="menu-screen">

            <div className="menu-small">
              CRYPTO PONG
            </div>

            <h1 className="main-title">

              <span className="blue-title">
                MANYU
              </span>

              <span className="vs-title">
                {" "}VS{" "}
              </span>

              <span className="red-title">
                NINJACAT
              </span>

            </h1>

            <div className="start-fighters">

              <img
                src="/manyupaddle.png"
                alt="Manyu"
                draggable={false}
              />

              <img
                src="/catpaddle.png"
                alt="NinjaCat"
                draggable={false}
              />

            </div>

            <button
              className="play-button"

              onClick={() =>
                setScreen("mode")
              }
            >
              PLAY
            </button>

            <div className="first-five">
              FIRST TO 5 WINS
            </div>

          </div>

        )}

        {/* =========================================
            MODE
        ========================================= */}

        {screen === "mode" && (

          <div className="menu-screen">

            <div className="menu-small">
              MANYU VS NINJACAT
            </div>

            <h2>
              CHOOSE MODE
            </h2>

            <button
              className="mode-button one-player"

              onClick={() => {
                setMode("1P");
                setScreen("fighter");
              }}
            >

              1 PLAYER

              <small>
                VS COMPUTER
              </small>

            </button>

            <button
              className="mode-button two-player"

              onClick={() => {
                setMode("2P");
                setScreen("fighter");
              }}
            >

              2 PLAYER

              <small>
                SAME DEVICE
              </small>

            </button>

            <button
              className="back-button"

              onClick={() =>
                setScreen("start")
              }
            >
              BACK
            </button>

          </div>

        )}

        {/* =========================================
            FIGHTER / START BATTLE
        ========================================= */}

        {screen === "fighter" && (

          <div className="menu-screen">

            <h2>
              {mode === "1P"
                ? "CHOOSE YOUR FIGHTER"
                : "READY TO BATTLE?"}
            </h2>

            {mode === "1P" ? (

              <div className="fighter-grid">

                <button
                  className="fighter-card manyu-card"

                  onClick={() => {
                    setFighter("manyu");
                    startMatch();
                  }}
                >

                  <img
                    src="/manyupaddle.png"
                    alt="Manyu"
                    draggable={false}
                  />

                  <strong>
                    MANYU
                  </strong>

                  <span>
                    YOU PLAY TOP
                  </span>

                </button>

                <button
                  className="fighter-card ninja-card"

                  onClick={() => {
                    setFighter("ninjacat");
                    startMatch();
                  }}
                >

                  <img
                    src="/catpaddle.png"
                    alt="NinjaCat"
                    draggable={false}
                  />

                  <strong>
                    NINJACAT
                  </strong>

                  <span>
                    YOU PLAY BOTTOM
                  </span>

                </button>

              </div>

            ) : (

              <div className="two-player-start">

                <div>
                  PLAYER 1
                  <strong>
                    MANYU
                  </strong>
                  TOP HALF
                </div>

                <div>
                  PLAYER 2
                  <strong>
                    NINJACAT
                  </strong>
                  BOTTOM HALF
                </div>

                <button
                  className="play-button"

                  onClick={startMatch}
                >
                  START MATCH
                </button>

              </div>

            )}

            <button
              className="back-button"

              onClick={() =>
                setScreen("mode")
              }
            >
              BACK
            </button>

          </div>

        )}

        {/* =========================================
            GAME
        ========================================= */}

        {screen === "game" && (
          <>

            {/* SCORE */}

            <div className="score-panel">

              <span className="score-name manyu-name">
                MANYU
              </span>

              <div className="score-values">

                <span className="manyu-number">
                  {manyuScore}
                </span>

                <span className="dash">
                  -
                </span>

                <span className="ninja-number">
                  {ninjaScore}
                </span>

              </div>

              <span className="score-name ninja-name">
                NINJACAT
              </span>

            </div>

            {/* MANYU */}

            <img
              id="manyuPaddle"
              className="paddle manyu-paddle"
              src="/manyupaddle.png"
              alt="Manyu"
              draggable={false}
            />

            {/* TRAIL */}

            {trail.map(
              (point, index) => (

                <div
                  key={
                    `${index}-${point.x}-${point.y}`
                  }

                  className={
                    `trail trail-${index}`
                  }

                  style={{
                    left:
                      `${point.x}%`,

                    top:
                      `${point.y}%`,
                  }}
                />

              )
            )}

            {/* BALL */}

            <img
              id="pongBall"
              className="ball"
              src="/ball.png"
              alt="Ball"
              draggable={false}
            />

            {/* NINJACAT */}

            <img
              id="ninjaPaddle"
              className="paddle ninja-paddle"
              src="/catpaddle.png"
              alt="NinjaCat"
              draggable={false}
            />

            <div className="hint">

              {mode === "1P"
                ? "DRAG TO MOVE"
                : "TOP = MANYU • BOTTOM = NINJACAT"}

            </div>

          </>
        )}

        {/* =========================================
            WINNER
        ========================================= */}

        {screen === "winner" &&
          winner && (

          <div className="menu-screen winner-screen">

            <div className="trophy">
              🏆
            </div>

            <h1
              className={
                winner === "manyu"
                  ? "blue-title"
                  : "red-title"
              }
            >

              {winner === "manyu"
                ? "MANYU WINS!"
                : "NINJACAT WINS!"}

            </h1>

            <img
              className="winner-image"

              src={
                winner === "manyu"
                  ? "/manyupaddle.png"
                  : "/catpaddle.png"
              }

              alt="Winner"

              draggable={false}
            />

            <div className="final-score">

              {manyuScore}
              {" - "}
              {ninjaScore}

            </div>

            <button
              className="play-button"

              onClick={startMatch}
            >
              REMATCH
            </button>

            <button
              className="back-button"

              onClick={mainMenu}
            >
              MAIN MENU
            </button>

          </div>

        )}

      </div>
    </div>
  );
}
