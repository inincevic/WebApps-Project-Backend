import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import mongoose from "mongoose";

const app = express();
const port = 3000;

// hard coded shit ----------------------- TEMPORARY
const masterUser = {
  email: "inincevic@unipu.hr",
  username: "inincevic",
  password: "12345",
};

//understanding JSON
app.use(express.json());
app.use(cors());

//test route ------------- DELETE LATER
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

//registration process
//data is recieved from fronted and sent to the Users collection in the database
app.post("/register", async (req, res) => {
  console.log("Registration called");
  console.log(req.body);

  //connecting to database and required collecion
  let db = await connectDB();
  let users = db.collection("Users");

  //creating an object that is sent to database
  let user = {
    "username": req.body.username,
    "email": req.body.email,
    "password": req.body.password,
    "number_guessed": "0",
    "guessed_pokemon": [],
    "favourite_pokemon": ""
  }

  //sending data into the database
  await users.insertOne(user, function(err, res) {
    if (err) throw err;
    console.log("User inserted");
  });

  res.status(201);
  res.send("User registered");
})

//login process which gets check if login is correct with the database
//currently, user data is sent to the frontend, but that might be changed
app.post("/login", async (req, res) => {
  console.log("Login called");
  
  //connecting to the database and required collecion
  let db = await connectDB();
  let users = db.collection("Users");

  let user_query = {
    email: req.body.email,
    password: req.body.password
  }

  let user_options = {
    projection: { _id: 0, username: 1, number_guessed: 1, guessed_pokemon: 1, favourite_pokemon: 1 },
  };

  let user = await users.findOne(user_query, user_options);
  console.log(user)


  res.status(201);
  res.send(user);
});

