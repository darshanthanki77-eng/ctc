const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Withdrawal = require('./models/Withdrawal');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ctc').then(async () => {
  const user = await User.findOne({ userId: 'CTC26597' });
  if (!user) {
    console.log('User CTC26597 not found');
    process.exit();
  }
  console.log('User Document:', JSON.stringify(user, null, 2));

  const txs = await Transaction.find({ user: user._id });
  console.log(`User has ${txs.length} transactions:`);
  txs.forEach(t => {
    console.log(`  Tx: type=${t.type}, amount=${t.amount}, status=${t.status || 'N/A'}, date=${t.createdAt.toISOString()}`);
  });

  const withdrawals = await Withdrawal.find({ user: user._id });
  console.log(`User has ${withdrawals.length} withdrawals:`);
  withdrawals.forEach(w => {
    console.log(`  Withdrawal: amount=${w.amount}, status=${w.status}, date=${w.createdAt.toISOString()}`);
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
