import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, AlertCircle } from 'lucide-react';
import './Chatbot.css';

const API_BASE_URL = 'http://localhost:5050/api/support-tickets';

const Chatbot = ({ user, role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  // Conversation state machine: 'idle' | 'awaiting_category' | 'awaiting_description' | 'submitting' | 'awaiting_status_token' | 'checking_status'
  const [step, setStep] = useState('idle');
  const [ticketData, setTicketData] = useState({
    category: '',
    description: ''
  });

  const messagesEndRef = useRef(null);

  // Initial welcome message
  const initChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: `Hi ${user?.name || 'there'}! I'm your Virtual Assistant. I can help you raise an Issue Token (support ticket) or check the status of existing tickets. What would you like to do?`,
        options: ['Raise an Issue Token', 'Check Ticket Status', 'General Inquiries']
      }
    ]);
    setStep('idle');
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initChat();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = (option) => {
    // Add user response message
    setMessages(prev => [...prev, { sender: 'user', text: option }]);

    if (option === 'Raise an Issue Token') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sure, I can help you register a support issue. Please select a category:',
          options: ['Technical', 'Fees', 'Attendance', 'Other']
        }
      ]);
      setStep('awaiting_category');
    } else if (option === 'Check Ticket Status') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Please enter your Ticket ID/Token (e.g. TK-123456):'
        }
      ]);
      setStep('awaiting_status_token');
    } else if (option === 'General Inquiries') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'For general assistance, you can view your Dashboard, Profile Details, or check notifications. If you have a specific system error, please choose "Raise an Issue Token".',
          options: ['Raise an Issue Token', 'Check Ticket Status']
        }
      ]);
      setStep('idle');
    } else if (step === 'awaiting_category') {
      // User clicked a category
      setTicketData(prev => ({ ...prev, category: option }));
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `You selected Category: ${option}. Now, please write a brief description of the issue you are experiencing:`
        }
      ]);
      setStep('awaiting_description');
    }
  };

  const handleSendText = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);

    if (step === 'awaiting_description') {
      setStep('submitting');
      setMessages(prev => [...prev, { sender: 'bot', text: 'Submitting your support issue... Please wait.' }]);

      try {
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userName: user?.name || 'Portal User',
            userEmail: user?.email || 'portal@school.edu',
            userRole: role, // 'student' or 'teacher'
            category: ticketData.category || 'Other',
            description: userText
          })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [
            ...prev.slice(0, -1), // remove the 'Submitting...' bot message
            {
              sender: 'bot',
              text: `Success! Your support ticket has been raised. Your unique Issue Token is:`,
              ticketToken: data.ticketId
            },
            {
              sender: 'bot',
              text: 'You can query this ticket status at any time using this token. What else can I help you with?',
              options: ['Check Ticket Status', 'Raise Another Issue', 'Restart Chat']
            }
          ]);
          setStep('idle');
        } else {
          const errData = await response.json();
          throw new Error(errData.message || 'Server error');
        }
      } catch (err) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            sender: 'bot',
            text: `⚠️ Error: Could not save ticket. Details: ${err.message}. Please try again shortly.`,
            options: ['Restart Chat']
          }
        ]);
        setStep('idle');
      }
    } else if (step === 'awaiting_status_token') {
      setStep('checking_status');
      setMessages(prev => [...prev, { sender: 'bot', text: `Checking status for ${userText}...` }]);

      try {
        const response = await fetch(`${API_BASE_URL}/status/${userText}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [
            ...prev.slice(0, -1), // remove loading
            {
              sender: 'bot',
              text: `Ticket Found!\nToken: ${data.ticketId}\nCategory: ${data.category}\nStatus: ${data.status}\nDescription: "${data.description}"`
            },
            {
              sender: 'bot',
              text: 'Need anything else?',
              options: ['Raise an Issue Token', 'Check Another Token', 'Restart Chat']
            }
          ]);
          setStep('idle');
        } else {
          setMessages(prev => [
            ...prev.slice(0, -1),
            {
              sender: 'bot',
              text: `❌ We could not find a support ticket matching the token "${userText}". Make sure it starts with "TK-" and includes all digits.`,
              options: ['Check Ticket Status', 'Raise an Issue Token', 'Restart Chat']
            }
          ]);
          setStep('idle');
        }
      } catch (err) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            sender: 'bot',
            text: `⚠️ Connection error while checking status. Please verify your internet connection.`,
            options: ['Restart Chat']
          }
        ]);
        setStep('idle');
      }
    } else if (userText.toLowerCase() === 'restart chat' || userText === 'Restart Chat') {
      initChat();
    } else if (userText.toLowerCase() === 'raise another issue' || userText === 'Raise Another Issue') {
      handleOptionClick('Raise an Issue Token');
    } else if (userText.toLowerCase() === 'check another token' || userText === 'Check Another Token') {
      handleOptionClick('Check Ticket Status');
    } else {
      // Default echo / general response
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I didn't quite catch that. Please use the options below or type 'Restart Chat' to start over.",
          options: ['Raise an Issue Token', 'Check Ticket Status']
        }
      ]);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chatbot-container">
      <button 
        type="button" 
        className="chatbot-bubble" 
        onClick={handleToggle}
        aria-label="Toggle chatbot assistant"
        title="Open Support Chatbot"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="chatbot-panel glass-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <Bot size={20} />
              <div>
                <h3>SMS Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span className="chatbot-status-dot"></span>
                  <span>Agent Online</span>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="chatbot-close-btn" 
              onClick={handleToggle}
              title="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                <div className={`chat-message ${msg.sender}`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                  {msg.ticketToken && (
                    <div style={{ marginTop: '8px' }}>
                      <span className="ticket-pill">{msg.ticketToken}</span>
                    </div>
                  )}
                </div>

                {msg.options && (
                  <div className="chat-options">
                    {msg.options.map(option => (
                      <button
                        key={option}
                        type="button"
                        className="chat-option-btn"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendText} className="chatbot-input-area">
            <input
              type="text"
              placeholder={
                step === 'awaiting_description' 
                  ? "Describe your issue..." 
                  : step === 'awaiting_status_token' 
                  ? "Enter ticket token (TK-...)" 
                  : "Type your message..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={step === 'submitting' || step === 'checking_status'}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={!inputValue.trim() || step === 'submitting' || step === 'checking_status'}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
