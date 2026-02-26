import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  DeleteSweep as BulkDeleteIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward,
  ArrowDownward,
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
  products_available?: number | "";
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
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterBy, setFilterBy] = useState<'all' | 'hasProducts' | 'noProducts'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDelete, setShowBulkDelete] = useState<boolean>(false);
  
  // View mode
  
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
    products_available: "",
  });
  
  const [editFormData, setEditFormData] = useState<{
    id: number;
    category_name?: string;
    products_available?: number | "";
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
      setError(err.message || 'Kategoriyalarni yuklashda xatolik');
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
      setError(err.message || 'Kategoriyani yuklashda xatolik');
      return null;
    }
  };

  // Create category
  const createCategory = async () => {
    if (!formData.category_name.trim()) {
      setError('Kategoriya nomi kiritilishi shart');
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
        throw new Error(data.error || 'Kategoriya yaratishda xatolik');
      }
      
      setSuccess('Kategoriya muvaffaqiyatli yaratildi!');
      setOpenCreateModal(false);
      setFormData({ category_name: '', products_available: "" });
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Kategoriya yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!editFormData.id) {
      setError('Kategoriya ID kiritilishi shart');
      return;
    }

    const normalizedEditForm = {
      ...editFormData,
      products_available:
        editFormData.products_available === "" || editFormData.products_available == null
          ? 0
          : Number(editFormData.products_available),
    };

    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.categories.updateCategory}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`,
        },
        body: JSON.stringify(normalizedEditForm),
      });
      
      const data: ApiResponse<Category> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kategoriyani yangilashda xatolik');
      }
      
      setSuccess('Kategoriya muvaffaqiyatli yangilandi!');
      setOpenEditModal(false);
      setEditFormData({ id: 0 });
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Kategoriyani yangilashda xatolik');
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
        throw new Error(data.error || 'Kategoriyani o\'chirishda xatolik');
      }
      
      setSuccess('Kategoriya muvaffaqiyatli o\'chirildi!');
      setOpenDeleteModal(false);
      setDeleteId(null);
      fetchCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Kategoriyani o\'chirishda xatolik');
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

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((cat) =>
        cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply product filter
    if (filterBy === 'hasProducts') {
      filtered = filtered.filter((cat) => cat.products_available > 0);
    } else if (filterBy === 'noProducts') {
      filtered = filtered.filter((cat) => cat.products_available === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareA: any, compareB: any;

      switch (sortBy) {
        case 'name':
          compareA = a.category_name.toLowerCase();
          compareB = b.category_name.toLowerCase();
          break;
        case 'products':
          compareA = a.products_available;
          compareB = b.products_available;
          break;
        case 'date':
          compareA = new Date(a.createdat).getTime();
          compareB = new Date(b.createdat).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return filtered;
  }, [categories, searchQuery, filterBy, sortBy, sortOrder]);

  // Statistics
  const statistics = useMemo(() => {
    const total = categories.length;
    const withProducts = categories.filter((cat) => cat.products_available > 0).length;
    const totalProducts = categories.reduce((sum, cat) => sum + cat.products_available, 0);
    const avgProducts = total > 0 ? (totalProducts / total).toFixed(1) : 0;

    return { total, withProducts, totalProducts, avgProducts };
  }, [categories]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCategories.map((cat) => cat.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const deletePromises = selectedIds.map((id) =>
        fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.categories.deleteCategory}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authData.accessToken}`,
          },
          body: JSON.stringify({ id }),
        })
      );

      await Promise.all(deletePromises);
      setSuccess(`${selectedIds.length} ta kategoriya muvaffaqiyatli o'chirildi!`);
      setSelectedIds([]);
      setShowBulkDelete(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Kategoriyalarni o\'chirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nomi', 'Mavjud Mahsulotlar', 'Yaratilgan', 'Yangilangan'];
    const csvData = filteredCategories.map((cat) => [
      cat.id,
      cat.category_name,
      cat.products_available,
      formatDate(cat.createdat),
      formatDate(cat.updatedat),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setSuccess('Kategoriyalar muvaffaqiyatli eksport qilindi!');
  };

  // Toggle sort order
  const toggleSort = (field: 'name' | 'products' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Statistics Table */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon />
                    Jami Kategoriyalar
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    Mahsulotli
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    Jami Mahsulotlar
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    O'rtacha Mahsulot/Kat
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Typography variant="h4" color="primary">{statistics.total}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h4" color="success.main">{statistics.withProducts}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h4" color="info.main">{statistics.totalProducts}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h4" color="warning.main">{statistics.avgProducts}</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Kategoriyalar Boshqaruvi
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Yangilash">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchCategories}
              >
                Yangilash
              </Button>
            </Tooltip>
            <Tooltip title="CSV ga eksport qilish">
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportCSV}
                disabled={filteredCategories.length === 0}
              >
                Eksport
              </Button>
            </Tooltip>
            {selectedIds.length > 0 && (
              <Tooltip title="Tanlanganlarni o'chirish">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<BulkDeleteIcon />}
                  onClick={() => setShowBulkDelete(true)}
                >
                  O'chirish ({selectedIds.length})
                </Button>
              </Tooltip>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
            >
              Kategoriya Qo'shish
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Kategoriyalarni qidirish..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filtrlash</InputLabel>
            <Select
              value={filterBy}
              label="Filtrlash"
              onChange={(e) => setFilterBy(e.target.value as any)}
            >
              <MenuItem value="all">Barcha Kategoriyalar</MenuItem>
              <MenuItem value="hasProducts">Mahsulotli</MenuItem>
              <MenuItem value="noProducts">Mahsulot yo'q</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Saralash</InputLabel>
            <Select
              value={sortBy}
              label="Saralash"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="name">Nom</MenuItem>
              <MenuItem value="products">Mahsulotlar Soni</MenuItem>
              <MenuItem value="date">Yaratilgan Sana</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            startIcon={sortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          >
            {sortOrder === 'asc' ? 'O\'sish tartibida' : 'Kamayish tartibida'}
          </Button>
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.length === filteredCategories.length && filteredCategories.length > 0}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filteredCategories.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSort('name')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Kategoriya Nomi
                      {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSort('products')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Mavjud Mahsulotlar
                      {sortBy === 'products' && (sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSort('date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Yaratilgan
                      {sortBy === 'date' && (sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell>Yangilangan</TableCell>
                  <TableCell>Amallar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow 
                    key={category.id}
                    selected={selectedIds.includes(category.id)}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(category.id)}
                        onChange={(e) => handleSelectOne(category.id, e.target.checked)}
                      />
                    </TableCell>
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
                        title="Ko'rish"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(category)}
                        title="Tahrirlash"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(category.id)}
                        title="O'chirish"
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

        {filteredCategories.length === 0 && !loading && (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 3 }}>
            {searchQuery || filterBy !== 'all' 
              ? 'Qidiruv/filtr mezonlariga mos kategoriya topilmadi.' 
              : 'Kategoriya topilmadi. Birinchi kategoriyangizni yarating!'}
          </Typography>
        )}

        {filteredCategories.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {categories.length} tadan {filteredCategories.length} ta ko'rsatilmoqda
            </Typography>
            {selectedIds.length > 0 && (
              <Typography variant="body2" color="primary">
                {selectedIds.length} ta tanlangan
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Create Category Modal */}
      <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yangi Kategoriya Yaratish</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kategoriya Nomi"
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
            label="Mavjud Mahsulotlar (Ixtiyoriy)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.products_available ?? ""}
            onChange={(e) => setFormData({
              ...formData,
              products_available: e.target.value === "" ? "" : parseInt(e.target.value),
            })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateModal(false)}>Bekor qilish</Button>
          <Button
            onClick={createCategory}
            variant="contained"
            disabled={loading || !formData.category_name.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kategoriyani Tahrirlash</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Mavjud Mahsulotlar"
            type="number"
            fullWidth
            variant="outlined"
            value={editFormData.products_available ?? ""}
            onChange={(e) => setEditFormData({
              ...editFormData,
              products_available: e.target.value === "" ? "" : parseInt(e.target.value),
            })}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Eslatma: Kategoriya nomini tahrirlash mumkin emas
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Bekor qilish</Button>
          <Button
            onClick={updateCategory}
            variant="contained"
            disabled={loading || editFormData.products_available === undefined}
          >
            {loading ? <CircularProgress size={24} /> : 'Yangilash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Category Modal */}
      <Dialog open={openViewModal} onClose={() => setOpenViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kategoriya Tafsilotlari</DialogTitle>
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
                <strong>Nomi:</strong> {selectedCategory.category_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Mavjud Mahsulotlar:</strong> {selectedCategory.products_available}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Yaratilgan:</strong> {formatDate(selectedCategory.createdat)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Oxirgi Yangilanish:</strong> {formatDate(selectedCategory.updatedat)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewModal(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogTitle>O'chirishni Tasdiqlash</DialogTitle>
        <DialogContent>
          <Typography>
            Ushbu kategoriyani o'chirishga ishonchingiz komilmi? Bu amalni bekor qilish mumkin emas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)}>Bekor qilish</Button>
          <Button
            onClick={deleteCategory}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'O\'chirish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={showBulkDelete} onClose={() => setShowBulkDelete(false)}>
        <DialogTitle>Ko'plab O'chirishni Tasdiqlash</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedIds.length} ta tanlangan kategoriyalarni o'chirishga ishonchingiz komilmi? 
            Bu amalni bekor qilish mumkin emas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkDelete(false)}>Bekor qilish</Button>
          <Button
            onClick={handleBulkDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : `${selectedIds.length} ta Kategoriyani O'chirish`}
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
