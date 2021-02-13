const { PDFDocument } = require('pdf-lib');
XLSX = require('exceljs');
const express = require('express');
const urlencoded = require("body-parser");
const mongoose = require("mongoose");
const Repairs = require("./Models/Repairs");
const Models = require("./Models/Models");
const repairsRouter = require("./Routes/repairs")
const userRouter = require("./Routes/user");
const fs = require('fs');
const CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
require('dotenv').config();
var multer = require('multer');
const checkAuth = require('./middlewares/check-auth');

var defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = process.env.CLOUDMERSIVE_KEY;

const port = process.env.PORT || 1337;

const urlencodedParser = urlencoded({extended: false});
var upload = multer();
const app = express();
app.use(express.json());
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    next();
});
app.use(upload.array()); 
app.use(express.static("public"));

try {
    mongoose.connect(process.env.MONGO_CONNECT, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
} catch (e) {
    console.log(e);
    return;
}
app.use("/repairs", repairsRouter);
app.use("/user", userRouter);
app.get('/get_model/:code', async (req, res)=>{
    let result;
    try {
        result = await Models.findOne({code: req.params["code"]}).lean();
    } catch (error) {
        result  = {};
    }
    if(!result){
        result = {name: req.params["code"]};
    }
    res.json(result);
});
app.post("/", checkAuth, async function (req, res) {
    if(!req.body) return response.sendStatus(400);
    var apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
    console.log(req.body);
    postNote(req.body, req.userData.userId);
    res.contentType("application/pdf");
    let name = modify(req.body)
    .then(name => {
        var callback = async function(error, data, response) {
            if (error) {
                console.error(error);
            } else {
                fs.writeFileSync(name+".pdf", data, () => {});
                const pdfDoc = await PDFDocument.load(fs.readFileSync(name+".pdf"));
                const [existingPage] = await pdfDoc.copyPages(pdfDoc, [1]);
                pdfDoc.addPage(existingPage);
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(name+".pdf", pdfBytes, () => {});
                res.send(fs.readFileSync(name+".pdf", () => {}));
            }
        };    
        let inputFile = Buffer.from(fs.readFileSync(name+".xlsx").buffer);
        apiInstance.convertDocumentXlsxToPdf(inputFile, callback);
        return name;
    });
});

app.post("/add-model", urlencodedParser, async function (req, res) {
    if(!req.body) return response.sendStatus(400);
    const model = new Models({
        name: req.body.name,
        code: req.body.code,
    });
    await model.save();
    res.sendStatus(204);
});


async function postNote(dataObj, userId){
    const date = new Date();
    let todayMonth = String(Number(date.getMonth())+1);
    if(todayMonth.length < 2){
        todayMonth = "0"+todayMonth;
    }
    const todayString = date.getDate() +"."+todayMonth+"."+date.getFullYear();
    const currentRepair = new Repairs({
        date: todayString,
        manager: dataObj.manager,
        model: dataObj.model,
        serial: dataObj.serial,
        repair_type: dataObj.repair_type,
        from: dataObj.from,
        equipment: dataObj.equipment,
        purchaseDate: dataObj.purchaseDate,
        clientName: dataObj.clientName,
        clientPhone: dataObj.clientPhone,
        malfunction: dataObj.malfunction,
        notes: dataObj.notes,
        appearance: dataObj.appearance,
        refoundNumber: dataObj.refoundNumber,
        replacementDevice: dataObj.replacementDevice == "" ? undefined : dataObj.replacementDevice,
        owner: userId
    });
    await currentRepair.save();
}
const cells = {
    shopAdress: "B3",
    number: ["B9", "B51"],
    manager: ["C5", 'B53', 'A46', 'A91'],
    dateTime: ["C6", "A51"],
    model: ["B12", "B52"],
    serial: ["B13", "B57"],
    appearance: ["B14", "B58"],
    notes: ["B15", "B60"],
    equipment: ["B16", "B59"],
    purchaseDate: ["B17", "B61"],
    timeFromPurchase: ["B18", "B62"],
    malfunction: ["B19", "B63"],
    from: "B54",
    clientName: ["B55", "A41", "A86"],
    clientPhone: "B56",
    replacementDevice: "B20",
}
async function read (name){
    const workbook = new XLSX.Workbook();
    await workbook.xlsx.readFile(name);
    return workbook;
}
async function modify(dataObj){
    console.log("start");
    const date = new Date();
    let todayMonth = String(Number(date.getMonth())+1);
    if(todayMonth.length < 2){
        todayMonth = "0"+todayMonth;
    }
    const todayString = date.getDate()+"."+todayMonth+"."+date.getFullYear();
    let minutesString = String(date.getMinutes());
    if(minutesString.length < 2){
        minutesString = "0"+minutesString;
    }
    const timeString = date.getHours()+":"+minutesString;
    let workbook = await read('act.xlsx');
    const sheet = workbook.worksheets[0];
    arrays(sheet, cells.manager, dataObj.manager);
    arrays(sheet, cells.dateTime, todayString+" "+timeString);
    arrays(sheet, cells.number, "КВИТАНЦИЯ "+date.getDate()+"/"+todayMonth+"/"+String(date.getFullYear()).substr(2,2))
    arrays(sheet, cells.model, dataObj.model);
    arrays(sheet, cells.serial, dataObj.serial);
    arrays(sheet, cells.appearance, dataObj.appearance);
    arrays(sheet, cells.notes, dataObj.repair_type + "; " + dataObj.notes);
    arrays(sheet, cells.equipment, Array.isArray(dataObj.equipment) ? dataObj.equipment.join(", ") : dataObj.equipment);
    const purchaseDate = new Date(dataObj.purchaseDate);
    let inputedPurchaseDate = dataObj.purchaseDate.split('-').reverse().join('.');
    arrays(sheet, cells.purchaseDate, inputedPurchaseDate);
    arrays(sheet, cells.timeFromPurchase, Math.floor((date-purchaseDate)/1000/3600/24) > 30 ? "Свыше 30 дней" : "до 30 дней");
    arrays(sheet, cells.malfunction, dataObj.malfunction);
    sheet.getCell(cells.from).value = dataObj.from+' (Магазин "Xistore", г. Могилев Планета Green)';
    arrays(sheet, cells.clientName, dataObj.clientName);
    sheet.getCell(cells.clientPhone).value = dataObj.clientPhone;
    sheet.getCell(cells.replacementDevice).value = dataObj.replacementDevice;
    await workbook.xlsx.writeFile(dataObj.clientName.split(" ")[0]+'.xlsx');
    return dataObj.clientName.split(" ")[0];
}

function arrays (sheet, array, value){
    array.forEach(element => {
        sheet.getCell(element).value = value;
    });
}

app.listen(port, () => console.log(`Server listening on port ${port}`));
