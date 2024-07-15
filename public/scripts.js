document.addEventListener('DOMContentLoaded', (event) => {
    const crosswordLayout = [
        ['$', '1', ' ', ' ', ' ', ' ', '2', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '3', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '4', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '$', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', '5', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['6', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '7', ' ', ' ', ' ', ' ', ' ', '$', '$', ' ', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', ' ', '$', '$', '$', '$'],
        ['$', '$', '8', '$', '9', '$', ' ', '$', '$', '10', '', ' ', ' ', ' ', ' ', '11 ','', ' ', ' ', ' ', ' ', ' '],
        ['$', '$', ' ', '$', ' ', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$'],
        ['$', '12',' ', ' ', ' ', ' ', ' ', '$', '$', '$', '$', '$', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$'],
        ['$', '$', ' ', '$', ' ', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', ' ', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', ' ', '$', '$', '$', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', ' ', '$', '13',' ', ' ', ' ', ' ', ' ', ' ', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$']
    ];

    const crosswordElement = document.getElementById('crossword');

    crosswordLayout.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const input = document.createElement('input');
            input.setAttribute('maxlength', '1');
            input.dataset.row = rowIndex;
            input.dataset.cell = cellIndex;

            input.value = cell;
            if (cell == '$') {
                input.style.visibility= 'hidden';
            }
            crosswordElement.appendChild(input);

            input.addEventListener('input', handleInput);
        });
    });

    async function handleInput(event) {
        const input = event.target;
        const row = input.dataset.row;
        const cell = input.dataset.cell;

        let direction;
        const leftCell = document.querySelector(`input[data-row="${row}"][data-cell="${parseInt(cell) - 1}"]`);
        const rightCell = document.querySelector(`input[data-row="${row}"][data-cell="${parseInt(cell) + 1}"]`);
        const upCell = document.querySelector(`input[data-row="${parseInt(row) - 1}"][data-cell="${cell}"]`);
        const downCell = document.querySelector(`input[data-row="${parseInt(row) + 1}"][data-cell="${cell}"]`);

        // Check both left and right sides for "$"
        const isDown = (leftCell && leftCell.value === '$') && (rightCell && rightCell.value === '$');
        // Check both up and down sides for "$"
        const isAcross = (upCell && upCell.value === '$') && (downCell && downCell.value === '$');

        if (isDown && !isAcross) {
            direction = 'down';
        } else {
            direction = 'across';
        }

        let inputs, currentWord, number;
        if (direction === 'across') {
            inputs = Array.from(document.querySelectorAll(`input[data-row="${row}"]`));
            currentWord = inputs.map(input => input.value).join('').replace(/\$/, '');
            number = (parseInt(row) + 1).toString();
        } else if (direction === 'down') {
            inputs = Array.from(document.querySelectorAll(`input[data-cell="${cell}"]`));
            currentWord = inputs.map(input => input.value).join('').replace(/\$/, '');
            number = (parseInt(cell) + 1).toString();
        }

        // window.alert(JSON.stringify({
        //     direction: direction,
        //     number: number, 
        //     answer: currentWord,
        //     leftcell: leftCell.value,
        //     rightCell: rightCell.value,
        //     upCell: upCell.value,
        //     downCell: downCell.value
        // }));

        // Replace with your backend URL
        const API_URL = 'http://localhost:5000/check';

        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                direction: direction,
                number: number, // Adjust based on your crossword numbering
                answer: currentWord
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.correct) {
                if (direction === 'across') {
                    const rowInputs = Array.from(document.querySelectorAll(`input[data-row="${row}"]`));
                    const currentRowValues = rowInputs.map(input => input.value.toUpperCase()).join('');
                    const correctAnswer = data.correctAnswer.toUpperCase();
                    const startIndex = currentRowValues.indexOf(correctAnswer[0]);
        
                    if (startIndex !== -1) {
                        for (let i = startIndex; i < startIndex + correctAnswer.length; i++) {
                            rowInputs[i].classList.add('correct');
                        }
                    }
                } else if (direction === 'down') {
                    const columnIndex = parseInt(cell);
                    const columnInputs = Array.from(document.querySelectorAll(`input[data-cell="${columnIndex}"]`));
                    const currentColumnValues = columnInputs.map(input => input.value.toUpperCase()).join('');
                    const correctAnswer = data.correctAnswer.toUpperCase();
                    const startIndex = currentColumnValues.indexOf(correctAnswer[0]);
        
                    if (startIndex !== -1) {
                        for (let i = startIndex; i < startIndex + correctAnswer.length; i++) {
                            columnInputs[i].classList.add('correct');
                        }
                    }
                }
            } else {
                // Clear incorrect inputs except for the matching letters
                // if (direction === 'across') {
                //     inputs.forEach((input, index) => {
                //         if (input.value !== data.correctAnswer[index]) {
                //             input.value = '';
                //         }
                //     });
                // } else if (direction === 'down') {
                //     // Find the correct inputs in the same column
                //     const columnIndex = parseInt(cell);
                //     const inputsInColumn = Array.from(document.querySelectorAll(`input[data-cell="${columnIndex}"]`));
                //     inputsInColumn.forEach((input, index) => {
                //         if (input.value !== data.correctAnswer[index]) {
                //             input.value = '';
                //         }
                //     });
                // }
            }
        });
    }
});
