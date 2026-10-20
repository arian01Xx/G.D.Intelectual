(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const livesElement = document.getElementById("lives");
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMessage = document.getElementById("overlay-message");
    const startButton = document.getElementById("start-button");
    const pauseButton = document.getElementById("pause-button");
    const width = canvas.width;
    const height = canvas.height;
    const paddle = { width: 112, height: 12, x: (width - 112) / 2, y: height - 34, speed: 470 };
    const ball = { x: width / 2, y: paddle.y - 10, radius: 8, vx: 230, vy: -300 };
    const keys = { left: false, right: false };
    const brickConfig = { columns: 10, rows: 5, width: 62, height: 18, gap: 9, top: 52 };
    let bricks = [];
    let score = 0;
    let lives = 3;
    let state = "ready";
    let lastTime = 0;
    let animationFrame;

    function showOverlay(title, message) {
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        overlay.hidden = false;
    }

    function makeBricks() {
        const totalWidth = brickConfig.columns * brickConfig.width + (brickConfig.columns - 1) * brickConfig.gap;
        const left = (width - totalWidth) / 2;
        bricks = [];
        for (let row = 0; row < brickConfig.rows; row++) {
            for (let column = 0; column < brickConfig.columns; column++) {
                bricks.push({ x: left + column * (brickConfig.width + brickConfig.gap), y: brickConfig.top + row * (brickConfig.height + brickConfig.gap), alive: true, color: ["#ed5be8", "#b46af1", "#7b8cff", "#63bfe1", "#63e1dc"][row] });
            }
        }
    }

    function resetBall() {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 1;
        ball.vx = Math.random() < 0.5 ? -230 : 230;
        ball.vy = -300;
    }

    function resetGame() {
        score = 0;
        lives = 3;
        scoreElement.textContent = score;
        livesElement.textContent = lives;
        paddle.x = (width - paddle.width) / 2;
        makeBricks();
        resetBall();
        draw();
    }

    function start() {
        if (state === "running") return;
        if (state === "over") resetGame();
        state = "running";
        overlay.hidden = true;
        startButton.textContent = "Nueva partida";
        pauseButton.disabled = false;
        pauseButton.textContent = "Pausar";
        lastTime = 0;
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(loop);
    }

    function togglePause() {
        if (state === "running") {
            state = "paused";
            pauseButton.textContent = "Continuar";
            showOverlay("Pausa", "Pulsa Continuar o Espacio para seguir");
        } else if (state === "paused") {
            state = "running";
            pauseButton.textContent = "Pausar";
            overlay.hidden = true;
            lastTime = 0;
            animationFrame = requestAnimationFrame(loop);
        }
    }

    function finish(won) {
        state = "over";
        pauseButton.disabled = true;
        showOverlay(won ? "¡Ganaste!" : "Fin del juego", `${score} puntos · Pulsa Jugar para otra partida`);
    }

    function update(delta) {
        if (keys.left) paddle.x -= paddle.speed * delta;
        if (keys.right) paddle.x += paddle.speed * delta;
        paddle.x = Math.max(0, Math.min(width - paddle.width, paddle.x));
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= width) {
            ball.vx *= -1;
            ball.x = Math.max(ball.radius, Math.min(width - ball.radius, ball.x));
        }
        if (ball.y - ball.radius <= 0) {
            ball.vy = Math.abs(ball.vy);
            ball.y = ball.radius;
        }
        if (ball.vy > 0 && ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
            const offset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const speed = Math.min(470, Math.hypot(ball.vx, ball.vy) * 1.025);
            const angle = offset * (Math.PI / 3);
            ball.vx = Math.sin(angle) * speed;
            ball.vy = -Math.cos(angle) * speed;
            ball.y = paddle.y - ball.radius;
        }

        for (const brick of bricks) {
            if (!brick.alive) continue;
            if (ball.x + ball.radius > brick.x && ball.x - ball.radius < brick.x + brickConfig.width && ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brickConfig.height) {
                brick.alive = false;
                score += 10;
                scoreElement.textContent = score;
                const overlapX = Math.min(ball.x + ball.radius - brick.x, brick.x + brickConfig.width - (ball.x - ball.radius));
                const overlapY = Math.min(ball.y + ball.radius - brick.y, brick.y + brickConfig.height - (ball.y - ball.radius));
                if (overlapX < overlapY) ball.vx *= -1; else ball.vy *= -1;
                break;
            }
        }

        if (bricks.every(brick => !brick.alive)) { finish(true); return; }
        if (ball.y - ball.radius > height) {
            lives--;
            livesElement.textContent = lives;
            if (lives <= 0) finish(false);
            else resetBall();
        }
    }

    function draw() {
        ctx.fillStyle = "#080d12";
        ctx.fillRect(0, 0, width, height);
        for (const brick of bricks) {
            if (!brick.alive) continue;
            ctx.fillStyle = brick.color;
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 9;
            ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height);
        }
        ctx.fillStyle = "#63e1dc";
        ctx.shadowColor = "#63e1dc";
        ctx.shadowBlur = 14;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#f5ffff";
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop(timestamp) {
        if (state !== "running") return;
        if (!lastTime) lastTime = timestamp;
        const delta = Math.min((timestamp - lastTime) / 1000, 0.035);
        lastTime = timestamp;
        update(delta);
        draw();
        if (state === "running") animationFrame = requestAnimationFrame(loop);
    }

    function setControl(name, pressed) {
        keys[name] = pressed;
        if (pressed && state === "ready") start();
    }

    function moveToPointer(event) {
        const rect = canvas.getBoundingClientRect();
        const scale = width / rect.width;
        paddle.x = Math.max(0, Math.min(width - paddle.width, (event.clientX - rect.left) * scale - paddle.width / 2));
        if (state === "ready") draw();
    }

    document.addEventListener("keydown", event => {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
        if (key === "arrowleft" || key === "a") setControl("left", true);
        if (key === "arrowright" || key === "d") setControl("right", true);
        if (event.code === "Space") { if (state === "ready") start(); else togglePause(); }
        if (key === "enter" && state !== "running") { if (state === "over") resetGame(); start(); }
    });
    document.addEventListener("keyup", event => {
        const key = event.key.toLowerCase();
        if (key === "arrowleft" || key === "a") setControl("left", false);
        if (key === "arrowright" || key === "d") setControl("right", false);
    });
    window.addEventListener("blur", () => { keys.left = false; keys.right = false; });
    canvas.addEventListener("pointermove", moveToPointer);
    canvas.addEventListener("pointerdown", event => { moveToPointer(event); if (state === "ready") start(); });
    document.querySelectorAll("[data-control]").forEach(button => {
        const name = button.dataset.control;
        button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); setControl(name, true); });
        button.addEventListener("pointerup", () => setControl(name, false));
        button.addEventListener("pointercancel", () => setControl(name, false));
        button.addEventListener("lostpointercapture", () => setControl(name, false));
    });
    startButton.addEventListener("click", () => {
        if (state === "running") { state = "ready"; resetGame(); }
        start();
    });
    pauseButton.addEventListener("click", togglePause);
    resetGame();
    showOverlay("¿Listo para jugar?", "Pulsa Jugar o mueve la paleta");
})();
