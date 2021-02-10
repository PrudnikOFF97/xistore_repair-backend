const {Schema, model} = require("mongoose");

const usersSchema = new Schema({
    login: String,
    password: String,
    addres: String,
    managers: [],
});


module.exports = model("Users", usersSchema);