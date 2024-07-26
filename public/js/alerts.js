const hideAlert = function () {
   const el = document.querySelector(".alert");
   if (el) {
      el.remove();
   }
};

// type = 'success' / 'error'
const showAlert = function (type, message, time = 7) {
   hideAlert();
   const markup = `<div class="alert alert--${type}"> ${message} </div>`;

   document.querySelector("body").insertAdjacentHTML("afterbegin", markup);

   window.setTimeout(hideAlert, time * 1000);
};

const alertFunctions = {
   showAlert,
   hideAlert,
};

export default alertFunctions;
