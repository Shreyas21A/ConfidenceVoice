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
  Avatar,
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

// Reusable BookTable component
const BookTable = ({
  books,
  loading,
  handleOpen,
  handleDelete,
  handleSort,
  order,
  orderBy,
}) => (
  <TableContainer component={Paper}>
    <Table aria-label="books table">
      <TableHead>
        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
          {[
            { id: "book_id", label: "ID" },
            { id: "book_name", label: "Book" },
            { id: "category_name", label: "Category" },
            { id: "description", label: "Description" },
            { id: "author", label: "Author" },
            { id: "publisher", label: "Publisher" },
            { id: "price", label: "Price" },
            { id: "isbn", label: "ISBN" },
            { id: "status", label: "Status" },
            { id: "cover_image", label: "Cover" },
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
              {Array.from(new Array(11)).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : books.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} align="center">
              No books found
            </TableCell>
          </TableRow>
        ) : (
          books.map((book) => (
            <TableRow key={book.book_id} hover>
              <TableCell>{book.book_id}</TableCell>
              <TableCell>{book.book_name}</TableCell>
              <TableCell>{book.category_name}</TableCell>
              <TableCell>{book.description}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>{book.publisher}</TableCell>
              <TableCell>₹{book.price}</TableCell>
              <TableCell>{book.isbn}</TableCell>
              <TableCell>{book.status}</TableCell>
              <TableCell>
                {book.cover_image ? (
                  <Avatar
                    src={`http://localhost:3003${book.cover_image}`}
                    alt={book.book_name}
                    variant="rounded"
                    sx={{ width: 50, height: 75 }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No Image
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleOpen(book)}
                  aria-label={`Edit book ${book.book_name}`}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(book.book_id)}
                  aria-label={`Delete book ${book.book_name}`}
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

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteBookId, setDeleteBookId] = useState(null);
  const [loading, setLoading] = useState({ books: false, categories: false });
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("book_id");
  const [formData, setFormData] = useState({
    book_name: "",
    category_id: "",
    description: "",
    author: "",
    publisher: "",
    price: "",
    isbn: "",
    status: "Active",
    cover_image: null,
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async (retries = 3) => {
    setLoading((prev) => ({ ...prev, books: true }));
    try {
      const res = await axios.get("http://localhost:3003/api/books");
      setBooks(res.data);
      applySearchFilter(searchTerm, res.data);
      setError(null);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchBooks(retries - 1), 1000);
      } else {
        setError("Failed to fetch books. Please try again.");
      }
    } finally {
      setLoading((prev) => ({ ...prev, books: false }));
    }
  };

  const fetchCategories = async (retries = 3) => {
    setLoading((prev) => ({ ...prev, categories: true }));
    try {
      const res = await axios.get("http://localhost:3003/api/categories");
      setCategories(res.data);
      setError(null);
    } catch (error) {
      if (retries > 0) {
        setTimeout(() => fetchCategories(retries - 1), 1000);
      } else {
        setError("Failed to fetch categories. Please try again.");
      }
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const handleOpen = (book = null) => {
    if (book) {
      setEditMode(true);
      setEditingId(book.book_id);
      setFormData({
        book_name: book.book_name,
        category_id: book.category_id,
        description: book.description,
        author: book.author,
        publisher: book.publisher,
        price: book.price,
        isbn: book.isbn || "",
        status: book.status,
        cover_image: null,
      });
    } else {
      setEditMode(false);
      setFormData({
        book_name: "",
        category_id: "",
        description: "",
        author: "",
        publisher: "",
        price: "",
        isbn: "",
        status: "Active",
        cover_image: null,
      });
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.book_name.trim()) newErrors.book_name = "Book name is required";
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.publisher.trim()) newErrors.publisher = "Publisher is required";
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.status) newErrors.status = "Status is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) data.append(key, value);
      });

      if (editMode) {
        await axios.put(`http://localhost:3003/api/books/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:3003/api/books", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fetchBooks();
      handleClose();
    } catch (error) {
      setError(`Failed to ${editMode ? "update" : "add"} book. Please try again.`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3003/api/books/${id}`);
      const updated = books.filter((book) => book.book_id !== id);
      setBooks(updated);
      applySearchFilter(searchTerm, updated);
      setDeleteBookId(null);
    } catch (error) {
      setError("Failed to delete book. Please try again.");
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
        (book) =>
          book.book_name.toLowerCase().includes(lowerTerm) ||
          book.author.toLowerCase().includes(lowerTerm) ||
          (book.category_name || "").toLowerCase().includes(lowerTerm)
      );
      setFilteredBooks(filtered);
      setPage(0); // Reset to first page on filter change
    },
    []
  );

  const handleSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      applySearchFilter(term, books);
    }, 500),
    [books, applySearchFilter]
  );

  // Sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const aValue = a[orderBy] || "";
      const bValue = b[orderBy] || "";
      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBooks, order, orderBy]);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedBooks = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedBooks.slice(start, start + rowsPerPage);
  }, [sortedBooks, page, rowsPerPage]);

  // Export to CSV
  const exportToCSV = () => {
    const csvRows = [
      [
        "ID",
        "Book Name",
        "Category",
        "Description",
        "Author",
        "Publisher",
        "Price",
        "ISBN",
        "Status",
        "Cover Image",
      ],
      ...books.map((book) => [
        book.book_id,
        book.book_name,
        book.category_name,
        book.description,
        book.author,
        book.publisher,
        book.price,
        book.isbn || "",
        book.status,
        book.cover_image || "",
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "books_report.csv");
  };

  return (
    <ThemeProvider theme={theme}>
      <AdminHeader />
      <main className="main" style={{ padding: "2rem 0", backgroundColor: "#f5f5f5" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" align="center" gutterBottom>
            Manage Books
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
                    fetchBooks();
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
              aria-label="Add new book"
            >
              Add Book
            </Button>
            <Box display="flex" gap={2}>
              <TextField
                label="Search by title, author, or category"
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
                aria-label="Export books as CSV"
              >
                Export Books
              </Button>
            </Box>
          </Box>

          <BookTable
            books={paginatedBooks}
            loading={loading.books}
            handleOpen={handleOpen}
            handleDelete={(id) => setDeleteBookId(id)}
            handleSort={handleSort}
            order={order}
            orderBy={orderBy}
          />

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedBooks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />

          {/* Dialog Modal for Add/Edit */}
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editMode ? "Edit Book" : "Add Book"}</DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                name="book_name"
                label="Book Name"
                full="Width"
                value={formData.book_name}
                onChange={handleChange}
                error={!!errors.book_name}
                helperText={errors.book_name}
                variant="outlined"
              />
              <FormControl fullWidth margin="dense" error={!!errors.category_id}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  label="Category"
                  onChange={handleChange}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.cat_id} value={cat.cat_id}>
                      {cat.category_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category_id && (
                  <Typography variant="caption" color="error">
                    {errors.category_id}
                  </Typography>
                )}
              </FormControl>
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
              <TextField
                margin="dense"
                name="author"
                label="Author"
                fullWidth
                value={formData.author}
                onChange={handleChange}
                error={!!errors.author}
                helperText={errors.author}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="publisher"
                label="Publisher"
                fullWidth
                value={formData.publisher}
                onChange={handleChange}
                error={!!errors.publisher}
                helperText={errors.publisher}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="price"
                label="Price"
                type="number"
                fullWidth
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
                variant="outlined"
              />
              <TextField
                margin="dense"
                name="isbn"
                label="ISBN"
                fullWidth
                value={formData.isbn}
                onChange={handleChange}
                variant="outlined"
              />
              <Button
                variant="outlined"
                component="label"
                sx={{ mt: 2 }}
              >
                Upload Cover Image
                <input
                  type="file"
                  name="cover_image"
                  accept="image/*"
                  hidden
                  onChange={handleChange}
                />
              </Button>
              {formData.cover_image && typeof formData.cover_image === "object" && (
                <Box mt={2}>
                  <Typography variant="body2">Preview:</Typography>
                  <Avatar
                    src={URL.createObjectURL(formData.cover_image)}
                    alt="Cover Preview"
                    variant="rounded"
                    sx={{ width: 100, height: 150 }}
                  />
                </Box>
              )}
              <FormControl fullWidth sx={{ mt: 2 }} error={!!errors.status}>
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
                {errors.status && (
                  <Typography variant="caption" color="error">
                    {errors.status}
                  </Typography>
                )}
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
          <Dialog open={!!deleteBookId} onClose={() => setDeleteBookId(null)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this book? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteBookId(null)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(deleteBookId)}
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

export default ManageBooks;