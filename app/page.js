'use client'
import { Box, Stack, Button, TextField } from "@mui/material";
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
  {
    role: 'assistant',
    content: `Hi! I'm the Headstarter support agent, how can I assist you today?`
  }])

  const [message, setMessage] = useState('');
  const [loadingDots, setLoadingDots] = useState('');
  const messagesEndRef = useRef(null); // Reference for auto-scroll

  useEffect(() => {
    let interval;
    if (loadingDots !== '') {
      interval = setInterval(() => {
        setLoadingDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loadingDots]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // Auto-scroll whenever messages change

  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' },
    ]);
    setLoadingDots('.');
    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: 'user', content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          setLoadingDots(''); // Stop the loading dots when done
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent the default action (e.g., form submission)
      sendMessage();
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={2}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          max="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display='flex'
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={7}
                p={3}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {message.content || (message.role === 'assistant' ? loadingDots : '')}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} /> {/* Auto-scroll reference */}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>
    </Box>
  );
}