document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const variables = {};

    input.addEventListener('input', () => {
        colorizeInput();
        calculate();
    });

    const resizer = document.getElementById('resizer');
    const inputDiv = document.getElementById('input');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.classList.add('resizing');
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const containerWidth = document.querySelector('.calculator').offsetWidth;
        let newWidth = (e.clientX / containerWidth) * 100;
        newWidth = Math.max(20, Math.min(newWidth, 80)); // Limite entre 20% et 80%
        inputDiv.style.flexBasis = `${newWidth}%`;
    }

    function stopResizing() {
        isResizing = false;
        document.body.classList.remove('resizing');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
    }

    function colorizeInput() {
        const text = input.innerText;
        const colorizedHtml = text.replace(/^(\w+):/gm, '<span class="variable">$1</span>:')
                                  .replace(/(?<=:)(.+)$/gm, '<span class="result">$1</span>');
        input.innerHTML = colorizedHtml;

        // Placer le curseur à la fin du texte
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function calculate() {
        const lines = input.innerText.split('\n');
        let result = '';

        lines.forEach((line, index) => {
            line = line.trim();
            if (line) {
                const [variable, expression] = line.includes(':') ? line.split(':').map(part => part.trim()) : [null, line];
                try {
                    const value = evaluateExpression(expression || variable, variables);
                    if (variable) {
                        variables[variable] = value;
                    }
                    result += `${value}\n`;
                } catch (error) {
                    result += `Erreur: ${error.message}\n`;
                }
            } else {
                result += '\n';
            }
        });

        output.textContent = result;
    }

    function evaluateExpression(expression, variables) {
        const safeEval = new Function(...Object.keys(variables), `return ${expression}`);
        return safeEval(...Object.values(variables));
    }
});
