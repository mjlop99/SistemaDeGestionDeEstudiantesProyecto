//login
const loginForm = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');





loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (username.value != '' || password.value != '') {
        try {
            const response = await fetch(`http://localhost:3000/api/public/login`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "correo": username.value,
                    "contrasena": password.value
                })
            });

            if (response.ok) {
                const data = await response.json();
                const role = data.role
                if (role==="director") {

                } else if (role==="maestro"){

                } else if (role==="estudiante"){

                }
                console.log(data);
                localStorage.setItem("accessToken", data.accessToken)
                localStorage.setItem("refreshToken", data.refreshToken)
                await redirigir(role)
            } else if (response.status === 401) {
                // Mostrar un mensaje de error si la solicitud no fue exitosa
                alert("Credenciales incorrectas");
            }

            
        } catch (error) {
            console.log(error);
        }
    }
})
const redirigir = async (role) => {
    console.log("REDIRGIR");
    try {
        const response = await fetch(`http://localhost:3000/api/inicios/${role}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'accessToken': localStorage.getItem('accessToken'),
                'refreshToken': localStorage.getItem('refreshToken'),
            },
        });
        if (response.ok) {
            if (role === 'director') {
                window.location.href = '/directorInicio.html';
            } else if (role === 'maestro') {
                window.location.href = '/inicioMaestros.html';
            } else if (role === 'estudiante') {
                window.location.href = '/estudianteInicio.html';
            }
        }

        console.log(response);


    } catch (error) {
        console.log(error);
    }
}