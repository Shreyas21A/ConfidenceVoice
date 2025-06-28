import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Box,
  Alert,
  Skeleton,
  ThemeProvider,
  createTheme,
  TablePagination,
  TableSortLabel,
  InputAdornment,
} from "@mui/material";
import { Delete, Edit, Search, Download as DownloadIcon } from "@mui/icons-material";
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";

// Custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: { main: "#1976D2", dark: "#1565C0" },
    secondary: { main: "#2E7D32", dark: "#1B5E20" },
    accent: { main: "#D32F2F", dark: "#C62828" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
  },
  components: {
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

// Reusable UserTable component
const UserTable = ({
  users,
  loading,
  handleEditClick,
  handleDeleteUser,
  handleSort,
  order,
  orderBy,
}) => (
  <TableContainer component={Paper}>
    <Table aria-label="users table">
      <TableHead>
        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
          {[
            { id: "id", label: "ID" },
            { id: "name", label: "Name" },
            { id: "email", label: "Email" },
            { id: "role", label: "Role" },
          ].map((headCell) => (
            <TableCell key={headCell.id} sx={{ fontWeight: "bold" }}>
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : "asc"}
                onClick={() => handleSort(headCell.id)}
              >
                {headCell.label}
              </TableSortLabel>
            </TableCell>
          ))}
          <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          Array.from(new Array(5)).map((_, index) => (
            <TableRow key={index}>
              {Array.from(new Array(5)).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleEditClick(user)}
                  aria-label={`Edit user ${user.name}`}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.role === "Admin"}
                  title={user.role === "Admin" ? "Cannot delete Admin user" : "Delete user"}
                  aria-label={`Delete user ${user.name}`}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("id");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (retries = 3) => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3003/api/auth/users");
      setUsers(response.data);
      applySearchFilter(searchTerm, response.data);
      setError(null);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchUsers(retries - 1), 1000);
      } else {
        setError("Failed to fetch users. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:3003/api/auth/users/${id}`);
      const updatedUsers = users.filter((user) => user.id !== id);
      setUsers(updatedUsers);
      applySearchFilter(searchTerm, updatedUsers);
      setDeleteUserId(null);
    } catch (error) {
      setError("Failed to delete user. Please try again.");
    }
  };

  const handleEditClick = (user) => {
    setEditUser({ ...user });
  };

  const handleEditChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:3003/api/auth/users/${editUser.id}`, editUser);
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      setError("Failed to update user. Please try again.");
    }
  };

  // Debounced search
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const applySearchFilter = useCallback(
    (term, userList) => {
      const lowercasedTerm = term.toLowerCase();
      const filtered = userList.filter(
        (user) =>
          user.name.toLowerCase().includes(lowercasedTerm) ||
          user.email.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredUsers(filtered);
      setPage(0); // Reset to first page on filter change
    },
    []
  );

  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      applySearchFilter(term, users);
    }, 500),
    [users, applySearchFilter]
  );

  // Sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, order, orderBy]);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedUsers.slice(start, start + rowsPerPage);
  }, [sortedUsers, page, rowsPerPage]);

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [
      ["ID", "Name", "Email", "Role"],
      ...users.map((user) => [user.id, user.name, user.email, user.role]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "users_report.csv");
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" align="center" gutterBottom>
            Manage Users
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
                    setError(null);
                    fetchUsers();
                  }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <TextField
              label="Search by name or email"
              variant="outlined"
              size="small"
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              aria-label="Export users as CSV"
            >
              Export Users
            </Button>
          </Box>

          <UserTable
            users={paginatedUsers}
            loading={loading}
            handleEditClick={handleEditClick}
            handleDeleteUser={(id) => setDeleteUserId(id)}
            handleSort={handleSort}
            order={order}
            orderBy={orderBy}
          />

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          {/* Edit User Dialog */}
          <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                name="name"
                value={editUser?.name || ""}
                onChange={handleEditChange}
                variant="outlined"
              />
              <TextField
                margin="dense"
                label="Email"
                fullWidth
                name="email"
                value={editUser?.email || ""}
                onChange={handleEditChange}
                variant="outlined"
              />
              <TextField
                margin="dense"
                label="Role"
                fullWidth
                name="role"
                value={editUser?.role || ""}
                onChange={handleEditChange}
                variant="outlined"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleEditSave}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this user permanently? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteUser(deleteUserId)}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
};

export default ManageUsers;