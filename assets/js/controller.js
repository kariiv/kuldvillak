const ESC = 27
const SPACE = 32

const gameplayEl = document.getElementById("gameplay")
const gridEl = document.querySelectorAll(".grid")[0];
const optionsEl = document.getElementById("options")
const teamChooserEl = document.getElementById("team-chooser")
const gameChooserEl = document.getElementById("game-chooser")
const teamsEl = document.getElementById("teams")

const submitEl = document.getElementById("submit")
const resetEl = document.getElementById("reset-all")

const modalEl = document.getElementById("question-modal")
const modalTitleEl = document.getElementById("question-title")

const modalQuestionEl = modalEl.querySelectorAll(".question")[0]
const modalAnswerEl = modalEl.querySelectorAll(".answer")[0]
const modalBodyEl = modalEl.querySelectorAll('.question-body')[0]
const modalInnerEl = modalEl.querySelectorAll('.modal-inner')[0]

function createElement(el, className, parentEl, innerText) {
    const El = document.createElement(el)
    if (className) El.className = className;
    if (innerText && el !== "input") El.innerText = innerText;
    if (innerText && el === "input") El.value = innerText;
    if (parentEl) parentEl.appendChild(El);
    return El;
}

function createTeamTab(team) {
    if (!team.getStatus()) return null
    const teamEl = createElement("div", "team", teamsEl);
    const nameEl = createElement("input", "name", teamEl, team.getName());
    const pointsEl = createElement("input", "points", teamEl, team.getPoints().toString());
    const pointerEl = createElement("div", "pointer", teamEl);
    const plusEl = createElement("span", "plus", pointerEl, "+");
    const minusEl = createElement("span", "minus", pointerEl, "-");
    plusEl.onclick = () => {
        const last = getCurrentGame().getLastQuestion()
        if (last) {
            team.addAnsweredQuestion(last, true)
            pointsEl.value = team.getPoints().toString()
            saveState()
        }
    }
    minusEl.onclick = () => {
        const last = getCurrentGame().getLastQuestion()
        if (last) {
            team.addAnsweredQuestion(last, false)
            pointsEl.value = team.getPoints().toString()
            saveState()
        }
    }
    nameEl.onchange = (e) => {
        team.setName(e.target.value)
        saveState()
    }

    pointsEl.onchange = (e) => {
        try {
            team.setPoints(parseInt(e.target.value))
            e.target.value = team.getPoints()
            saveState()
        } catch (err) {
            alert("Input must be integer!")
            e.target.value = team.getPoints()
        }
    }
    pointsEl.type = 'text'
    nameEl.type = 'text'
    return teamEl
}
function createCategoryCell(c) {
    const catEl = createElement("div", "grid-cell")
    const cellEl = createElement("div", "cell", catEl)
    createElement("div", "cell-inner cat-cell", cellEl, c)
    return catEl
}
function createQuestionCell(id, q, a, p, inerts) {
    const questionEl = createElement("div", "cell-group grid-cell" + (inerts ? " inert" : ''))
    const cellEl = createElement("div", "cell points", questionEl)
    createElement("div", "cell-inner", cellEl, p)
    createElement("div", "front question", cellEl, q)
    createElement("div", "back answer", cellEl, a)
    questionEl.id = id
    return questionEl
}
function createEmptyCell() {
    return createElement("div", "cell-group grid-cell empty");
}

