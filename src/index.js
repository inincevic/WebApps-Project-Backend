//This file contains all routes for get/post/put https requests

//importing requited packages
import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 5000;

//understanding JSON
app.use(express.json());
app.use(cors());

//registration process
//data is recieved from fronted and sent to the 'Users' collection in the database
app.post("/register", async (req, res) => {
  //Logging to console what request has been called.
  console.log("Registration called");

  //connecting to database and required collecion
  let db = await connectDB();
  let users = db.collection("Users");

  //creating an object that is sent to database
  let user = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    number_guessed: "0",
    guessed_pokemon: [],
    favourite_pokemon: "",
  };

  //sending data into the database
  await users.insertOne(user, function (err, res) {
    if (err) throw err;
    console.log("User inserted");
  });

  res.status(201);
  res.send("User registered");
});

//login process which checks if login is correct with the database
app.post("/login", async (req, res) => {
  //Logging to console what request has been called.
  console.log("Login called");

  //connecting to the database and required collecion
  let db = await connectDB();
  let users = db.collection("Users");

  //creating query and options for searching the user in the database
  let user_query = {
    email: req.body.email,
    password: req.body.password,
  };

  let user_options = {
    projection: {
      _id: 0,
      username: 1,
      number_guessed: 1,
      guessed_pokemon: 1,
      favourite_pokemon: 1,
    },
  };

  let user = await users.findOne(user_query, user_options);

  res.status(201);
  res.send(user);
});

// route for changing user's favourite pokemon
// the name of a Pokémon is entered, that name has to be matched with an id and then added to the user
app.put("/updatefavourite", async (req, res) => {
  let updated = false;

  //Logging to console what request has been called.
  console.log("Favourite Pokémon change has been called.")

  //connecting to the database and required collecions
  let db = await connectDB();
  let users = db.collection("Users");
  let pokemon_collection = db.collection("Pokémon");

  //finding user to check current favourite Pokémon
  let user_query = {
    username: req.body.username,
  };

  let user_option = {
    projection: { _id: 0, favourite_pokemon: 1 },
  };

  let current_favourite = await users.findOne(user_query, user_option);

  //finding the id of the new favourite Pokémon
  let pokemon_query = {
    pokemon_name: req.body.new_favourite_pokemon,
  };

  let pokemon_options = {
    projection: { _id: 1 },
  };

  let pokemon = await pokemon_collection.findOne(
    pokemon_query,
    pokemon_options
  );

  //first we have to chesk if a Pokémon has been found
  //otherwise we can't check their id or turn it into a string
  if (pokemon) {
    let pokemon_id = pokemon._id.toString();

    //updating the favourite pokemon
    //likewise we have to check if that id exists
    if (pokemon_id) {
      //we need to check if the old favourite Pokémon is the same as the new one
      //if so, there is no need to update
      if (current_favourite.favourite_pokemon == pokemon_id) {
        console.log("That is your current favourite Pokémon!");
      } 
      //if the Pokémon is not the current favourite, we have, to update it
      else {
        const updateTable = {
          $set: {
            favourite_pokemon: pokemon_id,
          },
        };
        const update = await users.updateOne(user_query, updateTable);
        console.log("Updated");
        updated = true;
      }
    }
  } 
  //Currently, not all 905 Pokémon (with alter forms) are a part of this database
  //It is possible that someone's favourite isn't here.
  else console.log("That Pokémon is not a part of this database");

  res.status(201);
  res.send(updated);
});

