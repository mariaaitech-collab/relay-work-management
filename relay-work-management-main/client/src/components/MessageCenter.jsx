import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

function MessageCenter() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadContacts = async () => {
    try {
      const response = await api.get('/messages/contacts');
      setContacts(response.data);
      setSelectedContact((current) => current || response.data[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Contacts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactId) => {
    if (!contactId) return;
    try {
      const response = await api.get(`/messages/${contactId}`);
      setMessages(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Conversation could not be loaded.');
    }
  };

  useEffect(() => { queueMicrotask(loadContacts); }, []);
  useEffect(() => { queueMicrotask(() => loadMessages(selectedContact?.id || selectedContact?._id)); }, [selectedContact]);

  const send = async (event) => {
    event.preventDefault();
    const receiverId = selectedContact?.id || selectedContact?._id;
    if (!receiverId || !body.trim()) return;
    try {
      await api.post('/messages', { receiverId, body });
      setBody('');
      loadMessages(receiverId);
    } catch (err) {
      setError(err.response?.data?.message || 'Message could not be sent.');
    }
  };

  if (loading) return <section className="dashboard-panel message-center"><p className="dashboard-empty">Loading conversations...</p></section>;

  return (
    <section className="dashboard-panel message-center">
      <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Workspace / Query</p><h2>Ask your team</h2></div><span className="dashboard-pill">Direct messages</span></div>
      {error && <p className="message-error">{error}</p>}
      <div className="message-layout">
        <aside className="message-contacts">{contacts.length ? contacts.map((contact) => <button className={selectedContact?.id === contact.id ? 'active' : ''} key={contact.id} onClick={() => setSelectedContact(contact)}><span className="dashboard-avatar">{contact.name.charAt(0)}</span><span><b>{contact.name}</b><small>{contact.job_role || contact.role}</small></span></button>) : <p className="dashboard-empty">No contacts available.</p>}</aside>
        <div className="message-thread">{selectedContact ? <><div className="message-thread-header"><span>Conversation with <b>{selectedContact.name}</b></span><small>{selectedContact.job_role || selectedContact.role}</small></div><div className="message-list">{messages.length ? messages.map((message) => { const currentUser = JSON.parse(localStorage.getItem('user') || '{}'); const own = (message.sender_id?.id || message.sender_id?._id) === currentUser.id; return <div className={`message-bubble ${own ? 'own' : ''}`} key={message.id || message._id}><p>{message.body}</p><small>{new Date(message.created_at || message.createdAt).toLocaleString()}</small></div>; }) : <p className="dashboard-empty">Start the conversation with a question or update.</p>}</div><form className="message-compose" onSubmit={send}><input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a query or update..." /><button className="dashboard-button" type="submit">Send ↗</button></form></> : <p className="dashboard-empty">Select a contact to start messaging.</p>}</div>
      </div>
    </section>
  );
}

export default MessageCenter;
