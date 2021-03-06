'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient, enrollVaxAdmin, readIdentity, uploadIdentity } = require('./CAUtil.js');
const { buildWallet } = require('./AppUtil.js');
const { exit } = require('process');

const configPath = '../server/config.json';
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

const ccpPath = '../server/' + config.connection_profile;
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const walletPath = path.join(__dirname, 'wallet');
const mspOrg = config.orgMSPID;
const appAdmin = config.appAdmin;

// Requires a userID for the vaccine administrator as a command line argument
async function main() {
    const args = process.argv.slice(2);
    const vaccineAdministratorID = args[0];
    const vaccineAdministratorSecret = args[1];
    if (vaccineAdministratorID == undefined) {
        console.error("Missing vaccineAdministratorID argument");
    }

    try {
        // Check if user already exists in the system
        const wallet = await buildWallet(Wallets, walletPath);
        const userIdentity = await wallet.get(vaccineAdministratorID);
        if (userIdentity != undefined) {
            console.error("Identity for the user \"" + vaccineAdministratorID + "\" already exists");
        }

        // Check if CA admin is enrolled already
        const adminIdentity = await wallet.get(appAdmin);
        if (adminIdentity == undefined) {
            console.error("No identity found for admin user \"" + appAdmin +  "\". Run the enrollAdmin.js application before retrying");
        }

        // Connect to the gateway as the admin
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: appAdmin,
            discovery: config.gatewayDiscovery
        });

        // Get CA client to interact with the CA server
        const caClient = buildCAClient(FabricCAServices, ccp, config.caName);

        // Register and enroll the new user
        await enrollVaxAdmin(caClient, wallet, mspOrg, vaccineAdministratorID, vaccineAdministratorSecret);
        let params = await readIdentity(vaccineAdministratorID);
        await uploadIdentity(params);
        exit();

    } catch (error) {
        console.error("Failed to register and enroll vaccine administrator \"" + vaccineAdministratorID + "\".");
        console.error(error);
    }
} 

main();