// route for finding Pokémon ----> The MOST IMPORTANT part of this applicaiton
// this route is the core of what the application does; finds Pokémon with the attributes that the user provided.
app.post("/findpokemon", async (req, res) => {
  //Logging to console what request has been called.
  console.log("Pokemon atributes recieved");
  console.log("Find Pokémon called.")

  //connecting to the database and required collecions
  let db = await connectDB();

  let pokemoni = db.collection("Pokémon");
  let colours = db.collection("Primary_Colour");
  let types = db.collection("Primary_Type");
  let variants = db.collection("Regional_Variant");
  let evo_method = db.collection("Evolution_Method");

  // The given attributes are attributes themselves, they need to be converted into ids in order to be 
  // properly connected to other collections
  // The next part of the code holds all the conversions needed to convert attributes names into ids

  // Type names -> Type ids && object -> string
  let type_one_query = { type_name: req.body.type_one };
  let type_two_query = { type_name: req.body.type_two };
  let type_options = {
    projection: { _id: 1 },
  };
  let type_one_id_original = await types.findOne(type_one_query, type_options);
  let type_two_id_original = await types.findOne(type_two_query, type_options);
  let type_one_id = type_one_id_original._id.toString();
  let type_two_id = null;

  if (type_two_id_original) {
    type_two_id = type_two_id_original._id.toString();
  }

  // Colour names -> Colour ids && object -> string
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
  
  if (colour_two_id_original) {
    colour_two_id = colour_two_id_original._id.toString();
  }

  // Evolution method names -> Evolution method ids && object -> string
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
  }

  // Variant names -> variant ids && object -> string
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
  }

  // setting up query ---> arrays can't have empty fields
  // I need to edit the query by building a string
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

  // Transforming query from sting to object so that it can be used for finding a Pokémon
  let pokemon_query_object = JSON.parse(pokemon_query);

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

  // logging the found Pokémon to the console
  if (pokemon) {
    console.log(
      "------------------------------- POKEMON FOUND -------------------------------"
    );
    console.log(pokemon);
  } 
  // if the Pokémon is not found, the following message is printed to the console
  // additional warning is provided on the fronted
  else {
    console.log(
      "------------------------------- POKEMON NOT FOUND -------------------------------"
    );
    console.log("Please try again");
  }

  // attribute ids need to be turned back into attribute names so that they can be properly displayed on the frontend
  if (pokemon) {
    // Type ids -> Type names
    type_one_query = {
      _id: mongoose.Types.ObjectId(pokemon.types[0].type_id),
    };
    type_options = {
      projection: { type_name: 1 },
    };

    let type_one = await types.findOne(type_one_query, type_options);
    pokemon.types[0].type_id = type_one.type_name;

    // checking if the found Pokémon has two types
    if (pokemon.types.length > 1) {
      type_two_query = {
        _id: mongoose.Types.ObjectId(pokemon.types[1].type_id),
      };
      let type_two = await types.findOne(type_two_query, type_options);

      pokemon.types[1].type_id = type_two.type_name;
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

    // checking if the found Pokémon has two types
    if (pokemon.colours.length > 1) {
      let colour_two_query = {
        _id: mongoose.Types.ObjectId(pokemon.colours[1].colour_id),
      };
      let colour_two = await colours.findOne(colour_two_query, colour_options);

      pokemon.colours[1].colour_id = colour_two.colour_name;
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

    // regional variant ids -> regional variant names
    let variant_query = {
      _id: mongoose.Types.ObjectId(pokemon.form),
    };
    let variant_options = {
      projection: { variant_name: 1 },
    };

    let variant = await variants.findOne(variant_query, variant_options);
    pokemon.form = variant.variant_name;

    //Printing the new display of Pokémon
    console.log(
      "------------------------------- REPLACING IDS -------------------------------"
    );

    console.log(pokemon);
  }

  res.status(201);
  res.send(pokemon);
});

// a User's favrourite Pokémon is saved in a user with it's ID
// that ID needs to be converted into that Pokémon's name so that it can be displayed on the profile
// route for converting favourite Pokémon's id into name
app.post("/favouritename", async (req, res) => {
  let favouriteName = null;

  //Logging to console what request has been called.
  console.log("Name conversion called");

  //connecting to the database and required collecions
  let db = await connectDB();
  let users = db.collection("Users");
  let pokemon_collection = db.collection("Pokémon");

  //finding given user's favourite Pokémon
  let user_query = {
    username: req.body.username,
  };
  let user_option = {
    projection: { _id: 0, favourite_pokemon: 1 },
  };
  let current_favourite = await users.findOne(user_query, user_option);

  //if a favourite Pokémon exists, go find his name
  if (current_favourite) {
    let pokemon_query = {
      _id: mongoose.Types.ObjectId(current_favourite.favourite_pokemon),
    };
    let pokemon_options = {
      projection: { _id: 0, pokemon_name: 1 },
    };
    let pokemon = await pokemon_collection.findOne(
      pokemon_query,
      pokemon_options
    );
    favouriteName = pokemon.pokemon_name;
  } 
  else {
    console.log("The user has yet to select their favourite Pokémon.");
  }
  res.status(201);
  res.send(favouriteName);
});

