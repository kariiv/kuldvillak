class Question {
    constructor(question, answer, points) {
        this.question = question
        this.answer = answer
        this.points = points
        this._asked = false // make cell gray
        this.answeredBy = [];
        this.category = null;
    }

    setCategory(category) {
        this.category = category;
    }

    getCategory() {
        return this.category;
    }

    getQuestion() {
        return this.question;
    }
    setQuestion(question) {
        this.question = question
    }

    getAnswer() {
        return this.answer;
    }
    setAnswer(answer) {
        this.answer = answer;
    }

    getPoints() {
        return this.points;
    }
    setPoints(points) {
        this.points = parseInt(points)
    }

    isEmpty() {
        return !this.getAnswer() && !this.getQuestion() && !this.getPoints()
    }

    isAsked() {
        return this._asked;
    }

    asked() {
        this._asked = true
    }

    answered(team) {
        this.answeredBy.push(team)
    }

    getState() {
        return {
            q: this.getQuestion(),
            a: this.getAnswer(),
            p: this.getPoints()
        }
    }

    hashCode() {
        let hash = 0;
        for (const chr of this.getQuestion() + this.getAnswer()) {
            hash = ((hash << 5) - hash) + chr.charCodeAt(0);
            hash |= hash & hash; // Convert to 32bit integer
        }
        return "q" + hash.toString();
    }
}

class Category {
    constructor(name) {
        this.name = name;
        this.questions = [];
    }

    addQuestion(question) {
        question.setCategory(this)
        this.questions.push(question)
    }

    removeQuestion(question) {
        question.setCategory(null)
        this.questions.splice(this.questions.indexOf(question), 1)
    }

    getQuestions() {
        return this.questions;
    }

    getQuestionById(id) {
        for (const question of this.getQuestions())
            if (question.hashCode() === id) return question
        return null
    }

    getQuestion(i) {
        const qs = this.getQuestions()
        if (i + 1 > qs.length) return null
        return qs[i];
    }

    createQuestion(question, answer, points) {
        this.addQuestion(new Question(question, answer, points))
        return this;
    }

    getName() {
        return this.name
    }
    setName(name) {
        this.name = name
    }

    areThereMatching() {
        const ex = {}
        for (const q of this.getQuestions()) {
            if (q.hashCode() in ex) return true
            else ex[q.hashCode()] = true
        }
        return false
    }
    isEmpty() {
        for (const q of this.getQuestions())
            if (!q.isEmpty()) return false
        return true
    }

    getState() {
        return {
            c: this.getName(),
            qs: this.getQuestions().map(q => q.getState())
        }
    }

    hashCode() {
        let hash = 0;
        for (const chr of this.getName()) {
            hash = ((hash << 5) - hash) + chr.charCodeAt(0);
            hash |= 0; // Convert to 32bit integer
        }
        return "c" + hash.toString();
    }
}

class Team {
    constructor(name, points = 0, active = true) {
        this.name = name
        this._active = active

        this.pointsManual = points ? [points,] : []
        this.correct = []
        this.incorrect = []
    }

    addAnsweredQuestion(question, correct) {
        const inc = this.incorrect.indexOf(question)
        if (inc !== -1) this.incorrect.splice(inc, 1)
        const corr = this.correct.indexOf(question)
        if (corr !== -1) this.correct.splice(corr, 1)

        if (correct && inc === -1) this.correct.push(question)
        else if (!correct && corr === -1) this.incorrect.push(question)
    }

    setPoints(points) {
        if (!Number.isInteger(points)) throw new Error('Type must be integer')
        this.pointsManual.push(points - this.getPoints())
    }

    getPoints() {
        const correctPoints = this.correct.map(q => q.getPoints()).reduce((a, b) => a + b, 0);
        const incorrectPoints = this.incorrect.map(q => q.getPoints()).reduce((a, b) => a + b, 0);
        const manualPoints = this.pointsManual.reduce((a, b) => a + b, 0);
        return correctPoints - incorrectPoints + manualPoints;
    }

    setName(name) {
        console.log(name)
        this.name = name
    }

    getName() {
        return this.name
    }

    getStatus() {
        return this._active;
    }

    active() {
        this._active = true;
    }

    inactive() {
        this._active = false;
    }

    getState() {
        const state = {}
        state["name"] = this.getName()
        state["points"] = this.getPoints()
        return state
    }

    hashCode() {
        let hash = 0;
        for (const chr of this.getName()) {
            hash = ((hash << 5) - hash) + chr.charCodeAt(0);
            hash |= 0; // Convert to 32bit integer
        }
        return "t" + hash.toString();
    }
}

