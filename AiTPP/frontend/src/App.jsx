import { useState, useEffect } from 'react';
function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [operation, setOperation] = useState('uppercase');
  const fetchTasks = async () => {
    const res = await fetch('http://localhost:5000/tasks');
    const data = await res.json();
    setTasks(data);
  };
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Task: ${operation}`, input, operation })
    });
    setInput('');
    fetchTasks();
  };
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Submit Task</h2>
      <form onSubmit={handleSubmit}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Enter text..." 
          required 
        />
        <select value={operation} onChange={e => setOperation(e.target.value)}>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="reverse">Reverse</option>
          <option value="wordcount">Word Count</option>
        </select>
        <button type="submit">Submit</button>
      </form>
      <h2>Task List</h2>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Input</th>
            <th>Operation</th>
            <th>Status</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td>{task._id.slice(-6)}</td>
              <td>{task.input}</td>
              <td>{task.operation}</td>
              <td><b>{task.status}</b></td>
              <td>{task.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;