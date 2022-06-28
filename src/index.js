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
    projection: { _id: 0, pokemon_name: 1, types: 1, colours: 1 },
  };

  const pokemon = await pokemoni.findOne(query, options);
  console.log(pokemon);
  //res.status(201);
  res.send(pokemon);
});

// app.get("/pokemoni", (req, res) => {
//   console.log("Izvrsava se!");
//   let pokemoni = [
//     {
//       name: "Trubbish",
//       primary_type: "Poison",
//       secondary_type: "No secondary type",
//       primary_colour: "Green",
//       secondary_colour: "No secondary colour",
//       stage: "Base",
//       evolution_method: "This pokemon is a base stage",
//     },
//     {
//       name: "Pikachu",
//       primary_type: "Electric",
//       secondary_type: "No secondary type",
//       primary_colour: "Yellow",
//       secondary_colour: "No secondary colour",
//       stage: "Base",
//       evolution_method: "Friendship",
//     },
//   ];
//   res.send(pokemoni);
// });

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




app.post("/findpokemon", async (req, res) => {
  console.log("Pokemon atributes recieved");
  console.log(req.body);

  let db = await connectDB();

  let pokemoni = db.collection("Pokémon");
  let colours = db.collection("Primary_Colour");
  let types = db.collection("Primary_Type");
  let variants = db.collection("Regional_Variant");
  let evo_method = db.collection("Evolution_Method");

  // Type names -> Type ids
  let type_one_query = { type_name: req.body.type_one };
  let type_two_query = { type_name: req.body.type_two };
  let type_options = {
    projection: { _id: 1},
  };
  let type_one_id_original = await types.findOne(type_one_query, type_options);
  let type_two_id_original = await types.findOne(type_two_query, type_options);
  let type_one_id = type_one_id_original._id.toString();
  let type_two_id = null;
  console.log(req.body.type_one, type_one_id);
  if(type_two_id_original){
    type_two_id = type_two_id_original._id.toString();
    console.log(req.body.type_two, type_two_id);
  }


  // Colour names -> Colour ids
  let colour_one_query = { colour_name: req.body.colour_one };
  let colour_two_query = {colour_name: req.body.colour_two };
  let colour_options = {
    projection: { _id: 1},
  };
  let colour_one_id_original = await colours.findOne(colour_one_query, colour_options);
  let colour_two_id_original = await colours.findOne(colour_two_query, colour_options);
  let colour_one_id = colour_one_id_original._id.toString();
  let colour_two_id = null;
  console.log(req.body.colour_one, colour_one_id);
  if (colour_two_id_original) {
    colour_two_id = colour_two_id_original._id.toString();
    console.log(req.body.colour_two, colour_two_id);
  } 


  // Variant names -> variant ids
  let regional_variant_query = { variant_name: req.body.regional_variant };
  let regional_variant_options = {
    projection: { _id: 1},
  };
  let variant_id = await variants.findOne(regional_variant_query, regional_variant_options);
  if(variant_id != null) {
    console.log(req.body.regional_variant, variant_id);
  }
  
  // Evolution method names -> Evolution method ids
  let evo_method_query = { method_name: req.body.evolution_method };
  let evo_method_options = {
    projection: { _id: 1},
  };
  let method_id = await evo_method.findOne(evo_method_query, evo_method_options);
  if(method_id != null) {
    console.log(req.body.evolution_method, method_id);
  }

  //setting up query ---> arrays can't have empty fields so I need if functions for different amounts of entries
  let pokemon_query = null;
  if(type_two_id == null && colour_two_id == null){
    pokemon_query = { 
      types: {
          type_id: type_one_id
        },
      colours: {
        colour_id: colour_one_id
      },
    };  
  }
  else if (type_two_id != null && colour_two_id == null) {
    pokemon_query = { 
      types: [{
          type_id: type_one_id
        },
        {
          type_id: type_two_id
        }
      ],
      colours: {
        colour_id: colour_one_id
      },
    };  
  }
  else if (type_two_id == null && colour_two_id != null) {
    pokemon_query = { 
      types: {
          type_id: type_one_id
        },
      colours: [{
          colour_id: colour_one_id
        },
        {
           colour_id: colour_two_id
        }
      ]
    };  
  }
  else {
    pokemon_query = { 
      //pokemon_name: "Bulbasaur",
      types: [{
          type_id: type_one_id
        },
        {
           type_id: type_two_id
        }
      ],
      colours: [{
        colour_id: colour_one_id
      },
      {
         colour_id: colour_two_id
      }
      ]
    }
  }
  //console.log(pokemon_query)
  let pokemon_options = {
    projection: { _id: 0, pokemon_name: 1, types: 1, colours: 1 },
    sort: { base_stat_total: -1 }
  };

  let pokemon = await pokemoni.findOne(pokemon_query, pokemon_options);
  console.log(pokemon);
  // //res.status(201);Primary_Colour
  // res.send(pokemon);

  res.status(201);
  res.send("Recieved");
});




app.listen(port, () => {
  console.log("Example app listening on port", port);
});
