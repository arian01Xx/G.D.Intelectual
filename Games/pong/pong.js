(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const playerScoreElement = document.getElementById("player-score");
    const cpuScoreElement = document.getElementById("cpu-score");
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMessage = document.getElementById("overlay-message");
    const startButton = document.getElementById("start-button");
    const pauseButton = document.getElementById("pause-button");

    const width = canvas.width;
    const height = canvas.height;
    const paddleWidth = 11;
    const paddleHeight = 76;
    const ballRadius = 7;
    const player = { x: 26, y: (height - paddleHeight) / 2, score: 0 };
    const cpu = { x: width - 26 - paddleWidth, y: (height - paddleHeight) / 2, score: 0 };
    const ball = { x: width / 2, y: height / 2, vx: 250, vy: 95 };
    const keys = { up: false, down: false };
    let state = "ready";
    let lastTime = 0;
    let animationFrame;
    let serveToward = 1;
    const winningScore = 5;

    function showOverlay(title, message) {
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        overlay.hidden = false;
    }

    function resetBall(toward = serveToward) {
        ball.x = width / 2;
        ball.y = height / 2;
        const angle = (Math.random() * 0.8 - 0.4);
        const speed = 250;
        ball.vx = Math.cos(angle) * speed * toward;
        ball.vy = Math.sin(angle) * speed;
    }

    function resetMatch() {
        player.score = 0;
        cpu.score = 0;
        playerScoreElement.textContent = "0";
        cpuScoreElement.textContent = "0";
        player.y = cpu.y = (height - paddleHeight) / 2;
        serveToward = Math.random() < 0.5 ? -1 : 1;
        resetBall();
        draw();
    }

    function start() {
        if (state === "running") return;
        if (state === "over") resetMatch();
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

    function scorePoint(scorer) {
        if (scorer === "player") {
            player.score++;
            playerScoreElement.textContent = player.score;
            serveToward = 1;
        } else {
            cpu.score++;
            cpuScoreElement.textContent = cpu.score;
            serveToward = -1;
        }
        if (player.score >= winningScore || cpu.score >= winningScore) {
            state = "over";
            pauseButton.disabled = true;
            const playerWon = player.score > cpu.score;
            showOverlay(playerWon ? "¡Ganaste!" : "Ganó la CPU", `${player.score} : ${cpu.score} · Pulsa Jugar para otra partida`);
            draw();
            return;
        }
        resetBall();
    }

    function update(delta) {
        const playerSpeed = 360;
        if (keys.up) player.y -= playerSpeed * delta;
        if (keys.down) player.y += playerSpeed * delta;
        player.y = Math.max(0, Math.min(height - paddleHeight, player.y));

        const cpuCenter = cpu.y + paddleHeight / 2;
        const target = ball.y;
        const cpuSpeed = 245;
        if (Math.abs(target - cpuCenter) > 8) {
            cpu.y += Math.sign(target - cpuCenter) * Math.min(cpuSpeed * delta, Math.abs(target - cpuCenter));
        }
        cpu.y = Math.max(0, Math.min(height - paddleHeight, cpu.y));

        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        if (ball.y - ballRadius <= 0 || ball.y + ballRadius >= height) {
            ball.vy *= -1;
            ball.y = Math.max(ballRadius, Math.min(height - ballRadius, ball.y));
        }

        if (ball.vx < 0 && ball.x - ballRadius <= player.x + paddleWidth &&
            ball.x > player.x && ball.y + ballRadius >= player.y && ball.y - ballRadius <= player.y + paddleHeight) {
            bounce(player);
        }
        if (ball.vx > 0 && ball.x + ballRadius >= cpu.x &&
            ball.x < cpu.x + paddleWidth && ball.y + ballRadius >= cpu.y && ball.y - ballRadius <= cpu.y + paddleHeight) {
            bounce(cpu);
        }
        if (ball.x < -ballRadius) scorePoint("cpu");
        if (ball.x > width + ballRadius) scorePoint("player");
    }

    function bounce(paddle) {
        const offset = (ball.y - (paddle.y + paddleHeight / 2)) / (paddleHeight / 2);
        const speed = Math.min(420, Math.hypot(ball.vx, ball.vy) * 1.045);
        const angle = offset * (Math.PI / 3);
        const toward = paddle === player ? 1 : -1;
        ball.vx = Math.cos(angle) * speed * toward;
        ball.vy = Math.sin(angle) * speed;
        ball.x = paddle === player ? player.x + paddleWidth + ballRadius : cpu.x - ballRadius;
    }

    function draw() {
        ctx.fillStyle = "#080d12";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(99,225,220,.19)";
        ctx.setLineDash([8, 10]);
        ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#63e1dc";
        ctx.shadowColor = "#63e1dc";
        ctx.shadowBlur = 12;
        ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
        ctx.fillStyle = "#ed5be8";
        ctx.shadowColor = "#ed5be8";
        ctx.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2); ctx.fillStyle = "#f5ffff"; ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop(timestamp) {
        if (state !== "running") return;
        if (!lastTime) lastTime = timestamp;
        const delta = Math.min((timestamp - lastTime) / 1000, 0.04);
        lastTime = timestamp;
        update(delta);
        draw();
        if (state === "running") animationFrame = requestAnimationFrame(loop);
    }

    function setControl(name, pressed) {
        keys[name] = pressed;
        if (pressed && state === "ready") start();
    }

    document.addEventListener("keydown", event => {
        if (["ArrowUp", "ArrowDown", " "].includes(event.key)) event.preventDefault();
        if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") setControl("up", true);
        if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") setControl("down", true);
        if (event.code === "Space") {
            if (state === "ready") start(); else togglePause();
        }
        if (event.key === "Enter" && state !== "running") { resetMatch(); start(); }
    });
    document.addEventListener("keyup", event => {
        if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") setControl("up", false);
        if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") setControl("down", false);
    });
    window.addEventListener("blur", () => { keys.up = false; keys.down = false; });
    document.querySelectorAll("[data-control]").forEach(button => {
        const name = button.dataset.control;
        button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); setControl(name, true); });
        button.addEventListener("pointerup", () => setControl(name, false));
        button.addEventListener("pointercancel", () => setControl(name, false));
        button.addEventListener("lostpointercapture", () => setControl(name, false));
    });
    startButton.addEventListener("click", () => {
        if (state === "running") { state = "ready"; resetMatch(); }
        start();
    });
    pauseButton.addEventListener("click", togglePause);

    resetMatch();
    showOverlay("¿Listo para jugar?", "Pulsa Jugar o una tecla de movimiento");
})();
