import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import {
  Typography,
  Grid,
  Card,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Skeleton,
  ThemeProvider,
  createTheme,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  InputAdornment,
  Fade,
} from "@mui/material";
import {
  PeopleOutlined,
  BookOutlined,
  CategoryOutlined,
  ShoppingCartOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";

// Custom theme with enhanced styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
    orders: { main: "#FFBB28", dark: "#F0A500" },
    neutral: { main: "#F9FAFB", dark: "#E5E7EB" },
    chartColors: ["#1976D2", "#2E7D32", "#D32F2F", "#FFBB28", "#00C49F"],
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700, fontSize: "2rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: "separate", borderSpacing: 0 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F1F5F9",
          position: "sticky",
          top: 0,
          zIndex: 1,
          fontWeight: 600,
          padding: "12px",
        },
        body: { padding: "12px", fontSize: "0.9rem" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover fieldset": { borderColor: "#1976D2" },
            "&.Mui-focused fieldset": { borderColor: "#1976D2" },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          padding: "8px 16px",
          "&:focus": { outline: "2px solid #1976D2" },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, maxWidth: 600, margin: "0 auto" },
      },
    },
  },
});

// Custom Recharts tooltip style
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Typography variant="body2">{`${label}: ${payload[0].value}`}</Typography>
      </Paper>
    );
  }
  return null;
};

// Reusable StatCard component
const StatCard = ({ title, value, icon, color, loading }) => (
  <Card
    sx={{
      display: "flex",
      alignItems: "center",
      p: 3,
      background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
      color: "#FFFFFF",
      minHeight: 120,
    }}
    role="region"
    aria-label={title}
  >
    {loading ? (
      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 3 }} />
    ) : (
      <Box sx={{ fontSize: 48, mr: 3 }}>{icon}</Box>
    )}
    <Box flexGrow={1}>
      <Typography variant="h6" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={80} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
      ) : (
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      )}
    </Box>
  </Card>
);

// Reusable ChartWrapper component
const ChartWrapper = ({ title, children, loading }) => (
  <Card sx={{ p: 3, bgcolor: "#fff" }}>
    <Typography variant="h5" mb={2} aria-label={title}>
      {title}
    </Typography>
    {loading ? (
      <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
    ) : (
      children
    )}
  </Card>
);

