<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate Suite Pro | JR Tech Solutions</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #050a18;
            --card: rgba(255, 255, 255, 0.05);
            --text: #ffffff;
            --primary: #00f2ff;
            --secondary: #7000ff;
            --border: rgba(255, 255, 255, 0.1);
            --input-bg: rgba(0, 0, 0, 0.3);
            --glass: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.2);
        }

        [data-theme="light"] {
            --bg: #f0f4f8;
            --card: rgba(255, 255, 255, 0.9);
            --text: #1a1a2e;
            --primary: #007aff;
            --secondary: #5856d6;
            --border: rgba(0, 0, 0, 0.1);
            --input-bg: #ffffff;
            --glass: rgba(0, 0, 0, 0.1);
            --glass-border: rgba(0, 0, 0, 0.2);
        }

        [data-theme="dark"] {
            --bg: #050a18;
            --card: rgba(255, 255, 255, 0.05);
            --text: #ffffff;
            --primary: #00f2ff;
            --secondary: #7000ff;
            --border: rgba(255, 255, 255, 0.1);
            --input-bg: rgba(0, 0, 0, 0.3);
            --glass: rgba(255, 255, 255, 0.1);
            --glass-border: rgba(255, 255, 255, 0.2);
        }

        [data-theme="neon"] {
            --bg: #1a1a2e;
            --card: rgba(255, 255, 255, 0.5);
            --text: #ffffff;
            --primary: #ff69b4;
            --secondary: #33cc33;
            --border: rgba(0, 255, 0, 0.5);
            --input-bg: rgba(0, 255, 0, 0.1);
            --glass: rgba(0, 255, 0, 0.1);
            --glass-border: rgba(0, 255, 0, 0.2);
        }

        [data-theme="pastel"] {
            --bg: #f5f5f5;
            --card: rgba(255, 255, 255, 0.7);
            --text: #1a1a2e;
            --primary: #ffc107;
            --secondary: #ff9800;
            --border: rgba(255, 0, 0, 0.1);
            --input-bg: rgba(255, 0, 0, 0.1);
            --glass: rgba(255, 0, 0, 0.1);
            --glass-border: rgba(255, 0, 0, 0.2);
        }

        [data-theme="cyber"] {
            --bg: #030303;
            --card: rgba(0, 255, 0, 0.1);
            --text: #ffffff;
            --primary: #00ff00;
            --secondary: #ff00ff;
            --border: rgba(0, 255, 0, 0.5);
            --input-bg: rgba(0, 255, 0, 0.1);
            --glass: rgba(0, 255, 0, 0.1);
            --glass-border: rgba(0, 255, 0, 0.2);
        }

        * { box-sizing: border-box; font-family: 'Outfit', sans-serif; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        body {
            margin: 0;
            min-height: 100vh;
            background: var(--bg);
            display: flex;
            color: var(--text);
            overflow: hidden;
        }

        /* SIDEBAR NAV */
        nav {
            width: 85px;
            background: var(--card);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 30px 0;
            gap: 20px;
            z-index: 10;
        }

        .nav-item {
            cursor: pointer;
            font-size: 18px;
            width: 55px;
            height: 55px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 18px;
            opacity: 0.5;
            text-align: center;
        }

        .nav-item span { font-size: 9px; margin-top: 2px; text-transform: uppercase; font-weight: 600; }

        .nav-item.active {
            opacity: 1;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            box-shadow: 0 10px 20px rgba(0, 242, 255, 0.3);
        }

        /* MAIN AREA */
        main {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .blob {
            position: absolute;
            width: 600px; height: 600px;
            background: radial-gradient(circle, var(--secondary) 0%, transparent 70%);
            filter: blur(100px);
            opacity: 0.15;
            z-index: -1;
            animation: move 15s infinite alternate;
        }

        @keyframes move { from { transform: translate(-10%, -10%); } to { transform: translate(10%, 10%); } }

        .calc-card {
            width: 95%;
            max-width: 500px;
            background: var(--glass);
            backdrop-filter: blur(40px);
            border: 1px solid var(--glass-border);
            border-radius: 40px;
            padding: 40px;
            box-shadow: 0 40px 100px rgba(0,0,0,0.4);
        }

        /* DUAL GAME MODE WIDTH */
        .calc-card.wide {
            max-width: 850px;
        }

        .section { display: none; animation: slideUp 0.6s ease forwards; }
        .section.active { display: block; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        h1 { font-size: 26px; margin: 0; letter-spacing: -1px; }
        p { font-size: 12px; opacity: 0.6; margin: 5px 0 25px; }

        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .full-width { grid-column: span 2; }

        label { display: block; font-size: 10px; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; color: var(--primary); }
        
        input, select {
            width: 100%; padding: 14px; background: var(--input-bg);
            border: 1px solid var(--border); 
            border-radius: 14px; color: var(--text); font-size: 15px; outline: none;
        }

        .result-box {
            background: rgba(0, 242, 255, 0.05);
            border: 1px dashed var(--primary);
            color: var(--primary);
            font-weight: 700;
            font-size: 18px;
            text-align: center;
            cursor: pointer;
        }

        .btn-calc {
            width: 100%; padding: 16px; margin-top: 15px; border-radius: 18px; border: none;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #fff; font-weight: 600; cursor: pointer; text-transform: uppercase;
        }

        .theme-btn {
            position: absolute; top: 30px; right: 30px; cursor: pointer; font-size: 22px;
            background: var(--glass);
            padding: 10px; border-radius: 12px; border: 1px solid var(--glass-border);
        }

        /* MULTI-GAME LAYOUT */
        .game-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            align-items: flex-start;
        }

        .game-box {
            background: var(--glass);
            padding: 20px;
            border-radius: 25px;
            border: 1px solid var(--glass-border);
            text-align: center;
        }

        canvas { background: #000; border-radius: 15px; display: block; margin: 0 auto; width: 100%; max-width: 250px; }

        /* Memory Game UI */
        .memory-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            max-width: 250px;
            margin: 0 auto;
        }
        .card {
            aspect-ratio: 1;
            background: var(--primary);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: transparent;
        }
        .card.flipped { color: #000; background: #fff; }
        .card.matched { background: var(--secondary); color: #fff; visibility: hidden; }

    </style>
</head>
<body data-theme="dark">

<nav>
    <div class="nav-item active" onclick="showCalc('vat', this)">💰<span>VAT</span></div>
    <div class="nav-item" onclick="showCalc('gold', this)">🥇<span>GOLD</span></div>
    <div class="nav-item" onclick="showCalc('loan', this)">🏦<span>EMI</span></div>
    <div class="nav-item" onclick="showCalc('student', this)">🎓<span>STUDY</span></div>
    <div class="nav-item" onclick="showCalc('games', this)">🎮<span>PLAY</span></div>
</nav>

<main>
    <div class="blob"></div>
    <div class="theme-btn" onclick="toggleTheme()">🌓</div>

    <div class="calc-card" id="mainCard">
        <div id="vat" class="section active">
            <h1>VAT Engine</h1>
            <p>Precise tax calculations.</p>
            <div class="input-grid">
                <div class="full-width">
                    <label>Net Amount</label>
                    <input type="number" id="vat-net" placeholder="0.00">
                </div>
                <div><label>Rate %</label><input type="number" id="vat-rate" value="20"></div>
                <div><label>VAT Fraction</label><input type="text" id="vat-amt" class="result-box" readonly></div>
                <div class="full-width"><label>Total (Gross)</label><input type="text" id="vat-total" class="result-box" readonly onclick="copyThis(this)"></div>
            </div>
            <button class="btn-calc" onclick="calcVAT()">Calculate VAT</button>
        </div>

        <div id="gold" class="section">
            <h1>Gold Portfolio</h1>
            <p>Valuation by Karat and Weight.</p>
            <div class="input-grid">
                <div><label>Currency</label><select id="gold-curr"><option value="$">USD</option><option value="₹">INR</option><option value="£">GBP</option></select></div>
                <div><label>Weight (g)</label><input type="number" id="gold-weight" placeholder="0.00"></div>
                <div><label>Purity</label><select id="gold-karat"><option value="24">24K</option><option value="22" selected>22K</option><option value="18">18K</option></select></div>
                <div><label>Rate/Gram</label><input type="number" id="gold-price" placeholder="Rate"></div>
                <div class="full-width"><label>Market Value</label><input type="text" id="gold-val" class="result-box" readonly onclick="copyThis(this)"></div>
            </div>
            <button class="btn-calc" onclick="calcGold()">Calculate Gold</button>
        </div>

        <div id="loan" class="section">
            <h1>Smart Loan</h1>
            <p>Monthly installment breakdown.</p>
            <div class="input-grid">
                <div class="full-width"><label>Principal</label><input type="number" id="loan-p" placeholder="50000"></div>
                <div><label>Interest %</label><input type="number" id="loan-r" value="8.5"></div>
                <div><label>Months</label><input type="number" id="loan-t" value="24"></div>
                <div class="full-width"><label>Monthly EMI</label><input type="text" id="loan-emi" class="result-box" readonly onclick="copyThis(this)"></div>
            </div>
            <button class="btn-calc" onclick="calcLoan()">Calculate EMI</button>
        </div>

        <div id="student" class="section">
            <h1>Student Hub</h1>
            <p>Grade & GPA Predictor.</p>
            <div class="input-grid">
                <div class="full-width"><label>Marks Obtained</label><input type="number" id="stu-marks" placeholder="85"></div>
                <div class="full-width"><label>Total Marks</label><input type="number" id="stu-total" placeholder="100"></div>
                <div class="full-width"><label>Grade / Result</label><input type="text" id="stu-res" class="result-box" readonly></div>
            </div>
            <button class="btn-calc" onclick="calcStudent()">Check Grade</button>
        </div>

        <div id="games" class="section">
            <h1>Game Zone</h1>
            <p>Select a game to start playing.</p>
            
            <div class="game-container">
                <div class="game-box">
                    <h3>Snake Retro</h3>
                    <canvas id="snakeGame" width="250" height="250"></canvas>
                    <div id="snakeScore">Score: 0</div>
                    <button class="btn-calc" onclick="initSnake()">Play Snake</button>
                </div>

                <div class="game-box">
                    <h3>Memory Match</h3>
                    <div class="memory-grid" id="memoryGrid"></div>
                    <div id="memoryStatus">Matches: 0</div>
                    <button class="btn-calc" onclick="initMemory()">Reset Cards</button>
                </div>
            </div>
        </div>
    </div>
</main>

<script>
    // NAVIGATION
    function showCalc(id, el) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const card = document.getElementById('mainCard');
        
        if(id === 'games') card.classList.add('wide');
        else card.classList.remove('wide');

        document.getElementById(id).classList.add('active');
        el.classList.add('active');
        if(id !== 'games') stopSnake();
    }

    let currentTheme = 'dark';
    const themes = ['dark', 'light', 'neon', 'pastel', 'cyber'];

    function toggleTheme() {
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        currentTheme = themes[nextIndex];
        document.body.setAttribute('data-theme', currentTheme);
    }

    function format(val) { return val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); }

    function copyThis(el) {
        if(!el.value) return;
        navigator.clipboard.writeText(el.value);
        let old = el.value; el.value = "COPIED!";
        setTimeout(() => el.value = old, 800);
    }

    // MATH LOGIC
    function calcVAT() {
        const n = parseFloat(document.getElementById('vat-net').value);
        const r = parseFloat(document.getElementById('vat-rate').value);
        if(!n) return;
        document.getElementById('vat-amt').value = format(n * r / 100);
        document.getElementById('vat-total').value = format(n + (n * r / 100));
    }

    function calcGold() {
        const w = parseFloat(document.getElementById('gold-weight').value);
        const k = parseInt(document.getElementById('gold-karat').value);
        const p = parseFloat(document.getElementById('gold-price').value);
        const cur = document.getElementById('gold-curr').value;
        if(!w || !p) return;
        document.getElementById('gold-val').value = `${cur} ${format(w * (k/24) * p)}`;
    }

    function calcLoan() {
        const p = parseFloat(document.getElementById('loan-p').value);
        const r = parseFloat(document.getElementById('loan-r').value) / 12 / 100;
        const n = parseFloat(document.getElementById('loan-t').value);
        if(!p || !r) return;
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        document.getElementById('loan-emi').value = format(emi);
    }

    function calcStudent() {
        const m = parseFloat(document.getElementById('stu-marks').value);
        const t = parseFloat(document.getElementById('stu-total').value);
        if(!m || !t) return;
        const p = (m / t) * 100;
        let g = p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : "F";
        document.getElementById('stu-res').value = `${p.toFixed(1)}% - ${g}`;
    }

    // SNAKE GAME
    const canvas = document.getElementById("snakeGame");
    const ctx = canvas.getContext("2d");
    let snake, food, dx, dy, score, snakeTimer;

    function initSnake() {
        clearInterval(snakeTimer);
        snake = [{x: 120, y: 120}];
        food = {x: 40, y: 40};
        dx = 10; dy = 0; score = 0;
        snakeTimer = setInterval(updateSnake, 120);
    }

    function stopSnake() { clearInterval(snakeTimer); }

    function updateSnake() {
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        if (head.x < 0 || head.x >= 250 || head.y < 0 || head.y >= 250 || snake.some(s => s.x === head.x && s.y === head.y)) {
            clearInterval(snakeTimer); alert("Game Over!"); return;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score += 10; document.getElementById('snakeScore').innerText = "Score: " + score;
            food = {x: Math.floor(Math.random()*24)*10, y: Math.floor(Math.random()*24)*10};
        } else snake.pop();
        ctx.fillStyle = "black"; ctx.fillRect(0,0,250,250);
        ctx.fillStyle = "#00f2ff"; snake.forEach(s => ctx.fillRect(s.x, s.y, 9, 9));
        ctx.fillStyle = "#ff0070"; ctx.fillRect(food.x, food.y, 9, 9);
    }

    // MEMORY GAME
    let cards = [], flipped = [], matches = 0;
    const icons = ['🔥', '⚡', '💎', '🚀', '🌈', '🛸', '⭐', '🎈'];
    
    function initMemory() {
        const grid = document.getElementById('memoryGrid');
        grid.innerHTML = ''; flipped = []; matches = 0;
        const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
        deck.forEach((icon, i) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = icon;
            card.onclick = () => flipCard(card, icon);
            grid.appendChild(card);
        });
        document.getElementById('memoryStatus').innerText = "Matches: 0";
    }

    function flipCard(card, icon) {
        if (flipped.length < 2 && !card.classList.contains('flipped')) {
            card.classList.add('flipped');
            flipped.push({card, icon});
            if (flipped.length === 2) {
                if (flipped[0].icon === flipped[1].icon) {
                    setTimeout(() => {
                        flipped.forEach(f => f.card.classList.add('matched'));
                        flipped = []; matches++;
                        document.getElementById('memoryStatus').innerText = "Matches: " + matches;
                    }, 500);
                } else {
                    setTimeout(() => {
                        flipped.forEach(f => f.card.classList.remove('flipped'));
                        flipped = [];
                    }, 800);
                }
            }
        }
    }

    window.addEventListener("keydown", e => {
        if (e.key === "ArrowUp" && dy === 0) { dx = 0; dy = -10; }
        if (e.key === "ArrowDown" && dy === 0) { dx = 0; dy = 10; }
        if (e.key === "ArrowLeft" && dx === 0) { dx = -10; dy = 0; }
        if (e.key === "ArrowRight" && dx === 0) { dx = 10; dy = 0; }
    });

    initMemory(); // Pre-load memory game
</script>

</body>
</html>