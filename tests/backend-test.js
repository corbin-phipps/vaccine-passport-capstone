'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const walletPath = ('../application-javascript/wallet');
const appAdmin = "admin"
let network = require('../application-javascript/app.js');
const { exit } = require('process');

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function runTests() {
    await loginTest("nonexistent-user");
    await loginTest("vaccineAdministrator1");
    await createPassportTest();
    await readPassportTest();
    await readOwnPassportTest();
    await updatePassportTest();
    await readOwnPassportTest();
    exit();
}

async function loginTest(authUser) {
    try {
        // Test login of vaccine admin
        console.log("\nTesting login...");

        let reqBody = {
            authenticatedUser: authUser
        }

        let authenticatedUser = reqBody.authenticatedUser;
    
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);

        const adminIdentity = await wallet.get(appAdmin);
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, appAdmin);

        const identityService = caClient.newIdentityService();

        try {
            const retrieveIdentity = await identityService.getOne(authenticatedUser, adminUser);
            console.log("user identity type: ", retrieveIdentity.result.type);
        } catch (error) {
            console.error("No identity found for user \"" + authenticatedUser + "\"");
        }

    } catch (error) {
        console.error(error);
    }
}

async function createPassportTest() {
    try {
        // Test createPassport
        console.log("\nTesting createPassport...");

        let reqBody = {
            authenticatedUser: "vaccineAdministrator1",
            userID: "userID",
            owner: "owner",
            vaccineBrand: "Pfizer",
            vaccineSite: "Walgreens",
            vaccineDate: "05/02/2021"
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
        let passportFields = [userID, owner, vaccineBrand, vaccineSite, vaccineDate];

        let response = await network.createPassport(networkObj, passportFields);
        if (response.error) {
            console.error(response.error);
        }
    } catch (error) {
        console.error(error);
    }
}

async function readPassportTest() {
    try {
        // Test readPassport
        console.log("\nTesting readPassport...");
        let reqBody = {
            authenticatedUser: "generalUser",
            targetUser: "userID"
        }
        let authenticatedUser = reqBody.authenticatedUser;
        let networkObj = await network.connectToNetwork(authenticatedUser);
        if (networkObj.error) {
            console.error(networkObj.error);
        }
        let user = reqBody.targetUser;

        let response = await network.readPassport(networkObj, user);
        if (response.error) {
            console.error(response.error);
        } else {
            console.log("Passport exists for user \"" + user + "\""); // later would test to see if fully vaccinated
        }
    } catch (error) {
        console.error(error);
    }
}

async function readOwnPassportTest() {
    try {
        // Test readOwnPassport
        console.log("\nTesting readOwnPassport...");
        let reqBody = {
            authenticatedUser: "userID",
            targetUser: "userID"
        }
        let authenticatedUser = reqBody.authenticatedUser;
        let networkObj = await network.connectToNetwork(authenticatedUser);
        if (networkObj.error) {
            console.error(networkObj.error);
        }
        let user = reqBody.targetUser
    
        if (authenticatedUser === user) {
            let response = await network.readPassport(networkObj, user);
            if (response.error) {
                console.error(response.error);
            } else {
                console.log(`*** Result: ${prettyJSONString(response.toString())}`);
            }
        } else {
            console.error("Logged in user is different from target user");
        }
    } catch (error) {
        console.error(error);
    }
}

async function updatePassportTest() {
    try {
        // Test updatePassport
        console.log("\nTesting updatePassport...");
        let reqBody = {
            authenticatedUser: "vaccineAdministrator1",
            userID: "userID",
            vaccineSite2: "CVS",
            vaccineDate2: "05/26/2021"
        }
        let authenticatedUser = reqBody.authenticatedUser;
        let networkObj = await network.connectToNetwork(authenticatedUser);

        let userID = reqBody.userID;
        let vaccineSite2 = reqBody.vaccineSite2;
        let vaccineDate2 = reqBody.vaccineDate2;
        let passportFields = [userID, vaccineSite2, vaccineDate2];

        let response = await network.updatePassport(networkObj, passportFields);
        if (response.error) {
            console.error(response.error);
        } 
    } catch (error) {
        console.error(error);
    }
}

runTests();