document.getElementById("login-form").addEventListener("submit", 
    function (e){
        e.preventDefault();
        const username = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        if (username === "coug@CTP.com" && password === "123coug") {
            window.location.href = "dashboard.html";
        }
        else {
            alert("Invalid Credentials");
        }
    });

    console.log('script.js loaded');