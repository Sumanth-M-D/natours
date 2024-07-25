import app from "./app.js";
import mongoose from "mongoose";

// .
//? Handling uncaught exception
process.on("uncaughtException", (err) => {
   console.log("UNCAUGHT EXCEPTION!! 💥 shutting down....");
   console.log(err.name, ": ", err.message);

   // End the app
   process.exit(1);
});

//.

/* %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                     MONGOOSE DATABASE DRIVER FOR MONGODB
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

//? GETTING THE DATABASE URL FROM ENVIRONMENT VARIABLES
const DB = process.env.DATABASE.replace(
   "<PASSWORD>",
   process.env.DATABASE_PASSWORD
);

//.
//? Connecting to the MONGODB DATABASE at ATLAS
mongoose
   .connect(DB, {
      /// useNewUrlParser: true,
      /// useUnifiedTopology: true,
   })
   .then(() => console.log("DB connection successful"));

//.

/* %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                      APP SERVER 
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
   console.log(`App running on port ${port}`);
});

//.
//? Handling global unhandled promise rejections
process.on("unhandledRejection", (err) => {
   console.log("UNHANDLED PROMISE REJECTION!! 💥 shutting down....");
   console.log(err.name, ": ", err.message);
   console.log(err);

   // Close the server and end the app
   server.close(() => {
      process.exit(1);
   });
});
