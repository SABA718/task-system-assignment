import React, { useState, useEffect } from 'react';
import Auth from './Auth';
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [input, setInput] = useState('');
  const [operation, setOperation] = useState('uppercase');
  useEffect(() => {
    if (token) {
      fetchTasks();
      const interval = setInterval(() => {
        fetchTasks();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token]);
  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5001/tasks', {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(data);
      } else if (response.status === 401 || response.status === 400) {
        // Token expired or invalid
        handleLogout();
      } else {
        alert("Fetch Error from Backend: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      alert("Network Error: Could not reach the backend to fetch tasks.");
      console.error("Failed to fetch tasks", error);
    }
  };
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      // FIXED: Changed port from 5000 to 5001
      const response = await fetch('http://localhost:5001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, input, operation })
      });
      const data = await response.json();
      if (response.ok) {
        fetchTasks(); 
        setTitle('');
        setInput('');
      } else {
        alert("Save Error from Backend: " + (data.error || "Unknown Error"));
      }
    } catch (error) {
      alert("Network Error: Could not reach the backend to save task.");
      console.error("Failed to create task", error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
  if (!token) {
    return <Auth setToken={setToken} />;
  }
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>AI Task Processing Platform</h1>
        <button onClick={handleLogout} style={{ height: '40px' }}>Logout</button>
      </div>
      <form onSubmit={handleCreateTask} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" required />
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Input Text" required />
        <select value={operation} onChange={e => setOperation(e.target.value)}>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="reverse">Reverse</option>
          <option value="wordcount">Word Count</option>
        </select>
        <button type="submit">Run Task</button>
      </form>
      <h2>Your Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
            <strong>{task.title}</strong> - Status: {task.status} <br/>
            Input: {task.input} <br/>
            Operation: {task.operation} <br/>
            {task.result && <span>Result: {task.result}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
export default App;