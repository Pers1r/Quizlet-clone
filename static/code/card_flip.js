(function () {
    const root = document.getElementById('card-storage');
    if (!root) return;
    let cards= [];
    try {
        cards = JSON.parse(root.dataset.cards || '[]');
    } catch (e) {
        console.error('invalid cards JSON', e);
        cards = [];
    }

    const cardEl = document.getElementById('card');
    const termEl = document.getElementById('term');
    const defEl = document.getElementById('definition');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const flipBtn = document.getElementById('flip-btn');
    const progressText = document.getElementById('progress-text');

    if (!cardEl || !termEl || !defEl) return;

    let index = 0;
    const total = cards.length || 1;

    function renderCard() {
            const c = cards[index] || { term: '', dfn: '' };
            termEl.textContent = c.term || '';
            defEl.textContent = c.dfn || c.definition || '';
            progressText.textContent = `${index + 1}/${total}`;
            // reset flip state when switching cards
            cardEl.classList.remove('is-flipped');
            cardEl.setAttribute('aria-pressed', 'false');
        }

        function toggleFlip() {
            const flipped = cardEl.classList.toggle('is-flipped');
            cardEl.setAttribute('aria-pressed', flipped ? 'true' : 'false');
        }

        function goNext() {
            if (index < cards.length - 1) {
                index++;
                renderCard();
            } else {
                // optional: loop to first
                index = 0;
                renderCard();
            }
        }

        function goPrev() {
            if (index > 0) {
                index--;
                renderCard();
            } else {
                index = cards.length - 1;
                renderCard();
            }
        }

        // Event bindings
        cardEl.addEventListener('click', function (e) {
            // clicking the card flips it
            toggleFlip();
        });

        flipBtn && flipBtn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleFlip();
        });

        nextBtn && nextBtn.addEventListener('click', function (e) {
            e.preventDefault();
            goNext();
        });

        prevBtn && prevBtn.addEventListener('click', function (e) {
            e.preventDefault();
            goPrev();
        });

        // keyboard: Enter / Space flips, arrows navigate
        cardEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFlip();
                return;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
                return;
            }
        });

        // also allow global arrow keys when card has focus
        document.addEventListener('keydown', function (e) {
            // only act if user isn't typing into an input
            const active = document.activeElement;
            const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
            if (typing) return;

            if (e.key === 'ArrowRight') {
                goNext();
            } else if (e.key === 'ArrowLeft') {
                goPrev();
            } else if (e.key === ' ' || e.key === 'Enter') {
                // only toggle flip if card is focused or visible
                const after = document.activeElement;
                if (after === cardEl) {
                    toggleFlip();
                }
            }
        });

        // init
        renderCard();
})();