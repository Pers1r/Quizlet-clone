let cardCount = 2;

document.getElementById("add-card-btn").addEventListener("click", function () {
    cardCount ++;

    const newCard = document.createElement("div")
    newCard.classList.add("card")

    newCard.innerHTML = `
        <p class="card-id">${cardCount}</p>
        <div class="card-line"></div>
        <div class="card-inputs">
            <div class="input-field">
                <input class="card-create-input" name="term_${cardCount}" id="term${cardCount}" type="text">
                <label class="card-input-label" for="term${cardCount}">TERM</label>
            </div>
            <div class="input-field">
                <input class="card-create-input" name="definition_${cardCount}" id="dfn${cardCount}" type="text">
                <label class="card-input-label" for="dfn${cardCount}">DEFINITION</label>
            </div>
        </div>
    `;

    document.querySelector(".cards").appendChild(newCard);
});