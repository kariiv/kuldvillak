class GameDataError extends Error {
    constructor(message) {
        super(message); // (1)
        this.name = "GameDataError"; // (2)
    }
}

class Question {
    constructor(question, answer, points) {
        this.question = question
        this.answer = answer
        this.points = parseInt(points)
        this._asked = false // make cell gray
        this.answeredBy = [];
        this.category = null;
    }

    getCategory() {
        return this.category;
    }
    setCategory(category) {
        this.category = category;
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
        this.points = parseInt(points) || 0
    }

    isAsked() {
        return this._asked;
    }
    asked() {
        this._asked = true
    }

    answered(team) {
        if (this.answeredBy.indexOf(team) !== -1) return
        this.answeredBy.push(team)
    }
    removeAnswered(team) {
        if (this.answeredBy.indexOf(team) === -1) return
        this.answeredBy.splice(this.answeredBy.indexOf(team), 1)
    }

    areEmptyValues() {
        return !!!this.getPoints() || !this.getAnswer() || !this.getQuestion()
    }
    isEmpty() {
        return !this.getAnswer() && !this.getQuestion() && !this.getPoints()
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

    getName() {
        return this.name
    }
    setName(name) {
        this.name = name
    }

    addQuestion(question) {
        if (Array.isArray(question)) {
            for (const q of question) this.addQuestion(q)
            return true
        }

        for (const q of this.questions)
            if (q.hashCode() === question.hashCode())
                return false
        question.setCategory(this)
        this.questions.push(question)
        return true
    }
    removeQuestion(question) {
        if (this.questions.indexOf(question) === -1) return
        question.setCategory(null)
        this.questions.splice(this.questions.indexOf(question), 1)
    }

    getQuestions() {
        return this.questions;
    }
    getQuestionById(id) {
        for (const question of this.getQuestions())
            if (question.hashCode() === id)
                return question
        return null
    }
    getQuestion(i) {
        const qs = this.getQuestions()
        if (i + 1 > qs.length) return null
        return qs[i];
    }

    areEmptyValues() {
        for (const question of this.getQuestions())
            if (question.areEmptyValues()) return true
        return false
    }
    isEmpty() {
        for (const q of this.getQuestions())
            if (!q.isEmpty()) return false
        return true
    }

    static makeCategory(data) {
        const c = new Category(data.c)
        for (const q of data.qs)
            c.addQuestion(new Question(q.q, q.a, q.p))
        return c
    }

    getState(end= 0) {
        const data = { c: this.getName() }
        if (end) data["qs"] = this.getQuestions().slice(0,end).map(q => q.getState())
        else data["qs"] = this.getQuestions().map(q => q.getState())
        return data
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
    constructor(name, active = true) {
        this.name = name
        this._active = active

        this.pointsManual = []
        this.correct = []
        this.incorrect = []
    }

    addAnsweredQuestion(question, correct) {
        const inc = this.incorrect.indexOf(question)
        if (inc !== -1) this.incorrect.splice(inc, 1)
        const corr = this.correct.indexOf(question)
        if (corr !== -1) this.correct.splice(corr, 1)

        if (correct && inc === -1) {
            this.correct.push(question)
            question.answered(this)
        }
        else if (!correct && corr === -1) {
            this.incorrect.push(question)
            question.removeAnswered(this)
        }
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

    setManualPoints(points) {
        if (!Array.isArray(points))
            throw TypeError("points must be array of integers.")
        this.pointsManual = points
    }
    setCorrectQuestions(questions) {
        if (!Array.isArray(questions)) throw TypeError("questions must be array of integers.")
        for (const question of questions)
            if (question)
                this.addAnsweredQuestion(question, true)
    }
    setIncorrectQuestions(questions) {
        if (!Array.isArray(questions)) throw TypeError("questions must be array of integers.")
        for (const question of questions)
            if (question)
                this.addAnsweredQuestion(question, false)
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
        state["active"] = this.getStatus()
        state["manual"] = this.pointsManual
        state["correct"] = this.correct.map(question => question.hashCode())
        state["incorrect"] = this.incorrect.map(question => question.hashCode())
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
        this.name = name || ''
        this.teams = []
        this.categories = []
        this.askedQuestions = []
        this.lastQuestion = null
    }

    isStarted() {
        return this.askedQuestions.length > 0
    }
    isFinished() {
        return this.askedQuestions.length === this.getCategories().map(c => c.getQuestions().length).reduce((a,b) => a+b, 0)
    }

    addAskedQuestion(question) {
        if (this.askedQuestions.indexOf(question) !== -1) return
        if (question.isAsked()) return
        question.asked()
        this.askedQuestions.push(question)
    }
    addQuestionToAnswered() {
        return this.lastQuestion === null ? undefined : this.addAskedQuestion(this.lastQuestion)
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

    verifyData(data) {
        if (!Array.isArray(data))
            throw new GameDataError('Data in not list of categories')
        return CategoryValidator(data.map(category => Category.makeCategory(category)))
    }
    loadData(data) {
        for (const category of this.verifyData(data))
            this.addCategory(category)
        return this
    }

    loadState(data) {
        const {name, teams, inerts, c} = data;
        this.loadData(c)

        if (name) this.name = name
        if (!this.getName()) throw new GameDataError("Name is not defined in state")

        if (inerts)
            for (const inert of inerts)
                this.addAskedQuestion(this.getQuestion(inert))

        if (teams)
            for (const team of teams) {
                const {name, active, manual, correct, incorrect} = team
                const loadTeam = new Team(name, active)

                if (manual) loadTeam.setManualPoints(manual)
                if (correct) loadTeam.setCorrectQuestions(correct.map(hashcode => this.getQuestion(hashcode)))
                if (incorrect) loadTeam.setIncorrectQuestions(incorrect.map(hashcode => this.getQuestion(hashcode)))

                this.addTeam(loadTeam)
            }

        return this
    }

    getName() {
        return this.name;
    }

    getState() {
        const state = {}
        state["id"] = this.hashCode()
        state["name"] = this.getName();
        state["teams"] = this.getTeams().map(t => t.getState());
        state["inerts"] = this.askedQuestions.map(q => q.hashCode())
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
            const res = this[originalFunctionName](...args)
            this.emit(listener)
            return res
        }
    }
}

const CategoryValidator = function (categories) {
    CategoryValidator.validators.forEach(validator => validator(categories));
    return categories;
}
CategoryValidator.validators = []
CategoryValidator.addValidator = function (validator) {
    CategoryValidator.validators.push(validator)
}

CategoryValidator.addValidator(categories => {
    for (const category of categories.slice(0,-1))
        if (!category.getName())
            throw new GameDataError('Category has no name')
})
CategoryValidator.addValidator(categories => {
    for (const cat of categories)
        for (const q of cat.getQuestions()) {
            if (!q.getQuestion())
                throw new GameDataError('Question missing "question" value!')
            if (!q.getAnswer())
                throw new GameDataError('Question missing "answer" value!')
            if (!!!q.getPoints())
                throw new GameDataError('Question missing "points" value!')
        }
})
CategoryValidator.addValidator(categories => {
    const ex = {}
    for (const category of categories) {
        if (category.hashCode() in ex)
            throw new GameDataError('Category has matching HashCode "' + category.hashCode() + '"')
        else
            ex[category.hashCode()] = category
    }
})
CategoryValidator.addValidator(categories => {
    const ex = {}
    for (const cat of categories)
        for (const q of cat.getQuestions()) {
            if (q.isEmpty()) continue
            if (q.hashCode() in ex)
                throw new GameDataError('Question has matching HashCode "' + q.hashCode() + '"')
            else
                ex[q.hashCode()] = q
        }
})
CategoryValidator.addValidator(categories => {
    const ex = {}
    for (const cat of categories)
        for (const q of cat.getQuestions()) {
            if (q.isEmpty()) continue
            if (q.getQuestion() in ex)
                throw new GameDataError('Question has matching question name "' + q.getQuestion() + '"')
            else
                ex[q.getQuestion()] = q
        }
})


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