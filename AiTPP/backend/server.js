const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(helmet()); 
app.use(express.json());
app.use(cors());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(apiLimiter);
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected to taskdb'))
  .catch(err => console.error("MongoDB connection error:", err));
const redisHost = process.env.REDIS_HOST || 'localhost';
const redis = new Redis({ host: redisHost, port: 6379 });
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);
const taskSchema = new mongoose.Schema({
  title: String,
  input: String,
  operation: String,
  status: { type: String, default: 'pending' },
  result: String,
  logs: [String],
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
});
const Task = mongoose.model('Task', taskSchema);
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed. Username might exist." });
  }
});
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: "Logged in successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
app.post('/tasks', verifyToken, async (req, res) => {
  try {
    const { title, input, operation } = req.body;
    const newTask = new Task({ 
      title, 
      input, 
      operation, 
      logs: ['Task created in DB'],
      userId: req.user.userId 
    });
    await newTask.save();
    const taskPayload = { id: newTask._id.toString(), input, operation };
    await redis.lpush('tasks_queue', JSON.stringify(taskPayload));
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/tasks', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(5001, () => console.log('Backend running on port 5001'));