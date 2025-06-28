import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Grid,
  ThemeProvider,
  createTheme,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Resend OTP timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleOtpChange = useCallback((index, value) => {
    if (value === "" || /^[0-9]$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== "" && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  }, [otp]);

  const sendOTP = useCallback(async (retries = 3) => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3003/api/otp/forgot-password", { email });
      setSuccess("OTP sent to your email.");
      setError("");
      setStep(2);
      setResendTimer(60); // 60-second cooldown for resend
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => sendOTP(retries - 1), 1000);
      } else {
        setError("Error sending OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  const resendOTP = useCallback(() => {
    setOtp(new Array(6).fill(""));
    sendOTP();
  }, [sendOTP]);

  const verifyOTP = useCallback(() => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setStep(3);
    setError("");
    setSuccess("");
  }, [otp]);

  const resetPassword = useCallback(
    async (retries = 3) => {
      setError("");
      setSuccess("");

      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        setError("Invalid OTP. Please go back and verify again.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      setLoading(true);
      try {
        await axios.post("http://localhost:3003/api/otp/reset-password", {
          email,
          otp: otpCode,
          newPassword,
        });
        setSuccess("Password reset successful! Redirecting to login...");
        setError("");
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => resetPassword(retries - 1), 1000);
        } else {
          setError("Invalid OTP or error resetting password. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, otp, newPassword, navigate]
  );

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setNewPassword(value);

    // Password strength check
    if (value.length < 8) {
      setPasswordStrength("Weak");
    } else if (value.length >= 8 && value.match(/[A-Z]/) && value.match(/[0-9]/)) {
      setPasswordStrength("Strong");
    } else {
      setPasswordStrength("Moderate");
    }
  }, []);

  const steps = ["Enter Email", "Verify OTP", "Reset Password"];

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="sm">
          <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
            <img
              src="assets/img/logo.png"
              alt="Logo"
              style={{ width: "150px", marginBottom: "16px" }}
            />
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Follow the steps to reset your password.
            </Typography>

            <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {step === 1 && (
              <>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  margin="normal"
                  disabled={loading}
                  inputProps={{ "aria-required": "true" }}
                />
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendOTP}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                    aria-label="Send OTP"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </Box>
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Enter the 6-digit OTP sent to {email}
                </Typography>
                <Grid container spacing={1} sx={{ mb: 3, justifyContent: "center" }}>
                  {otp.map((value, index) => (
                    <Grid item xs={2} key={index}>
                      <TextField
                        id={`otp-${index}`}
                        inputProps={{
                          maxLength: 1,
                          style: { textAlign: "center", fontSize: "1.2rem", padding: "10px 0" },
                          "aria-label": `OTP digit ${index + 1}`,
                        }}
                        variant="outlined"
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                      />
                    </Grid>
                  ))}
                </Grid>
                <Box display="flex" justifyContent="center" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={verifyOTP}
                    disabled={loading}
                    aria-label="Verify OTP"
                  >
                    Verify OTP
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={resendOTP}
                    disabled={resendTimer > 0 || loading}
                    aria-label="Resend OTP"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </Button>
                </Box>
              </>
            )}

            {step === 3 && (
              <>
                <TextField
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  margin="normal"
                  helperText={
                    passwordStrength
                      ? `Password Strength: ${passwordStrength}`
                      : "Password must be at least 8 characters long."
                  }
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          aria-label="Toggle password visibility"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ "aria-required": "true" }}
                />
                <Box display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={resetPassword}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                    aria-label="Reset Password"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Box>
              </>
            )}

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Link
                component={RouterLink}
                to="/"
                variant="body2"
                sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}
              >
                Back to Login
              </Link>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ForgotPassword;