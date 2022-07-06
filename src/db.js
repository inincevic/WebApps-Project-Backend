//This file will connect us to our database

import mongo from "mongodb";

//connection string for the PokeGuesserProject database on MongoDB
let connection_string =
  "mongodb+srv://inincevic:Umbreon1@cluster0.lwuw4.mongodb.net/test";

let client = new mongo.MongoClient(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db = null;

//checking if the program is already connected to the databse
function isConnected() {
  return !!client && !!client.topology && client.topology.isConnected();
}

//We use isConnected function to check if we're already connected to the database 
//so that we don't open a connection that is already open
export default async () => {
  if (!db || !isConnected()) {
    await client.connect();
    db = client.db("PokeGuesserProject");
    console.log("Connected OK");
  } else console.log("Already Connected");
  return db;
};
