document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    const predefinedUsername = 'admin';
    const predefinedPassword = '1234';

    if (username === predefinedUsername && password === predefinedPassword) {
        alert('Inicio de sesión exitoso');
       
        window.location.href = 'UsDirect.html'; 
    } else {
        alert('Nombre de usuario o contraseña incorrectos');
    }
});

