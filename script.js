/**
 * script.js - Cyber Snake Game Logic
 *
 * This file handles the entire game loop, drawing to the canvas,
 * state management (start, playing, game over), and saving scores
 * using the browser's Local Storage.
 */

// --- Game Constants & Variables ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resetScoresBtn = document.getElementById("reset-scores-btn");
const playerNameInput = document.getElementById("player-name");
const currentScoreEl = document.getElementById("current-score");
const finalScoreEl = document.getElementById("final-score");
const leaderboardListEl = document.getElementById("leaderboard-list");

// Grid size determines the size of each "block" in the snake and the food
const gridSize = 20;
// Calculate total tiles in rows and columns
const tileCount = canvas.width / gridSize;

// Variables that change during gameplay
let snake = [];
let dx = 0; // Velocity on the x-axis
let dy = 0; // Velocity on the y-axis
let foodX = 0;
let foodY = 0;
let score = 0;
let level = 1;
let currentPlayerAlias = "ANONYMOUS";

// The game loop timer
let gameInterval;
// Base speed of the game in milliseconds
let gameSpeed = 100;

// The key used to save/load our leaderboard array from Local Storage
const LS_KEY = "cyberSnakeLeaders";

// --- Events ---
// Listen for clicks on the buttons to start/restart
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", showMenu);
resetScoresBtn.addEventListener("click", clearScores);

function clearScores() {
    // Wipe local storage key
    localStorage.removeItem(LS_KEY);
    // Re-render empty leaderboard
    renderLeaderboard([]);
}

function showMenu() {
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
}

// Listen for keyboard input to change the snake's direction
document.addEventListener("keydown", changeDirection);

// --- Core Game Functions ---

/**
 * Initializes the game state, resetting the snake, score, and hiding UI panels.
 */
function startGame() {
    // Capture the player's name (default to "ANONYMOUS" if empty)
    currentPlayerAlias = playerNameInput.value.trim() || "ANONYMOUS";
    currentPlayerAlias = currentPlayerAlias.toUpperCase();

    // Reset snake to center of screen with length of 1
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];

    // Initial movement direction (moving right)
    dx = 1;
    dy = 0;

    score = 0;
    level = 1;
    gameSpeed = 100; // Reset to base speed
    currentScoreEl.innerText = score;

    // Switch UI screens
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    canvas.classList.add("active");

    // Spawn the first food
    placeFood();

    // Clear any existing game loop, then start a new one
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

/**
 * The main Game Loop. This function is called repeatedly based on `gameSpeed`.
 * It clears the screen, moves the snake, checks for collisions, and draws everything.
 */
function gameLoop() {
    moveSnake();

    // If a collision happened (hit wall or self), stop the game
    if (checkCollision()) {
        gameOver();
        return;
    }

    clearCanvas();
    drawFood();
    drawSnake();
    drawGrid(); // Optional aesthetic: Neon grid
}

/**
 * Updates the array representing the snake's body by adding a new head
 * in the direction of movement, and removing the tail.
 */
function moveSnake() {
    // Calculate the new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Add new head to the beginning of the array
    snake.unshift(head);

    // Check if snake ate the food
    if (head.x === foodX && head.y === foodY) {
        // Increase score
        score += 10;
        currentScoreEl.innerText = score;

        // Every 10 foods (100 points), increase speed (decrease interval time)
        // Also increase level and adjust speed
        if (score % 100 === 0) {
            level++;
            gameSpeed = Math.max(40, gameSpeed - 10); // Cap max speed to 40ms
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed); // Restart game loop with new speed
        }

        // Spawn a new food; we do NOT pop the tail so the snake grows!
        placeFood();
    } else {
        // If no food was eaten, remove the tail so the snake stays the same length
        snake.pop();
    }
}

/**
 * Detects if the snake's head has hit the walls or its own body.
 * Returns true if a collision happened, false otherwise.
 */
function checkCollision() {
    const head = snake[0];

    // Check Wall Collisions
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    // Check Self Collisions (start checking from index 1 since 0 is the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

/**
 * Reads the player's keyboard input to set dx and dy (velocity constraints).
 * Prevents the snake from immediately reversing direction.
 */
function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    // Prevent default scrolling behavior for arrow keys
    if ([LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY].includes(keyPressed)) {
        event.preventDefault();
    }

    // A check is made so the snake can't move left while currently moving right, etc.
    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    } else if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    } else if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    } else if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

