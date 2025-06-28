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
  Menu,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { Menu as MenuIcon, Logout as LogoutIcon, ArrowDropDown as ArrowDropDownIcon } from "@mui/icons-material";

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
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: 200,
        },
      },
    },
  },
});

const navItems = [
  { label: "Home", path: "/home" },
  { label: "About", path: "/about" },
  {
    label: "AI Coaching",
    path: "/coaching",
    subItems: [
      { label: "Audio Analysis", path: "/coaching/audio" },
      { label: "Video Analysis", path: "/coaching/video" },
      { label: "Analysis via Upload", path: "/coaching/upload" },
    ],
  },
  { label: "Products", path: "/products" },
  { label: "Cart", path: "/add-cart" },
  { label: "Orders", path: "/orders" },
  { label: "Settings", path: "/settings" },
  { label: "Contact", path: "/contact" },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCoachingClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCoachingClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => location.pathname === path;
  const isCoachingActive = location.pathname.startsWith("/coaching");

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        ConfidentVoice
      </Typography>
      <List>
        {navItems.map((item) => (
          <React.Fragment key={item.path}>
            <ListItem
              component={Link}
              to={item.path}
              onClick={handleDrawerToggle}
              selected={isActive(item.path) || (item.path === "/coaching" && isCoachingActive)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemText primary={item.label} />
            </ListItem>
            {item.subItems && (
              <Box sx={{ pl: 2 }}>
                {item.subItems.map((subItem) => (
                  <ListItem
                    key={subItem.path}
                    component={Link}
                    to={subItem.path}
                    onClick={handleDrawerToggle}
                    selected={isActive(subItem.path)}
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemText primary={subItem.label} />
                  </ListItem>
                ))}
              </Box>
            )}
          </React.Fragment>
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
              to="/home"
              sx={{ textDecoration: "none", color: "inherit" }}
              aria-label="ConfidentVoice"
            >
              ConfidentVoice
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {navItems.map((item) =>
              item.subItems ? (
                <Box key={item.path}>
                  <MenuItem
                    onClick={handleCoachingClick}
                    sx={{ fontSize: "0.95rem", bgcolor: isCoachingActive ? "#E5E7EB" : "transparent" }}
                    aria-haspopup="true"
                    aria-expanded={Boolean(anchorEl)}
                    aria-controls="coaching-menu"
                  >
                    {item.label}
                    <ArrowDropDownIcon />
                  </MenuItem>
                  <Menu
                    id="coaching-menu"
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCoachingClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                  >
                    {item.subItems.map((subItem) => (
                      <MenuItem
                        key={subItem.path}
                        component={Link}
                        to={subItem.path}
                        onClick={handleCoachingClose}
                        selected={isActive(subItem.path)}
                        aria-current={isActive(subItem.path) ? "page" : undefined}
                      >
                        {subItem.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : (
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
              )
            )}
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

export default Header;