function renderGrid(game) {
    gridEl.innerHTML = ''
    const categories = game.getCategories();
    const maxQuestions = Math.max(...categories.map(c => c.getQuestions().length));

    for (let i = 0; i <= maxQuestions; i++) {
        let className;
        switch (i) {
            case 0: // Categories
                className = "grid-row grid-row-cats";
                break;
            case 1: // Questions first line
                className = "grid-row grid-row-questions grid-first-row";
                break;
            case maxQuestions: // Questions last line
                className = "grid-row grid-row-questions grid-last-row";
                break;
            default:
                className = "grid-row grid-row-questions"
        }

        const gridRowEl = createElement('div', className, gridEl);

        for (let j = 0; j < categories.length; j++) {
            let cellEl;
            const category = categories[j];
            if (i === 0) { // Category
                cellEl = createCategoryCell(category.getName());
            } else { // Question
                const q = category.getQuestion(i - 1);
                if (q) {
                    cellEl = createQuestionCell(q.hashCode(), q.getQuestion(), q.getAnswer(), q.getPoints(), q.isAsked());
                    cellEl.onclick = () => {
                        getCurrentGame().setLastQuestion(q)
                        renderState({"page": "slide", "cell": q.hashCode()})
                    }
                } else
                    cellEl = createEmptyCell();
            }
            cellEl.setAttribute('data-row', i.toString());
            cellEl.setAttribute('data-col', j.toString());
            gridRowEl.appendChild(cellEl)
        }
    }
}

function removeClass(selector, cls) {
    for (const el of document.querySelectorAll(selector))
        el.classList.remove(cls);
}

function debounce(func, wait, immediate) {
    let timeout;
    if (immediate) return func
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait)
    };
}

function on(eventName, elementSelector, handler, extra) {
    document.addEventListener(eventName, function (e) {
        // loop parent nodes from the target to the delegation node
        for (let target = e.target; target && target !== this; target = target.parentNode) {
            if (matches(target, elementSelector)) {
                handler.call(target, e);
                break;
            }
        }
    }, extra || false);
}

function ready(fn) {
    if (document.readyState !== 'loading' && document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
}

const game = {
    game: null
}
initial_state = {"page": "menu"}

function loadGame(key) {
    const state = getState(key)
    let _game;
    if (state) {
        const {name} = state
        _game = new Kuldvillak(name)
        _game.loadState(state)
    } else {
        _game = new Kuldvillak('Kuldvillak')
        _game.loadData(gameData)
    }

    setCurrentGame(_game)
    renderGrid(_game)
    resize()
    return _game
}

function getCurrentGame() {
    return game.game;
}

function setCurrentGame(_game) {
    game.game = _game
}

function clearState() {
    const state = getState()
    if (state) {
        state["teams"] = []
        state["inerts"] = []
        localStorage.setItem(state.id, JSON.stringify(state))
        newReady()
    }
}

function getState(key) {
    const state = localStorage.getItem(key ? key : getCurrentGame().hashCode())
    return state ? JSON.parse(state) : null;
}

function saveState() {
    const _game = getCurrentGame()
    localStorage.setItem(_game.hashCode(), JSON.stringify(_game.getState()))
}

window.addEventListener("resize", debounce(resize, 40, false));

gameChooserEl.onchange = (e) => loadGame(e.target.value)

const newReady = function () {
    gameChooserEl.innerHTML = ''
    for (let i = 0, len = localStorage.length; i < len; ++i ) {
        const state = JSON.parse(localStorage.getItem(localStorage.key( i )))
        if (i === 0)  loadGame(state.id)
        const opt = document.createElement('option')
        opt.appendChild(document.createTextNode(state.name));
        opt.value = state.id
        gameChooserEl.appendChild(opt)
    }
    renderState(initial_state)
}

ready(newReady)

function renderMenu() {
    const old_state = getState()
    optionsEl.style.display = "block";
    if (!old_state || (!old_state.teams.length && !old_state.inerts.length)) {
        submitEl.value = "Start";
        resetEl.style.display = "none";
        teamChooserEl.value = 2; // DEFAULT VALUE
    } else {
        submitEl.value = "Continue"
        resetEl.style.display = ""
        teamChooserEl.value = old_state.teams.length;
    }
}

function renderState(state) {
    if (state)
        history.pushState(state, "Game");
    else
        state = window.history.state

    optionsEl.style.display = "none";
    teamsEl.style.display = "none";
    gameplayEl.style.filter = "";

    modal.is_open = false;
    modalEl.style.display = "none";
    modalEl.classList.remove("expanded");
    modalEl.style.borderWidth = "3px";

    if (state.page === "menu") {
        renderMenu();
    } else {
        teamsEl.style.display = "flex";
        gameplayEl.style.filter = "blur(0px)";
        if (state.page === "slide")
            modal.show(getCurrentGame().getQuestion(state.cell), true);
    }
}

window.onpopstate = () => renderState();

const shrink_cell_cache = {};
let enable_caching = true;

function shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms) {
    let cached;
    let cache_key;
    if (enable_caching) {
        cache_key = [max_width, max_height, $cell.innerHTML].join(".");
        cached = shrink_cell_cache[cache_key];
    } else
        return _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms);

    if (cached) {
        $scaler.style.fontSize = cached.font_size + "px";
        $scaler.style.transform = (transforms || "") + " scale(" + cached.scale + ") ";
    } else
        shrink_cell_cache[cache_key] = _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms);
}

