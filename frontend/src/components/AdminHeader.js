import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { Menu as MenuIcon, Logout as LogoutIcon } from "@mui/icons-material";

const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    neutral: { main: "#F9FAFB", dark: "#E5E7EB" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700, fontSize: "1.5rem" },
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
          padding: "8px 16px",
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

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Manage Users", path: "/admin/manage-users" },
  { label: "Manage Categories", path: "/admin/manage-categories" },
  { label: "Manage Books", path: "/admin/manage-books" },
  { label: "Manage Orders", path: "/admin/manage-orders" },
  { label: "Manage Messages", path: "/admin/manage-messages" },
  { label: "Settings", path: "/admin/settings" },
];

function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Admin Panel
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            selected={isActive(item.path)}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="sticky">
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open navigation drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component={Link}
              to="/admin/dashboard"
              sx={{ textDecoration: "none", color: "inherit" }}
              aria-label="Admin Panel"
            >
              Admin Panel
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {navItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                sx={{ fontSize: "0.95rem" }}
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                {item.label}
              </MenuItem>
            ))}
          </Box>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
            aria-label="Logout"
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", sm: "none" } }}
        aria-label="Mobile navigation menu"
        aria-expanded={mobileOpen}
      >
        {drawer}
      </Drawer>
    </ThemeProvider>
  );
}

export default AdminHeader;