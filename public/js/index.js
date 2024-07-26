import "core-js";
import "regenerator-runtime";
import displayMap from "./leafletMap.js";
import { login, logout } from "./login.js";
import { signUp } from "./signUp.js";
import { updateSettings } from "./updateSettings.js";
import bookTour from "./stripe.js";
import alertFunctions from "./alerts.js";

//? DOM elements
const leafletMap = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const signUpForm = document.querySelector(".form--signUp");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.querySelector("#book-tour");

//.
//? Displaying map in the tour page
if (leafletMap) {
   const locations = JSON.parse(leafletMap.dataset.locations);
   displayMap(locations);
}

//.
//? Listening to submit event of the login form
if (loginForm) {
   loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
   });
}

//.
//? Listening to submit event of the signUp form
if (signUpForm) {
   signUpForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("passwordConfirm").value;
      signUp(name, email, password, passwordConfirm);
   });
}

//.
//? Listening to logout btn
if (logoutBtn) {
   logoutBtn.addEventListener("click", logout);
}

//.
//? Listening to save settings
if (userDataForm) {
   userDataForm.addEventListener("submit", (e) => {
      e.preventDefault();

      /// construct instance of FormData with "form fields" and their "values" --
      /// --for Ajax calls that requires multipart/form-data encoding [For images].
      //1.
      const form = new FormData();
      form.append("name", document.querySelector("#name").value);
      form.append("email", document.querySelector("#email").value);
      form.append("photo", document.querySelector("#photo").files[0]);

      updateSettings(form, "data");
   });
}

//.
//? Listening to save password
if (userPasswordForm) {
   userPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      document.querySelector(".btn-save-password").textContent =
         "updating.....";
      const passwordCurrent = document.querySelector("#password-current").value;
      const password = document.querySelector("#password").value;
      const passwordConfirm = document.querySelector("#password-confirm").value;

      updateSettings(
         { passwordCurrent, password, passwordConfirm },
         "password"
      );

      document.querySelector(".btn-save-password").textContent =
         "save password";
      document.querySelector("#password-current").value = "";
      document.querySelector("#password").value = "";
      document.querySelector("#password-confirm").value = "";
   });
}

//.
// //? Rendering the booking page of stripe on front end
///Steps to render checkout page on server side:-
/// 1. comment following
///     a. stripe.js
///     b. Below code
/// 2. UnComment following
///     a. tour.pug -> form(action=`/checkout-session/${tour.id}` method="POST")
///     b. viewsController -> router.post( "/checkout-session/:tourId"...)

if (bookBtn) {
   bookBtn.addEventListener("click", (e) => {
      e.target.textContent = "Processing....";
      const tourId = e.target.dataset.tourId;
      bookTour(tourId);
   });
}

const alertMessage = document.querySelector("body").dataset.alert;
if (alert) alertFunctions.showAlert("success", alertMessage, 15);
