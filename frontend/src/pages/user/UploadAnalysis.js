import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ThemeProvider,
  createTheme,
  Fade,
  styled,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Sync as SyncIcon,
  VolumeOff as VolumeOffIcon,
  Lightbulb as LightbulbIcon,
  EmojiEmotions as ConfidenceIcon,
} from "@mui/icons-material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Styled upload progress
const UploadProgress = styled(LinearProgress)(({ theme }) => ({
  marginTop: 8,
  borderRadius: 4,
}));

// Custom theme
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
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "background-color 0.3s",
        },
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
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#F1F5F9",
          fontWeight: 600,
          padding: "12px",
        },
        body: { padding: "12px", fontSize: "0.9rem" },
      },
    },
  },
});

// Reusable ResultCard component
const ResultCard = React.memo(({ title, icon, content }) => (
  <Fade in timeout={500}>
    <Card sx={{ height: "100%", display: "flex", alignItems: "center" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Tooltip title={title} arrow>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }} aria-label={title}>
              {title}
            </Typography>
          </Box>
        </Tooltip>
        <Typography variant="body1">{content || "None"}</Typography>
      </CardContent>
    </Card>
  </Fade>
));

// Reusable TableWrapper component
const TableWrapper = React.memo(({ title, children, loading }) => (
  <Box mt={4}>
    <Typography variant="h5" mb={2} aria-label={title}>
      {title}
    </Typography>
    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    ) : (
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        {children}
      </TableContainer>
    )}
  </Box>
));

function UploadAnalysis() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  // Validate file
  const validateFile = (file) => {
    const validTypes = ["audio/wav", "audio/mp3", "video/mp4", "video/avi", "video/x-matroska"];
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (!validTypes.includes(file.type)) {
      return "Invalid file format. Please upload WAV, MP3, MP4, AVI, or MKV.";
    }
    if (file.size > maxSize) {
      return "File too large. Maximum size is 50MB.";
    }
    return null;
  };

  // Check if user is logged in
  useEffect(() => {
    if (!userId || !token) {
      navigate("/login");
    } else {
      fetchReports();
    }
  }, [userId, token, navigate]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");
    try {
      const response = await axios.get("http://127.0.0.1:5000/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data);
    } catch (err) {
      setReportsError("Failed to load reports. Please try again.");
    } finally {
      setReportsLoading(false);
    }
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setError(error);
        setFile(null);
        e.target.value = null;
      } else {
        setFile(selectedFile);
        setError("");
        setResult(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an audio or video file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setResult(null);
    setUploadProgress(0);

    try {
      const response = await axios.post("http://127.0.0.1:5000/index", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      if (response.data.success) {
        setResult(response.data.result);
        fetchReports();
      } else {
        setError(response.data.message || "Analysis failed. Please check file format or try again.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to analyze file. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme}>
      <Header onLogout={handleLogout} />
      <main style={{ padding: "2rem 0", backgroundColor: theme.palette.neutral.main, minHeight: "100vh" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" align="center" gutterBottom aria-label="Analysis via Upload">
            Analysis via Upload
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" mb={4}>
            Upload an audio or video file to analyze your confidence level.
          </Typography>

          {error && (
            <Fade in timeout={500}>
              <Alert
                severity="error"
                sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setError("");
                      if (file) handleUpload();
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Card aria-live="polite">
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Upload File
                  </Typography>
                  <Box component="form" sx={{ mt: 2 }}>
                    <TextField
                      type="file"
                      fullWidth
                      inputProps={{ accept: "audio/wav,audio/mp3,video/mp4,video/avi,video/x-matroska" }}
                      onChange={handleFileChange}
                      disabled={loading}
                      aria-label="Select audio or video file"
                    />
                    {loading && <UploadProgress variant="determinate" value={uploadProgress} />}
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<UploadIcon />}
                      onClick={handleUpload}
                      disabled={loading || !file}
                      sx={{ mt: 2 }}
                      aria-label="Upload and analyze file"
                    >
                      {loading ? `Analyzing (${uploadProgress}%)...` : "Analyze"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result && (
            <Grid container spacing={3} mt={4}>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Transcription"
                  icon={<DescriptionIcon color="primary" />}
                  content={result.transcribed_text}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Vocabulary Assessment"
                  icon={<BarChartIcon color="primary" />}
                  content={result.pronunciation_assessment}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Most Repeated Words"
                  icon={<SyncIcon color="primary" />}
                  content={result.most_repeated_words}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Filler Words"
                  icon={<VolumeOffIcon color="primary" />}
                  content={result.filler_words}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Confidence Level"
                  icon={<ConfidenceIcon color="primary" />}
                  content={result.confident_percentage}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Not Confident Level"
                  icon={<ConfidenceIcon color="secondary" />}
                  content={result.not_confident_percentage}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  title="Suggestions"
                  icon={<LightbulbIcon color="primary" />}
                  content={result.suggestions.join(", ")}
                />
              </Grid>
            </Grid>
          )}

          <TableWrapper title="Analysis Reports" loading={reportsLoading}>
            <Table aria-label="Analysis reports table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Pronunciation Assessment">Pronunciation Assessment</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Most Repeated Words">Most Repeated Words</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Filler Words">Filler Words</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Confidence Level">Confidence Level</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Not Confident Level">Not Confident Level</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Suggestion">Suggestion</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} aria-label="Date">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 && !reportsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1">No reports found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} hover sx={{ "&:hover": { bgcolor: theme.palette.neutral.dark } }}>
                      <TableCell>{report.pronunciation_assessment || "N/A"}</TableCell>
                      <TableCell>{report.most_repeated_words || "N/A"}</TableCell>
                      <TableCell>{report.filler_words || "None"}</TableCell>
                      <TableCell>{report.confident_percentage ? `${report.confident_percentage}%` : "N/A"}</TableCell>
                      <TableCell>{report.not_confident_percentage ? `${report.not_confident_percentage}%` : "N/A"}</TableCell>
                      <TableCell>{report.suggestion || "N/A"}</TableCell>
                      <TableCell>{new Date(report.created_at).toLocaleDateString() || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>

          {reportsError && (
            <Fade in timeout={500}>
              <Alert
                severity="error"
                sx={{ mt: 4, maxWidth: 600, mx: "auto" }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setReportsError("");
                      fetchReports();
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {reportsError}
              </Alert>
            </Fade>
          )}
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default UploadAnalysis;