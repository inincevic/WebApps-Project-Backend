import express from "express";
import cors from "cors";
import connectDB from "./db.js";

const app = express();
const port = 3000;

// hard coded shit
const masterUser = {
    email: "inincevic@unipu.hr",
    username: "inincevic",
    password: "12345",
  };

//razumijevanje jsona
app.use(express.json());
app.use(cors());

app.get("/testdb", async (req, res) => {
    let db = await connectDB();

    let pokemoni = db.collection("Pokémon");
    const query = { pokemon_name: "Charmander" };
    const options = {
      projection: { _id:0, pokemon_name:1, types:1, colours:1}
    }

    const pokemon = await pokemoni.findOne(query, options);
    console.log(pokemon);
    //res.status(201);
    res.send(pokemon);
})

app.get("/pokemoni", (req, res) => {
  console.log("Izvrsava se!");
  let pokemoni = [
    {
      name: "Trubbish",
      primary_type: "Poison",
      secondary_type: "No secondary type",
      primary_colour: "Green",
      secondary_colour: "No secondary colour",
      stage: "Base",
      evolution_method: "This pokemon is a base stage",
    },
    {
      name: "Pikachu",
      primary_type: "Electric",
      secondary_type: "No secondary type",
      primary_colour: "Yellow",
      secondary_colour: "No secondary colour",
      stage: "Base",
      evolution_method: "Friendship",
    },
  ];
  res.send(pokemoni);
});

app.post("/login", (req, res) => {
  console.log("POST called");
//   console.log(req.body.email);
//   console.log(masterUser.email);
//   console.log(req.body.password);
//   console.log(masterUser.password);
  
  let validLogin = false;
  if (
    req.body.email == masterUser.email &&
    req.body.password == masterUser.password
  ) {
    validLogin = true;
  }

  // console.log(validLogin);
  res.status(201);
  res.send(validLogin);
});

app.listen(port, () => {
  console.log("Example app listening on port", port);
});
