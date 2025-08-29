(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreElem = document.getElementById('score');
  const highScoreElem = document.getElementById('highScore');

  // ==== Added: Hat menu elements ====
  const hatMenu = document.getElementById('hatMenu');
  const hatOptionsElem = document.getElementById('hatOptions');
  const startBtn = document.getElementById('startGame');

  // ==== Original constants ====
  const gravity = 0.3;
  const jumpPower = -6;
  const pipeWidth = 60;
  const pipeGap = 150;
  const pipeSpeed = 2;

  let bird = {
    x: 80,
    y: canvas.height / 2,
    width: 60,   // size to draw the bird
    height: 60,
    velocity: 0,
  };

  // 🔹 Load the sprite (original)
  const birdImg = new Image();
  birdImg.src = "7b2efed4-adcf-4d5d-a5ea-d5f432444ae7.png"; 
  // make sure this file is alongside index.html, or adjust the path

  // ==== Added: Hats (use your PNGs) ====
  // Place these PNGs next to index.html and script.js
  //   - cap.png       (your red cap)
  //   - crown.png     (your crown)
  //   - wizard.png    (your wizard hat)
  const hats = [
    { name: "none",   img: null,         unlockScore: 0  },
    { name: "cap",    img: new Image(),  unlockScore: 10 },
    { name: "crown",  img: new Image(),  unlockScore: 25 },
    { name: "wizard", img: new Image(),  unlockScore: 50 },
  ];
  hats[1].img.src = "cap.png";
  hats[2].img.src = "crown.png";
  hats[3].img.src = "wizard.png";

  // Persist selected hat & max unlocked across sessions
  let selectedHatIndex = parseInt(localStorage.getItem("flappyHatIndex") || "0", 10);
  let maxUnlockedHat = parseInt(localStorage.getItem("flappyMaxHat") || "0", 10);

  let pipes = [];
  let clouds = [];
  let frameCount = 0;
  let score = 0;
  let highScore = 0;
  const savedHighScore = localStorage.getItem('flappyHighScore');
  if (savedHighScore !== null) {
    highScore = parseInt(savedHighScore, 10);
  }

  let gameOver = false;
  let gameStarted = false; // ==== Added: start only after hat chosen ====

  // --- Clouds setup (original) ---
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height / 2),
      size: 40 + Math.random() * 30,
      speed: 0.3 + Math.random() * 0.3,
    });
  }

  function createPipe() {
    const topPipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
    pipes.push({
      x: canvas.width,
      top: topPipeHeight,
      bottom: topPipeHeight + pipeGap,
      width: pipeWidth,
      passed: false,
    });
  }

  function drawCloud(cloud) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.15, cloud.size * 0.35, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawPipes() {
    pipes.forEach(pipe => {
      drawPipeRect(pipe.x, 0, pipe.width, pipe.top, true);
      drawPipeRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom, false);
    });
  }

  function drawPipeRect(x, y, width, height, isTop) {
    const radius = 15;

    ctx.fillStyle = '#0f0';
    ctx.strokeStyle = '#070';
    ctx.lineWidth = 3;

    ctx.beginPath();

    if (isTop) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height - radius);
      ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
      ctx.lineTo(x + width - radius, y + height);
      ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
      ctx.lineTo(x + width, y);
      ctx.closePath();
    } else {
      ctx.moveTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.closePath();
    }

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    if (isTop) {
      ctx.fillRect(x + 5, y + 5, width / 2, height / 4);
    } else {
      ctx.fillRect(x + 5, y + height / 2, width / 2, height / 4);
    }
  }

  // 🟡 Draw bird sprite + overlay hat (ADDED)
  function drawBird() {
    // draw the original bird
    ctx.drawImage(
      birdImg,
      bird.x - bird.width / 2,
      bird.y - bird.height / 2,
      bird.width,
      bird.height
    );

    // overlay selected hat
    const hat = hats[selectedHatIndex];
    if (hat && hat.img) {
      const hatWidth  = bird.width * 0.9;  // tweak as needed
      const hatHeight = bird.height * 0.5;
      ctx.drawImage(
        hat.img,
        bird.x - hatWidth / 2,
        bird.y - bird.height / 2 - hatHeight * 0.2, // slight overlap on head
        hatWidth,
        hatHeight
      );
    }
  }

  function updateBird() {
    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (bird.y - bird.height / 2 < 0) {
      bird.y = bird.height / 2;
      if (bird.velocity < 0) bird.velocity = 0;
    }

    if (bird.y + bird.height / 2 > canvas.height) {
      bird.y = canvas.height - bird.height / 2;
      gameOver = true;
    }
  }

  function updatePipes() {
    if (frameCount % 100 === 0) {
      createPipe();
    }

    pipes.forEach(pipe => {
      pipe.x -= pipeSpeed;

      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        score++;
        pipe.passed = true;
        scoreElem.textContent = 'Score: ' + score;

        if (score > highScore) {
          highScore = score;
          highScoreElem.textContent = 'High Score: ' + highScore;
          localStorage.setItem('flappyHighScore', highScore);
        }

        // 🔓 ADDED: unlock hats by score thresholds
        hats.forEach((hat, i) => {
          if (score >= hat.unlockScore && i > maxUnlockedHat) {
            maxUnlockedHat = i;
            localStorage.setItem("flappyMaxHat", String(maxUnlockedHat));
            buildHatMenu(); // refresh menu to show newly unlocked hat(s)
          }
        });
      }
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
  }

  function updateClouds() {
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.size < 0) {
        cloud.x = canvas.width + cloud.size;
        cloud.y = Math.random() * (canvas.height / 2);
      }
    });
  }

  function checkCollision() {
    for (const pipe of pipes) {
      const hitboxShrink = 6; // tweak this value to your liking (e.g., 6–10)

      const bx = bird.x - bird.width / 2 + hitboxShrink;
      const by = bird.y - bird.height / 2 + hitboxShrink;
      const bw = bird.width - hitboxShrink * 2;
      const bh = bird.height - hitboxShrink * 2;

      const tx = pipe.x;
      const ty = 0;
      const tw = pipe.width;
      const th = pipe.top;

      const bxp = pipe.x;
      const byp = pipe.bottom;
      const tbw = pipe.width;
      const tbh = canvas.height - pipe.bottom;

      if (
        bx < tx + tw &&
        bx + bw > tx &&
        by < ty + th &&
        by + bh > ty
      ) {
        gameOver = true;
      }

      if (
        bx < bxp + tbw &&
        bx + bw > bxp &&
        by < byp + tbh &&
        by + bh > byp
      ) {
        gameOver = true;
      }
    }
  }

  function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameOver = false;
    gameStarted = false; // ADDED
    scoreElem.textContent = 'Score: 0';
    highScoreElem.textContent = 'High Score: ' + highScore;

    clouds.forEach(cloud => {
      cloud.x = Math.random() * canvas.width;
      cloud.y = Math.random() * (canvas.height / 2);
    });

    // ADDED: show hat menu again on game over
    hatMenu.style.display = "block";
    buildHatMenu();
  }

  function draw() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    clouds.forEach(drawCloud);
    drawPipes();
    drawBird(); // draws sprite + hat
  }

  function gameLoop() {
    if (!gameOver) {
      frameCount++;
      updateBird();
      updatePipes();
      updateClouds();
      checkCollision();
      draw();
      requestAnimationFrame(gameLoop);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);

      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 55);
      ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 90);
    }
  }

  // ==== Added: Hat Menu builder ====
  function buildHatMenu() {
    hatOptionsElem.innerHTML = "";
    hats.forEach((hat, i) => {
      const div = document.createElement("div");
      div.classList.add("hatChoice");
      if (i > maxUnlockedHat) div.classList.add("locked");
      if (i === selectedHatIndex) div.classList.add("selected");

      const img = document.createElement("img");
      // If "none", show a tiny bird head placeholder using the bird sprite
      if (hat.img) {
        img.src = hat.img.src;
      } else {
        img.src = "7b2efed4-adcf-4d5d-a5ea-d5f432444ae7.png";
      }
      img.width = 48;
      img.height = 48;

      div.appendChild(img);
      div.title = hat.name + (i > 0 ? ` (Unlock: ${hat.unlockScore})` : " (Default)");

      div.addEventListener("click", () => {
        if (i <= maxUnlockedHat) {
          selectedHatIndex = i;
          localStorage.setItem("flappyHatIndex", String(i));
          buildHatMenu();
        }
      });

      hatOptionsElem.appendChild(div);
    });
  }

  // ==== Controls (adapted to respect start state) ====
  canvas.addEventListener('click', () => {
    if (gameOver) {
      resetGame();
      gameLoop();
    } else {
      if (!gameStarted) return; // don’t flap before starting
      bird.velocity = jumpPower;
    }
  });

  // ==== Start button ====
  startBtn.addEventListener("click", () => {
    if (!gameStarted) {
      hatMenu.style.display = "none";
      gameStarted = true;
      gameOver = false;
      // ensure maxUnlockedHat at least matches current highScore at first run
      hats.forEach((hat, i) => {
        if (highScore >= hat.unlockScore && i > maxUnlockedHat) {
          maxUnlockedHat = i;
        }
      });
      localStorage.setItem("flappyMaxHat", String(maxUnlockedHat));
      gameLoop();
    }
  });

  // ==== UI init ====
  scoreElem.textContent = 'Score: 0';
  highScoreElem.textContent = 'High Score: ' + highScore;

  birdImg.onload = () => {
    // Build menu first; game starts when player clicks "Start Game"
    buildHatMenu();
    hatMenu.style.display = "block";
  };
})();

