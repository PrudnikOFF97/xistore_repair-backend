const express = require('express')
const Repairs = require('../Models/Repairs')
const urlencoded = require("body-parser");

const urlencodedParser = urlencoded({extended: false});


const router = express.Router();

router.get('/', async function(req, res){
    let result = await Repairs.find({}).lean();
    res.json(result);
});
router.get('/issued', async function(req, res){
    let result = await Repairs.find({"issueDate": {$exists: true, $ne: null}}).lean();
    res.json(result);
});
router.get('/recived', async function(req, res){
    let result = await Repairs.find({"receivingDate": {$exists: true, $ne: null}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/sended', async function(req, res){
    let result = await Repairs.find({"sendingDate": {$exists: true, $ne: null}, "receivingDate": {$exists: false}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/just-acepted', async function(req, res){
    let result = await Repairs.find({"sendingDate": {$exists: false}, "receivingDate": {$exists: false}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/:id', urlencodedParser, async function (req, res){
    console.log(req.params);
    let result = await Repairs.findById(req.params["id"]);
    res.json(result);
});
router.post("/update/:id", urlencodedParser, async function (req, res) {
    let repair = await Repairs.findById(req.params["id"]);
    console.log(Object.keys(req.body));
    console.log(req.body[Object.keys(req.body)]);
    if(req.body[Object.keys(req.body)]){
        repair[Object.keys(req.body)] = req.body[Object.keys(req.body)].split("-").reverse().join('.');
    }
    await repair.save();
    res.sendStatus(204);
});

module.exports = router