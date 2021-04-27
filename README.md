# Vaccine Passport Capstone

## How to Run
In a terminal, navigate to the test network directory

`cd test-network`


To clear old network and start fresh, run this command

`./network.sh down`


Start up the network

`./network.sh up createChannel mychannel -ca`


Deploy chaincode

`./network.sh deployCC -ccn basic -ccp ../chaincode-javascript/ -ccl javascript`


In a separate terminal, navigate to the application code directory

`cd application-javascript`


Run the application

`node app.js`
