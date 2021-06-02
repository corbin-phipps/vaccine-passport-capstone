'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { buildCAClient, registerAndEnrollUser } = require('./CAUtil.js');
const { buildWallet } = require('./AppUtil.js');
const AWS = require('aws-sdk');

const configPath = path.join(process.cwd(), './config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

const ccpPath = path.join(process.cwd(), config.connection_profile);
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

const s3 = new AWS.S3({
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretAccessKey,
    Bucket: config.s3BucketName
});

const channelName = 'mychannel';
const chaincodeName = 'asset-transfer-basic';
const appAdmin = config.appAdmin;
const mspOrg = config.orgMSPID;
const walletPath = path.join(__dirname, 'wallet');

async function s3download(params) {
    let promise = new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: config.s3BucketName
        }, function () {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    fs.writeFile(path.join(walletPath, params.Key), data.Body, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Successfully downloaded file from S3 bucket');
                        }
                    });
                    resolve(data);
                }
            });
        });
    });

    return await promise;
}

exports.connectToNetwork = async function (userName) {
	const gateway = new Gateway();
	
	try {
		const wallet = await buildWallet(Wallets, walletPath);

		const identityFileName = userName + '.id';
		const params = {
			Bucket: config.s3BucketName,
			Key: identityFileName
		}
		s3download(params);

		const userIdentity = await wallet.get(userName);
		if (userIdentity == undefined) {
			let response = {};
			response.error = "No identity found for user \"" + userName + "\".\n If " + userName + " is a vaccine administrator, please run registerEnrollVaxAdmin.js.";
			return response;
		}

		await gateway.connect(ccp, {
			wallet,
			identity: userName,
			discovery: config.gatewayDiscovery
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
	} 
};

exports.readPassport = async function (networkObj, user) {
	try {
		// Check if the user exists in the blockchain database
		await networkObj.contract.evaluateTransaction('AssetExists', user);

		// Return query associated with the given user, if the user exists
		let result = await networkObj.contract.evaluateTransaction('ReadAsset', user);	

		return result;

	} catch (error) {
		console.error("ReadPassport failed: " + error);
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

		let identityFileName = userID + '.id';
 		let params = {
			Bucket: config.s3BucketName,
			Key: identityFileName
		}
		s3download(params)
		.catch(e => {
			console.log('User does not exist confirmed');
		});

		const userIdentity = await wallet.get(userID);
		if (userIdentity != undefined) {
			let response = {};
			response.error = "Identity for the user \"" + userID + "\" already exists";
			return response;
		}

		// Check if app admin is enrolled already
		identityFileName = appAdmin + '.id';
		params = {
			Bucket: config.s3BucketName,
			Key: identityFileName
		}
		s3download(params)
		.catch(e => {
			console.log('App admin does not exist');
		});
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
			discovery: config.gatewayDiscovery
		});

		// Get CA client to interact with the CA server
		const caClient = buildCAClient(FabricCAServices, ccp, config.caName);

		// Register and enroll the new user
		await registerAndEnrollUser(caClient, wallet, mspOrg, userID, '');

		return passportResponse;

	} catch (error) {
		console.error("CreatePassport failed: " + error);
		return error;
	}
};

exports.updatePassport = async function (networkObj, passportFields) {
	let user = passportFields[0];
	let vaccineSite2 = passportFields[1];
	let vaccineDate2 = passportFields[2];
	
	try {
		let result = await networkObj.contract.evaluateTransaction('ReadAsset', user);
		let result_str = result.toString();

		const kvs = result_str.split(',');

		let ownerArr = kvs[1].split(":");
		let owner = ownerArr[1].substring(1, ownerArr[1].length - 1);

		let vaccineTypeArr = kvs[2].split(":");
		let vaccineType = vaccineTypeArr[1].substring(1, vaccineTypeArr[1].length - 1);

		if (vaccineType !== "Pfizer" && vaccineType !== "Moderna") {
			console.log(vaccineType + " only requires one dose.")
			return vaccineType + " only requires one dose.";
		} else {
			let vaccineAdminArr = kvs[3].split(":");
			let vaccineAdmin = vaccineAdminArr[1].substring(1, vaccineAdminArr[1].length - 1);

			let dateofFirstDoseArr = kvs[5].split(":");
			let dateofFirstDose = dateofFirstDoseArr[1].substring(1, dateofFirstDoseArr[1].length - 1);
			
			let response = await networkObj.contract.submitTransaction('UpdateAsset', user, owner, vaccineType, vaccineAdmin, vaccineSite2, dateofFirstDose, vaccineDate2);
			
			return response;
		}
	} catch (error) {
		console.error("UpdatePassport failed: " + error);
	}
}