// Reusable TableWrapper component
const TableWrapper = ({ title, children, loading }) => (
  <Card sx={{ p: 3, bgcolor: "#fff" }}>
    <Typography variant="h5" mb={2} aria-label={title}>
      {title}
    </Typography>
    {loading ? (
      <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
    ) : (
      <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 400, overflowY: "auto" }}>
        {children}
      </TableContainer>
    )}
  </Card>
);

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [emotionResults, setEmotionResults] = useState([]);
  const [audioResults, setAudioResults] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState({
    users: false,
    books: false,
    categories: false,
    orders: false,
    messages: false,
    emotionResults: false,
    audioResults: false,
    analysisResults: false,
  });
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [userSearch, setUserSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchBooks();
    fetchCategories();
    fetchOrders();
    fetchMessages();
    fetchEmotionResults();
    fetchAudioResults();
    fetchAnalysisResults();
  }, []);

  const fetchWithRetry = async (url, setter, key, method = "get", data = null, retries = 3) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const response = method === "get" ? await axios.get(url) : await axios.post(url, data);
      setter(response.data);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchWithRetry(url, setter, key, method, data, retries - 1), 1000);
      } else {
        setError(`Failed to fetch ${key}. Please try again.`);
      }
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const fetchUsers = () => fetchWithRetry("http://localhost:3003/api/auth/users", setUsers, "users");
  const fetchBooks = () => fetchWithRetry("http://localhost:3003/api/books", setBooks, "books");
  const fetchCategories = () => fetchWithRetry("http://localhost:3003/api/categories", setCategories, "categories");
  const fetchOrders = () => fetchWithRetry("http://localhost:3003/api/orders", setOrders, "orders");
  const fetchMessages = () => fetchWithRetry("http://localhost:3003/api/contact", setMessages, "messages");
  const fetchEmotionResults = () => fetchWithRetry("http://localhost:3003/api/emotion-results", setEmotionResults, "emotionResults");
  const fetchAudioResults = () => fetchWithRetry("http://localhost:3003/api/audio-results", setAudioResults, "audioResults");
  const fetchAnalysisResults = () => fetchWithRetry("http://localhost:3003/api/analysis-results", setAnalysisResults, "analysisResults");

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:3003/api/contact/${id}/read`);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, status: "read" } : msg))
      );
    } catch (error) {
      setError("Failed to mark message as read.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Debounced handlers
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleDateRangeChange = useCallback(
    debounce((newRange) => {
      setDateRange(newRange);
    }, 500),
    []
  );

  const handleUserSearchChange = useCallback(
    debounce((value) => {
      setUserSearch(value);
    }, 300),
    []
  );

  const handleMessageSearchChange = useCallback(
    debounce((value) => {
      setMessageSearch(value);
    }, 300),
    []
  );

  // Data calculations
  const recentBooks = useMemo(() => [...books].slice(-5).reverse(), [books]);
  const recentUsers = useMemo(() => [...users].slice(-5).reverse(), [users]);
  const recentMessages = useMemo(() => [...messages].slice(-5).reverse(), [messages]);

  const booksPerCategoryData = useMemo(
    () =>
      categories.map((category) => ({
        name: category.category_name,
        value: books.filter((book) => book.category_name === category.category_name).length,
      })),
    [categories, books]
  );

  const orderStatusData = useMemo(
    () => [
      { name: "Pending", value: orders.filter((order) => order.status === "Pending").length },
      { name: "Approved", value: orders.filter((order) => order.status === "Approved").length },
      { name: "Dispatched", value: orders.filter((order) => order.status === "Dispatched").length },
      { name: "Delivered", value: orders.filter((order) => order.status === "Delivered").length },
      { name: "Cancelled", value: orders.filter((order) => order.status === "Cancelled").length },
    ],
    [orders]
  );

  const analysisTypeData = useMemo(
    () => [
      { name: "Video", value: emotionResults.length },
      { name: "Audio", value: audioResults.length },
      { name: "Upload", value: analysisResults.length },
    ],
    [emotionResults, audioResults, analysisResults]
  );

  const filteredOrders = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return orders;
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    return orders.filter((order) => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, dateRange]);

  const ordersPerMonthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => ({
      month,
      orders: filteredOrders.filter((order) => new Date(order.date).getMonth() === index).length,
    }));
  }, [filteredOrders]);

  const filteredAnalyses = useMemo(() => {
    const allAnalyses = [
      ...emotionResults.map((e) => ({ ...e, type: "video", date: e.timestamp })),
      ...audioResults.map((a) => ({ ...a, type: "audio", date: a.created_at || a.timestamp })),
      ...analysisResults.map((r) => ({ ...r, type: "upload", date: r.created_at || r.timestamp })),
    ];
    if (!dateRange.start || !dateRange.end) return allAnalyses;
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    return allAnalyses.filter((analysis) => {
      const analysisDate = new Date(analysis.date);
      return analysisDate >= startDate && analysisDate <= endDate;
    });
  }, [emotionResults, audioResults, analysisResults, dateRange]);

  const analysesPerMonthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => ({
      month,
      analyses: filteredAnalyses.filter((analysis) => new Date(analysis.date).getMonth() === index).length,
    }));
  }, [filteredAnalyses]);

  const totalRevenueData = useMemo(
    () =>
      orders.map((order) => ({
        orderId: order.order_id,
        revenue: order.net_total,
      })),
    [orders]
  );

  const filteredUsers = useMemo(
    () =>
      recentUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.toLowerCase())
      ),
    [recentUsers, userSearch]
  );

  const filteredMessages = useMemo(
    () =>
      messages
        .filter(
          (msg) =>
            msg.name.toLowerCase().includes(messageSearch.toLowerCase()) ||
            msg.email.toLowerCase().includes(messageSearch.toLowerCase()) ||
            msg.subject.toLowerCase().includes(messageSearch.toLowerCase())
        )
        .filter((msg) => messageFilter === "all" || msg.status === messageFilter),
    [messages, messageSearch, messageFilter]
  );

  const recentActivities = useMemo(() => {
    const allAnalyses = [
      ...emotionResults.map((e) => ({ ...e, type: "video", date: e.timestamp })),
      ...audioResults.map((a) => ({ ...a, type: "audio", date: a.created_at || a.timestamp })),
      ...analysisResults.map((r) => ({ ...r, type: "upload", date: r.created_at || r.timestamp })),
    ];
    return allAnalyses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((analysis) => ({
        user: users.find((u) => u.id === analysis.user_id) || { name: "Unknown", email: "N/A" },
        type: analysis.type,
        date: analysis.date,
      }));
  }, [emotionResults, audioResults, analysisResults, users]);

  // Export data as CSV
  const exportToCSV = () => {
    const csvRows = [
      ["Books per Category"],
      ["Category", "Count"],
      ...booksPerCategoryData.map((item) => [item.name, item.value]),
      [],
      ["Order Status"],
      ["Status", "Count"],
      ...orderStatusData.map((item) => [item.name, item.value]),
      [],
      ["Orders per Month"],
      ["Month", "Orders"],
      ...ordersPerMonthData.map((item) => [item.month, item.orders]),
      [],
      ["Analysis Types"],
      ["Type", "Count"],
      ...analysisTypeData.map((item) => [item.name, item.value]),
      [],
      ["Analyses per Month"],
      ["Month", "Analyses"],
      ...analysesPerMonthData.map((item) => [item.month, item.analyses]),
      [],
      ["Total Revenue"],
      ["Order ID", "Revenue"],
      ...totalRevenueData.map((item) => [item.orderId, item.revenue]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "dashboard_report.csv");
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader onLogout={handleLogout} />
      <main style={{ padding: "2rem 0", backgroundColor: theme.palette.neutral.main, minHeight: "100vh" }}>
        <Container maxWidth="xl">
          <Box sx={{ position: "sticky", top: 16, zIndex: 10, display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<DownloadOutlined />}
              onClick={exportToCSV}
              aria-label="Export dashboard data as CSV"
              sx={{ bgcolor: theme.palette.primary.main, "&:hover": { bgcolor: theme.palette.primary.dark } }}
            >
              Export Data
            </Button>
          </Box>

          <Typography variant="h3" align="center" gutterBottom sx={{ mb: 2 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
            Monitor bookstore operations and AI analysis sessions for ConfidenceVoice.
          </Typography>

          <Fade in={!!error} timeout={500}>
            <Alert
              severity="error"
              sx={{ mb: 4 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError(null);
                    fetchUsers();
                    fetchBooks();
                    fetchCategories();
                    fetchOrders();
                    fetchMessages();
                    fetchEmotionResults();
                    fetchAudioResults();
                    fetchAnalysisResults();
                  }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Fade>

          <Card sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Users"
                  value={users.length}
                  icon={<PeopleOutlined fontSize="large" />}
                  color="primary"
                  loading={loading.users}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Categories"
                  value={categories.length}
                  icon={<CategoryOutlined fontSize="large" />}
                  color="secondary"
                  loading={loading.categories}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Books"
                  value={books.length}
                  icon={<BookOutlined fontSize="large" />}
                  color="accent"
                  loading={loading.books}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Orders"
                  value={orders.length}
                  icon={<ShoppingCartOutlined fontSize="large" />}
                  color="orders"
                  loading={loading.orders}
                />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} lg={4}>
                <ChartWrapper title="Books per Category" loading={loading.books || loading.categories}>
                  <PieChart width={Math.min(320, window.innerWidth * 0.25)} height={280}>
                    <Pie
                      data={booksPerCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label
                    >
                      {booksPerCategoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.chartColors[index % theme.palette.chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ChartWrapper>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <ChartWrapper title="Order Status" loading={loading.orders}>
                  <PieChart width={Math.min(320, window.innerWidth * 0.25)} height={280}>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.chartColors[index % theme.palette.chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ChartWrapper>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <ChartWrapper title="Analysis Types" loading={loading.emotionResults || loading.audioResults || loading.analysisResults}>
                  <PieChart width={Math.min(320, window.innerWidth * 0.25)} height={280}>
                    <Pie
                      data={analysisTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label
                    >
                      {analysisTypeData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={theme.palette.chartColors[index % theme.palette.chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ChartWrapper>
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 4, bgcolor: "#fff" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} lg={6}>
                <ChartWrapper title="Orders per Month" loading={loading.orders}>
                  <Box mb={2} display="flex" gap={2} flexWrap="wrap">
                    <TextField
                      type="date"
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(e) => handleDateRangeChange({ ...dateRange, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 160, maxWidth: 200 }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      value={dateRange.end}
                      onChange={(e) => handleDateRangeChange({ ...dateRange, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 160, maxWidth: 200 }}
                    />
                  </Box>
                  <LineChart width={Math.min(600, window.innerWidth * 0.45)} height={300} data={ordersPerMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line type="monotone" dataKey="orders" stroke={theme.palette.primary.main} strokeWidth={2} />
                  </LineChart>
                </ChartWrapper>
              </Grid>

              <Grid item xs={12} lg={6}>
                <ChartWrapper title="Analyses per Month" loading={loading.emotionResults || loading.audioResults || loading.analysisResults}>
                  <Box mb={2} display="flex" gap={2} flexWrap="wrap">
                    <TextField
                      type="date"
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(e) => handleDateRangeChange({ ...dateRange, start: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 160, maxWidth: 200 }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      value={dateRange.end}
                      onChange={(e) => handleDateRangeChange({ ...dateRange, end: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 160, maxWidth: 200 }}
                    />
                  </Box>
                  <LineChart width={Math.min(600, window.innerWidth * 0.45)} height={300} data={analysesPerMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Line type="monotone" dataKey="analyses" stroke={theme.palette.primary.main} strokeWidth={2} />
                  </LineChart>
                </ChartWrapper>
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, bgcolor: "#fff" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <Box mb={2} display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    label="Search Messages"
                    variant="outlined"
                    value={messageSearch}
                    onChange={(e) => handleMessageSearchChange(e.target.value)}
                    sx={{ minWidth: 200, maxWidth: 300 }}
                    aria-label="Search messages by name, email, or subject"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl sx={{ minWidth: 160, maxWidth: 200 }}>
                    <InputLabel>Filter Status</InputLabel>
                    <Select
                      value={messageFilter}
                      onChange={(e) => setMessageFilter(e.target.value)}
                      label="Filter Status"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="unread">Unread</MenuItem>
                      <MenuItem value="read">Read</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableWrapper title="Recent Contact Messages" loading={loading.messages}>
                  <Table aria-label="recent messages table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Subject</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMessages.slice(0, 5).map((message) => (
                        <TableRow
                          key={message.id}
                          hover
                          sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark, cursor: "pointer" } }}
                        >
                          <TableCell>{message.name}</TableCell>
                          <TableCell>{message.email}</TableCell>
                          <TableCell>{message.subject}</TableCell>
                          <TableCell>{message.status}</TableCell>
                          <TableCell>
                            {message.status === "unread" && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleMarkAsRead(message.id)}
                                startIcon={<CheckCircleOutlined />}
                                aria-label={`Mark message from ${message.name} as read`}
                                sx={{ bgcolor: theme.palette.secondary.main, "&:hover": { bgcolor: theme.palette.secondary.dark } }}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Box mb={2}>
                  <TextField
                    label="Search Users"
                    variant="outlined"
                    value={userSearch}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    sx={{ minWidth: 200, maxWidth: 300 }}
                    aria-label="Search users by name or email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <TableWrapper title="Recently Registered Users" loading={loading.users}>
                  <Table aria-label="recent users table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.slice(0, 5).map((user) => (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark, cursor: "pointer" } }}
                        >
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{new Date(user.create_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </Grid>

              <Grid item xs={12}>
                <TableWrapper title="Recently Added Books" loading={loading.books}>
                  <Table aria-label="recent books table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Author</TableCell>
                        <TableCell>Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentBooks.map((book) => (
                        <TableRow
                          key={book.book_id}
                          hover
                          sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark, cursor: "pointer" } }}
                        >
                          <TableCell>{book.book_name}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>{book.category_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </Grid>

              <Grid item xs={12}>
                <TableWrapper title="Recent User Activities" loading={loading.emotionResults || loading.audioResults || loading.analysisResults}>
                  <Table aria-label="recent activities table">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Activity</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentActivities.map((activity, index) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark, cursor: "pointer" } }}
                        >
                          <TableCell>{activity.user.name}</TableCell>
                          <TableCell>{activity.user.email}</TableCell>
                          <TableCell>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} Analysis</TableCell>
                          <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </Grid>
            </Grid>
          </Card>
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
};

export default Dashboard;