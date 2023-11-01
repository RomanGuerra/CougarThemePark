/*
This is the login script used 
for users to access the website.
*/

document.getElementById("login-form").addEventListener("submit",
    function (e){
        e.preventDefault();
        const username = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Hash passwords here
        if (username === "coug@CTP.com" && password === "123coug") {
            window.location.href = "dashboard.html";
        }
        // ADMIN - USER
        else if (username === "uh@CTP.com" && password === "codecoug") {
            window.location.href = "1addvisitor.html";
        }
        // SALES EMPLOYEE - USER
        else {
            alert("Invalid Credentials");
        }
    });
    console.log('login.js loaded');