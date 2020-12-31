
function b64en(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)))
}
function b64de(str) {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

const creatorTable = document.getElementById('creator-table')
const creatorTitle = document.getElementById('creator-title')

const creatorReset = document.getElementById('creator-reset')
const creatorCopy = document.getElementById('creator-copy')
const creatorSave = document.getElementById('creator-save')


function createCategoryTab(category) {
    const catTitleEl = createElement("h4", 'category-title', creatorTable, category.getName());
    catTitleEl.oninput = (e) => category.setName(e.target.innerText)
    catTitleEl.contentEditable = 'true'
    catTitleEl.style.width = "100%"

    const tableEl = createElement('table', "table", creatorTable)
    const trHead = createElement('thead', null, tableEl)
    const tr = createElement('tr', null, trHead)
    createElement('th', null, tr, "Question")
    createElement('th', null, tr, "Answer")
    createElement('th', null, tr, "Points")
    category.h2 = catTitleEl
    category.table = createElement('tbody', null, catTitleEl)
    category.tbody = createElement('tbody', null, tableEl)
}

function createQuestionRow(category, question) {
    const body = category.tbody
    const trEl = createElement('tr', null, body)
    const tQuestion = createElement('td', null, trEl, question.getQuestion())
    const tAnswer = createElement('td', null, trEl, question.getAnswer())
    const tPoints = createElement('td', null, trEl, question.getPoints())
    tQuestion.contentEditable = true
    tAnswer.contentEditable = true
    tPoints.contentEditable = true
    tQuestion.oninput = (e) => {
        question.setQuestion(e.target.innerText)
    }
    tAnswer.oninput = (e) => {
        question.setAnswer(e.target.innerText)
    }
    tPoints.oninput = (e) => {
        question.setPoints(e.target.innerText)
    }
    question.trow = trEl
}

class Creator {
    constructor(categories) {
        this.categories = categories || []
        this.saved = true
        this.init()
    }
    changes(obj, isCat) {
        this.saved = false
        if (isCat) this.changeInCategory(obj)
        else this.changeInQuestion(obj)
    }
    changeInCategory(cat) {
        if (this.isLastCategory(cat)) {
            if (!cat.isEmpty())
                this.newCategory()
        }
        else {
            if (cat.isEmpty()) {
                this.categories.splice(this.categories.indexOf(cat), 1)
                creatorTable.removeChild(cat.table)
                creatorTable.removeChild(cat.h2)
            }
        }
    }
    changeInQuestion(question) {
        if (this.isLastQuestion(question)) {
            this.newTableRow(question.getCategory())
            this.changeInCategory(question.getCategory())
        }
        else {
            if (question.isEmpty()) {
                const cat = question.getCategory()
                const questions = cat.getQuestions()
                questions.splice(questions.indexOf(question), 1)
                cat.tbody.removeChild(question.trow)
                console.log(cat.getQuestions())
                this.changeInCategory(question.getCategory())
            }
        }
    }

    isLastQuestion(q) {
        const questions = q.getCategory().getQuestions()
        return questions.indexOf(q) === questions.length -1
    }
    isLastCategory(c) {
        return this.categories.indexOf(c) === this.categories.length -1
    }
    isSaved() {
        return this.saved
    }
    reset() {
        if (!this.isSaved())
            if (!confirm("This will clear all values in tables. Click OK if you want to reset")) return
        this.categories = []
        this.saved = true
        this.init()
    }
    copy() {
        console.log(this.getCurrentData())
        const en = b64en(JSON.stringify(this.getCurrentData()))
        console.log(en)
        console.log(b64de(en))
    }
    save() {

    }
    getCurrentData() {
        return this.categories.slice(0,-1).map(c => {
            return { c: c.getName(), qs:c.getQuestions().slice(0,-1).map(q => q.getState())}
        })
    }
    init() {
        creatorTable.innerHTML = ''
        this.loadCategories()
        this.newCategory()
    }
    loadCategories() {
        for (const cat of this.categories)
            this.newCategory(cat)
    }
    newCategory(cat) {
        if (!cat) cat = new Category("Category#" + (this.categories.length + 1))
        this.categories.push(cat)
        cat.on('name', (e) => this.changes(e, true))
        createCategoryTab(cat)

        for (const question of cat.getQuestions())
            this.newTableRow(cat, question)
        this.newTableRow(cat)
    }
    newTableRow(category, question) {
        if (!question) {
            question = new Question('', '', 0)
            category.addQuestion(question)
        }

        createQuestionRow(category, question)
        question.on('question', (q) => this.changes(q))
        question.on('answer', (q) => this.changes(q))
        question.on('points', (q) => this.changes(q))
    }
}

const creator = new Creator()

on("click", "#creator-reset", () => creator.reset());
on("click", "#creator-copy", () => creator.copy());
on("click", "#creator-save", () => creator.save());