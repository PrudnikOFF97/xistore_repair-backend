XLSX = require('exceljs');
const mongoose = require("mongoose");
const Repairs = require("./Models/Repairs");
const Models = require("./Models/Models");
const fs = require('fs');

async function read (name){
    const workbook = new XLSX.Workbook();
    await workbook.xlsx.readFile(name);
    return workbook;
}

try {
    mongoose.connect("mongodb+srv://prudnikoff:1q2w3e@cluster0-3gb3f.mongodb.net/xistore?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    });
} catch (e) {
    console.log(e);
    return;
}
function splitSerial(string){
    let str = string;
    return str.split(' (')[str.split(' (').length-1].split(')')[0];
}
function splitModel(string){
    let str = string;
    return str.replace('('+splitSerial(str)+')','').trim();
}
function dateTransform(value){
    if (!value){
        return undefined;
    }
    try{
        let date = new Date(value);
        if (isNaN(date.getTime())) {
            return undefined;
        }
        let month = String(Number(date.getMonth())+1);
        let day = date.getDate();
        if(month.length < 2){
            month = "0"+month;
        }
        if(day.length < 2){
            day = "0"+day;
        }
        return day+"."+month+"."+date.getFullYear();
    }   
    catch{
        return undefined;
    }
}
async function gg(){
    let workbook = await read('rem.xlsm');
    const sheet = workbook.worksheets[0];
    let rowNumber = 1235;
    // console.log(dateTransform("не доступен"));
    while(sheet.getCell("B"+rowNumber).value !== ""){
        
        let currentRepair = new Repairs({
            date: dateTransform(sheet.getCell("B"+rowNumber).value),
            model: splitModel(sheet.getCell("C"+rowNumber).value),
            serial: splitSerial(sheet.getCell("C"+rowNumber).value),
            repair_type: sheet.getCell("E"+rowNumber).value,
            clientName: sheet.getCell("D"+rowNumber).value,
            clientPhone: sheet.getCell("F"+rowNumber).value,
            sendingDate: dateTransform(sheet.getCell("G"+rowNumber).value),
            receivingDate: dateTransform(sheet.getCell("H"+rowNumber).value),
            issueDate: dateTransform(sheet.getCell("I"+rowNumber).value),        
            refoundNumber: sheet.getCell("B"+rowNumber).note.texts[0].text,
            replacementDevice: sheet.getCell("J"+rowNumber).value ? sheet.getCell("J"+rowNumber).value : undefined
        });
        console.log(currentRepair);
        await currentRepair.save();
        rowNumber++;
    }

}
gg();
// while(sheet.getCell("B"+rowNumber).value !== "")
