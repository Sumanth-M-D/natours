import dotenv from "dotenv"; //npm i dotenv
dotenv.config({ path: "../../config.env" });

import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import Tour from "../../models/tourModel.js";
import User from "../../models/userModel.js";
import Review from "../../models/reviewModel.js";

//.
//? GETTING THE DATABASE URL FROM ENVIRONMENT VARIABLES
const DB = process.env.DATABASE.replace(
   "<PASSWORD>",
   process.env.DATABASE_PASSWORD
);

//.
//? Connecting to the MONGODB DATABASE at ATLAS
mongoose.connect(DB).then(() => console.log("DB connection successful"));

//.
//? Read JSON file
const tours = JSON.parse(readFileSync("./tours.json", "utf-8"));
const users = JSON.parse(readFileSync("./users.json", "utf-8"));
const reviews = JSON.parse(readFileSync("./reviews.json", "utf-8"));

//.
//? Import data into Database
async function importData() {
   try {
      await Tour.create(tours);
      await User.create(users, { validateBeforeSave: false });
      await Review.create(reviews);

      console.log("data successfully loaded");
   } catch (err) {
      console.log(err);
   }
   process.exit();
}

//.
//? Delete all the data in the collection
async function deleteData() {
   try {
      await Tour.deleteMany();
      await User.deleteMany();
      await Review.deleteMany();

      console.log("Delete successful");
   } catch (err) {
      console.log(err);
   }
   process.exit();
}

//.
//? Setting commands for importing and deleting
//console.log(process.argv); /// Object that contains an array of input commands

/* COMMANDS
   cd dev-data/data/
   node import-dev-data.js --import /// For importing the data to DB
   node import-dev-data.js --delete /// For deleting the data from DB
*/
if (process.argv[2] === "--import") {
   importData();
} else if (process.argv[2] === "--delete") {
   deleteData();
}
