const glitchOverlay = document.querySelector('.glitch-overlay');
const glitchContainer = document.querySelector('.glitch-container');

let glitchInterval;

function startGlitch() {
    glitchOverlay.style.opacity = 1;
    glitchOverlay.style.transform = `translate(${getRandomInt(-3, 3)}px, ${getRandomInt(-3, 3)}px)`;
    
    glitchInterval = setInterval(() => {
        glitchOverlay.style.transform = `translate(${getRandomInt(-3, 3)}px, ${getRandomInt(-3, 3)}px)`;
        glitchOverlay.style.opacity = Math.random() * 1;
    }, 250);
}

function stopGlitch() {
    clearInterval(glitchInterval);

    glitchOverlay.style.opacity = 0;
    glitchOverlay.style.transform = 'translate(0, 0)';
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

glitchContainer.addEventListener("click", function() {
    window.location.href = "challenge.html";
});

glitchContainer.addEventListener('mouseenter', startGlitch);
glitchContainer.addEventListener('mouseleave', stopGlitch);