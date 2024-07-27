// server
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded());



mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(`Mongodb is connected on port ${PORT}`))
  .catch((err) => console.error('Mongodb connection error', err));

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  points: Number,
  isAdmin: Boolean,
  membership_id: Number,
});

const User = mongoose.model('User', userSchema);

app.get('/', async (req, res) => {
  // This is the admin dashboard route
  res.json('Welcome to the  dashboard!');
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const isAdminUser = name === 'admin';
    const newUser = new User({
      name,
      email,
      password,
      points: 100,
      isAdmin: isAdminUser ? true : false,
      membership_id :0,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error during registration', error);
    res.status(500).json({ error: "Inter server error" });
  }
});

app.get('/api/me', async (req, res,next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(decoded);
  } catch (error) {
    console.error('Error during user retrieval', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  return next()
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.password!== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    
    // Generate a token
    if (!process.env.SECRET_KEY) {
      console.error('SECRET_KEY environment variable is not set');
      process.exit(1); // Exit the process if SECRET_KEY is not set
    }

        // Check if the user is an admin
    if (user.isAdmin) { // assuming you have an isAdmin field in your user schema
       // Generate a token for the admin dashboard
      const adminToken = jwt.sign({ username: User.name, isAdmin: true }, 'SECRET_KEY', { expiresIn: '1h' });
      res.cookie('token', adminToken, { httpOnly: true, secure: true, sameSite: 'strict' });
      res.status(200).json({ message: "Admin Login successful", token: adminToken, username: user.name, points: user.points, isAdmin: true });
      // Redirect to the admin dashboa
      // res.render('Admin'); // assuming you have an admin dashboard route

    }
    else{
    const token = jwt.sign({ username: User.name }, 'SECRET_KEY', { expiresIn: '1h' });
    // const refreshtoken = jwt.sign({ username: User.name }, 'SECRET_KEY', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    // res.cookie('refreshtoken', refreshtoken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ message: "Login successful", token,username:user.name,email:user.email ,points :user.points,Login:true });
     } 
    }
catch (error) {
    console.error('Error during login', error)
    res.status(500).json({ error: "inter server error" })
  }
})

//all user code 
app.get('/getallusers', async (req, res) => {
  try {
    const users = await User.find() // exclude password field
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//find one particular user 
app.get('/getalluser/:username', async (req, res) => {
  const username = req.params.username;
  const user = await User.findOne({ name: username });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

//update membership amount code 
app.put('/updateuser/:username', async (req, res) => {
  const username = req.params.username;
  const userPoints = req.body.points;
  const {addPoints} =req.body;
  const {membership_id} =req.body;


  // console.log(typeof membership_id);
  try {
    const user = await User.findOne({ name: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Updating user: ${username}, Points: ${userPoints}, AddPoints: ${addPoints}, Membership ID: ${membership_id}`);

    let errorResponse;
  
    if (Number(membership_id) === 1) {
      if (userPoints < 10) {
        errorResponse = { error: 'User must have at least 10 points for membership ID 1' };
      }
    } else if (Number(membership_id) === 2) {
      if (userPoints < 20) {
        errorResponse = { error: 'User must have at least 20 points for membership ID 2' };
      }
    } else if (Number(membership_id) === 3) {
      if (userPoints < 30) {
        errorResponse = { error: 'User must have at least 30 points for membership ID 3' };
      }
    }
  
    if (errorResponse) {
      return res.status(400).json(errorResponse);
    }else{
    console.log("goes here");
    const adminUser = await User.findOne({ name: 'admin' });
    adminUser.points = adminUser.points + addPoints;
    await adminUser.save();
  
    user.membership_id = membership_id;
    user.points = req.body.points + addPoints;
    const updatedUser = await user.save();
    console.log("last step");
    res.json({ user: updatedUser, admin: adminUser });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal error' });
  }


});

const donationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Donation = mongoose.model('Donation', donationSchema);

//donate code 
app.put('/donate/:username', async (req, res) => {
  const username = req.params.username;
  const updatedPoints = req.body.points;
  const {addPoints} =req.body;

  try {
    const user = await User.findOne({ name: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (addPoints <0) {
      return res.status(400).json({ error: 'Invalid amount, please enter a valid number' });
    }
    if (user.points < addPoints) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }else{
      await new Donation({
        userId: user._id,
        amount: addPoints,
      }).save();
    
     const adminUser = await User.findOne({ name: 'admin' });
      adminUser.points = adminUser.points + Number(addPoints);
      await adminUser.save();
      
    user.points = updatedPoints;
    const updatedUser = await user.save();
    res.json({user: updatedUser,admin:adminUser});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/total-donations', async (req, res) => {
  try {
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({ total: totalDonations.length > 0 ? totalDonations[0].total : 0 });
  } catch (error) {
    console.error('Error fetching total donations:', error);
    res.status(500).json({ error: 'Unable to fetch total donations' });
  }
});


app.get('/user-donations', async (req, res) => {
  try {
    // Aggregate donations grouped by user
    const userDonations = await Donation.aggregate([
      { 
        $group: {
          _id: '$userId', // Group by userId
          totalDonations: { $sum: '$amount' } // Calculate total donations for each user
        }
      },
      {
        $lookup: {
          from: 'users', // Name of the collection for User model
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }, // Unwind the user array to get individual user documents
      {
        $project: {
          _id: 0, // Exclude the _id field
          username: '$user.name', // Include username
          totalDonations: 1 // Include total donations
        }
      }
    ]);

    res.json({ userDonations });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ error: 'Unable to fetch user donations' });
  }
});




//cancel membership 
app.post('/cancel', async (req, res) => {
  const { userId } = req.body;

  try {
    // Update the user's document in MongoDB
    await User.updateOne({ name: userId }, { $unset: { membership_id: "" } });
    res.status(200).json({ message: 'Membership cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling membership.', error });
  }
});


app.post('/quizPoints', async (req, res) => {
  const { userId } = req.body;
  const {addPoints}=req.body;
  try {
    const user = await User.findOne({ name: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
      
    user.points = user.points+Number(addPoints);
    const updatedUser = await user.save();
    res.json({user: updatedUser});
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Events
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  image: { type: String }
});

const Event = mongoose.model('Event', eventSchema);

// Event routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  const { title, description, date, time, image } = req.body;
  const newEvent = new Event({ title, description, date, time, image });
  try {
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stories
const storySchema = new mongoose.Schema({
  username: String,
  story: String,
  date: { type: Date, default: Date.now }
});

const Story = mongoose.model('Story', storySchema);

// Endpoint to get all stories
app.get('/stories', async (req, res) => {
  try {
    const stories = await Story.find().sort({ date: -1 }); // Sorting by date descending
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to add a new story
app.post('/stories', async (req, res) => {
  const { username, story } = req.body;
  try {
    const newStory = new Story({ username, story });
    const savedStory = await newStory.save();
    res.status(201).json(savedStory);
  } catch (error) {
    console.error('Error adding story:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const inquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  date: { type: Date, default: Date.now },
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);

// POST Route to Save Inquiries
app.post('/api/inquiries', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newInquiry = new Inquiry({
      name,
      email,
      message,
    });

    await newInquiry.save();
    console.log('Inquiry received and stored:', { name, email, message });
    res.status(200).json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

app.get('/admin/inquiries', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ date: -1 }); // Fetch all inquiries, newest first
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Unable to fetch inquiries' });
  }
});


app.listen(PORT);
