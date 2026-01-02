import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { type Category } from '../../../types/types';
import { DEFAULT_ENDPOINT, ENDPOINTS } from '../../config/endpoints';
import { useDispatch, useSelector } from 'react-redux';
import { getAuthFromStore, getCategoriesFromStore } from '../../redux/selectors';
import {  type AppDispatch } from '../../redux/store';
import { getCategoriesThunk } from '../../redux/slices/categories/thunk/getAllCategories';

// TypeScript interfaces

interface CategoryFormData {
  category_name: string;
  products_available?: number;
}

interface ApiResponse<T> {
  message: string;
  data?: T;
  category?: T;
  error?: string;
}


const CategoryManager: React.FC = () => {
  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
//   REDUX STORE
  const categories=useSelector(getCategoriesFromStore)
  const dispatch=useDispatch<AppDispatch>()
  const authData=useSelector(getAuthFromStore)
  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [openViewModal, setOpenViewModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  
  // Form states
  const [formData, setFormData] = useState<CategoryFormData>({
    category_name: '',
    products_available: 0,
  });
  
  const [editFormData, setEditFormData] = useState<{
    id: number;
    category_name?: string;
    products_available?: number;
  }>({ id: 0 });
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
    dispatch(getCategoriesThunk({token:authData.accessToken}))

    } catch (err: any) {
      setError(err.message || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single category
  const fetchCategory = async (id: number) => {
    try {
      
    const category=categories.find((cat)=>cat.id===id)
      return category;
    } catch (err: any) {
      setError(err.message || 'Error fetching category');
      return null;
    }
  };

  // Create category
  const createCategory = async () => {
    if (!formData.category_name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.categories.createCategory}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`,
        },
        body: JSON.stringify({
          category_name: formData.category_name,
        }),
      });
      
      const data: ApiResponse<Category> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category');
      }
      
      setSuccess('Category created successfully!');
      setOpenCreateModal(false);
      setFormData({ category_name: '', products_available: 0 });
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!editFormData.id) {
      setError('Category ID is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.categories.updateCategory}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`,
        },
        body: JSON.stringify(editFormData),
      });
      
      const data: ApiResponse<Category> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update category');
      }
      
      setSuccess('Category updated successfully!');
      setOpenEditModal(false);
      setEditFormData({ id: 0 });
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error updating category');
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const deleteCategory = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.categories.deleteCategory}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`,
        },
        body: JSON.stringify({ id: deleteId }),
      });
      
      const data: ApiResponse<Category> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }
      
      setSuccess('Category deleted successfully!');
      setOpenDeleteModal(false);
      setDeleteId(null);
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleViewCategory = async (id: number) => {
    const category = await fetchCategory(id);
    if (category) {
      setSelectedCategory(category);
      setOpenViewModal(true);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditFormData({
      id: category.id,
      products_available: category.products_available,
    });
    setOpenEditModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Category Management
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCategories}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        {loading && categories.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Products Available</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {category.category_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={category.products_available}
                        color={category.products_available > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(category.createdat)}</TableCell>
                    <TableCell>{formatDate(category.updatedat)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleViewCategory(category.id)}
                        title="View"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(category)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(category.id)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {categories.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 3 }}>
            No categories found. Create your first category!
          </Typography>
        )}
      </Paper>

      {/* Create Category Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.category_name}
            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
            required
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Products Available (Optional)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.products_available}
            onChange={(e) => setFormData({ ...formData, products_available: parseInt(e.target.value) || 0 })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateModal(false)}>Cancel</Button>
          <Button
            onClick={createCategory}
            variant="contained"
            disabled={loading || !formData.category_name.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Products Available"
            type="number"
            fullWidth
            variant="outlined"
            value={editFormData.products_available || 0}
            onChange={(e) => setEditFormData({
              ...editFormData,
              products_available: parseInt(e.target.value) || 0,
            })}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Note: Category name cannot be edited
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button
            onClick={updateCategory}
            variant="contained"
            disabled={loading || editFormData.products_available === undefined}
          >
            {loading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Category Modal */}
      <Dialog open={openViewModal} onClose={() => setOpenViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Category Details</DialogTitle>
        <DialogContent>
          {selectedCategory && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>ID:</strong> {selectedCategory.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>UUID:</strong> {selectedCategory.uuid}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {selectedCategory.category_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Products Available:</strong> {selectedCategory.products_available}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created:</strong> {formatDate(selectedCategory.createdat)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Updated:</strong> {formatDate(selectedCategory.updatedat)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this category? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
          <Button
            onClick={deleteCategory}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryManager;