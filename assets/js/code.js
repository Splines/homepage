let blocks = document.querySelectorAll(".code-figure");
blocks.forEach((block) => {
    const button = block.querySelector(".code-copy-btn");
    if (!navigator.clipboard) {
        console.warn("Your browser does not support the Clipboard API."
            + " The copy button will be hidden.");
        button.style.display = "none";
        return;
    }

    button.addEventListener("click", async () => {
        await copyCode(block);
    });
});

async function copyCode(block) {
    let code = block.querySelector("code");
    let text = code.innerText;
    await navigator.clipboard.writeText(text);

    // visual feedback
    let copyIcon = block.querySelector(".code-copy-icon-clipboard");
    let tickIcon = block.querySelector(".code-copy-icon-tick");
    toggleIcons(copyIcon, tickIcon);
    setTimeout(() => {
        toggleIcons(tickIcon, copyIcon);
    }, 1300);
}

function toggleIcons(icon1, icon2) {
    icon1.style.opacity = 0;
    icon1.style.transform = "scale(0)";
    icon2.style.opacity = 1;
    icon2.style.transform = "scale(1)";
}
