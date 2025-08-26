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
      // but you can reset fields here if you prefer:
      // form.username = ''; form.password = ''; form.password2 = '';
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

      if (isRegister.value) {
        if (!form.password2) {
          errors.general = 'Please repeat your password.';
          return;
        }
        if (form.password !== form.password2) {
          errors.general = 'Passwords do not match.';
          return;
        }

        // Simulate server request with a small delay
        isCreating.value = true;
        try {
          await new Promise(resolve => setTimeout(resolve, 900));
          console.log('REGISTER (demo):', { username: form.username });
          alert('Account created (demo). You can now log in.');
          switchMode(false);
          form.password = '';
          form.password2 = '';
        } catch (err) {
          errors.general = 'Could not create account. Try again later.';
        } finally {
          isCreating.value = false;
        }

      } else {
        // LOGIN flow (demo)
        console.log('LOGIN (demo):', { username: form.username });
        alert('Logged in (demo).');
        form.password = '';
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
