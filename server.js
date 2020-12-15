const { PDFDocument } = require('pdf-lib');
XLSX = require('exceljs');
const express = require('express');
const urlencoded = require("body-parser");
const mongoose = require("mongoose");
const Repairs = require("./Models/Repairs");
const Models = require("./Models/Models");
const fs = require('fs');
const CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');

var defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = "13a8007f-a90e-4338-89ef-e935624edf50";


const port = process.env.PORT || 1337;

const urlencodedParser = urlencoded({extended: false});
const app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    next();
});
app.use(express.static("public"));

try {
    mongoose.connect("mongodb+srv://prudnikoff:1q2w3e@cluster0-3gb3f.mongodb.net/xistore?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
} catch (e) {
    console.log(e);
    return;
}

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
app.get('/', (req, res) =>{
    // res.download("name.pdf");
    // res.redirect('name.pdf');
});
async function serveRepairs(req, res){
    let result = await Repairs.find({}).lean();
    res.json(result);
}
app.get('/repairs', serveRepairs);
app.get('/repairs/:id', urlencodedParser, async function (req, res){
    console.log(req.params);
    let result = await Repairs.findById(req.params["id"]);
    res.json(result);
});

app.post("/", urlencodedParser, async function (req, res) {
    if(!req.body) return response.sendStatus(400);
    var apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
    console.log(req.body);
    postNote(req.body);
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

app.post("/update/:id", urlencodedParser, async function (req, res) {
    let repair = await Repairs.findById(req.params["id"]);
    console.log(Object.keys(req.body));
    console.log(req.body[Object.keys(req.body)]);
    if(req.body[Object.keys(req.body)]){
        repair[Object.keys(req.body)] = req.body[Object.keys(req.body)].split("-").reverse().join('.');
    }
    await repair.save();
    res.sendStatus(204);
});

async function postNote(dataObj){
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
        replacementDevice: dataObj.replacementDevice == "" ? undefined : dataObj.replacementDevice
    });
    await currentRepair.save();
}
const cells = {
    shopAdress: "B3",
    number: ["B8", "B46"],
    manager: ["C4", 'B48'],
    dateTime: ["C5", "A46"],
    model: ["B11", "B47"],
    serial: ["B12", "B52"],
    appearance: ["B13", "B53"],
    notes: ["B14", "B55"],
    equipment: ["B15", "B54"],
    purchaseDate: ["B16", "B56"],
    timeFromPurchase: ["B17", "B57"],
    malfunction: ["B18", "B58"],
    from: "B49",
    clientName: "B50",
    clientPhone: "B51",
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
    arrays(sheet, cells.number, date.getDate()+"/"+todayMonth+"/"+String(date.getFullYear()).substr(2,2))
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
    sheet.getCell(cells.clientName).value = dataObj.clientName;
    sheet.getCell(cells.clientPhone).value = dataObj.clientPhone;
    await workbook.xlsx.writeFile(dataObj.clientName.split(" ")[0]+'.xlsx');
    return dataObj.clientName.split(" ")[0];
}

function arrays (sheet, array, value){
    array.forEach(element => {
        sheet.getCell(element).value = value;
    });
}

app.listen(port, () => console.log(`Server listening on port ${port}`));
