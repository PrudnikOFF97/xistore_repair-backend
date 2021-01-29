const {Schema, model} = require("mongoose");

const usersSchema = new Schema({
    name: String,
    password: String,
    addres: String,
    managers: [],
});


module.exports = model("Users", usersSchema);