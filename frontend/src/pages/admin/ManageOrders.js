import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
  Skeleton,
  ThemeProvider,
  createTheme,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Edit, Search, Download as DownloadIcon, Visibility } from "@mui/icons-material";
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

// Reusable OrderTable component
const OrderTable = ({
  orders,
  loading,
  handleEditClick,
  handleViewDetails,
  handleSort,
  order,
  orderBy,
}) => (
  <TableContainer component={Paper}>
    <Table aria-label="orders table">
      <TableHead>
        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
          {[
            { id: "user_name", label: "User Name" },
            { id: "order_id", label: "Order ID" },
            { id: "date", label: "Date" },
            { id: "books", label: "Books" },
            { id: "net_total", label: "Net Total" },
            { id: "status", label: "Status" },
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
              {Array.from(new Array(7)).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} align="center">
              No orders found
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.order_id} hover>
              <TableCell>{order.user_name}</TableCell>
              <TableCell>{order.order_id}</TableCell>
              <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <List sx={{ margin: 0, padding: 0, listStylePosition: "inside" }}>
                  {[...new Set(order.books.map((book) => book.book_name))].map((name, index) => (
                    <ListItem key={index} sx={{ padding: 0 }}>
                      <ListItemText primary={name} />
                    </ListItem>
                  ))}
                </List>
              </TableCell>
              <TableCell>₹{order.net_total}</TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleEditClick(order)}
                  aria-label={`Edit order ${order.order_id}`}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => handleViewDetails(order)}
                  aria-label={`View details of order ${order.order_id}`}
                >
                  <Visibility />
                </IconButton>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("order_id");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (retries = 3) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3003/api/orders");
      setOrders(res.data);
      applySearchFilter(searchTerm, res.data);
      setError(null);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchOrders(retries - 1), 1000);
      } else {
        setError("Failed to fetch orders. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
  };

  const handleViewDetails = (order) => {
    setViewOrder(order);
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const handleSaveStatus = async () => {
    try {
      await axios.put(`http://localhost:3003/api/orders/${selectedOrder.order_id}`, {
        status: newStatus,
      });
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      setError("Failed to update order status. Please try again.");
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
    (term, list) => {
      const lowerTerm = term.toLowerCase();
      const filtered = list.filter(
        (order) =>
          order.user_name.toLowerCase().includes(lowerTerm) ||
          order.order_id.toString().includes(lowerTerm)
      );
      setFilteredOrders(filtered);
      setPage(0); // Reset to first page on filter change
    },
    []
  );

  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      applySearchFilter(term, orders);
    }, 500),
    [orders, applySearchFilter]
  );

  // Sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      if (orderBy === "date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (orderBy === "net_total") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, order, orderBy]);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedOrders = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedOrders.slice(start, start + rowsPerPage);
  }, [sortedOrders, page, rowsPerPage]);

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [
      ["Order ID", "User Name", "Date", "Books", "Net Total", "Status"],
      ...orders.map((order) => [
        order.order_id,
        order.user_name,
        new Date(order.date).toLocaleDateString(),
        [...new Set(order.books.map((book) => book.book_name))].join("; "),
        order.net_total,
        order.status,
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "orders_report.csv");
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" align="center" gutterBottom>
            Manage Orders
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
                    fetchOrders();
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
              label="Search by user name or order ID"
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
              aria-label="Export orders as CSV"
            >
              Export Orders
            </Button>
          </Box>

          <OrderTable
            orders={paginatedOrders}
            loading={loading}
            handleEditClick={handleEditClick}
            handleViewDetails={handleViewDetails}
            handleSort={handleSort}
            order={order}
            orderBy={orderBy}
          />

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          {/* Status Edit Dialog */}
          <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Order Status</DialogTitle>
            <DialogContent>
              <Typography gutterBottom>Order ID: {selectedOrder?.order_id}</Typography>
              <Select
                fullWidth
                value={newStatus}
                onChange={handleStatusChange}
                label="Status"
                variant="outlined"
                sx={{ mt: 1 }}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Dispatched">Dispatched</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveStatus} color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Order Details Dialog */}
          <Dialog open={!!viewOrder} onClose={() => setViewOrder(null)} maxWidth="md" fullWidth>
            <DialogTitle>Order Details - ID: {viewOrder?.order_id}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                <strong>User Name:</strong> {viewOrder?.user_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {viewOrder && new Date(viewOrder.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Net Total:</strong> ₹{viewOrder?.net_total}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {viewOrder?.status}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Books:
              </Typography>
              <List>
                {viewOrder?.books.map((book, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={book.book_name}
                      
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewOrder(null)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
};

export default ManageOrders;