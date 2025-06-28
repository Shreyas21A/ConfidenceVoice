import React, { useState, useEffect, useRef } from "react";
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
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { Upload as UploadIcon, Mic as MicIcon, Videocam as VideocamIcon } from "@mui/icons-material";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
    orders: { main: "#FFBB28", dark: "#F0A500" },
    chartColors: ["#1976D2", "#2E7D32", "#D32F2F", "#FFBB28", "#00C49F"],
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "background-color 0.3s",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function Coaching() {
  const [tab, setTab] = useState(0); // 0: Upload, 1: Audio, 2: Video
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check if user is logged in
    if (!userId || !token) {
      navigate("/");
    }

    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [userId, token, navigate, stream]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setFile(null);
    setError("");
    setResult(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setResult(null);
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

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze file. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startAudioStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      setError("");
      setResult(null);
      console.log("Audio stream started. Awaiting realtime_audio/app.py for WebSocket implementation.");
    } catch (err) {
      setError("Failed to access microphone. Please grant permission.");
      console.error("Audio stream error:", err);
    }
  };

  const startVideoStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setError("");
      setResult(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      console.log("Video stream started. Awaiting realtime_video/app.py for streaming implementation.");
    } catch (err) {
      setError("Failed to access webcam. Please grant permission.");
      console.error("Video stream error:", err);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <ThemeProvider theme={theme}>
      <Header onLogout={handleLogout} />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <Typography variant="h3" align="center" gutterBottom>
            AI Coaching
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" mb={4}>
            Analyze your confidence through audio, video, or uploaded files.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 4 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError("");
                    if (tab === 0 && file) handleUpload();
                    if (tab === 1) startAudioStream();
                    if (tab === 2) startVideoStream();
                  }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={handleTabChange}
            centered
            sx={{ mb: 4 }}
            aria-label="Analysis type tabs"
          >
            <Tab label="File Upload" />
            <Tab label="Real-Time Audio" />
            <Tab label="Real-Time Video" />
          </Tabs>

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {tab === 0 ? "Upload Audio/Video" : tab === 1 ? "Real-Time Audio Analysis" : "Real-Time Video Analysis"}
                  </Typography>

                  {tab === 0 && (
                    <Box component="form" sx={{ mt: 2 }}>
                      <TextField
                        type="file"
                        fullWidth
                        inputProps={{ accept: "audio/wav,audio/mp3,video/mp4,video/avi" }}
                        onChange={handleFileChange}
                        disabled={loading}
                        aria-label="Select audio or video file"
                      />
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
                        {loading ? "Analyzing..." : "Analyze"}
                      </Button>
                    </Box>
                  )}

                  {tab === 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<MicIcon />}
                        onClick={startAudioStream}
                        disabled={loading || stream}
                        sx={{ mb: 2 }}
                        aria-label="Start audio analysis"
                      >
                        Start Audio
                      </Button>
                      {stream && (
                        <Button
                          variant="outlined"
                          color="accent"
                          fullWidth
                          onClick={stopStream}
                          aria-label="Stop audio analysis"
                        >
                          Stop Audio
                        </Button>
                      )}
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Ensure your microphone is enabled for real-time analysis.
                      </Typography>
                    </Box>
                  )}

                  {tab === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        startIcon={<VideocamIcon />}
                        onClick={startVideoStream}
                        disabled={loading || stream}
                        sx={{ mb: 2 }}
                        aria-label="Start video analysis"
                      >
                        Start Video
                      </Button>
                      {stream && (
                        <Button
                          variant="outlined"
                          color="accent"
                          fullWidth
                          onClick={stopStream}
                          aria-label="Stop video analysis"
                        >
                          Stop Video
                        </Button>
                      )}
                      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                        <video ref={videoRef} autoPlay muted style={{ maxWidth: "100%", borderRadius: 8 }} />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Ensure your webcam is enabled for real-time analysis.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result && (
            <Grid container spacing={3} mt={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Analysis Results
                    </Typography>
                    {result.error ? (
                      <Typography variant="body1" color="error">
                        Error: {result.error}
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Transcribed Text:</strong> {result.transcribed_text || "N/A"}
                        </Typography>
                        <Typography variant="body1" sx warnings={{ mb: 1 }}>
                          <strong>Pronunciation Assessment:</strong> {result.pronunciation_assessment || "N/A"}
                        </Typography>
                        {result.confident_percentage && (
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Confident Percentage:</strong> {result.confident_percentage}
                          </Typography>
                        )}
                        {result.not_confident_percentage && (
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Not Confident Percentage:</strong> {result.not_confident_percentage}
                          </Typography>
                        )}
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Most Repeated Word:</strong> {result.most_repeated_word || "N/A"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>General Suggestion:</strong> {result.general_suggestion || "N/A"}
                        </Typography>
                        {result.processed_text && (
                          <Box>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Processed Words:</strong>
                            </Typography>
                            <Typography variant="body2">{result.processed_text.join(", ")}</Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default Coaching;