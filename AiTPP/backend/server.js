const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));
const redisHost = process.env.REDIS_HOST || 'localhost';
const redis = new Redis({ host: redisHost, port: 6379 });
const taskSchema = new mongoose.Schema({
  title: String,
  input: String,
  operation: String,
  status: { type: String, default: 'pending' },
  result: String,
  logs: [String],
  createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', taskSchema);
app.post('/tasks', async (req, res) => {
  try {
    const { title, input, operation } = req.body;
    const newTask = new Task({ title, input, operation, logs: ['Task created in DB'] });
    await newTask.save();
    const taskPayload = { id: newTask._id.toString(), input, operation };
    await redis.lpush('tasks_queue', JSON.stringify(taskPayload));
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});
app.listen(5000, () => console.log('Backend running on port 5000'));