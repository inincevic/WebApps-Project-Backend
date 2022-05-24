import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

//razumijevanje jsona
app.use(express.json());
app.use(cors());

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
      evolution_method: "This pokemon is a base stage"
    },
    {
        name: "Pikachu",
        primary_type: "Electric",
        secondary_type: "No secondary type",
        primary_colour: "Yellow",
        secondary_colour: "No secondary colour",
        stage: "Base",
        evolution_method: "Friendship"
    }
  ];
  res.send(pokemoni);
});
app.listen(port, () => {
  console.log("Example app listening on port", port);
});