/**
 * Randomly places the food somewhere on the grid, ensuring it isn't placed
 * inside the snake's body.
 */
function placeFood() {
    foodX = Math.floor(Math.random() * tileCount);
    foodY = Math.floor(Math.random() * tileCount);

    // If the random coordinates land on the snake, reroll
    for (let part of snake) {
        if (part.x === foodX && part.y === foodY) {
            placeFood();
            return;
        }
    }
}

// --- Drawing / Graphics Functions ---

function clearCanvas() {
    // Fill the canvas with a stark black to fit the cyber theme
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.strokeStyle = "rgba(0, 243, 255, 0.05)"; // Very faint blue
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((part, index) => {
        // The head is a different color (Neon Pink) vs the body (Neon Blue)
        ctx.fillStyle = index === 0 ? "#ff00ea" : "#00f3ff";

        // Add a glow effect for the cyberpunk aesthetic
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;

        // Draw the block, slightly smaller than gridSize to leave a gap between segments
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);

        // Reset shadow so it doesn't leak into other drawings
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    ctx.fillStyle = "#39ff14"; // Neon Green
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#39ff14";

    ctx.fillRect(foodX * gridSize + 1, foodY * gridSize + 1, gridSize - 2, gridSize - 2);

    ctx.shadowBlur = 0;
}

// --- End Game & Local Storage (Leaderboard) ---

/**
 * Called when the snake crashes. Stops the loop, shows the game over screen,
 * and handles saving the score to the leaderboard.
 */
function gameOver() {
    clearInterval(gameInterval); // Stop game loop

    canvas.classList.remove("active");
    gameOverScreen.classList.remove("hidden");
    finalScoreEl.innerText = score;

    // Handle leaderboard saving
    handleLeaderboard(score);
}

/**
 * Uses Local Storage to read, update, and save the top 5 high scores.
 * 
 * Local Storage allows us to save strings in the user's browser, meaning
 * the scores stay even if they refresh the page.
 */
function handleLeaderboard(newScore) {
    // 1. Retrieve the existing string from Local Storage using our key
    const savedData = localStorage.getItem(LS_KEY);

    // 2. Parse the string into a JavaScript Array. If nobody has played yet, use an empty array.
    let leaderboard = savedData ? JSON.parse(savedData) : [];

    // Filter out old integer-only scores if there are any from before the update
    leaderboard = leaderboard.filter(entry => typeof entry === 'object');

    // 3. Add or update the score
    if (newScore > 0) {
        const existingPlayerIndex = leaderboard.findIndex(entry => entry.name === currentPlayerAlias);

        if (existingPlayerIndex !== -1) {
            // Player exists, update their score only if the new score is higher
            if (newScore > leaderboard[existingPlayerIndex].score) {
                leaderboard[existingPlayerIndex].score = newScore;
            }
        } else {
            // New player
            leaderboard.push({ name: currentPlayerAlias, score: newScore });
        }
    }

    // 4. Sort the array numerically in descending order (highest score first)
    leaderboard.sort((a, b) => b.score - a.score);

    // 5. Keep only the Top 5 scores
    leaderboard = leaderboard.slice(0, 5);

    // 6. Save the updated array back to Local Storage
    localStorage.setItem(LS_KEY, JSON.stringify(leaderboard));

    // 7. Update the UI to show the new leaderboard
    renderLeaderboard(leaderboard);
}

/**
 * Clears the old leaderboard UI and creates new HTML list items for each score.
 */
function renderLeaderboard(leaderboard) {
    leaderboardListEl.innerHTML = ""; // Clear existing entries

    // Filter to ensure we only render valid objects
    leaderboard = leaderboard.filter(entry => typeof entry === 'object');

    if (leaderboard.length === 0) {
        leaderboardListEl.innerHTML = "<li>No scores yet...</li>";
        return;
    }

    leaderboard.forEach((entry) => {
        const li = document.createElement("li");
        const hackerName = entry.name;
        const hackerScore = entry.score;

        li.innerHTML = `<span>${hackerName}</span> <span>${hackerScore}</span>`;
        leaderboardListEl.appendChild(li);
    });
}

// Load the leaderboard onto the UI when the script first loads (if they die immediately, they can still see it)
renderLeaderboard(localStorage.getItem(LS_KEY) ? JSON.parse(localStorage.getItem(LS_KEY)) : []);
