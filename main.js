const request = require('request');
const externalip = require('externalip');
var myIp, zoneID, recordID, bodyJson, baseDomain, ddnsDomain;

baseDomain = "farooq.xyz";  // enter the base domain you use with Cloudflare
ddnsDomain = "vpn.farooq.xyz"; // enter the subdomain you're going to use as the DDNS address
const apiKey = process.env.apiKey;
const email = process.env.email;

console.log("Updating!");

externalip(function (err, ip) { // find our external IP 
    myIp = ip;
})

zoneIDs();

async function zoneIDs() {
    zoneID = await getZoneID(apiKey, email, baseDomain)
    recordID = await getRecordID(apiKey, email, zoneID, ddnsDomain)
    ourIP = await putOurIP(apiKey, email, zoneID, recordID, ddnsDomain, myIp)
}

function getZoneID(apiKey, email, baseDomain) { // find domain's zone identifier through cloudflare's api
    return new Promise(resolve => {
        request({
            url: "https://api.cloudflare.com/client/v4/zones/", 
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Key": apiKey,
                "X-Auth-Email": email
            }
        }, function(error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            bodyJson = JSON.parse(body);

            for (var i = 0; i < bodyJson["result_info"]["total_count"]; i++){
                // look through the response body for the zone identifier, return this value
                if (bodyJson["result"][i]["name"] == baseDomain){
                    resolve(bodyJson["result"][i]["id"]);
                }
            }
        });
    })
}

function getRecordID(apiKey, email, zoneID, ddnsDomain) { // find the subdomain's record identifier through cloudflare api
    return new Promise(resolve => {
        request({
            url: "https://api.cloudflare.com/client/v4/zones/" + zoneID + "/dns_records" ,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Key": apiKey,
                "X-Auth-Email": email
            }
        }, function(error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            bodyJson = JSON.parse(body);

            for (var i = 0; i < bodyJson["result_info"]["total_count"]; i++){
                // look through the response body for the identifier, return this value
                if (bodyJson["result"][i]["name"] == ddnsDomain){
                    resolve(bodyJson["result"][i]["id"]);
                }
            }
        });
    })
}

function putOurIP(apiKey, email, zoneID, recordID, ddnsDomain, IP) { // update cloudflare with our external IP, pass in our zone identifier and record identifier
    return new Promise(resolve => {
        request({
            url: "https://api.cloudflare.com/client/v4/zones/" + zoneID + "/dns_records/" +  recordID,
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Auth-Key": apiKey,
                "X-Auth-Email": email
            },
            json: true,
            body: {"type":"A","name":ddnsDomain,"content":IP,"ttl":1,"proxied":false}
        }, function(error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            if (response.statusCode == "200") {
                console.info("Successfully updated!")
            }
        });
    })
}
