// const ethers = require('ethers');
const moralis = require('moralis/node');
const bodyParser = require('body-parser');
require('dotenv').config({ path: '../.env' });
const votingStructure = require('./voting.json');
const express = require('express');
const debug = require('debug')('api:server');
const http = require('http');
const cors = require("cors");
const { Wallet } = require('ethers');


const serverUrl = process.env.REACT_APP_MORALIS_SERVER_URL;
const appId = process.env.REACT_APP_MORALIS_APPLICATION_ID;
const moralisSecret = process.env.REACT_APP_MORALIS_SECRET;


// const contractAddress = '0x23581767a106ae21c074b2276D25e5C3e136a68b';
const contractAddress = '0xbeB1d3357cD525947b16A9f7a2b3d50B50b977BD';


const jsonParser = bodyParser.json({ limit: '50mb' });

const paginationSize = 100;

const logging = true;


const app = express();
app.set('view engine', 'ejs');

app.use(jsonParser); 

app.use(bodyParser.urlencoded({
     limit: '50mb',
     extended: true,
     parameterLimit: 50000
}));

app.locals.walletAddress = undefined;
app.locals.electees = undefined;
app.locals.addressVoted = undefined;
app.locals.randomSelection = true;
app.locals.continueElection = false;
app.set('iteration', 0);
app.set('votingStructure', votingStructure)

const router = require('./routes/comVoting');
app.use(cors());
app.use('/api/', router);
const PORT = 9000;
app.set('port', PORT);

const server = http.createServer(app);

// app.listen(PORT, () => {
//     const url= `http://localhost:${PORT}/`;
//     console.log(`Listening on ${url}`);
// });
// server.on('error', onError);
// server.on('listening', onListening);


function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
    return num
  }


function checkForTies(values, indexMaxVotes, amountMaxVotes)
{
    for(let i = 0; i < values.length; i++)
    {
        if(i !== indexMaxVotes)
        {
            if(amountMaxVotes > values[i])
            {
                return false;
            }
            else
            {
                return true;
            }
        }
    }
}


function obtainElectedWalletsDemo(electeePool, electorPool, address, res)
{
    const modifiedElecteePool = electeePool.sort(() => 0.5 - Math.random()).slice(0, 10);
    const reducedElecteePoolIndices = Array.from({length: electorPool.length}, () => Math.floor(randn_bm() * (modifiedElecteePool.length))).sort();
    let demoElectedWallets = []
    
    for(let i = 0; i < reducedElecteePoolIndices.length; i++)
    {
        demoElectedWallets.push(modifiedElecteePool[reducedElecteePoolIndices[i]]);

    }
    console.log("demoElectedWallets: " + demoElectedWallets)
    let electeeArrayOfMaps = [];

    for(let i = 0; i < modifiedElecteePool.length; i++)
    {
        const electeeMap = { option: modifiedElecteePool[i], votes: 0 };
        electeeArrayOfMaps.push(electeeMap);
    }
    console.log(electeeArrayOfMaps)
    // app.locals.electees = electeeArrayOfMaps;
    // app.set('electeePool', electeeArrayOfMaps);
    // app.locals.randomSelection = false;
    // app.set('continueElection', false);

    
    demoElectedWallets[demoElectedWallets.length - 1] = address;
    // console.log(app.get('electeePool'));
    console.log("demo wallet: " + demoElectedWallets[demoElectedWallets.length - 1])

    res.json(
        {
            "random_selection" : false,
            "electee_pool" : electeeArrayOfMaps
        })

    // if(getWalletDemo().includes(app.get('wallet')))
    // {
    //     app.set('electeePool', electeePool);
    //     getSelection();


    // }
    
    return demoElectedWallets;
}


