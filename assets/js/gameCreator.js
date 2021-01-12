const creatorTable = document.getElementById('creator-table')
const creatorTitle = document.getElementById('creator-title')
const creatorImport = document.getElementById('creator-import')
const creatorCopy = document.getElementById('creator-copy')
const creatorSave = document.getElementById('creator-save')

class CreatorQuestion extends Question {
    constructor(...props) {
        super(...props);

        this.trow = null;

        this.validation = false;
    }

    isValid() {
        return this.validation
    }
    invalid() {
        if (this.trow) this.trow.classList.add('invalid')
        this.validation = false
    }
    valid() {
        if (this.trow) this.trow.classList.remove('invalid')
        this.validation = true
    }
}

class CreatorCategory extends Category {
    constructor(props) {
        super(props);

        this.title = null;
        this.table = null;
        this.tbody = null;

        this.validation = false;
    }

    isValid() {
        return this.validation
    }
    invalid() {
        if (this.title) this.title.classList.add('invalid')
        this.validation = false
    }
    valid() {
        if (this.title) this.title.classList.remove('invalid')
        this.validation = true
    }

    static makeCategory(data) {
        const c = new CreatorCategory(data.c)
        for (const q of data.qs)
            c.addQuestion(new CreatorQuestion(q.q, q.a, q.p))
        return c
    }

    areEmptyValues() {
        if (this.getQuestions().length < 2) return true
        for (const question of this.getQuestions().slice(0,-1))
            if (question.areEmptyValues()) return true
        return false
    }  // overwrite: Removes the last object cause last is always empty
}


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
    category.title = catTitleEl
    category.table = tableEl
    category.tbody = createElement('tbody', null, tableEl)
}
function getCaretPosition() {
    if (window.getSelection && window.getSelection().getRangeAt) {
        const range = window.getSelection().getRangeAt(0);
        const selectedObj = window.getSelection();
        let rangeCount = 0;
        let childNodes = selectedObj.anchorNode.parentNode.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
            if (childNodes[i] === selectedObj.anchorNode) {
                break;
            }
            if (childNodes[i].outerHTML)
                rangeCount += childNodes[i].outerHTML.length;
            else if (childNodes[i].nodeType === 3) {
                rangeCount += childNodes[i].textContent.length;
            }
        }
        return range.startOffset + rangeCount;
    }
    return -1;
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
        const val = e.target.innerText.replace(/[^\d.-]/g, '')
        question.setPoints(val)

        if (question.getPoints().toString() !== e.target.innerText) {
            let pos = getCaretPosition() - 1
            if (pos < 0) pos = 0
            if (pos > question.getPoints().toString().length) pos = question.getPoints().toString().length

            if (val.length === 0)
                e.target.innerText = ''
            else
                e.target.innerText = question.getPoints().toString()

            if (val.length > 0) {
                const range = document.createRange()
                const sel = window.getSelection()
                range.setStart(e.target.childNodes[0], pos)
                range.collapse(true)

                sel.removeAllRanges()
                sel.addRange(range)
            }
        }
    }
    question.trow = trEl
}

class Creator {
    constructor(name) {
        creatorTitle.innerText = name || 'NewGame'
        this.categories = []
        this.categoryValidations = []
        this.questionValidations = []
        this.saved = true
    }

    init() {
        creatorTable.innerHTML = ''
        this.loadCategories()
        this.newCategory()
        this.disableButtons()
    }

    changes(obj, isCat) {
        this.saved = false
        this.setAllToValid()

        if (isCat) this.changeInCategory(obj)
        else this.changeInQuestion(obj)

        this.runValidators()
        this.updateStyle()
    }
    changeInCategory(cat) {
        if (this.isLastCategory(cat)) {
            if (!cat.isEmpty())
                this.newCategory()
        }
        else {
            if (cat.isEmpty()) {
                let pointer = this.categories.indexOf(cat)
                if (this.categories[pointer + 1].isEmpty()) pointer += 1

                const rem = this.categories[pointer]
                this.categories.splice(pointer, 1)
                creatorTable.removeChild(rem.table)
                creatorTable.removeChild(rem.title)
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
                this.changeInCategory(question.getCategory())
            }
        }
    }

    addQuestionValidator(f) {
        this.questionValidations.push(f)
    }
    addCategoryValidator(f) {
        this.categoryValidations.push(f)
    }

