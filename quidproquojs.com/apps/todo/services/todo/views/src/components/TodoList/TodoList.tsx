// federated.export: This file will be exported using module federation

import { type CSSProperties, useState } from 'react';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '4rem',
  minHeight: '100vh',
  width: '100vw',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ecf5 100%)',
  color: '#1a2733',
};

const formStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1.5rem',
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  border: '1px solid #cbd8e4',
  borderRadius: '0.5rem',
  width: '20rem',
};

const buttonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: '#ffffff',
  background: '#2b6cb0',
  border: 'none',
  borderRadius: '0.5rem',
  cursor: 'pointer',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  marginTop: '1.5rem',
  width: '26rem',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
  background: '#ffffff',
  border: '1px solid #cbd8e4',
  borderRadius: '0.5rem',
};

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

// In-memory only for now — the exampler's next step is persisting these
// through the todo service's api.
export const TodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [text, setText] = useState('');
  const [nextId, setNextId] = useState(1);

  const onAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setTodos([...todos, { id: nextId, text: trimmed, done: false }]);
    setNextId(nextId + 1);
    setText('');
  };

  const onToggle = (id: number) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2.5rem', margin: 0 }}>todo</h1>
      <p style={{ fontSize: '1.1rem', color: '#51616f' }}>An example quidproquo app — this view is the todo service&apos;s microfrontend.</p>
      <div style={formStyle}>
        <input
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onAdd()}
          placeholder="What needs doing?"
          style={inputStyle}
          value={text}
        />
        <button onClick={onAdd} style={buttonStyle} type="button">
          Add
        </button>
      </div>
      <ul style={listStyle}>
        {todos.map((todo) => (
          <li key={todo.id} style={itemStyle}>
            <input checked={todo.done} onChange={() => onToggle(todo.id)} type="checkbox" />
            <span
              style={{
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#8496a5' : '#1a2733',
              }}
            >
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
