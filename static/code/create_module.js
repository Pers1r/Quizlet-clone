const {createApp, reactive} = Vue;

createApp({
    setup() {

        console.log('Vue setup() called');

        const name = Vue.ref('');
        const description = Vue.ref('');
        const cards = Vue.reactive([{ term: '', dfn: '' }]);
        const error = Vue.ref('');
        const success = Vue.ref('')
        const csrf = window.__CSRF__;

        function add() { cards.push({ term: '', dfn: '' }); }
        function remove(i) { cards.splice(i, 1); }

        async function createAndPractice() {
            // maybe set a flag that you want to practice after creation, or redirect to /flashcard_module/:id
            await submit(); // reuse submit logic
            // then redirect to the module practice page (if submit succeeded)
        }

        async function submit() {
            error.value = '';
            success.value = '';

            if (!name.value || !name.value.trim()) {
                error.value = 'Module name is required';
                return;
            }

            const validCards = cards.filter( c => c.term.trim() && c.dfn.trim());
            if (validCards.length === 0) {
                error.value = 'At least one complete card is required';
                return;
            }

            const payload = {
                name: name.value,
                description: description.value,
                cards: validCards
            };

            try {
                const res = await fetch('api/modules', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
                    body: JSON.stringify(payload)
                });
                const data = await res.json()
                if (!res.ok) {
                    error.value = data.error || 'Could not create a module'
                    return;
                }

                success.value = 'Module created successfully!'
                window.location.href = '/';
            } catch (err) {
                error.value = 'Network error';
            }
        }
        return { name, description, cards, error, success, add, remove, submit };
    }
}).mount('#app');
