exports.comVoting = (req, res) => 
{
    let electionResult = req.app.get('electionResult')
    res.json(
        {
            "election_result" : electionResult
        })
};