// Get a list of all the Pokémon found by the User
app.post("/guessedpokemon", async (req, res) => {
  let guessed_pokemon = [];

  //Logging to console what request has been called.
  console.log("Listing guessed Pokémon called.")

  //connecting to the database and required collecions
  let db = await connectDB();
  let users = db.collection("Users");
  let pokemon_collection = db.collection("Pokémon");

  //finding the list of user's guessed Pokémon
  let user_query = {
    username: req.body.username,
  };
  let user_option = {
    projection: { _id: 0, guessed_pokemon: 1 },
  };
  let guessed_list = await users.findOne(user_query, user_option);

  //finding names of pokemon and placing them into guessed_pokemon
  //checking if any pokemon have been guessed by this user
  if (guessed_list) {
    let counter = 0;
    for (const pokemon in guessed_list.guessed_pokemon) {
      if (guessed_list) {
        let pokemon_query = {
          _id: mongoose.Types.ObjectId(
            guessed_list.guessed_pokemon[counter].pokemon_id
          ),
        };
        let pokemon_options = {
          projection: { _id: 0, pokemon_name: 1 },
        };
        let pokemon = await pokemon_collection.findOne(
          pokemon_query,
          pokemon_options
        );

        guessed_pokemon[counter] = pokemon;
        counter++;
      }
    }
    //if this user has not guessed any Pokémon the following message is displayed
    if (counter == 0) {
      console.log("This user has not guessed any Pokémon");
    }
  }

  res.status(201);
  res.send(guessed_pokemon);
});

//Get all attributes for displaying on frontend
app.get("/getattributes", async (req, res) => {
  //Logging to console what request has been called.
  console.log("Getting attributes called.")

  let attributes = {
    types: [],
    colours: [],
    evolution_methods: [],
    forms: [],
  };

  //connecting to the database and required collecions
  let db = await connectDB();

  let colours = db.collection("Primary_Colour");
  let types = db.collection("Primary_Type");
  let variants = db.collection("Regional_Variant");
  let evo_method = db.collection("Evolution_Method");

  //getting all types from the database
  let type_option = {
    projection: { _id: 0, type_name: 1 },
  };
  let all_types = await types.find({}, type_option).toArray();
  attributes.types = all_types;

  //getting all colours from the database
  let colour_option = {
    projection: { _id: 0, colour_name: 1 },
  };
  let all_colours = await colours.find({}, colour_option).toArray();
  attributes.colours = all_colours;

  //getting all evolution methods from the database
  let evo_method_option = {
    projection: { _id: 0, method_name: 1 },
  };
  let all_methods = await evo_method.find({}, evo_method_option).toArray();
  attributes.evolution_methods = all_methods;

  //getting all forms from the database
  let form_option = {
    projection: { _id: 0, variant_name: 1 },
  };
  let all_forms = await variants.find({}, form_option).toArray();
  attributes.forms = all_forms;

  res.status(201);
  res.send(attributes);
});

//updating number of Pokémon guessed and list of guessed Pokémon
app.put("/updateuser", async (req, res) => {
  let updated = "";

  //Logging to console what request has been called.
  console.log("Updating guessed called.")

  //connecting to the database and required collecions
  let db = await connectDB();
  let users = db.collection("Users");
  let pokemon_collection = db.collection("Pokémon");

  //finding user to get the number and list of guessed Pokémon
  let user_query = {
    username: req.body.username,
  };
  let user_option = {
    projection: { _id: 0, number_guessed: 1, guessed_pokemon: 1 },
  };
  let current_number = await users.findOne(user_query, user_option);

  //finding the id of the new guessed Pokémon
  let pokemon_query = {
    pokemon_name: req.body.pokemon_name,
  };
  let pokemon_options = {
    projection: { _id: 1 },
  };
  let pokemon = await pokemon_collection.findOne(
    pokemon_query,
    pokemon_options
  );

  if (pokemon) {
    let pokemon_id_check = pokemon._id.toString();

    //checking if the guessed Pokémon has been guessed before
    let existing_check = 0;
    let counter = 0;
    for (const pokemon in current_number.guessed_pokemon) {
      if (
        current_number.guessed_pokemon[counter].pokemon_id == pokemon_id_check
      ) {
        existing_check = 1;
        updated = "You have already guessed this Pokémon.";
      }
      counter++;
    }
    
    //updating number guessed and list of guessed Pokémon
    if (pokemon_id_check && !existing_check) {
      let guessed = current_number.guessed_pokemon;
      guessed[current_number.number_guessed] = { pokemon_id: pokemon_id_check };
      let number = current_number.number_guessed + 1;

      const updateTable = {
        $set: {
          number_guessed: number,
          guessed_pokemon: guessed,
        },
      };
      const update = await users.updateOne(user_query, updateTable);
      console.log("Updated");
      updated = "Ok";
    } 
    else {
      console.log("Existing");
      updated = "Existing";
    }
  } 
  else {
    console.log("That Pokémon is not a part of this database");
    updated = "Not in Database";
  }

  res.status(201);
  res.send(updated);
});

//having the app listen on the port
app.listen(port, () => {
  console.log("Example app listening on port", port);
});