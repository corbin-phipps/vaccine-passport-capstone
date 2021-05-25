'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const walletPath = ('../application-javascript/wallet');
const appAdmin = "admin"
let network = require('../application-javascript/app.js');

async function runTests() {
    try {
        // Test login
        console.log("\nTesting login...");

        let reqBody = {
            authenticatedUser: "vaccineAdministrator1"
        }

        let authenticatedUser = reqBody.authenticatedUser;
        let networkObj = await network.connectToNetwork(appAdmin);
    
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);

        const adminIdentity = await wallet.get(appAdmin);
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, appAdmin);

        const identityService = caClient.newIdentityService();

        const retrieveIdentity = await identityService.getOne(authenticatedUser, adminUser);
        console.log("user identity type: ", retrieveIdentity.result.type);
        
        // Test createPassport
        console.log("\nTesting createPassport...");

        reqBody = {
            authenticatedUser: "vaccineAdministrator1",
            userID: "userID",
            owner: "owner",
            vaccineBrand: "vaccineBrand",
            vaccineSite: "vaccineSite",
            vaccineDate: "vaccineDate"
        }
        
        authenticatedUser = reqBody.authenticatedUser;
        networkObj = await network.connectToNetwork(authenticatedUser);
        if (networkObj.error) {
            console.error(networkObj.error);
        }

        let userID = reqBody.userID;
        let owner = reqBody.owner;
        let vaccineBrand = reqBody.vaccineBrand;
        let vaccineSite = reqBody.vaccineSite;
        let vaccineDate = reqBody.vaccineDate;
        let passportFields = [userID, owner, vaccineBrand, vaccineSite, vaccineDate];

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
        authenticatedUser = reqBody.authenticatedUser;
        networkObj = await network.connectToNetwork(authenticatedUser);
        if (networkObj.error) {
            console.error(networkObj.error);
        }
        let user = reqBody.targetUser;

        let readResponse = await network.readPassport(networkObj, user);
        if (readResponse.error) {
            console.error(readResponse.error);
        }
    } catch (error) {
        console.error("Error: " + error);
    }
}

runTests();