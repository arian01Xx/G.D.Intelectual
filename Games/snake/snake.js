(() => {
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const bestElement = document.getElementById("best");
    const overlay = document.getElementById("overlay");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayMessage = document.getElementById("overlay-message");
    const startButton = document.getElementById("start-button");
    const pauseButton = document.getElementById("pause-button");

    const cells = 21;
    const cellSize = canvas.width / cells;
    const directions = {
        up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
        left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    let snake;
    let food;
    let direction;
    let nextDirection;
    let score = 0;
    let best = Number(localStorage.getItem("gd-snake-best") || 0);
    let state = "ready";
    let lastStep = 0;
    let animationFrame;

    bestElement.textContent = best;

    function reset() {
        snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        direction = directions.right;
        nextDirection = direction;
        score = 0;
        scoreElement.textContent = score;
        placeFood();
        draw();
    }

    function placeFood() {
        do {
            food = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
        } while (snake.some(part => part.x === food.x && part.y === food.y));
    }

    function showOverlay(title, message) {
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        overlay.hidden = false;
    }

    function start() {
        if (state === "running") return;
        if (state === "over") reset();
        state = "running";
        overlay.hidden = true;
        startButton.textContent = "Reiniciar";
        pauseButton.disabled = false;
        pauseButton.textContent = "Pausar";
        lastStep = 0;
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
            lastStep = 0;
            animationFrame = requestAnimationFrame(loop);
        }
    }

    function setDirection(name) {
        if (state === "ready" || state === "over") {
            nextDirection = directions[name];
            if (state === "over") reset();
            direction = nextDirection;
            start();
            return;
        }
        const candidate = directions[name];
        if (candidate && !(candidate.x === -direction.x && candidate.y === -direction.y)) {
            nextDirection = candidate;
        }
    }

    function step() {
        direction = nextDirection;
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        const eating = head.x === food.x && head.y === food.y;
        const bodyToCheck = eating ? snake : snake.slice(0, -1);
        if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells ||
            bodyToCheck.some(part => part.x === head.x && part.y === head.y)) {
            endGame();
            return;
        }
        snake.unshift(head);
        if (eating) {
            score += 10;
            scoreElement.textContent = score;
            if (score > best) {
                best = score;
                bestElement.textContent = best;
                localStorage.setItem("gd-snake-best", best);
            }
            placeFood();
        } else {
            snake.pop();
        }
        draw();
    }

    function endGame() {
        state = "over";
        pauseButton.disabled = true;
        showOverlay("Fin del juego", `Puntuación: ${score} · Pulsa Jugar o Enter para intentarlo otra vez`);
        draw();
    }

    function draw() {
        ctx.fillStyle = "#080d12";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(99,225,220,.055)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= cells; i++) {
            const point = i * cellSize;
            ctx.beginPath(); ctx.moveTo(point, 0); ctx.lineTo(point, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, point); ctx.lineTo(canvas.width, point); ctx.stroke();
        }
        if (food) {
            ctx.fillStyle = "#ed5be8";
            ctx.shadowColor = "#ed5be8";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc((food.x + .5) * cellSize, (food.y + .5) * cellSize, cellSize * .31, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (snake) snake.forEach((part, index) => {
            const inset = 2;
            ctx.fillStyle = index === 0 ? "#a4fff5" : "#63e1dc";
            ctx.shadowColor = index === 0 ? "#63e1dc" : "transparent";
            ctx.shadowBlur = index === 0 ? 10 : 0;
            ctx.beginPath();
            ctx.roundRect(part.x * cellSize + inset, part.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2, 4);
            ctx.fill();
        });
        ctx.shadowBlur = 0;
    }

    function loop(timestamp) {
        if (state !== "running") return;
        if (!lastStep) lastStep = timestamp;
        const interval = Math.max(75, 145 - Math.floor(score / 50) * 8);
        if (timestamp - lastStep >= interval) {
            step();
            lastStep = timestamp;
        }
        if (state === "running") animationFrame = requestAnimationFrame(loop);
    }

    const keyDirections = {
        ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right"
    };
    document.addEventListener("keydown", event => {
        if (keyDirections[event.key]) {
            event.preventDefault();
            setDirection(keyDirections[event.key]);
        } else if (event.code === "Space") {
            event.preventDefault();
            if (state === "ready") start(); else togglePause();
        } else if (event.key === "Enter" && state !== "running") {
            reset(); start();
        }
    });

    document.querySelectorAll("[data-direction]").forEach(button => {
        button.addEventListener("click", () => setDirection(button.dataset.direction));
    });
    startButton.addEventListener("click", () => { reset(); start(); });
    pauseButton.addEventListener("click", togglePause);

    reset();
    showOverlay("¿Listo para jugar?", "Pulsa Jugar o una flecha para empezar");
})();
