const {Schema, model} = require("mongoose");

const modelsSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    code: String,
});


module.exports = model("Models", modelsSchema);