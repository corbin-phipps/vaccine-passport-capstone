const appAdmin = "admin"
let network = require('../application-javascript/app.js');

async function runTests() {
    // Test createPassport
    console.log("\nTesting createPassport...");

    let reqBody = {
        authenticatedUser: "vaccineAdministrator1",
        userID: "userID",
        owner: "owner",
        vaccineBrand: "vaccineBrand",
        vaccineSite: "vaccineSite",
        vaccineDate: "vaccineDate"
    }
    
    let authenticatedUser = reqBody.authenticatedUser;
    let networkObj = await network.connectToNetwork(authenticatedUser);
    if (networkObj.error) {
        console.error(networkObj.error);
    }

    let userID = reqBody.userID;
    let owner = reqBody.owner;
    let vaccineBrand = reqBody.vaccineBrand;
    let vaccineSite = reqBody.vaccineSite;
    let vaccineDate = reqBody.vaccineDate;
    let passportFields = {userID, owner, vaccineBrand, vaccineSite, vaccineDate}

    let createResponse = await network.createPassport(networkObj, passportFields);
    if (createResponse.error) {
        console.error(createResponse.error);
    }

    // Test readPassport
    console.log("\nTesting readPassport...");
    reqBody = {
        authenticatedUser: "generalUser",
        targetUser: "userID"
    }
    authenticatedUser = reqBody.authenticatedUser
    networkObj = await network.connectToNetwork(authenticatedUser);
    let user = reqBody.targetUser;

    let readResponse = await network.readPassport(networkObj, user);
    if (readResponse.error) {
        console.error(readResponse.error);
    }
}

runTests();