async function electionProcess(nftOwnersAddresses, res, req, iteration, address)
{
    let mutatingNftOwnerAddresses = nftOwnersAddresses;
    let electedWallets;
    let voteCountsMap = {};

    // for(let i = 0; i < votingStructure.rounds; i++)
    // {
    // eslint-disable-next-line default-case
    console.log("voting Struct: " + votingStructure.round_type[iteration])
    switch(votingStructure.round_type[iteration])
    {
        case "lottery": 
            mutatingNftOwnerAddresses = mutatingNftOwnerAddresses.sort(() => 0.5 - Math.random());
            mutatingNftOwnerAddresses = mutatingNftOwnerAddresses.slice(0, votingStructure.n_people_chosen[iteration]);
            // app.locals.electees = true;
            
            let electeeArrayOfMaps = [];
            for(let i = 0; i < mutatingNftOwnerAddresses.length; i++)
            {
                const electeeMap = { option: mutatingNftOwnerAddresses[i], votes: 1 };
                electeeArrayOfMaps.push(electeeMap);
            }
            console.log("lottery Round: " + electeeArrayOfMaps)

            res.json(
                {
                    "random_selection" : true,
                    "electee_pool" : electeeArrayOfMaps
                })
            break;
        case "election":
            console.log("Number of addresses in this iteration: " + mutatingNftOwnerAddresses.length);
            //electedWallets can be 
            electedWallets = obtainElectedWalletsDemo(nftOwnersAddresses, mutatingNftOwnerAddresses, address, res);
            // if(electedWallets.includes(app.get('wallet')));

            console.log(electedWallets);
            for (const electedWallet of electedWallets) {
                voteCountsMap[electedWallet] = voteCountsMap[electedWallet] ? voteCountsMap[electedWallet] + 1 : 1;
            }
            console.log(voteCountsMap);
            break;
    }

    const continueLoop = await req.body.continueElection;

    console.log(continueLoop)

    
    const values = Object.values(voteCountsMap);
    const keys = Object.keys(voteCountsMap);

    const amountMaxVotes = Math.max(...values);
    const indexMaxVotes = keys[values.indexOf(Math.max(...values))];

    const ties = checkForTies(values, indexMaxVotes, amountMaxVotes);

    if(ties)
    {
        return "Tied";
    }
    else
    {
        return indexMaxVotes;
    }

}

const runElectionProcess = async (res, req, iteration, address) => 
{

    await moralis.start({ serverUrl, appId, moralisSecret });
    const nftAccessOptions = { address: contractAddress, chain: "Eth", limit: 100};
    const nftOwnersData = await moralis.Web3API.token.getNFTOwners(nftAccessOptions);
    
    const amountOfOwners = parseInt(nftOwnersData.total);
    // console.log(amountOfOwners);
    var nftOwnersAddresses = Array(amountOfOwners);

    for(let i = 0; i < paginationSize; i++)
    {
        nftOwnersAddresses[i] = nftOwnersData.result[i].owner_of;
    }
    // console.log(nftOwnersData);

    let selectedWallets = electionProcess(nftOwnersAddresses, res, req, iteration, address);
    console.log("selected wallets: " + selectedWallets);
    app.set('electionResult', selectedWallets);
};

router.post('/', async (req, res) => {
    console.log("how many times")
    const address = await req.body.address;

    const localVotingStruct = req.app.get('votingStructure')
    let iteration = req.app.get('iteration')

    if(req.app.get('iteration') < localVotingStruct.rounds)
    {
        // console.log(req.app.iteration)
        await runElectionProcess(res, req, iteration, address);
        // if(req.body.continueElection != undefined)
        // {
            req.app.set('iteration', iteration + 1);
        // }
        
    }


    
    // const continueElection = await res.app.get('continueElection');
    // const electeePool = await res.app.get('electeePool')

    // console.log("continueElection: " + continueElection)
    // console.log("electeePool: " + electeePool)
    // res.json(
    //     {
    //         "random_selection" : continueElection,
    //         "electee_pool" : electeePool
    //     })
    // console.log("after");


    // req.app.set('wallet', address);
    // console.log('address is: ' + address);
    // res.end(“yes”);
});

// router.get('/electees/', async (req, res) => 
// {
//     // let electeePool = req.app.locals.electees; //req.app.get('electeePool')
//     // console.log("electee pool: " + electeePool);

//     // const continueElection = await app.get('continueElection');
//     // const electeePool = await app.get('electeePool')

//     // console.log("continueElection: " + continueElection)
//     // console.log("electeePool: " + electeePool)
//     // res.json(
//     //     {
//     //         "random_selection" : continueElection,
//     //         "electee_pool" : electeePool
//     //     })
// });

router.post('/vote/', async (req, res) => {
    const addressVoted = await req.body.addressVoted;
    req.app.locals.addressVoted = addressVoted;
});

// router.post('/continue/', async (req, res) => {
//     const continueElection = await req.body.continueElection;
//     req.app.locals.continueElection = continueElection;
// });

app.listen(PORT, () => {
    const url= `http://localhost:${PORT}/`;
    console.log(`Listening on ${url}`);
});

// runElectionProcess();