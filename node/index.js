/*
var fs = require("fs");

fs.readFile("vgsales.csv", function(err, buf) {
  console.log(buf.toString());
});
*/

const fs = require('fs');
var csv = require('csv');
var inputPath = "vgsales.csv";

fs.readFile(inputPath, function (err, fileData) {
  var result = csv.parse(fileData, {columns: true, trim: true}, function(err, rows) {
    // Your CSV data is in an array of arrys passed to this callback as rows.
    var headers = rows[0];
    var lookupConditions = [
        ['Platform', 'SNES']
    ];
    var lookupColumns = ["Name"]
    
    var validRows = [];
    rows.forEach(row => {
        var rowIsValid = true;
        lookupConditions.forEach(lookupCondition => {
            var columnToCheck = lookupCondition[0];
            var valueToCheck = lookupCondition[1];
            var valueBeingChecked = row[columnToCheck];
            if (valueToCheck != row[columnToCheck]) {
                rowIsValid = false;
            }
            else {
                console.log({columnToCheck, valueToCheck, valueBeingChecked});
            }
        });
        if (rowIsValid) {
            validRows.push(row);
        }
        //console.log(row);
    });
    console.log(validRows[0]);
    console.log(validRows.length);
    console.log(lookupConditions);
    //return headers;
  })
  //console.log(result);
})