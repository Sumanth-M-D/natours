import axios from "axios";
import alertFunctions from "./alerts.js";

//.
//? Function to login
export const login = async function (email, password) {
   try {
      const res = await axios({
         method: "POST",
         url: "/api/v1/users/login",
         data: {
            email,
            password,
         },
      });

      if (res.data.status === "success") {
         alertFunctions.showAlert("success", "Logged in successfully");
      }

      window.setTimeout(() => {
         location.assign("/"); ///Redirect to home page
      }, 1500);
   } catch (err) {
      if (err.response) {
         alertFunctions.showAlert("error", err.response.data.message);
      }
   }
};

//.
//? Function to logout
export const logout = async function () {
   try {
      const res = await axios({
         method: "POST",
         url: "/api/v1/users/logout",
      });

      if (res.data.status === "success") {
         location.reload(true); ///reload
      }
   } catch (err) {
      console.log(err);
      alertFunctions.showAlert("error", "Error logging out! Try again.");
   }
};

//.
