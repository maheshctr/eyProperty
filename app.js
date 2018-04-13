const express = require('express');
const app = express();
var port = process.env.PORT || 3000;

app.get('/',(req,res) => {
    res.send('Hello World!!!');
});

function deleteDataFromCosmosDB()
{
    var mongoDBurl = "mongodb://eypropertysearch:AqswvaIrS4cNeY9OV5XJtD9WGwcBmn2vUXSXFKc6otj27kAGnXREGsznJZ9G0tzkp1bB1oZzitpqJZHXDhn5IA%3D%3D@eypropertysearch.documents.azure.com:10255/?ssl=true";
    //var mongoDBurl = "mongodb://127.0.0.1:27017";
    var databaseName = 'OnlineProperty';
    var mongoClient = require("mongodb").MongoClient;
    
    mongoClient.connect(mongoDBurl, function (err, client) {
        if (err) throw err;
        var db = client.db(databaseName);
        db.collection("Property").deleteMany({ });
    client.close();
    });
}

function insertDataToCosmosDB(listing)
{
    var mongoDBurl = "mongodb://eypropertysearch:AqswvaIrS4cNeY9OV5XJtD9WGwcBmn2vUXSXFKc6otj27kAGnXREGsznJZ9G0tzkp1bB1oZzitpqJZHXDhn5IA%3D%3D@eypropertysearch.documents.azure.com:10255/?ssl=true";
    //var mongoDBurl = "mongodb://127.0.0.1:27017";
    var databaseName = 'OnlineProperty';
    var mongoClient = require("mongodb").MongoClient;
    
    mongoClient.connect(mongoDBurl, function (err, client) {
        if (err) throw err;
        var db = client.db(databaseName);
        //db.collection("Property").deleteMany({ });
        db.collection("Property").insertMany(listing,function(err, res)
        {
            if (err) throw err;
            console.log(res.insertedCount+" documents inserted");
            // close the connection to db when you are done with it                    
        });
    client.close();
    });
}

app.get('/scrape', function name(req, res) {
    let url = 'https://housing.com/in/buy/search?f=eyJiYXNlIjpbeyJ0eXBlIjoiUE9MWSIsInV1aWQiOiIzOTkzZjkwYjViYzkwZGM4YzdkYiIsImxhYmVsIjoiSi4gUC4gTmFnYXIifSx7InR5cGUiOiJQT0xZIiwidXVpZCI6ImEyNzNjNGMzYmUwZWU4YjM2NjlmIiwibGFiZWwiOiJXaGl0ZWZpZWxkIn0seyJ0eXBlIjoiUE9MWSIsInV1aWQiOiIwMTM2ZGU5YzEyYzA1ZmM2YTdhOSIsImxhYmVsIjoiRWxlY3Ryb25pYyBDaXR5In1dLCJ2IjoyLCJzIjoiZCJ9';
    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
    const request = require('request');
    request(url, function (error, response, html) {
        // First we'll check to make sure no errors occurred when making the request
        let listing = [];
        if (!error) {
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
            const cheerio = require('cheerio');
            var $ = cheerio.load(html);
            for (let index = 0; index < 
                $('.infinite-loader>.infi-item-wrapper>.list-item-container>.list-card-item').length; index++) {
                const ele = $('.infinite-loader>.infi-item-wrapper>.list-item-container>.list-card-item')[index];
                console.log(ele);
                let prop = {};
                prop.img = $($(ele).find('.lst-img-container>.lst-img')[0]).css('background-image').replace('url(', '').replace(')', '').replace('"','');
                prop.propName = $($(ele).find('.lst-dtls>.lst-heading>.lst-title')[0]).text()
                prop.propCost = $($($('.infinite-loader')[0]).find('.lst-dtls>.lst-price-cnfg>.lst-price>.price-txt')[0]).text();
                if (prop.propCost.toString().indexOf('Lacs') > -1) {
                    prop.propCost = Number(prop.propCost.replace('Lacs', '')) * 100000;
                }
                if (prop.propCost.toString().indexOf('Cr') > -1) {
                    prop.propCost = Number(prop.propCost.replace('Cr', '')) * 10000000;
                }
                const qtyType = $($($(ele).find('.lst-dtls>.lst-middle-section>div>.lst-sub-title '))[0]).text();
                if (qtyType == 'Configs') {

                    prop.bhk = $($($(ele).find('.lst-dtls>.lst-middle-section>div>.lst-sub-value'))[0]).text()
                }
                if (qtyType == 'Built Up Area') {
                    prop.area = $($($(ele).find('.lst-dtls>.lst-middle-section>div>.lst-sub-value'))[0]).text()
                }

                prop.locality = $($($(ele).find('.lst-dtls>.lst-heading>.lst-loct>span '))[0]).text()
                prop.builder = $($($(ele).find('.lst-dtls>.lst-contact>.cntc-section>.lst-cntct-dtls>.lst-cntct-title>.cntct-link>span '))[0]).text()
                console.log(prop);
                listing.push(prop);
            }
            // Finally, we'll define the variables we're going to capture
            deleteDataFromCosmosDB();
            insertDataToCosmosDB(listing);
            var title, release, rating;
            var json = { title: "", release: "", rating: "" };
            res.send(listing);
        }
    })
});

app.listen(port, ()=>console.log('Listening to port:  ' + port));