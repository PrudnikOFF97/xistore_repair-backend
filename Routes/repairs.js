const express = require('express')
const Repairs = require('../Models/Repairs')
const urlencoded = require("body-parser");
const checkAuth = require("../Middlewares/check-auth");


const urlencodedParser = urlencoded({extended: false});


const router = express.Router();

router.get('/', checkAuth, async function(req, res){
    let result = await Repairs.find({"owner": req.userData.userId}).lean();
    res.json(result);
});
router.get('/issued', checkAuth, async function(req, res){
    let result = await Repairs.find({"owner": req.userData.userId, "issueDate": {$exists: true, $ne: null}}).lean();
    res.json(result);
});
router.get('/recived', checkAuth, async function(req, res){
    let result = await Repairs.find({"owner": req.userData.userId, "receivingDate": {$exists: true, $ne: null}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/sended', checkAuth, async function(req, res){
    let result = await Repairs.find({"owner": req.userData.userId, "sendingDate": {$exists: true, $ne: null}, "receivingDate": {$exists: false}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/just-acepted', checkAuth, async function(req, res){
    let result = await Repairs.find({"owner": req.userData.userId, "sendingDate": {$exists: false}, "receivingDate": {$exists: false}, "issueDate": {$exists: false}}).lean();
    res.json(result);
});
router.get('/:id', checkAuth, async function (req, res){
    console.log(req.params);
    let result = await Repairs.findById(req.params["id"]);
    res.json(result);
});
router.post("/update/:id", checkAuth, async function (req, res) {
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