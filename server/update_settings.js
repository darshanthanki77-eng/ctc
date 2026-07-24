const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';

const chartData = [
  // Week
  { period: 'week', label: 'Mon', value: 1.2 },
  { period: 'week', label: 'Tue', value: 1.8 },
  { period: 'week', label: 'Wed', value: 1.5 },
  { period: 'week', label: 'Thu', value: 2.5 },
  { period: 'week', label: 'Fri', value: 3.2 },
  { period: 'week', label: 'Sat', value: 3.0 },
  { period: 'week', label: 'Sun', value: 3.8 },

  // Month
  { period: 'month', label: '0', value: 0 },
  { period: 'month', label: '2', value: 0 },
  { period: 'month', label: '4', value: 1.5 },
  { period: 'month', label: '6', value: 3.8 },
  { period: 'month', label: '8', value: 3.5 },
  { period: 'month', label: '10', value: 5.5 },
  { period: 'month', label: '12', value: 8.0 },
  { period: 'month', label: '14', value: 9.8 },
  { period: 'month', label: '16', value: 9.5 },
  { period: 'month', label: '18', value: 10.5 },
  { period: 'month', label: '20', value: 9.0 },
  { period: 'month', label: '22', value: 10.5 },
  { period: 'month', label: '24', value: 10.5 },
  { period: 'month', label: '26', value: 11.5 },
  { period: 'month', label: '28', value: 16.0 },
  { period: 'month', label: '31', value: 17.33 },

  // 3M
  { period: '3m', label: 'Month 1', value: 12.0 },
  { period: '3m', label: 'Month 2', value: 24.5 },
  { period: '3m', label: 'Month 3', value: 38.2 },

  // 6M
  { period: '6m', label: 'Month 1', value: 10.5 },
  { period: '6m', label: 'Month 2', value: 18.0 },
  { period: '6m', label: 'Month 3', value: 28.5 },
  { period: '6m', label: 'Month 4', value: 42.0 },
  { period: '6m', label: 'Month 5', value: 58.0 },
  { period: '6m', label: 'Month 6', value: 72.5 },

  // Year
  { period: 'year', label: 'Jan', value: 12.0 },
  { period: 'year', label: 'Feb', value: 25.0 },
  { period: 'year', label: 'Mar', value: 42.0 },
  { period: 'year', label: 'Apr', value: 58.0 },
  { period: 'year', label: 'May', value: 75.0 },
  { period: 'year', label: 'Jun', value: 92.0 },
  { period: 'year', label: 'Jul', value: 110.0 },
  { period: 'year', label: 'Aug', value: 128.0 },
  { period: 'year', label: 'Sep', value: 145.0 },
  { period: 'year', label: 'Oct', value: 162.0 },
  { period: 'year', label: 'Nov', value: 180.0 },
  { period: 'year', label: 'Dec', value: 205.5 },

  // All
  { period: 'all', label: '2023', value: 85.0 },
  { period: 'all', label: '2024', value: 220.0 },
  { period: 'all', label: '2025', value: 410.0 },
  { period: 'all', label: '2026', value: 680.0 }
];

async function updateDb() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const SystemSettings = mongoose.model('SystemSettings', new mongoose.Schema({}, { strict: false }));
    
    // Find or create settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      console.log('No settings doc found, creating one...');
      settings = new SystemSettings({});
    }

    settings.set('transparencyChartData', chartData);
    await settings.save();
    
    console.log('Successfully updated SystemSettings with chartData for all periods!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating DB:', err);
    process.exit(1);
  }
}

updateDb();
