'use strict';

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const configPath = path.join(process.cwd(), '../server/config.json');
const configJSON = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configJSON);

const s3 = new AWS.S3({
    accessKeyId: config.s3AccessKey,
    secretAccessKey: config.s3SecretAccessKey,
    Bucket: config.s3BucketName
});

// Helper function to build a local filesystem wallet to store identities at the given path.
// Returns the newly created wallet object
exports.buildWallet = async (Wallets, walletPath) => {
	// Create a new  wallet : Note that wallet is for managing identities.
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}

	return wallet;
};

// Downloads an identity file from the S3 bucket from the given parameters
exports.s3download = async (params, walletPath) => {
    let promise = new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: config.s3BucketName
        }, function () {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
					// Uses the file downloaded from S3 and writes to local filesystem wallet
                    fs.writeFile(path.join(walletPath, params.Key), data.Body, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Successfully downloaded file: ' + params.Key + ' from S3 bucket');
                        }
                    });
                    resolve(data);
                }
            });
        });
    });

    return await promise;
}

//Uploads an identity file based on the given parameters to the S3 bucket 
exports.s3upload = async (params) => {
    let promise = new Promise((resolve, reject) => {
        s3.createBucket({
            Bucket: config.s3BucketName
        }, function () {
            s3.putObject(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    console.log('Successfully added file: ' + params.Key + ' to S3 bucket');
                    resolve(data);
                }
            });
        });
    });

    return await promise;
}
