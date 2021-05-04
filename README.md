# Vaccine Passport Capstone

## How to Run

For the first time, clone the repo

`git clone https://gitlab.cs.washington.edu/cmp99/vaccine-passport-capstone.git`


In a terminal, enter the code directory

`cd vaccine-passport-capstone`


Navigate to the test network directory

`cd test-network`


Run this command to shut down old network, start up fresh new network

`./start.sh`


## Running Demo with Multiple Nodes

Open 3 terminals (network admin, peer0.org1, peer0.org2)


In the network admin terminal, start up network

`cd test-network`
`./start.sh`


In the peer0.org1 terminal, run this command to set up the environment

`source terminalorg1`


In the peer0.org2 terminal, run this command to set up the environment

`source terminalorg2`


To invoke chaincode functions from either peer terminals, run the following command

`peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls true --cafile $ORDERER_CA -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"Args":["ReadAsset", "vp1"]}'`


Edit the end of the previous command to invoke other chaincode functions with different arguments, such as

`{"Args":["CreateAsset", "vp1", "Alice", "Pfizer", "qfc", "05/04/2021"]}`