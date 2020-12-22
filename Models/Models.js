const {Schema, model} = require("mongoose");

const modelsSchema = new Schema({
    name: String,
    code: { 
        type: String,
        unique: true
    },
});


module.exports = model("Models", modelsSchema);