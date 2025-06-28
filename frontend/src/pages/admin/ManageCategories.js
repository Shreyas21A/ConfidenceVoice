import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Alert,
  Skeleton,
  ThemeProvider,
  createTheme,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Edit, Delete, Search, Download as DownloadIcon } from "@mui/icons-material";
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

// Reusable CategoryTable component 
const CategoryTable = ({
  categories,
  loading,
  handleOpen,
  handleDelete,
  handleSort,
  order,
  orderBy,
}) => (
  <TableContainer component={Paper}>
    <Table aria-label="categories table">
      <TableHead>
        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
          {[
            { id: "cat_id", label: "ID" },
            { id: "category_name", label: "Category Name" },
            { id: "description", label: "Description" },
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
              {Array.from(new Array(5)).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : categories.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} align="center">
              No categories found
            </TableCell>
          </TableRow>
        ) : (
          categories.map((cat) => (
            <TableRow key={cat.cat_id} hover>
              <TableCell>{cat.cat_id}</TableCell>
              <TableCell>{cat.category_name}</TableCell>
              <TableCell>{cat.description}</TableCell>
              <TableCell>{cat.status}</TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleOpen(cat)}
                  aria-label={`Edit category ${cat.category_name}`}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(cat.cat_id)}
                  aria-label={`Delete category ${cat.category_name}`}
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

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    status: "Active",
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("cat_id");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (retries = 3) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3003/api/categories");
      setCategories(res.data);
      applySearchFilter(searchTerm, res.data);
      setError(null);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchCategories(retries - 1), 1000);
      } else {
        setError("Failed to fetch categories. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditMode(true);
      setEditingId(category.cat_id);
      setFormData({
        category_name: category.category_name,
        description: category.description,
        status: category.status,
      });
    } else {
      setEditMode(false);
      setFormData({ category_name: "", description: "", status: "Active" });
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.category_name.trim()) newErrors.category_name = "Category name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editMode) {
        await axios.put(`http://localhost:3003/api/categories/${editingId}`, formData);
      } else {
        await axios.post("http://localhost:3003/api/categories", formData);
      }
      fetchCategories();
      handleClose();
      setErrors({});
    } catch (error) {
      setError(`Failed to ${editMode ? "update" : "add"} category. Please try again.`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3003/api/categories/${id}`);
      const updated = categories.filter((cat) => cat.cat_id !== id);
      setCategories(updated);
      applySearchFilter(searchTerm, updated);
      setDeleteCategoryId(null);
    } catch (error) {
      setError("Failed to delete category. Please try again.");
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
        (cat) =>
          cat.category_name.toLowerCase().includes(lowerTerm) ||
          cat.description.toLowerCase().includes(lowerTerm)
      );
      setFilteredCategories(filtered);
      setPage(0); // Reset to first page on filter change
    },
    []
  );

  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      applySearchFilter(term, categories);
    }, 500),
    [categories, applySearchFilter]
  );

  // Sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCategories, order, orderBy]);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCategories = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedCategories.slice(start, start + rowsPerPage);
  }, [sortedCategories, page, rowsPerPage]);

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [
      ["ID", "Category Name", "Description", "Status"],
      ...categories.map((cat) => [cat.cat_id, cat.category_name, cat.description, cat.status]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "categories_report.csv");
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" align="center" gutterBottom>
            Manage Categories
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
                    fetchCategories();
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpen()}
              aria-label="Add new category"
            >
              Add Category
            </Button>
            <Box display="flex" gap={2}>
              <TextField
                label="Search by name or description"
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
                aria-label="Export categories as CSV"
              >
                Export Categories
              </Button>
            </Box>
          </Box>

          <CategoryTable
            categories={paginatedCategories}
            loading={loading}
            handleOpen={handleOpen}
            handleDelete={(id) => setDeleteCategoryId(id)}
            handleSort={handleSort}
            order={order}
            orderBy={orderBy}
          />

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedCategories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          {/* Dialog Modal for Add/Edit */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editMode ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                name="category_name"
                label="Category Name"
                fullWidth
                value={formData.category_name}
                onChange={handleChange}
                error={!!errors.category_name}
                helperText={errors.category_name}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                variant="outlined"
              />
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleChange}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                {editMode ? "Edit" : "Add"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deleteCategoryId} onClose={() => setDeleteCategoryId(null)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this category? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteCategoryId(null)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(deleteCategoryId)}
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

export default ManageCategories;