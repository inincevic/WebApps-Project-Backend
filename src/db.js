import mongo from "mongodb";

let connection_string =
  "mongodb+srv://inincevic:Umbreon1@cluster0.lwuw4.mongodb.net/test";

let client = new mongo.MongoClient(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db = null;

function isConnected() {
  return !!client && !!client.topology && client.topology.isConnected();
}
// eksportamo Promise koji resolva na konekciju
export default async () => {
  if (!db || !isConnected()) {
    await client.connect();
    db = client.db("PokeGuesserProject");
    console.log("Connected OK");
  } else console.log("Already Connected");
  return db;
};
