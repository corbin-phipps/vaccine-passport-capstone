rm -rf ../application-javascript/wallet/
./network.sh down
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn basic -ccp ../chaincode-javascript/ -ccl javascript
cd ../application-javascript
node enrollAdmin.js
node registerEnrollVaxAdmin.js vaccineAdministrator1
node registerEnrollGeneralUser.js