class Kuldvillak {

    constructor(name) {
        this.name = name
        this.teams = []
        this.categories = []
        this.answeredQuestions = []
        this.lastQuestion = null
    }

    addAnsweredQuestion(question) {
        for (const q of this.answeredQuestions)
            if (q === question) return
        if (!question.isAsked()) return
        this.answeredQuestions.push(question)
    }

    getQuestion(id) {
        for (const cat of this.getCategories()) {
            const question = cat.getQuestionById(id)
            if (question) return question
        }
        return null
    }

    setLastQuestion(question) {
        this.lastQuestion = question;
    }

    getLastQuestion() {
        return this.lastQuestion;
    }

    addTeam(team) {
        this.teams.push(team)
    }

    removeTeam(team) {
        this.teams.splice(this.teams.indexOf(team), 1)
    }

    getTeams() {
        return this.teams;
    }

    addCategory(category) {
        this.categories.push(category)
    }

    removeCategory(category) {
        this.categories.splice(this.categories.indexOf(category), 1)
    }

    getCategories() {
        return this.categories;
    }

    loadData(data) {
        for (const cat of data) {
            const c = new Category(cat.c)
            for (const q of cat.qs)
                c.addQuestion(new Question(q.q, q.a, q.p))
            this.addCategory(c)
        }
    }

    loadState(data) {
        const {id, teams, inerts, c} = data;
        this.loadData(c)
        if (this.hashCode() !== id) throw new Error("State not belong to this game")
        for (const inert of inerts) {
            const q = this.getQuestion(inert)
            q.asked()
            this.addAnsweredQuestion(q)
        }
        for (const team of teams)
            this.addTeam(new Team(team.name, team.points))
    }

    getName() {
        return this.name;
    }

    getState() {
        const state = {}
        state["id"] = this.hashCode()
        state["name"] = this.getName();
        state["teams"] = this.getTeams().map(t => t.getState());
        state["inerts"] = this.answeredQuestions.map(q => q.hashCode())
        state["c"] = this.getCategories().map(c => c.getState())
        return state
    }

    hashCode() {
        let hash = 0;
        for (const chr of this.getName()) {
            hash = ((hash << 5) - hash) + chr.charCodeAt(0);
            hash |= 0; // Convert to 32bit integer
        }
        return "g" + hash.toString();
    }
}

const ListenerBuilder = function (classObj) {

    classObj.prototype.on = function (event, handler) {
        if (!(event in this.listeners)) return;
        if (this.onListeners === undefined) this.onListeners = {}

        if (event in this.onListeners) this.onListeners[event].push(handler)
        else this.onListeners[event] = [handler,]
    }
    classObj.prototype.emit = function (event) {
        if (!this.onListeners || !(event in this.onListeners)) return;
        for (const handler of this.onListeners[event]) handler(this)
    }
    classObj.addListener = function (func, listener) {
        if (this.prototype.listeners === undefined)
            this.prototype.listeners = {}

        const originalFunctionName = "old_" + func.name // Rename original function
        this.prototype[originalFunctionName] = func

        if (!this.prototype.listeners[listener]) // Add listener key
            this.prototype.listeners[listener] = true

        this.prototype[func.name] = function (...args) { // Run old and then listener
            this[originalFunctionName](...args)
            this.emit(listener)
        }
    }
}

ListenerBuilder(Question)
ListenerBuilder(Category)
ListenerBuilder(Team)
ListenerBuilder(Kuldvillak)

Kuldvillak.addListener(Kuldvillak.prototype.addCategory, "category")
Kuldvillak.addListener(Kuldvillak.prototype.removeCategory, "category")

Kuldvillak.addListener(Kuldvillak.prototype.addTeam, "team")
Kuldvillak.addListener(Kuldvillak.prototype.removeTeam, "team")

Team.addListener(Team.prototype.setPoints, "points")
Team.addListener(Team.prototype.active, "status")

Category.addListener(Category.prototype.setName, "name")
Category.addListener(Category.prototype.addQuestion, "question")
Category.addListener(Category.prototype.addQuestion, "question")
Category.addListener(Category.prototype.removeQuestion, "question")

Question.addListener(Question.prototype.asked, "asked")
Question.addListener(Question.prototype.answered, "answered")

Question.addListener(Question.prototype.setCategory, "category")
Question.addListener(Question.prototype.setQuestion, "question")
Question.addListener(Question.prototype.setAnswer, "answer")
Question.addListener(Question.prototype.setPoints, "points")