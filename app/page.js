'use client'
import { Box, Stack, Button, TextField, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

// Define the shake animation using keyframes
const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm the Headstarter support agent, how can I assist you today?`,
    },
  ]);

  const [message, setMessage] = useState("");
  const [loadingDots, setLoadingDots] = useState("");
  const [shakeInput, setShakeInput] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(false);
  const [isResponding, setIsResponding] = useState(false); // New state for tracking if chatbot is responding
  const messagesEndRef = useRef(null);
  const [isScrollbarActive, setIsScrollbarActive] = useState(false);

  useEffect(() => {
    let interval;
    if (loadingDots !== "") {
      interval = setInterval(() => {
        setLoadingDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loadingDots]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Function to check if the scrollbar is active
    const checkScrollbar = () => {
      const element = messagesEndRef.current?.parentElement;
      if (element && element.scrollHeight > element.clientHeight) {
        setIsScrollbarActive(true);
      } else {
        setIsScrollbarActive(false);
      }
    };

    checkScrollbar(); // Check scrollbar on load
    window.addEventListener('resize', checkScrollbar); // Re-check on window resize

    return () => {
      window.removeEventListener('resize', checkScrollbar);
    };
  }, [messages]);

  // Check API Key on page load
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ role: "user", content: "Ping" }]), // A simple ping message to check API key
        });

        if (response.ok) {
          setApiKeyValid(true); // Mark as Online
        } else {
          setApiKeyValid(false); // Mark as Offline if the response fails
        }
      } catch (error) {
        setApiKeyValid(false); // Mark as Offline in case of an error
      }
    };

    checkApiKey(); // Validate API key when the page loads
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 1000);
      return;
    }

    setIsResponding(true); // Disable input and send button while responding
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setLoadingDots(".");

    try {
      // Check API Key before sending the message to ensure it's back online
      const apiKeyResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ role: "user", content: "Ping" }]),
      });

      if (apiKeyResponse.ok) {
        setApiKeyValid(true); // Set status to online if the API key is valid again
      } else {
        setApiKeyValid(false); // Keep offline status if API key is still invalid
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      reader.read().then(function processText({ done, value }) {
        if (done) {
          setLoadingDots("");
          setIsResponding(false); // Re-enable input and send button when done
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        if (text.includes("The chatbot is going offline")) {
          setApiKeyValid(false); // Set status to offline if error message is received
        }
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
    } catch (error) {
      setIsResponding(false); // Ensure input is re-enabled in case of an error
      setApiKeyValid(false); // Ensure it sets to offline in case of an error
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isResponding) {
        sendMessage();
      }
    }
  };

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
        sx={{
          overflowY: 'auto',
          marginRight: 0,
          paddingRight: 0,
        }}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          max="100%"
          sx={{
            paddingRight: '16px'
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                sx={{ maxWidth: "87.5%" }} // Limits the width of the message bubbles
                bgcolor={
                  message.role === "assistant" ? "primary.main" : "secondary.main"
                }
                color="white"
                borderRadius={7}
                p={3}
                style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
              >
                {message.content ||
                  (message.role === "assistant" ? loadingDots : "")}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            paddingRight: '16px', // Ensures padding for the send button
          }}
        >
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            sx={{
              animation: shakeInput ? `${shake} 0.5s` : "none",
              borderColor: shakeInput ? "red" : "primary.main",
              "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
                borderColor: shakeInput ? "red" : "primary.main",
              },
            }}
            error={shakeInput} // Always show the red border when shaking, regardless of online status
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isResponding} // Disable button while chatbot is responding
          >
            Send
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
        }}
      >
        {apiKeyValid ? (
          <>
            <CheckCircleIcon sx={{ color: "green", mr: 1 }} />
            <Typography variant="body2" sx={{ color: "green" }}>
              Online
            </Typography>
          </>
        ) : (
          <>
            <CancelIcon sx={{ color: "red", mr: 1 }} />
            <Typography variant="body2" sx={{ color: "red" }}>
              Offline
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
