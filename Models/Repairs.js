const {Schema, model} = require("mongoose");

const repairsSchema = new Schema({
    date: String,
    manager: String,
    model: String,
    serial: String,
    repair_type: String,
    from: String,
    equipment: [],
    purchaseDate: String,
    clientName: String,
    clientPhone: String,
    malfunction: String,
    notes: String,
    appearance: String,
    sendingDate: String,
    receivingDate: String,
    issueDate: String,
    refoundNumber: String,
    replacementDevice: String,
    owner: String,
    comment: String
});


module.exports = model("Repairs", repairsSchema);