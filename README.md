# Venetian Election DAO

A DAO to elect a leader via a group of wallets holding an NFT from a specific collection. The election style is inspired by the Venetian Election Style where the Doge (the king) would be elected through a series of alternating random/election cycles. This repository was forked from [moralis-poll](https://github.com/ashbeech/moralis-poll).

## Prereqs
- Metamask Wallet or equivalent
- Moralis Account
- Nodejs and reactjs

## Setup instructions
1. First, clone this repo:
```
git clone https://github.com/solarsailorneo/venetianElectionDAO.git
```
2. You will need to get a Moralis account and spin up a server. I used the Rinkeby testnet for this project, but any testnet will do.
3. Once you spin up the server you will need to obtain the *server URL*, *application ID*, and *CLI API Secret*, create an `.env` file in the `frontend` directory, and place the values in the file. The flags are: `REACT_APP_MORALIS_SERVER_URL`, `REACT_APP_MORALIS_APPLICATION_ID`, and `REACT_APP_MORALIS_SECRET` respectively.

## How to Run
To run, type the following commands in the terminal:

```
cd venetianElectionDAO/backend/
node processVoting.js
cd ../frontend/
npm start dev
```

## How to Use
1. After following the **How to Run** instructions, a connect to wallet message will pop-up in metamask. Connect a test wallet to proceed.
2. Once the wallet is connected, the backend will spin up the first election round (Election round parameters including number of wallets voting, number elected, and the type [lottery | election] can be specified in the `backend/voting.json` file).
3. **[default]** The first round is a lottery of 5 wallets. Press `continue` to access the second lottery. The second round is a lottery of 3 wallets. Press `continue` for the next round. The final round is an election of 1 wallet. For this last round, simply select the wallet that you want to vote for. The results will pop up and the winner will be known.
