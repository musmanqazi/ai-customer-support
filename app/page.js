'use client'
import { Box, Stack, Button, TextField, Typography, IconButton } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

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
  const [isResponding, setIsResponding] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    const checkScrollbar = () => {
      const element = messagesEndRef.current?.parentElement;
      if (element && element.scrollHeight > element.clientHeight) {
        setIsScrollbarActive(true);
      } else {
        setIsScrollbarActive(false);
      }
    };

    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);

    return () => {
      window.removeEventListener('resize', checkScrollbar);
    };
  }, [messages]);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ role: "user", content: "Ping" }]),
        });

        if (response.ok) {
          setApiKeyValid(true);
        } else {
          setApiKeyValid(false);
        }
      } catch (error) {
        setApiKeyValid(false);
      }
    };

    checkApiKey();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 1000);
      return;
    }

    setIsResponding(true);
    setMessage("");
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setLoadingDots(".");

    try {
      const apiKeyResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ role: "user", content: "Ping" }]),
      });

      if (apiKeyResponse.ok) {
        setApiKeyValid(true);
      } else {
        setApiKeyValid(false);
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
          setIsResponding(false);
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        if (text.includes("The chatbot is going offline")) {
          setApiKeyValid(false);
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
      setIsResponding(false);
      setApiKeyValid(false);
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

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: '#f5f5f5',
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
      background: {
        default: '#303030',
      },
    },
  });

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          padding: "16px",
          boxSizing: "border-box",
          backgroundColor: "background.default",
        }}
      >
        <Stack
          direction="column"
          width={{ xs: "100%", sm: "100%", md: "600px" }}
          height={{ xs: "90vh", sm: "90vh", md: "700px" }}
          border="1px solid black"
          p={2}
          spacing={2}
          sx={{
            overflowY: 'auto',
            marginRight: 0,
            paddingRight: 0,
            backgroundColor: darkMode ? "#424242" : "#ffffff",
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            max="100%"
            sx={{
              paddingRight: '16px',
              paddingLeft: '16px',
              "@media (max-width: 600px)": {
                paddingRight: isScrollbarActive ? '12px' : '12px',
                paddingLeft: '12px',
              },
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
                  sx={{
                    maxWidth: "87.5%", 
                    bgcolor: message.role === "assistant" ? "primary.main" : "secondary.main",
                    color: "white",
                    borderRadius: 7,
                    p: 3,
                    style: {
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                    },
                    "@media (max-width: 600px)": {
                      padding: 2,
                      maxWidth: "80%", // Slightly reduce bubble width on mobile
                    },
                  }}
                >
                  {message.content || (message.role === "assistant" ? loadingDots : "")}
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              paddingRight: '16px',
              "@media (max-width: 600px)": {
                paddingRight: '12px',
              },
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
                "@media (max-width: 600px)": {
                  padding: '10px',
                },
                backgroundColor: darkMode ? "#333" : "#fff",
              }}
              error={shakeInput}
              disabled={isResponding}
            />
            <Button
              variant="contained"
              onClick={sendMessage}
              disabled={isResponding}
              sx={{
                "@media (max-width: 600px)": {
                  padding: '10px 12px',
                },
              }}
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
          <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
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
    </ThemeProvider>
  );
}
