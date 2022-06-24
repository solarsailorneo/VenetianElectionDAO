import React, { useState, useEffect, useRef } from "react";
import {
  useMoralis,
  useNativeBalance,
  useNewMoralisObject,
} from "react-moralis";
import { LeafPoll, Result } from 'react-leaf-polls'
import 'react-leaf-polls/dist/index.css'

// Object keys may vary on the poll type (see the 'Theme options' table below)
const customTheme = {
  textColor: 'black',
  mainColor: '#00B87B',
  backgroundColor: 'rgb(255,255,255)',
  alignment: 'center'
}

let saved_account = "";

// WARNING: DEMO CODE/WIP
// TODO: Need to display/build Polls data from Moralis instance.
// TODO: utilise further  calls such as …
// 'const { switchNetwork, chainId, chain, account } = useChain();'

// Declaring poll question and answers
// Currenltly static, exisiting example of objectId in Moralis instance's db.

const pollQuestion = "Who should be Doge ?";
const answers = [
  { option: "Yes", votes: 7 }
];
let option_voted = "";
let poll_id = 1;
let voter = {};
let poll_title = "";
let poll_options = [];

function Polls({ more }) {
  const [access, setReg] = useState(false);
  const [initialState, setInitialState] = useState(0);
  const { isInitialized, account, isAuthenticated, Moralis } = useMoralis();
  const [validatedWallet, setValidatedWallet] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [randomSelection, setRandomSelection] = useState(true);
  const [counter, setCounter] = useState(0);

  const {
    getBalance,
    data: balance,
    nativeToken,
    isLoading,
  } = useNativeBalance({ chain: "rinkeby" });
  const { isSaving, error, save, object } = useNewMoralisObject("Polls");

  // Setting answers to state to reload the component with each vote
  const [pollAnswers, setPollAnswers] = useState([...answers]);
  const isInitialMount = useRef(true);
  const isInitialFetch = useRef(true);

  const updatePoll = async () => {
    const PollData = Moralis.Object.extend("Polls");
    const query = new Moralis.Query(PollData);
    // Building Poll from Moralis instance will include: 'query.equalTo("id", 1);'
    query.equalTo("pollId", 1); //<-- temp/static id to update same row, instead of saving new row
    const poll = await query.first();

    return poll;
  };

  const submitWallet = async () => {
      
    if(account != null)
    {
      
      if(isInitialFetch.current)
      {
        isInitialFetch.current = false;
        console.log("pass")
        const address = {
          address: account
        }
        console.log(JSON.stringify(address));
        const result = await fetch('/.netlify/functions/processVoting/', {
          method: 'POST',
          headers: {
            'content-Type': 'application/json'
          },
          body: JSON.stringify(address), 
          mode: "cors"
        })
    
        const resultInJson = await result.json();
        console.log(resultInJson);
  
        // // if(resultInJson.confirmation)
        // // {
        // const electees = await fetch('/api/');
        // const electeesInJson = await electees.json();
        console.log(resultInJson.electee_pool)
  
        // setAnswers(resultInJson.electee_pool);
        setRandomSelection(resultInJson.random_selection);
        
        // setPollAnswers([])
        // setPollAnswers(temporalPollAnswers);
        setPollAnswers(resultInJson.electee_pool);
        setCounter(counter + 1);
        

      }
      else
      {
        // console.log(pollAnswers)
        // setPollAnswers(pollAnswers);
      }

      

      // }
    }

  }
  


  const getElectionResult = async () => {
    const electionResult = await fetch('/.netlify/functions/processVoting/');
    const electionResultInJson = await electionResult.json();

    console.log(electionResultInJson)
  }

    // check reg status -> handle
    const checkReg = async (_access) => {
      if (!isAuthenticated) {
        // not authenticated user
        return false;
      } else {
        // access condition
        _access = balance.balance && balance.balance > 0 ? true : false;
        if (_access) {
          // reset/build options
          
          // give access to vote if meets conditions
          setReg(_access);
          saved_account = account;
        } else {
          // no access
        }
  
        return _access;
      }
    };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // run on update
      if (isInitialized && balance.balance > 0) {
        if (saved_account !== account) {
          // check registration status
          checkReg();
        }
      } else {
        // reset registration status to false
        setReg(false);
      }
    }
  }, [account, balance, isInitialized]);

useEffect(() => {

  submitWallet();
  // getElectionResult();
},[pollAnswers]);

  useEffect(() => {

    isInitialMount.current = false;
    option_voted = "";
    voter = account;
    poll_title = pollQuestion;
    // poll_options = answers;
    // console.log("poll options: " + poll_options)
    const temporalPollAnswers = pollAnswers

    console.log(pollAnswers)
    
  },[]);

  const handleVote = async (voteAnswer) => {
    option_voted = voteAnswer;

    const asyncVoteRes = await Promise.all(
      pollAnswers.map(async (answer) => {
        if (answer.option === option_voted) {
          answer.votes = answer.votes + 1;
        }
        return answer;
      })
    );



    console.log("Async", asyncVoteRes);
    poll_options = asyncVoteRes;

    // Poll Class Design
    // columns: poll_id: uint, poll_options: [{option: "Yes", votes: 7}, {option: "No", votes: 2}], poll_voters: {user_id}

    // test db integration with static example
    // create poll
    //
    let poll_data = {
      id: poll_id,
      title: poll_title,
      options: poll_options,
      voted: voter,
    };

    const pollObject = new Moralis.Object("Polls");
    pollObject.set("id", poll_data.id);
    pollObject.set("title", poll_data.title);
    pollObject.set("options", poll_data.options);
    pollObject.addUnique("voted", poll_data.voted);
    pollObject.save();
  };

  const handleVoteRandom = async (voteAnswer) => {
  }

  const handleContinue = async () => {
    const continueElection = {
      continueProcess: true
    }
    console.log(JSON.stringify(continueElection));
    const result = await fetch('/.netlify/functions/processVoting/', {
      method: 'POST',
      headers: {
        'content-Type': 'application/json'
      },
      body: JSON.stringify(continueElection), 
      mode: "cors"
    })

    const resultInJson = await result.json();
    console.log(resultInJson);

    // // if(resultInJson.confirmation)
    // // {
    // const electees = await fetch('/api/');
    // const electeesInJson = await electees.json();
    console.log(resultInJson.electee_pool)

    // setAnswers(resultInJson.electee_pool);
    setRandomSelection(resultInJson.random_selection);
    
    // setPollAnswers([])
    // setPollAnswers(temporalPollAnswers);
    setPollAnswers(resultInJson.electee_pool);
    setCounter(counter + 1);


  

  };

  console.log("random selection: " + randomSelection)


  // Not authoriased
  if (!access) {
    return <>{"NO ACCESS"}</>;
  }
  else if(randomSelection)
  {
    return (
      <>
        <LeafPoll
          type='multiple'
          question={pollQuestion}
          results={pollAnswers}
          theme={customTheme}
          onVote={handleVoteRandom}
          isVoted={false}
        />
        <button 
          onClick={handleContinue}>
          Continue
        </button>
      </>
    );
  }
  else
  {
    // Authoriased
    return (
      <>
        <LeafPoll
          type='multiple'
          question={pollQuestion}
          results={pollAnswers}
          theme={customTheme}
          onVote={handleVote}
          isVoted={false}
        />
      </>
    );
  }
  

  
}

export default Polls;
