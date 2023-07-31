


import React, { useState } from 'react';
import './App.css';
// import { Collapse } from 'antd';
import TextareaAutosize from 'react-textarea-autosize';


function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  

  // States for component expansion
  const [signInExpanded, setSignInExpanded] = useState(false);
  const [scrapExpanded, setScrapExpanded] = useState(false);
  const [uploadExpanded, setUploadExpanded] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showScrap, setShowScrap] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showChat, setShowChat] = useState(false);
 

  const handleResponseChange = (event) => {
    setResponse(event.target.value);
  };

  const handleResize = (event) => {
    event.target.style.height = 'auto';
    event.target.style.height = (event.target.scrollHeight) + 'px';
  };



  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };
  
  // const handleScrap = () => {
  //   fetch('http://localhost:5000/upload', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ url }),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       setChat([...chat, data.message]);
  //     })
  //     .catch((error) => {
  //       console.error('Error:', error);
  //     });
  // };
  const handleSignIn = () => {
    // Handle Sign In
  };

  const handleScrap = () => {
    fetch('http://localhost:5000/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_type: 'url', url: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        setChat([...chat, data.message]);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file_type', file.name.split('.').pop());
    formData.append('file', file);

    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setChat([...chat, data.message]);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleConversation = () => {
    fetch('http://localhost:5000/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    })
      .then((response) => response.json())
      .then((data) => {
        const messages = data.messages.map((message) => `${message.sender}: ${message.content}`);
        setChat([...chat, ...messages]);
        setResponse(data.messages[data.messages.length - 1].content);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };
  

  

  const handleSignInExpand = () => setSignInExpanded(!signInExpanded);
  const handleScrapExpand = () => setScrapExpanded(!scrapExpanded);
  const handleUploadExpand = () => setUploadExpanded(!uploadExpanded);
  const handleChatExpand = () => setChatExpanded(!chatExpanded);

  const handleSignUp = () => {
    // Code to handle sign up
    setChat([...chat, 'Sign up successful']);
  };




return (
  <div className="container">
    {/* <div className={`form ${!signInExpanded && !scrapExpanded && !uploadExpanded && !chatExpanded ? 'expanded' : ''}`}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <div className="form-group">
          <label>Email:</label>
          <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={email} onChange={handleEmailChange} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={password} onChange={handlePasswordChange} />
        </div>
        <div className="form-group">
          <label>Confirm Password:</label>
          <TextareaAutosize minRows={1} style={{fontSize: '14px'}} />
        </div>
        <input type="submit" value="Sign Up" className="btn" />
      </form>
    </div> */}
    
    {/* <div className={`form ${signInExpanded ? 'expanded' : ''}`}>
      <h2>Sign In</h2>
      {signInExpanded && (
        <>
          <div className="form-group">
            <label>Email:</label>
            <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={email} onChange={handleEmailChange} />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={password} onChange={handlePasswordChange} />
          </div>
          <button className="btn" onClick={() => {}}>Sign In</button>
        </>
      )}
      <button className="btn" onClick={handleSignInExpand}>
        {signInExpanded ? 'Hide Sign In' : 'Show Sign In'}
      </button>
    </div> */}

    <div className={`form ${scrapExpanded ? 'expanded' : ''}`}>
      <h2>Scrap Data</h2>
      {scrapExpanded && (
        <div className="form-group">
          <label>URL:</label>
          <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={url} onChange={handleUrlChange} />
          <button className="btn" onClick={handleScrap}>Scrap</button>
        </div>
      )}
      <button className="btn" onClick={handleScrapExpand}>
        {scrapExpanded ? 'Hide Scrap' : 'Show Scrap'}
      </button>
    </div>

    <div className={`form ${uploadExpanded ? 'expanded' : ''}`}>
      <h2>Upload File</h2>
      {uploadExpanded && (
        <div className="form-group">
          <label>Drag and Drop File:</label>
          <input type="file" onChange={handleFileChange} />
          <button className="btn" onClick={handleUpload}>Upload</button>
        </div>
      )}
      <button className="btn" onClick={handleUploadExpand}>
        {uploadExpanded ? 'Hide Upload' : 'Show Upload'}
      </button>
    </div>

    <div className={`chat ${chatExpanded ? 'expanded' : ''}`}>
      <h2>Chat</h2>
      {chatExpanded && (
        <>
          <div className="chat-messages">
            {chat.map((message, index) => (
              <div key={index} className="chat-message">{message}</div>
            ))}
          </div>
          <div className="form-group">
            <label>Question:</label>
            <TextareaAutosize minRows={1} style={{fontSize: '14px'}} value={question} onChange={handleQuestionChange} />
          </div>
          <div className="form-group">
            <label>Response:</label>
            <TextareaAutosize minRows={3} style={{fontSize: '14px'}} value={response} onChange={handleResponseChange} />
          </div>
          <button className="btn" onClick={handleConversation}>Send</button>
        </>
      )}
      <button className="btn" onClick={handleChatExpand}>
        {chatExpanded ? 'Hide Chat' : 'Show Chat'}
      </button>
    </div>
  </div>
);

};

export default App;

