import axios from "axios";
import alertFunctions from "./alerts.js";

//.
//? Function to login
export const signUp = async function (name, email, password, passwordConfirm) {
   try {
      const res = await axios({
         method: "POST",
         url: "/api/v1/users/signUp",
         data: {
            name,
            email,
            password,
            passwordConfirm,
         },
      });

      if (res.data.status === "success") {
         alertFunctions.showAlert("success", "Signed up successfully");
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

//.
