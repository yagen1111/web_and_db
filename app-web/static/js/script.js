// WEB-APP/static/js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // הוספת אנימציה לכפתורים
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s';
        });
    });

    // סגירה אוטומטית של הודעות
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 1s';
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 1000);
        }, 5000);
    });

    // ולידציה צד לקוח בסיסית
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            const inputs = form.querySelectorAll('input[required]');
            let valid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    valid = false;
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                }
            });
            
            if (!valid) {
                event.preventDefault();
                alert('אנא מלא את כל השדות הנדרשים');
            }
        });
    }
});