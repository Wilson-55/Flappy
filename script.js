const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let frames = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem("flappyHighScore") || "0", 10);
let gameStarted = false;
let gameOver = false;

// Bird
const birdImg = new Image();
birdImg.src = "bird.png"; // your bird sprite

const bird = {
  x: 80,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  gravity: 0.25,
  lift: -4.6,
  velocity: 0
};

// 🎩 Hats
const hats = [
  { name: "None", img: null },
  { name: "Cap", img: new Image(), unlockAt: 10 },
  { name: "Crown", img: new Image(), unlockAt: 25 },
  { name: "Wizard", img: new Image(), unlockAt: 50 },
];

// set image sources (make sure you have these PNGs in your folder)
hats[1].img.src = "cap.png";
hats[2].img.src = "crown.png";
hats[3].img.src = "wizard.png";

let selectedHatIndex = parseInt(localStorage.getItem("flappyHatIndex") || "0", 10);
let maxUnlockedHat = 0;

// Pipes
const pipes = [];
const pipeWidth = 52;
const pipeGap = 100;
const pipeSpeed = 2;

// Clouds (optional from your earlier version)
const clouds = [];
const cloudImg = new Image();
cloudImg.src = "cloud.png"; // if you had one

// Input
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !gameOver) {
    bird.velocity = bird.lift;
  }
});

// Start Button
const startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.style.position = "absolute";
startButton.style.top = "50%";
startButton.style.left = "50%";
startButton.style.transform = "translate(-50%, -50%)";
startButton.style.fontSize = "24px";
startButton.style.padding = "12px 24px";
document.body.appendChild(startButton);

// Hat Menu
const hatMenu = document.getElementById("hatMenu");

function buildHatMenu() {
  hatMenu.innerHTML = "";
  hats.forEach((hat, i) => {
    const div = document.createElement("div");
    div.classList.add("hatChoice");
    if (i > maxUnlockedHat) div.classList.add("locked");
    if (i === selectedHatIndex) div.classList.add("selected");

    const img = document.createElement("img");
    img.src = hat.img ? hat.img.src : "bird.png"; // fallback

    div.appendChild(img);
    div.addEventListener("click", () => {
      if (i <= maxUnlockedHat) {
        selectedHatIndex = i;
        localStorage.setItem("flappyHatIndex", i);
        buildHatMenu();
      }
    });

    hatMenu.appendChild(div);
  });
}

startButton.addEventListener("click", () => {
  gameStarted = true;
  startButton.style.display = "none";
  hatMenu.style.display = "block"; // show hats only after start
  resetGame();
  gameLoop();
});

// Reset game
function resetGame() {
  score = 0;
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes.length = 0;
  clouds.length = 0;
  frames = 0;
  gameOver = false;
}

// Draw Bird + Hat
function drawBird() {
  ctx.drawImage(
    birdImg,
    bird.x - bird.width / 2,
    bird.y - bird.height / 2,
    bird.width,
    bird.height
  );

  const hat = hats[selectedHatIndex];
  if (hat && hat.img && (selectedHatIndex <= maxUnlockedHat)) {
    const hatWidth = bird.width * 0.9;
    const hatHeight = bird.height * 0.5;
    ctx.drawImage(
      hat.img,
      bird.x - hatWidth / 2,
      bird.y - bird.height / 2 - hatHeight / 2,
      hatWidth,
      hatHeight
    );
  }
}

// Update hats unlocks
function updateHatUnlocks() {
  maxUnlockedHat = 0;
  hats.forEach((hat, i) => {
    if (hat.unlockAt && score >= hat.unlockAt) {
      maxUnlockedHat = i;
    }
  });
  buildHatMenu();
}

// Main Loop
function gameLoop() {
  update();
  draw();
  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

// Update game state
function update() {
  frames++;
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (frames % 90 === 0) {
    const topHeight = Math.floor(Math.random() * (canvas.height / 2));
    pipes.push({
      x: canvas.width,
      y: topHeight
    });
  }

  pipes.forEach((pipe, i) => {
    pipe.x -= pipeSpeed;
    if (pipe.x + pipeWidth < 0) {
      pipes.splice(i, 1);
    }
    // scoring
    if (pipe.x + pipeWidth === bird.x) {
      score++;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
      }
      updateHatUnlocks();
    }
  });

  // collision
  pipes.forEach((pipe) => {
    if (
      bird.x + bird.width / 2 > pipe.x &&
      bird.x - bird.width / 2 < pipe.x + pipeWidth
    ) {
      if (
        bird.y - bird.height / 2 < pipe.y ||
        bird.y + bird.height / 2 > pipe.y + pipeGap
      ) {
        gameOver = true;
        startButton.style.display = "block";
        hatMenu.style.display = "block";
      }
    }
  });

  if (bird.y + bird.height / 2 >= canvas.height) {
    gameOver = true;
    startButton.style.display = "block";
    hatMenu.style.display = "block";
  }
}

// Draw game
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // pipes
  ctx.fillStyle = "#2c9c35";
  pipes.forEach((pipe) => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y);
    ctx.fillRect(pipe.x, pipe.y + pipeGap, pipeWidth, canvas.height);
  });

  // bird
  drawBird();

  // score
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("High Score: " + highScore, 10, 60);
}