// route for finding Pokémon ----> The MOST IMPORTANT part of this applicaitonn
app.post("/findpokemon", async (req, res) => {
  console.log("Pokemon atributes recieved");
  //console.log(req.body);  //DELETE LATER

  //connecting to the database and required collecions
  let db = await connectDB();

  let pokemoni = db.collection("Pokémon");
  let colours = db.collection("Primary_Colour");
  let types = db.collection("Primary_Type");
  let variants = db.collection("Regional_Variant");
  let evo_method = db.collection("Evolution_Method");

  // Type names -> Type ids & object -> string
  let type_one_query = { type_name: req.body.type_one };
  let type_two_query = { type_name: req.body.type_two };
  let type_options = {
    projection: { _id: 1 },
  };
  let type_one_id_original = await types.findOne(type_one_query, type_options);
  let type_two_id_original = await types.findOne(type_two_query, type_options);
  let type_one_id = type_one_id_original._id.toString();
  let type_two_id = null;
  // console.log(req.body.type_one, type_one_id); //DELETE LATER
  if (type_two_id_original) {
    type_two_id = type_two_id_original._id.toString();
    //console.log(req.body.type_two, type_two_id); //DELETE LATER
  }

  // Colour names -> Colour ids & object -> string
  let colour_one_query = { colour_name: req.body.colour_one };
  let colour_two_query = { colour_name: req.body.colour_two };
  let colour_options = {
    projection: { _id: 1 },
  };
  let colour_one_id_original = await colours.findOne(
    colour_one_query,
    colour_options
  );
  let colour_two_id_original = await colours.findOne(
    colour_two_query,
    colour_options
  );
  let colour_one_id = colour_one_id_original._id.toString();
  let colour_two_id = null;
  //console.log(req.body.colour_one, colour_one_id); //DELETE LATER
  if (colour_two_id_original) {
    colour_two_id = colour_two_id_original._id.toString();
    //console.log(req.body.colour_two, colour_two_id);v //DELETE LATER
  }

  // Evolution method names -> Evolution method ids & object -> string
  let method_id = null;
  if (req.body.evolution_method != "") {
    let evo_method_query = { method_name: req.body.evolution_method };
    let evo_method_options = {
      projection: { _id: 1 },
    };
    let method_id_original = await evo_method.findOne(
      evo_method_query,
      evo_method_options
    );
    if (method_id_original) method_id = method_id_original._id.toString();
    if (method_id) {
      //console.log(req.body.evolution_method, method_id); //DELETE LATER
    }
  }

  // Variant names -> variant ids & object -> string
  let variant_id = null;
  if (req.body.regional_variant != "") {
    let regional_variant_query = { variant_name: req.body.regional_variant };
    let regional_variant_options = {
      projection: { _id: 1 },
    };
    let variant_id_original = await variants.findOne(
      regional_variant_query,
      regional_variant_options
    );
    if (variant_id_original) variant_id = variant_id_original._id.toString();
    if (variant_id) {
      //console.log(req.body.regional_variant, variant_id); //DELETE LATER
    }
  }

  //setting up query ---> arrays can't have empty fields so I need to edit the query by building a string
  let pokemon_query = "{ ";

  // at least one type must be provided, but both can be provided
  if (type_two_id) {
    pokemon_query +=
      '"types": [ {"type_id": "' +
      type_one_id +
      '"}, { "type_id": "' +
      type_two_id +
      '" }]';
  } else {
    pokemon_query += '"types": {"type_id": "' + type_one_id + '"} ';
  }

  // at least one colour must be provided, but both can be provided
  if (colour_two_id) {
    pokemon_query +=
      ',"colours": [ {"colour_id": "' +
      colour_one_id +
      '"}, { "colour_id": "' +
      colour_two_id +
      '"}]';
  } else {
    pokemon_query += ',"colours": {"colour_id": "' + colour_one_id + '"} ';
  }

  // adding evolution method search to query
  if (method_id) {
    pokemon_query += ',"evolution_method": "' + method_id + '"';
  }

  // adding variant search to query
  if (variant_id) {
    pokemon_query += ',"form": "' + variant_id + '"';
  }

  // ading stage search to query
  if (
    req.body.stage != "" &&
    (req.body.stage == "Base form" ||
      req.body.stage == "1st stage" ||
      req.body.stage == "2nd stage")
  ) {
    pokemon_query += ',"stage": "' + req.body.stage + '"';
  }

  // ading base stat total search to query
  if (req.body.base_stat_total != "") {
    pokemon_query += ',"base_stat_total": "' + req.body.base_stat_total + '"';
  }

  pokemon_query += "}";

  // Transforming query from sting to object
  //console.log(pokemon_query);   //DELETE LATER
  let pokemon_query_object = JSON.parse(pokemon_query);
  //console.log(pokemon_query_object); //DELETE LATER

  let pokemon_options = {
    projection: {
      _id: 0,
      dex_number: 1,
      pokemon_name: 1,
      types: 1,
      colours: 1,
      evolution_method: 1,
      form: 1,
      stage: 1,
      dex_entry: 1,
      base_stat_total: 1,
    },
    sort: { base_stat_total: -1 },
  };

  // finding a Pokémon using the created query
  let pokemon = await pokemoni.findOne(pokemon_query_object, pokemon_options);
  if (pokemon) {
    console.log(
      "------------------------------- POKEMON FOUND -------------------------------"
    );
    console.log(pokemon);
  } else {
    console.log(
      "------------------------------- POKEMON NOT FOUND -------------------------------"
    );
    console.log("Please try again");
  }

  if (pokemon) {
    //removing ids and restoring names
    // Type ids -> Type names
    type_one_query = {
      _id: mongoose.Types.ObjectId(pokemon.types[0].type_id),
    };
    type_options = {
      projection: { type_name: 1 },
    };

    let type_one = await types.findOne(type_one_query, type_options);
    pokemon.types[0].type_id = type_one.type_name;
    //console.log("Type one = " + pokemon.types[0].type_id) // DELETE LATER

    if (pokemon.types.length > 1) {
      type_two_query = {
        _id: mongoose.Types.ObjectId(pokemon.types[1].type_id),
      };
      let type_two = await types.findOne(type_two_query, type_options);

      pokemon.types[1].type_id = type_two.type_name;
      //console.log("Type two = " + pokemon.types[1].type_id) // DELETE LATER
    }

    // Colour ids -> Colour names
    colour_one_query = {
      _id: mongoose.Types.ObjectId(pokemon.colours[0].colour_id),
    };
    colour_options = {
      projection: { colour_name: 1 },
    };

    let colour_one = await colours.findOne(colour_one_query, colour_options);
    pokemon.colours[0].colour_id = colour_one.colour_name;
    //console.log("Colour one = " + pokemon.colours[0].colour_id) // DELETE LATER

    if (pokemon.colours.length > 1) {
      let colour_two_query = {
        _id: mongoose.Types.ObjectId(pokemon.colours[1].colour_id),
      };
      let colour_two = await colours.findOne(colour_two_query, colour_options);

      pokemon.colours[1].colour_id = colour_two.colour_name;
      //console.log("Colour two = " + pokemon.colours[1].colour_id) // DELETE LATER
    }

    // evo_method ids -> evo_method names
    let evo_method_query = {
      _id: mongoose.Types.ObjectId(pokemon.evolution_method),
    };
    let evo_method_options = {
      projection: { method_name: 1 },
    };

    let method = await evo_method.findOne(evo_method_query, evo_method_options);
    pokemon.evolution_method = method.method_name;
    //console.log("Evolution method = " + pokemon.evolution_method) // DELETE LATER

    // regional variant ids -> regional variant names
    let variant_query = {
      _id: mongoose.Types.ObjectId(pokemon.form),
    };
    let variant_options = {
      projection: { variant_name: 1 },
    };

    let variant = await variants.findOne(variant_query, variant_options);
    pokemon.form = variant.variant_name;
    //console.log("Form = " + pokemon.form) // DELETE LATER

    console.log(
      "------------------------------- REPLACING IDS -------------------------------"
    );

    console.log(pokemon);
  }

  res.status(201);
  res.send(pokemon);
});

app.listen(port, () => {
  console.log("Example app listening on port", port);
});