function shrink_in_place(max_font_size, min_font_size) {
    const a = {length: max_font_size + 1}
    let font_size = binarySearch(a, (el, array, font_size) => {
        modalInnerEl.style.fontSize = font_size + "px";
        const isHorizontalScrollbar = modalInnerEl.scrollWidth > modalInnerEl.clientWidth;
        const isVerticalScrollbar = modalInnerEl.scrollHeight > modalInnerEl.clientHeight;
        return isHorizontalScrollbar || isVerticalScrollbar
    });
    font_size = font_size - 1
    font_size = Math.max(min_font_size, Math.min(font_size, max_font_size));
    modalInnerEl.style.fontSize = font_size + "px";
    return font_size;
}

function binarySearch(array, pred) {
    let lo = -1, hi = array.length;
    while (1 + lo < hi) {
        const mi = lo + ((hi - lo) >> 1);
        if (pred(array[mi], array, mi)) hi = mi;
        else lo = mi;
    }
    return hi;
}

function _shrink_cell($cell, $scaler, max_width, max_height, max_font_size, transforms, min_font_size) {
    if (min_font_size === undefined)
        min_font_size = 1;

    let font_size = Math.max(min_font_size, max_font_size);

    if (!$scaler) return {font_size: font_size}

    $cell.style.fontSize = "";
    $scaler.style.fontSize = font_size + "px";
    $scaler.style.transform = "";

    const extra_width = 0
    const extra_height = 0

    const bbox = getBoundingClientRect($scaler);
    const w = bbox.width;
    const h = bbox.height;
    const scale = Math.min(1, Math.min((max_width - extra_width) / w, (max_height - extra_height) / h));
    if (scale !== 1) {
        //debugger;
    }
    $scaler.style.transform = (transforms || "") + " scale(" + scale + ") ";

    return {font_size: font_size, scale: scale};
}

function getBoundingClientRect(el) {
    const bbox = el.getBoundingClientRect();

    return {
        top: bbox.top + (window.scrollY || document.documentElement.scrollTop || 0),
        left: bbox.left + (window.scrollX || document.documentElement.scrollLeft || 0),
        width: bbox.width,
        height: bbox.height,
        x: bbox.x,
        y: bbox.y
    }
}

function matches(el, selector) {
    return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
}

function prepwork(cell, scale_factor) {
    if (scale_factor === undefined) scale_factor = 1;

    const width = cell.parentElement.clientWidth;
    const height = cell.parentElement.clientHeight;
    const inner = cell.querySelectorAll(".cell-inner")[0];

    shrink_cell(cell, inner, width * scale_factor, height * scale_factor, 32, "");
    return inner
}

function minirender(grid, question_scale_factor) {
    if (question_scale_factor === undefined)
        question_scale_factor = 1;

    miniresize(grid, grid.querySelectorAll(".grid-row-cats .cell"), true, 1);
    miniresize(grid, grid.querySelectorAll(".grid-row-questions .cell"), false, question_scale_factor);
}

function miniresize(grid, cells, is_cats, scale_factor) {
    if (is_cats) {
        const cat = grid.querySelectorAll(".grid-row-cats")[0]
        cat.style.height = "auto";
        let max_height = 0;
        for (const cell of cells) {
            const inner = prepwork(cell);
            cell.client_height = inner.clientHeight;
            max_height = Math.max(max_height, inner.clientHeight);
        }
        cat.style.height = max_height + "px";
    } else
        for (const cell of cells)
            prepwork(cell, scale_factor)
}

