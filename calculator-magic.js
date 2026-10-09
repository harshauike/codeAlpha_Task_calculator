
const screen = document.getElementById("screen");
const expressionDisplay = document.getElementById("expression");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

function updateDisplay() {
    expressionDisplay.textContent = expression
        .replace(/\*/g, " × ")
        .replace(/\//g, " ÷ ")
        .replace(/\+/g, " + ")
        .replace(/-/g, " − ");

    screen.value = expression || "0";
}

// Safely calculate arithmetic expressions
function calculateExpression(input) {
    const tokens = input.match(
        /(?:\d+\.?\d*|\.\d+)|[+\-*/%]/g
    );

    if (!tokens || tokens.join("") !== input) {
        throw new Error("Invalid expression");
    }

    let position = 0;

    function factor() {
        let sign = 1;

        while (tokens[position] === "+" ||
               tokens[position] === "-") {
            if (tokens[position] === "-") sign *= -1;
            position++;
        }

        let value;

        if (tokens[position] === "(") {
            position++;
            value = addSub();

            if (tokens[position] !== ")") {
                throw new Error("Missing bracket");
            }
            position++;
        } else {
            const token = tokens[position++];

            if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
                throw new Error("Invalid number");
            }

            value = Number(token);
        }

        if (tokens[position] === "%") {
            value /= 100;
            position++;
        }

        return sign * value;
    }

    function multiplyDivide() {
        let value = factor();

        while (["*", "/"].includes(tokens[position])) {
            const operator = tokens[position++];
            const next = factor();

            if (operator === "/" && next === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = operator === "*"
                ? value * next
                : value / next;
        }

        return value;
    }

    function addSub() {
        let value = multiplyDivide();

        while (["+", "-"].includes(tokens[position])) {
            const operator = tokens[position++];
            const next = multiplyDivide();

            value = operator === "+"
                ? value + next
                : value - next;
        }

        return value;
    }

    const result = addSub();

    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Invalid calculation");
    }

    return result;
}

function calculate() {
    if (!expression) return;

    try {
        const result = calculateExpression(expression);

        expressionDisplay.textContent = expression
            .replace(/\*/g, " × ")
            .replace(/\//g, " ÷ ");

        expression = String(Number(result.toPrecision(12)));
        screen.value = expression;
        justCalculated = true;
    } catch (error) {
        screen.value = error.message === "Cannot divide by zero"
            ? "Cannot divide by 0"
            : "Invalid input";

        expressionDisplay.textContent = expression;
        expression = "";
        justCalculated = true;
    }
}

function addValue(value) {
    if (justCalculated) {
        if (/[0-9.]/.test(value)) {
            expression = "";
        }
        justCalculated = false;
    }

    if (/[0-9]/.test(value) && value.length === 1) {
        const lastNumber = expression.split(/[+\-*/%]/).pop();

        if (lastNumber === "0") {
            expression = expression.slice(0, -1);
        }
    }

    if (value === ".") {
        const lastNumber = expression.split(/[+\-*/%]/).pop();

        if (lastNumber.includes(".")) return;

        if (!lastNumber) value = "0.";
    }

    if (["+", "*", "/", "%"].includes(value) && !expression) {
        if (value !== "+") return;
    }

    if (["+", "-", "*", "/", "%"].includes(value)) {
        const last = expression.slice(-1);

        if (["+", "-", "*", "/", "%"].includes(last)) {
            expression = expression.slice(0, -1);
        }
    }

    expression += value;
    updateDisplay();
}

function clearAll() {
    expression = "";
    justCalculated = false;
    expressionDisplay.textContent = "";
    screen.value = "0";
}

function deleteLast() {
    if (justCalculated) {
        clearAll();
        return;
    }

    expression = expression.slice(0, -1);
    updateDisplay();
}

function changeSign() {
    if (!expression) return;

    try {
        expression = String(-calculateExpression(expression));
        justCalculated = true;
        updateDisplay();
    } catch {
        // Ignore incomplete expressions.
    }
}

buttons.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.value !== undefined) {
        addValue(button.dataset.value);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            clearAll();
            break;

        case "delete":
            deleteLast();
            break;

        case "calculate":
            calculate();
            break;

        case "sign":
            changeSign();
            break;
    }
});

// Keyboard support
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        addValue(key);
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        addValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape" || key === "Delete") {
        clearAll();
    }
});

updateDisplay();