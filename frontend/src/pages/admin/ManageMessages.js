import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Alert,
  Button,
  Paper,
  IconButton,
  Grid,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  useMediaQuery
} from "@mui/material";
import {
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  DeleteOutline as DeleteOutlineIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  AccessTime as AccessTimeIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon
} from "@mui/icons-material";
import { saveAs } from "file-saver";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";

// Custom theme for consistent styling with Dashboard
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
    orders: { main: "#FFBB28", dark: "#F0A500" },
    chartColors: ["#1976D2", "#2E7D32", "#D32F2F", "#FFBB28", "#00C49F"],
    background: {
      default: "#f5f5f5",
      paper: "#ffffff"
    },
    text: {
      primary: "#2a3b4d",
      secondary: "#5a6a7a"
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "background-color 0.3s, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.09)"
          }
        }
      }
    }
  }
});

// Reusable StatCard component (matching Dashboard)
const StatCard = ({ title, value, icon, color, loading }) => (
  <Card
    sx={{
      display: "flex",
      alignItems: "center",
      p: 2,
      bgcolor: theme.palette[color]?.main || color,
      color: "#fff",
      "&:hover": {
        bgcolor: theme.palette[color]?.dark || theme.palette[color]?.main || color,
      },
      minHeight: 100,
    }}
    role="region"
    aria-label={title}
  >
    {loading ? (
      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
    ) : (
      icon
    )}
    <Box ml={2} flexGrow={1}>
      <Typography variant="h6">{title}</Typography>
      {loading ? (
        <Skeleton variant="text" width={60} />
      ) : (
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      )}
    </Box>
  </Card>
);

// Reusable ContentWrapper component (matching Dashboard)
const ContentWrapper = ({ title, children, loading }) => (
  <Box>
    <Typography variant="h5" mb={2} aria-label={title}>
      {title}
    </Typography>
    {loading ? (
      <Skeleton variant="rectangular" height={250} />
    ) : (
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {children}
      </Paper>
    )}
  </Box>
);

function ManageMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
  });
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check if admin is logged in
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchMessages();
  }, [userId, navigate]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3003/api/contact");
      
      // Sort messages by date (newest first)
      const sortedMessages = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Add read/unread status for demo purposes
      const messagesWithStatus = sortedMessages.map((msg, index) => ({
        ...msg,
        read: index % 3 !== 0, // For demo, mark every third message as unread
      }));
      
      setMessages(messagesWithStatus);
      
      // Calculate stats
      setStats({
        total: messagesWithStatus.length,
        unread: messagesWithStatus.filter(msg => !msg.read).length,
        read: messagesWithStatus.filter(msg => msg.read).length,
      });
      
      setError("");
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Format created_at timestamp
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get initials from name for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get color based on name (consistent with Dashboard)
  const getAvatarColor = (name) => {
    const colors = theme.palette.chartColors;
    const index = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Toggle message read status
  const toggleReadStatus = (id) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === id) {
        const newStatus = !msg.read;
        // Update stats
        setStats(prev => ({
          ...prev,
          read: newStatus ? prev.read + 1 : prev.read - 1,
          unread: newStatus ? prev.unread - 1 : prev.unread + 1,
        }));
        return { ...msg, read: newStatus };
      }
      return msg;
    });
    setMessages(updatedMessages);
  };

  // Delete message
  const deleteMessage = (id) => {
    const messageToDelete = messages.find(msg => msg.id === id);
    if (messageToDelete) {
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        read: messageToDelete.read ? prev.read - 1 : prev.read,
        unread: messageToDelete.read ? prev.unread : prev.unread - 1,
      }));
    }
    setMessages(messages.filter(msg => msg.id !== id));
  };

  // Get recent messages (last 5)
  const recentMessages = useMemo(() => 
    messages.slice(0, 5), 
    [messages]
  );

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader onLogout={handleLogout} />
      <main style={{ padding: "2rem 0", backgroundColor: theme.palette.background.default, minHeight: "calc(100vh - 120px)" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" align="center" gutterBottom>
            Message Inbox
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" mb={4}>
            Manage and respond to visitor inquiries
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 4 }}
              action={
                <Button color="inherit" size="small" onClick={() => { setError(null); fetchMessages(); }}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Messages"
                value={stats.total}
                icon={<EmailIcon fontSize="large" />}
                color="primary"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Unread Messages"
                value={stats.unread}
                icon={<MarkEmailUnreadIcon fontSize="large" />}
                color="accent"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Read Messages"
                value={stats.read}
                icon={<MarkEmailReadIcon fontSize="large" />}
                color="secondary"
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Detailed Message View */}
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12}>
              <ContentWrapper title="All Messages" loading={loading}>
                {messages.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <EmailIcon sx={{ fontSize: 60, color: "#bdbdbd", mb: 2 }} />
                    <Typography variant="h6">No messages found</Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 0 }}>
                    {messages.map((message) => (
                      <Card 
                        key={message.id} 
                        sx={{ 
                          mb: 2, 
                          borderRadius: 0,
                          borderLeft: message.read ? 
                            "4px solid #9e9e9e" : 
                            `4px solid ${theme.palette.primary.main}`,
                          boxShadow: "none",
                          "&:hover": {
                            transform: "none",
                            boxShadow: "none",
                            bgcolor: "rgba(0, 0, 0, 0.02)"
                          }
                        }}
                      >
                        <CardContent sx={{ p: 0 }}>
                          <Grid container>
                            {/* Left side - Avatar */}
                            <Grid item xs={12} sm={3} md={2}>
                              <Box 
                                sx={{ 
                                  p: 3, 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  alignItems: "center",
                                  borderRight: { xs: 0, sm: "1px solid #f0f0f0" },
                                  borderBottom: { xs: "1px solid #f0f0f0", sm: 0 }
                                }}
                              >
                                <Avatar 
                                  sx={{ 
                                    width: 64, 
                                    height: 64, 
                                    bgcolor: getAvatarColor(message.name),
                                    fontSize: "1.5rem",
                                    fontWeight: "bold",
                                    mb: 1
                                  }}
                                >
                                  {getInitials(message.name)}
                                </Avatar>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
                                  {message.name}
                                </Typography>
                                <Tooltip title={message.email}>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      mt: 0.5, 
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                      maxWidth: "100%",
                                      textAlign: "center"
                                    }}
                                  >
                                    {message.email}
                                  </Typography>
                                </Tooltip>
                              </Box>
                            </Grid>
                            
                            {/* Right side - Message content */}
                            <Grid item xs={12} sm={9} md={10}>
                              <Box sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1, sm: 0 } }}>
                                    <SubjectIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                                    <Typography variant="h6" component="div">
                                      {message.subject}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Tooltip title={formatDate(message.created_at)}>
                                      <Chip 
                                        icon={<AccessTimeIcon />} 
                                        label={new Date(message.created_at).toLocaleDateString()} 
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Tooltip>
                                    <Chip 
                                      label={message.read ? "Read" : "Unread"} 
                                      size="small"
                                      color={message.read ? "success" : "error"}
                                      variant={message.read ? "outlined" : "filled"}
                                    />
                                  </Box>
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    mb: 3, 
                                    lineHeight: 1.7,
                                    color: theme.palette.text.primary,
                                    whiteSpace: "pre-line" // Preserve line breaks
                                  }}
                                >
                                  {message.message}
                                </Typography>
                                
                                <Box sx={{ 
                                  display: "flex", 
                                  justifyContent: "flex-end", 
                                  mt: 2,
                                  gap: 1
                                }}>
                                  <Tooltip title={message.read ? "Mark as unread" : "Mark as read"}>
                                    <IconButton 
                                      color="primary" 
                                      onClick={() => toggleReadStatus(message.id)}
                                      size="small"
                                    >
                                      {message.read ? <MarkEmailReadIcon /> : <MarkEmailUnreadIcon />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete message">
                                    <IconButton 
                                      color="error" 
                                      onClick={() => deleteMessage(message.id)}
                                      size="small"
                                    >
                                      <DeleteOutlineIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </ContentWrapper>
            </Grid>
          </Grid>
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default ManageMessages;