    setAllToValid() {
        for (const category of this.categories) {
            category.valid()
            for (const question of category.getQuestions())
                question.valid()
        }
    }
    runValidators() {
        for (const f of this.categoryValidations)
            f.memo = {}

        for (const f of this.questionValidations)
            f.memo = {}

        for (const cat of this.categories) {
            for (const f of this.categoryValidations)
                f(cat, f.memo)

            for (const ques of cat.getQuestions()) {
                if (ques.isEmpty()) continue
                for (const f of this.questionValidations)
                    f(ques, f.memo)
            }
        }
    }
    isTableValid() {
        for (const category of this.categories) {
            if (!category.isValid()) return false
            for (const question of category.getQuestions())
                if (!question.isValid()) return false
        }
        return true;
    }
    areEmptyValues() {
        if (this.categories.length < 2) return true
        for (const cat of this.categories.slice(0,-1)) {
            if (!cat.getName()) return true
            if (cat.areEmptyValues())
                return true
        }
        return false
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

    removePrompt() {
        return this.isSaved() || confirm("Action will clear all the values in table. Click OK if you want to override")
    }
    edit(game) {
        const setData = () => {
            if (!this.removePrompt()) return
            this.loadIn(game.getState().c)
            creatorTitle.innerText = game.getName()
        }
        if (!this.isSaved()) setTimeout(setData, 500)  // 154 minimum value
        else setData()
    }
    reset() {
        if (!this.removePrompt()) return
        creatorTitle.innerText = 'NewGame'
        this.categories = []
        this.saved = true
        this.init()
    }
    save() {
        try {
            const game = new Kuldvillak(creatorTitle.innerText).loadData(this.getCurrentData())
            gameController.addGame(game, true, true)
            alert("Game saved successfully.")
        } catch (e) {
            return alert("Unable to save the game. " + e.message)
        }
        this.saved = true
        this.enableButtons()
    }
    copy() {
        try {
            new Kuldvillak().loadData(this.getCurrentData())
        } catch (e) {
            return alert("Unable to make copy with invalid data. " + e.message)
        }

        const activeEl = document.activeElement; // save focused button element
        try {
            creatorImport.value = LZString.compressToBase64(this.getCurrentData(true))
            console.log(creatorImport.value)
            console.log(creatorImport.value.length,  this.getCurrentData(true).length - creatorImport.value.length)
        } catch (e) {
            return alert("Compress failed" + e.message)
        }
        /* Select the text field */
        creatorImport.select();
        creatorImport.setSelectionRange(0, 9999999); /* For mobile devices */

        /* Copy the text inside the text field */
        document.execCommand("copy");
        creatorImport.value = ''
        activeEl.focus() // set focus back to button
    }
    import() {
        if (!this.removePrompt()) return
        const text = creatorImport.value;
        if (!text) return
        try {
            this.loadIn(JSON.parse(LZString.decompressFromBase64(text)))
        } catch (e) {
            if (e.name === 'SyntaxError') alert('Import value is not JSON')
            else alert('Import failed. ' + e.message)
            return
        }
        creatorTitle.innerText = 'ImportGame'
    }

    loadIn(data) {
        this.categories = data.map(category => CreatorCategory.makeCategory(category))
        this.saved = false
        this.init()

        this.setAllToValid()
        this.runValidators()
        this.updateStyle()
    }

    getCurrentData(stringify) {
        const data = this.categories.slice(0, -1).map(c => c.getState(-1))
        return stringify ? JSON.stringify(data) : data;
    }

    loadCategories() {
        for (const cat of this.categories)
            this.newCategory(cat)
    }
    newCategory(cat) {
        if (!cat) {
            cat = new CreatorCategory("Category#" + (this.categories.length + 1))
            this.categories.push(cat)
        }
        cat.on('name', (e) => this.changes(e, true))
        createCategoryTab(cat)

        for (const question of cat.getQuestions())
            this.newTableRow(cat, question)
        this.newTableRow(cat)
    }
    newTableRow(category, question) {
        if (!question) {
            question = new CreatorQuestion('', '', 0)
            if (!category.addQuestion(question))
                return
        }
        createQuestionRow(category, question)
        question.on('question', (q) => this.changes(q))
        question.on('answer', (q) => this.changes(q))
        question.on('points', (q) => this.changes(q))
    }

    updateStyle() {
        if (!this.areEmptyValues() && this.isTableValid()) this.enableButtons()
        else this.disableButtons()
    }

    disableButtons() {
        creatorCopy.setAttribute("disabled", "")
        creatorSave.setAttribute("disabled", "")
    }
    enableButtons() {
        creatorCopy.removeAttribute("disabled")
        if (!this.saved) creatorSave.removeAttribute("disabled")
    }
}

// START OF VALIDATIONS
function missingCategoryProps(category) {
    return !category.getName()
}
function validateByKey(key, obj, memo) {
    if (key in memo) {
        memo[key].invalid()
        obj.invalid()
    }
    memo[key] = obj
}
function matchingCategories(category, memo) {
    validateByKey(category.hashCode(), category, memo)
}
function matchingQuestionsHashCode(question, memo) {
    validateByKey(question.hashCode(), question, memo)
}
function matchingQuestions(question, memo) {
    validateByKey(question.getQuestion(), question, memo)
}
/// END OF VALIDATIONS

const creator = new Creator()

creator.addCategoryValidator(missingCategoryProps)
creator.addCategoryValidator(matchingCategories)

creator.addQuestionValidator(matchingQuestionsHashCode)
creator.addQuestionValidator(matchingQuestions)

creator.init()

on("click", "#creator-reset", () => creator.reset());
on("click", "#creator-copy", () => creator.copy());
on("click", "#creator-save", () => creator.save());
on("click", "#import-btn", () => creator.import());
on("click", "#edit-game", () => {
    creator.edit(gameController.getCurrentGame())
});