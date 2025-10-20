// Dark Mode Toggle Component
// Auto-creates button and handles all functionality

(function () {
    // Create the button HTML
    const toggleHTML = `
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            <span class="theme-icon">🌙</span>
        </button>
    `;

    // Insert button into page
    document.addEventListener('DOMContentLoaded', () => {
        document.body.insertAdjacentHTML('beforeend', toggleHTML);

        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');

        // Load saved theme or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

        // Toggle theme on click
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';

            themeToggle.style.animation = 'bounce 0.5s ease';
        });
    });
})();