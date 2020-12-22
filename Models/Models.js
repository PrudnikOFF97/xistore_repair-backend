const {Schema, model} = require("mongoose");

const modelsSchema = new Schema({
    name:{ 
        type: String,
        unique: false,
    },
    code: { 
        type: String,
        unique: true
    },
});


module.exports = model("Models", modelsSchema);