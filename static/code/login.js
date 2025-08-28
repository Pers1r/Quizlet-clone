// app.js
// NOTE: This script relies on the global Vue object loaded from the CDN in index.html.
// We use Vue 3 'global' build so there is no bundler or build step needed.

const { createApp, reactive, ref } = Vue;

createApp({
    setup() {
        // toggle between register and login. `ref` creates a reactive scalar
        const isRegister = ref(false);

        // show a "creating..." state during simulated registration
        const isCreating = ref(false);

        // form object holds input values. reactive() makes nested properties reactive
        const form = reactive({
            username: '',
            password: '',
            password2: ''
        });

        // simple error store
        const errors = reactive({
            general: ''
        });

        // Switch between modes (login/register)
        function switchMode(toRegister) {
            isRegister.value = !!toRegister;     // !! ensures boolean
            errors.general = '';                // clear previous errors
            // note: we intentionally keep form values (so user doesn't lose typed username),
        }

        function createNewAccount() {
            switchMode(true);
        }

        // submit handler for both login and register
        async function submit() {
            errors.general = '';

            // Basic validation
            if (!form.username.trim()) {
                errors.general = 'Please enter a username.';
                return;
            }
            if (!form.password) {
                errors.general = 'Please enter a password.';
                return;
            }

            const csrf = window.__CSRF__ ?? window.__CSRF ?? null;
            if (!csrf) {
                console.warn('CSRF token missing on page (window.__CSRF__ or window.__CSRF).');
            }

            if (isRegister.value) {
                if (!form.password2) {
                    errors.general = 'Please repeat your password.';
                    return;
                }
                if (form.password !== form.password2) {
                    errors.general = 'Passwords do not match.';
                    return;
                }

                isCreating.value = true;
                try {
                    const res = await fetch('/api/register', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
                        body: JSON.stringify({ username: form.username, password: form.password })
                    })
                    const data = await res.json()
                    console.log('register response', res.status, data);

                    if (!res.ok) {
                        errors.general = data.error || `Registration failed (status ${res.status})`;
                        return;
                    }
                    alert('Account created. Please log in.');
                    switchMode(false);
                    form.password = ''; form.password2 = '';

                } catch (err) {
                    errors.general = 'Could not create account. Try again later.';
                } finally {
                    isCreating.value = false;
                }

            } else {
                try {
                    const res = await fetch('/api/login', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
                        body: JSON.stringify({ username: form.username, password: form.password })
                    })
                    const data = await res.json()
                    if (!res.ok) {
                        errors.general = data.error || 'Login failed.';
                        return;
                    }

                    window.location.href = '/';
                    switchMode(false);
                    form.password = ''; form.password2 = '';

                } catch (err) {
                    errors.general = 'Try again later.';
                } finally {
                    form.password = ''
                }
            }
        }

        // expose to template
        return {
            isRegister,
            form,
            errors,
            isCreating,
            switchMode,
            submit,
            createNewAccount
        };
    }
}).mount('#app');
