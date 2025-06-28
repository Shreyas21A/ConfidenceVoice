// src/theme.js
import { createTheme } from "@mui/material";

export const theme = createTheme({
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#000",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          "&:hover": { backgroundColor: "#E5E7EB" },
          "&.Mui-selected": {
            backgroundColor: "#1976D2",
            color: "#fff",
            "&:hover": { backgroundColor: "#1565C0" },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { width: 240, padding: "16px" },
      },
    },
  },
});