function resize() {
    let bbox_teams = getBoundingClientRect(teamsEl)
    let rows = document.querySelectorAll(".grid-row").length;
    let h;
    if (bbox_teams.height === 0) h = window.innerHeight;
    else h = bbox_teams.top + ((window.innerHeight - bbox_teams.height) / (rows)) / 4

    gridEl.style.height = h + "px";
    minirender(gridEl, .8);
}

game.init = function () {
    let val = parseInt(teamChooserEl.value)
    if (val < 0) {
        teamChooserEl.value = 0
        return alert("Teams count must be >= 0")
    }

    const _game = getCurrentGame()
    const teams = _game.getTeams()

    teamsEl.innerHTML = ''

    if (val < teams.length) {
        for (let i = val - 1; i < val; i++)
            _game.getTeams()[i].inactive()
    } else if (val > teams.length) {
        for (let i = teams.length; i < val; i++)
            _game.addTeam(new Team("Team " + (i + 1), 0))
    }
    for (let i = 0; i < val; i++) {
        const team = _game.getTeams()[i]
        team.active()
        createTeamTab(team)
    }
    saveState()
    renderState({"page": "game"})
    resize()
}

let modal = function () {}
modal.hide = function () {
    modalAnswerEl.classList.remove("reveal");
    renderState({"page": "game"});
}
modal.reveal = function () {
    modalAnswerEl.classList.add("reveal");
    const _game = getCurrentGame()
    const question = _game.getLastQuestion()
    question.asked()
    _game.addAnsweredQuestion(question)
    document.getElementById(question.hashCode()).classList.add("inert");
    saveState()
}
modal.show = function (question) {
    modalTitleEl.innerText = question.getCategory().getName() + " " + question.getPoints()

    const questionEl = document.getElementById(question.hashCode())
    let bbox = questionEl.getBoundingClientRect();

    modalEl.style.display = "block";
    modalEl.style.opacity = "0";

    let position_of_top = getBoundingClientRect(modalBodyEl).top;
    let position_of_bottom = getBoundingClientRect(teamsEl).top || window.innerHeight;
    let h = position_of_bottom - position_of_top - 20 // 20 pixels for some extra room

    modalBodyEl.style.maxHeight = h + "px";
    modalInnerEl.style.height = h + "px";

    modalQuestionEl.innerText = question.getQuestion()
    modalAnswerEl.innerText = question.getAnswer()
    shrink_in_place(100, 24);

    modalEl.style.transform = `translate(${bbox.left}px, ${bbox.top}px) scale(${bbox.width / window.innerWidth}, ${bbox.height / window.innerHeight})`
    modalEl.style.opacity = "1";

    removeClass(".expanded", "expanded");
    setTimeout(() => {
        modalEl.classList.add("expanded");
        modalEl.style.top = "0";
        modalEl.style.left = "0";
        modalEl.style.bottom = "0";
        modalEl.style.right = "0";
        modalEl.style.width = "100%";
        modalEl.style.height = "100%";
        modalEl.style.borderWidth = "0";
        modalEl.style.transform = "translate(0px, 0px) scale(1)"
    }, 1);
    modal.is_open = true; // flag for the keyboard event
}

on("click", "#answer-button", () => modal.reveal());
on("click", "#continue-button", () => modal.hide());
on("click", "#menu-picker", () => renderState({"page": "menu"}));
on("click", "#submit", () => game.init());
on("click", "#reset-all", () => {
    if (confirm("This will clear the scores and team names, and start a new game. Click OK if you want to do this"))
        clearState();
});

window.addEventListener("keydown", (e) => {
    if (modal.is_open) {
        if (e.keyCode === ESC) {
            e.preventDefault();
            modal.hide();
        } else if (e.keyCode === SPACE) {
            e.preventDefault();
            modal.reveal();
        }
    }
}, false);