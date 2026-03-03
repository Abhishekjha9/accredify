const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const ChangeRequest = require('./models/ChangeRequest');

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/accredify');
        console.log('Connected to MongoDB');

        // Clear existing
        await User.deleteMany({});
        await Project.deleteMany({});
        await ChangeRequest.deleteMany({});
        console.log('Cleared existing data.');

        // Default passwords will trigger the pre-save hook to hash them
        await User.create([
            {
                name: 'Freelancer',
                email: 'freelancer@test.com',
                password: 'freelancer123',
                role: 'freelancer'
            },
            {
                name: 'Client',
                email: 'client@test.com',
                password: 'client123',
                role: 'client'
            }
        ]);

        console.log('✅ Accounts created successfully:');
        console.log('Freelancer -> freelancer@test.com / freelancer123');
        console.log('Client     -> client@test.com / client123');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
