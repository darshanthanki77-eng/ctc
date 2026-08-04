const mongoose = require('mongoose');
const User = require('./models/User');

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';

mongoose.connect(prodURI).then(async () => {
  try {
    const targetUser = await User.findOne({ userId: 'CTC18052' });
    if (!targetUser) {
      console.log('User CTC18052 not found');
      process.exit();
    }

    console.log(`User CTC18052 _id: ${targetUser._id}`);
    
    // Find users by sponsor ObjectId
    const sponsorObjCount = await User.countDocuments({ sponsor: targetUser._id });
    console.log(`Users with sponsor = targetUser._id: ${sponsorObjCount}`);

    // Find users by sponsorId string
    const sponsorStrCount = await User.countDocuments({ sponsorId: 'CTC18052' });
    console.log(`Users with sponsorId = 'CTC18052' string: ${sponsorStrCount}`);

    const sponsorStrUsers = await User.find({ sponsorId: 'CTC18052' });
    sponsorStrUsers.forEach(u => {
      console.log(` - User: ${u.userId}, Name: ${u.fullName}, sponsor ObjectId ref: ${u.sponsor}`);
    });
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
});
