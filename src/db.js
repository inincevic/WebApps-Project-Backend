import mongo from "mongodb";

let connection_string = "mongodb+srv://inincevic:Umbreon1@cluster0.lwuw4.mongodb.net/test";

let client = new mongo.MongoClient(connection_string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
 });

 client.connect((err) => {
     if (err) {
         console.error(err);
         return;
     }
     console. log ("Database connected successfully!");
     // za sada ništa necemo raditi, samo zatvaramo pristup
     client. close();
});
