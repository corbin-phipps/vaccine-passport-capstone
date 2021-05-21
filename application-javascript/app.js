// TODO: enroll admin in separate file

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');

const ccp = buildCCPOrg1();

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// For console input
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

// function that promises to ask a question and 
// resolve to its answer
function ask(questionText) {
	return new Promise((resolve, reject) => {
		readline.question(questionText, (input) => resolve(input) );
	});
}


exports.connectToNetwork = async function (userName) {
	const gateway = new Gateway();
	
	try {
		const wallet = await buildWallet(Wallets, walletPath);
		const userExists = await wallet.exists(userName);
		if (!userExists) {
			let response = {};
			response.error = "need to register user first";
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
		let userExists = await contract.evaluateTransaction('AssetExists', user);

		// Return query associated with the given user, if the user exists
		let result = await contract.evaluateTransaction('ReadAsset', user);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);	

		return result;

	} catch (error) {
		console.error("User \"" + user + "\" does not exist.\n")
		return error;
	}
};

// TODO: Check if admin exists, register/enroll user
exports.createPassport = async function (networkObj, passportFields) {
	try {
		/* Create vaccine passport asset */
		userID = JSON.parse(passportFields[0]);
		owner = JSON.parse(passportFields[1]);
		vaccineBrand = JSON.parse(passportFields[2]);
		vaccineSite = JSON.parse(passportFields[3]);
		vaccineDate = JSON.parse(passportFields[4]);

		userID = JSON.stringify(userID);
		owner = JSON.stringify(owner);
		vaccineBrand = JSON.stringify(vaccineBrand);
		vaccineSite = JSON.stringify(vaccineSite);
		vaccineDate = JSON.stringify(vaccineDate);
		
		await contract.submitTransaction('CreateAsset', userID, owner, vaccineBrand, vaccineSite, null, vaccineDate, null);

		// Disconnect from the gateway as the vaccine administrator so we can reconnect as the admin later on
		await networkObj.gateway.disconnect();

		/* Register and enroll the new user into the system */

		// Check if user already exists in the system
		const wallet = await buildWallet(Wallets, walletPath);
		const userExists = await wallet.exists(userID);
		if (userExists) {
			let response = {};
			response.error = "Identity for the user: " + userID + " already exists";
			return response;
		}

		// Check if CA admin is enrolled already
		const adminExists = await wallet.exists(appAdmin);
    	if (!adminExists) {
      		let response = {};
      		response.error = "No identity found for admin user: " + appAdmin +  ". Run the enrollAdmin.js application before retrying";
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

	} catch (error) {
		console.error("CreatePassport failed: " + error);
		return error;
	}
};