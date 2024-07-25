import axios from "axios";
import alertFunctions from "./alerts";

///Type is either 'password' or 'data(name & email)'
export const updateSettings = async function (data, type) {
   try {
      const res = await axios({
         method: "PATCH",
         url: `/api/v1/users/${
            type === "password" ? "updateMyPassword" : "updateMe"
         }`,
         data,
      });

      if (res.data.status === "success") {
         alertFunctions.showAlert(
            "success",
            `${type.toUpperCase()} updated successfully`
         );
      }
      //.
   } catch (err) {
      alertFunctions.showAlert("error", err.response.data.message);
   }
};
