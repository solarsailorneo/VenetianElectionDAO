const express = require('express');
router = express.Router();
comVoting = require('../controllers/comVoting');

router.get('/', comVoting.comVoting);

// router.post('/', async (req, res) => {
//     const address = await req.body.address;
//     // router.set('wallet', address);
//     req.app.locals.walletAddress = address;
//     req.app.set('wallet', address);
//     console.log('address is: ' + address);
//     // res.end(“yes”);
// });

// router.get('/', (req, res) => 
// {
//     let electeePool = req.app.get('electeePool')
//     console.log("electee pool: " + electeePool);
//     res.json(
//         {
//             "electee_pool" : electeePool
//         })
// });

module.exports = router;