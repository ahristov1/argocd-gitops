document.addEventListener("DOMContentLoaded", function () {
    const paragraph = document.querySelector("p");
    let position = 0;
    let direction = 1;

    function moveText() {
        position += direction * 2;

        // Reverse direction at boundaries
        if (position >= window.innerWidth - 200 || position <= 0) {
            direction *= -1;
        }

        paragraph.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(moveText);
    }

    moveText();
});
