window.addEventListener('DOMContentLoaded', async () => {
    const questions = await window.electron.loadChallenges();

    const answersContainer = document.getElementById("answers");
    const imageContainer = document.getElementById("image-challenge");
    const shadersCounter = document.getElementById("shader-count");

    let currentQuestionIndex = 0;
    let correctAnswers = 0;

    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        document.getElementById("question").innerText = question.question;

        if (question.image) {
            imageContainer.innerHTML = `<img src="${question.image}" id="question-image" alt="Question Image" />`;
        } else {
            imageContainer.innerHTML = "";
        }

        answersContainer.innerHTML = '';

        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement("a");
            answerElement.href = "#";
            answerElement.classList.add("answer");
            answerElement.innerHTML = `<span></span><span></span>${answer}`;
            answerElement.addEventListener("click", async function handleAnswerClick(event) {
                event.preventDefault();
                await checkAnswer(index);

                answerElement.removeEventListener("click", handleAnswerClick);
            });
            answersContainer.appendChild(answerElement);
        });
    }

    async function checkAnswer(selectedIndex) {
        const question = questions[currentQuestionIndex];

        if (selectedIndex === question.correctAnswerIndex) {
            correctAnswers++;
        } else {
            const leftShaders = await window.electron.deleteShader();
            shadersCounter.innerHTML = `You have ${leftShaders} shaders left.`;
        }

        if (currentQuestionIndex == questions.length-1) {
            if (correctAnswers == 0) {
                shadersCounter.innerHTML = "You're so done bro.";
                await window.electron.deleteGame();
            } else {
                await window.electron.launchSiege()
            }
            return;
        }

        setTimeout(() => {
            currentQuestionIndex = (currentQuestionIndex + 1);
            displayQuestion();
        }, 1000);
    }

    displayQuestion();
});