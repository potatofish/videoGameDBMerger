/*
var fs = require("fs");

fs.readFile("vgsales.csv", function(err, buf) {
  console.log(buf.toString());
});
*/

const fs = require('fs');
var csv = require('csv');
var inputPath = "vgsales.csv";


/*

request(url, function (err, response, body) {
  if(err){
    var error = "cannot connect to the server";
    console.log(error);
  } else {
    console.log(‘body:’, body);
  }
});
*/
var tiny = require('tiny-json-http')
const cheerio = require('cheerio');
const { title } = require('process');


var url = "https://en.wikipedia.org/wiki/List_of_Super_Nintendo_Entertainment_System_games";
;(async function _iife() {
  try {
    var requestedHTML = await tiny.get({url});
    const $ = cheerio.load(requestedHTML.body);

    //$('h2.title').text('Hello there!');
    //$('h2').addClass('welcome');

    var tables = $('table').toArray();
    var html_table = $('table#softwarelist');
    // gets table header titles; loops through all th data, and pulls an array of the values
    var table_header_dirty = html_table.find('th').map(function() {return $(this).text().trim();}).toArray();
    // re-order array to account for multiple rows and merged columns
    var table_header_clean = [
      table_header_dirty[0], table_header_dirty[1], table_header_dirty[2], // first 3 the same
      table_header_dirty[3] + " " + table_header_dirty[5],                 // next 3 are the
      table_header_dirty[3] + " " + table_header_dirty[6],                 // the release dates
      table_header_dirty[3] + " " + table_header_dirty[7],                 // for 3 regions
      table_header_dirty[4]                                                // REF column is last
    ];                                                                     // probably don't need it

    var number_of_columns = 7;
    var table_data = html_table.find('tbody tr').map(function(tr_index) {
      // gets the cells value for the row; loops through each cell and returns an array of values
      var cells = $(this).find('td').map(function(td_index) {return $(this).text().trim();}).toArray();
      // removes columns after the number of columns specified
      cells = cells.slice(0, number_of_columns);
      // returns an array of the cell data generated
      return [cells];
      // the filter removes empty array items
    }).toArray().filter(function(item) {return item.length;});

    var table_data_clean = [];
    table_data.forEach(row => {
      var row_clean = {};
      row.forEach((cell, index) => {
        var cellKey = table_header_clean[index];
        var cellValue = cell;
        row_clean[cellKey] = cellValue;
      });
      table_data_clean.push(row_clean)
    });

    //TODO Validate that Toystory has an alternate title under other
    //TODO Find other bad suffixer ("Archer MacLean's Super Dropzone" maybe?)


    //TODO 'Manchester United Championship Soccer•Lothar Matthäus Super SoccerGER' does not fit the below pattern
    //TODO "Kevin Keegan's Player Manager•K.H. Rummenigge's Player ManagerGER" does not fit the below pattern
    var old_regionAbbreviationMap = {
      Asia : ['JP',' †','KR'],
      Europe : ['EU','FR', 'ER'], //ER is short for GER
      'North America' : ['NA', 'MX'], 
      Other: ['BR','ER']
    };

    var regionAbbreviationMap = {
      Asia : ['JP','KR'],
      Europe : ['EU','FR', 'GER'], //ER is short for GER
      'North America' : ['NA', 'MX'], 
      Other: ['BR','ER']
    };
    
    var regionList =  {};
    var table_data_transformed = [];
    table_data_clean.forEach(row => {
      //console.log(row);
      var row_transformed = {};
      row_transformed['Releases'] = {
        'Asia': {'Date': row['Release date Japan'], AlternateTitles: []},
        'North America': {'Date': row['Release date North America'], AlternateTitles: []},
        'Europe': {'Date': row['Release date PAL region'], AlternateTitles: []},
        'Other': {AlternateTitles: []}
      };
      row_transformed['Debug'] = {};
      var titleArray = row['Title'].replace(' †','').replace(' †','').split('•');

      
      //row_transformed['Array Titles'] = JSON.stringify([titleArray, titleArray.length]);
      row_transformed['Title'] = titleArray.shift();
      //row_transformed['Array TitlesX'] = JSON.stringify([rowSplit, rowSplit.length]);


      if (titleArray.length > 0) {
        //var regionList =  {};
        titleArray.forEach(alternateTitle => {
          var regionAbbreviation = alternateTitle.slice(-2);
          if (regionAbbreviation == "ER") {
            regionAbbreviation = alternateTitle.slice(-3);
          }

          var altTitleObject = {
            title: alternateTitle.slice(alternateTitle.length*-1,-2),
            region: alternateTitle.slice(-2)
          }

          /*
          row_transformed.Debug = {
            region_abbreviation: regionAbbreviation,
            regions_checked: []
          };
           */
          //console.log(row_transformed['Title'],row_transformed['Debug']);
          var regionMapped = false;
          Object.keys(regionAbbreviationMap).forEach(region => {
            //console.log(Object.keys(regionAbbreviationMap),region, regionAbbreviationMap[region], regionAbbreviationMap[region].indexOf(regionAbbreviation));
            //row_transformed.Debug.regions_checked.push(region);
            if(regionAbbreviationMap[region].indexOf(regionAbbreviation) >= 0) {
              regionMapped = true;
              if (regionAbbreviationMap[region].indexOf(regionAbbreviation) == 0) {
                row_transformed['Releases'][region]['Title'] = alternateTitle.slice(alternateTitle.length*-1,regionAbbreviation.length*-1);
              }
              else {
                //console.log({region, release: row_transformed['Releases'][region]}, regionAbbreviation);
                row_transformed['Releases'][region].AlternateTitles.push({title: alternateTitle.slice(alternateTitle.length*-1,regionAbbreviation.length*-1), region: regionAbbreviation});
                console.log("Missed Region See Debug");
                row_transformed.Debug['RAW Titles'] = row['Title'];
                //row_transformed.Debug['Missed Region'] = {regionAbbreviation, title: alternateTitle.slice(alternateTitle.length*-1,regionAbbreviation.length*-1)};
              }
            }
          });

          // There is no region, so save this as an alternate title under other
          if (!(regionMapped)) {
            console.log({alternateTitle,alternateTitle });
            row_transformed.Debug['RAW Titles'] = row['Title'];
            row_transformed['Releases'].Other.AlternateTitles.push({alternateTitle});
          }

          //console.log(row_transformed);


          //List Regiontags of titles for design informing
          if (!(regionList[altTitleObject.region])) {
            regionList[altTitleObject.region]=0;
          };
          regionList[altTitleObject.region]++;
        });
      }

      Object.keys(row_transformed['Releases']).forEach(releaseKey => {
        if(row_transformed['Releases'][releaseKey].Date == 'Unreleased') {
          delete row_transformed['Releases'][releaseKey].Date;
        }

        //TODO 'Dragon Ball Z: Super Butouden 3 †•Dragon Ball Z: ChomutujeonKR †•Dragon Ball Z: Ultime Menace FR' has wrong EU title  
        //TODO Dragon Ball Z: Super Butouden 2 †•Dragon Ball Z 2: la Légende SaienFR' has wrong EU title


        if(row_transformed['Releases'][releaseKey].Date) {
          if(!(row_transformed['Releases'][releaseKey].Title)) {
            if ((row_transformed['Releases'][releaseKey].AlternateTitles.length > 0)) {
              // Table Makes Some Choices with priorities on naming.
              if (row_transformed['Title'] == 'Dragon Ball Z: Super Butouden 2' || row_transformed['Title'] == 'Dragon Ball Z: Super Butouden 3' ) {
                row_transformed['Releases'][releaseKey].Title = row_transformed['Releases'][releaseKey].AlternateTitles[0].title;
              }
              else {
                row_transformed['Releases'][releaseKey].Title = row_transformed['Title'];
              }
            }
          }
          //console.log(releaseKey, row_transformed['Releases'][releaseKey]);
        }
      });
      
      //console.log(Object.keys(row_transformed.Debug));
      if (Object.keys(row_transformed.Debug).length>0) {
        console.dir({
          title: row_transformed['Title'], 
          releases: row_transformed['Releases'],
          debug: row_transformed.Debug
        }, { depth: null });
      }
      table_data_transformed.push(row_transformed)
    });
    console.log({'Games Developed' : table_data_transformed.length});
    
    //console.log(regionList);
    var renderedHTMLdata = $.html();
    return;
    //=> <html><head></head><body><h2 class="title welcome">Hello there!</h2></body></html>
    console.log({tab0: tables[0], tabH: table_header_clean});
    table_data_transformed.forEach(row => {
      var titleCount = JSON.parse(row['Array Titles'])[1];
      if (titleCount > 1) {
        console.log(row);
      }
    });

  } catch (err) {
    console.log('ruh roh!', err)
  }
})();



//console.log(data);
//=> {"hello": "world"}

fs.readFile(inputPath, function (err, fileData) {
  var result = csv.parse(fileData, {columns: true, trim: true}, function(err, rows) {
    // Your CSV data is in an array of arrys passed to this callback as rows.
    var headers = rows[0];
    var lookupConditions = [
        ['Platform', 'SNES']
    ];
    var lookupColumns = ["Name"]
    
    var validRows = [];
    var countOfS = 0;

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
                ;//console.log({columnToCheck, valueToCheck, valueBeingChecked});
            }
        });
        var platform = row["Platform"];
        var beginsWithS = /^S.*$/.test(row["Platform"]);
        if (beginsWithS) {
          countOfS++;
          //console.log({platform, beginsWithS, countOfS});
        }
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