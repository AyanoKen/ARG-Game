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
        ['$', '$', '8', '$', '9', '$', '', '$', '$', '10', '', '', '', '', '', '11','', '', '', '', '', ''],
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
        'One of the words is a famous experiment originally called the Imitation Game', 'One of the words is a key figure behind a major AI organization',
         'One of the words is named after a zodiac sign and a Google project', 'One of the words is a robot granted citizenship by a country',
          "One of the words involves layers of 'neurons' in computing", 'One of the words represents enormous volumes of information',
           'One of the words involves computers understanding human language', "One of the words is a classic film's AI with red camera eye",
            'One of the words focuses on tailored educational experiences', 'One of the words automates the scoring of student work',
             'One of the words is an early educational software for geography', 'One of the words is both an animal and an artistic AI tool',
              "One of the words describes AI's potential for prejudiced output."
    ];

        const video = document.getElementById('vid-1');
        const playPauseBtn = document.getElementById('playPauseBtn');

        // Play/Pause functionality
        playPauseBtn.addEventListener('click', () => {
            if (video.paused || video.ended) {
                video.play();
                playPauseBtn.style.display = 'none';

                playPauseBtn.classList.add("hidden");
                video.classList.remove("hidden");
            }
        });

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
            const response = await fetch('/check', {
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

                if(result.count >= 97){
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
