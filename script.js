(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreElem = document.getElementById('score');
  const highScoreElem = document.getElementById('highScore');

  const gravity = 0.3;
  const jumpPower = -6;
  const pipeWidth = 60;
  const pipeGap = 150;
  const pipeSpeed = 2;

  let bird = {
    x: 80,
    y: canvas.height / 2,
    width: 40,   // adjusted to fit PNG proportions
    height: 40,
    velocity: 0,
  };

  // Load bird image
  const birdImg = new Image();
  birdImg.src = "assets/bird.png"; // make sure this path is correct

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

  // Create initial clouds
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

  // 🟡 Use the PNG bird here
  function drawBird() {
    ctx.drawImage(
      birdImg,
      bird.x - bird.width / 2,
      bird.y - bird.height / 2,
      bird.width,
      bird.height
    );
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
      const bx = bird.x - bird.width / 2;
      const by = bird.y - bird.height / 2;
      const bw = bird.width;
      const bh = bird.height;

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
    scoreElem.textContent = 'Score: 0';
    highScoreElem.textContent = 'High Score: ' + highScore;

    clouds.forEach(cloud => {
      cloud.x = Math.random() * canvas.width;
      cloud.y = Math.random() * (canvas.height / 2);
    });
  }

  function draw() {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    clouds.forEach(drawCloud);
    drawPipes();
    drawBird(); // now draws the PNG
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

  canvas.addEventListener('click', () => {
    if (gameOver) {
      resetGame();
      gameLoop();
    } else {
      bird.velocity = jumpPower;
    }
  });

  scoreElem.textContent = 'Score: 0';
  highScoreElem.textContent = 'High Score: ' + highScore;

  birdImg.onload = () => {
    gameLoop(); // start only after the bird image is loaded
  };
})();
