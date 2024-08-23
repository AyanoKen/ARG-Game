document.addEventListener('DOMContentLoaded', (event) => {
    const crosswordLayout = [
        ['$', '1', '', '', '', '', '2', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '3', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '4', '', '', '', '', '', '', '', '', '$', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '5', '$', '$', '$', '', '$', '$', '$', '$'],
        ['6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '7', '', '', '', '', '', '$', '$', '', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '', '$', '$', '$', '$'],
        ['$', '$', '8', '$', '9', '$', '', '$', '$', '10', '', '', '', '', '', '11 ','', '', '', '', '', ''],
        ['$', '$', '', '$', '', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$'],
        ['$', '12','', '', '', '', '', '$', '$', '$', '$', '$', '$', '$', '$', '', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '', '$', '', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '', '$', '$', '$', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '', '$', '13','', '', '', '', '', '', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
        ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$']
    ];


    const crosswordElement = document.getElementById('crossword');
    const revealButton = document.getElementById('revealButton');
    const revealText = document.getElementById('revealText');

    const words = [
        'SCHOLAR', 'AUTOMATEDGRADING', 'PERSONALIZATION', 'GEMINI', 'NEURALNETWORK', 'ALPACA', 'BIGDATA',
        'SAMALTMAN', 'TURINGTEST', 'SOPHIA', 'HAL9000', 'BIAS', 'NLP'
    ];

    crosswordLayout.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const input = document.createElement('input');
            input.setAttribute('maxlength', '1');
            input.dataset.row = rowIndex;
            input.dataset.cell = cellIndex;
            input.addEventListener('input', handleInput);

            input.value = cell;

            if (cell !== '$') {
                input.style.visibility = 'visible';
            } else {
                input.style.visibility = 'hidden';
            }
            crosswordElement.appendChild(input);
        });
    });

    async function handleInput(event) {
        const input = event.target;
        const row = input.dataset.row;
        const cell = input.dataset.cell;
        const answer = input.value.toUpperCase();

        if(input.style.pointerEvents == 'none'){
        } else{
            const response = await fetch('http://localhost:5000/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ row, cell, answer })
            });
            const result = await response.json();
    
            if (result.correct) {
                input.style.backgroundColor = 'green';
                input.style.pointerEvents = 'none';
                input.value = result.correctAnswer;
                input.blur();

                if(result.count >= 5){
                    document.getElementById("revealButton").remove();
                    document.getElementById("EndButton").style.visibility = "visible";
                }

            } else {
                input.style.backgroundColor = 'red';
            }
        }

        
    }

    revealButton.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * words.length);
        const word = words[randomIndex];
        revealText.textContent = `${word}`;
        setTimeout(() => {
            revealText.textContent = '';
        }, 3000);
    });

    document.getElementById('EndButton').addEventListener('click',() => {
        fetch('/crossword/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/levels';
            }
        })
        
    });
});
