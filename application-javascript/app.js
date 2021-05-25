// TODO: enroll admin in separate file

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const appAdmin = "admin";
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

const ccp = buildCCPOrg1();

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

exports.connectToNetwork = async function (userName) {
	const gateway = new Gateway();
	
	try {
		const wallet = await buildWallet(Wallets, walletPath);
		const userIdentity = await wallet.get(userName);
		if (userIdentity == undefined) {
			let response = {};
			response.error = "No identity found for user \"" + userName + "\". Please register/enroll user before trying again.";
			return response;
		}

		await gateway.connect(ccp, {
			wallet,
			identity: userName,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		const network = await gateway.getNetwork(channelName);

		const contract = network.getContract(chaincodeName);

		let networkObj = {
			contract: contract,
			network: network,
			gateway: gateway
		};

		return networkObj;
	} catch (error) {
		let response = {};
		response.error = error;
		return response;
	} finally {

	}
};

exports.readPassport = async function (networkObj, user) {
	try {
		// Check if the user exists in the blockchain database
		await networkObj.contract.evaluateTransaction('AssetExists', user);

		// Return query associated with the given user, if the user exists
		let result = await networkObj.contract.evaluateTransaction('ReadAsset', user);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);	

		return result;

	} catch (error) {
		console.error("User \"" + user + "\" does not exist.")
		return error;
	}
};

exports.createPassport = async function (networkObj, passportFields) {
	try {
		/* Create vaccine passport asset */
		let userID = passportFields[0];
		let owner = passportFields[1];
		let vaccineBrand = passportFields[2];
		let vaccineSite = passportFields[3];
		let vaccineDate = passportFields[4];
	
		let passportResponse = await networkObj.contract.submitTransaction('CreateAsset', userID, owner, vaccineBrand, vaccineSite, '', vaccineDate, '');

		// Disconnect from the gateway as the vaccine administrator so we can reconnect as the admin later on
		await networkObj.gateway.disconnect();

		/* Register and enroll the new user into the system */

		// Check if user already exists in the system
		const wallet = await buildWallet(Wallets, walletPath);
		const userIdentity = await wallet.get(userID);
		if (userIdentity != undefined) {
			let response = {};
			response.error = "Identity for the user \"" + userID + "\" already exists";
			return response;
		}

		// Check if CA admin is enrolled already
		const adminIdentity = await wallet.get(appAdmin);
    	if (adminIdentity == undefined) {
      		let response = {};
      		response.error = "No identity found for admin user \"" + appAdmin +  "\". Run the enrollAdmin.js application before retrying";
      		return response;
		}
		
		// Connect to the gateway as the admin
		const gateway = new Gateway();
		await gateway.connect(ccp, {
			wallet,
			identity: appAdmin,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		// Get CA client to interact with the CA server
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// Register and enroll the new user
		await registerAndEnrollUser(caClient, wallet, mspOrg1, userID, '');

		return passportResponse;

	} catch (error) {
		console.error("CreatePassport failed: " + error);
		return error;
	}
};