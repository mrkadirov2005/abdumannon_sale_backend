import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { exampleBrand,  type Brand } from '../../../types/types';
import { DEFAULT_ENDPOINT, ENDPOINTS } from '../../config/endpoints';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../redux/store';
import {  getAuthFromStore, getBrandsFromStore } from '../../redux/selectors';
import { getBrandsThunk } from '../../redux/slices/brands/thunk/getAllBrands';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BrandCRUD = () => {
  const brands = useSelector(getBrandsFromStore);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand>(exampleBrand);
  const [loading, setLoading] = useState(false);
  currentBrand
  const [formData, setFormData] = useState({
    uuid: "",
    brand_name: '',
    provider_name: '',
    provider_last_name: '',
    provider_phone: '',
    provider_card_number: '',
    provider_email: ''
  });

  const dispatch = useDispatch<AppDispatch>();
  const authData = useSelector(getAuthFromStore);
  // const token = useSelector(accessTokenFromStore);

  // API base URL

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      await dispatch(getBrandsThunk({ token: authData.accessToken }));
    } catch (err) {
      toast.error('Failed to fetch brands', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      uuid: "",
      brand_name: '',
      provider_name: '',
      provider_last_name: '',
      provider_phone: '',
      provider_card_number: '',
      provider_email: ''
    });
    setCurrentBrand(exampleBrand);
    setIsEditing(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setCurrentBrand(brand);
    setFormData({
      uuid: brand.uuid as string,
      brand_name: brand.brand_name,
      provider_name: brand.provider_name,
      provider_last_name: brand.provider_last_name,
      provider_phone: brand.provider_phone,
      provider_card_number: brand.provider_card_number,
      provider_email: brand.provider_email
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.brands.createBrand}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Brand created successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        await fetchBrands();
        setIsModalOpen(false);
        resetForm();
        dispatch(getBrandsThunk({ token: authData.accessToken }));
      } else {
        toast.error(result.error || result.message || 'Failed to create brand', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      toast.error('Network error. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.brands.updateBrand}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`
        },
        body: JSON.stringify({
          ...formData
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Brand updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        await fetchBrands();
        setIsModalOpen(false);
        resetForm();
      } else {
        toast.error(result.error || result.message || 'Failed to update brand', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      toast.error('Network error. Please try again.', {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading('Deleting brand...', {
      position: "top-right"
    });

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.brands.deleteBrand}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authData.accessToken}`
        },
        body: JSON.stringify({ uuid })
      });

      if (response.ok) {
        toast.update(loadingToast, {
          render: 'Brand deleted successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        await fetchBrands();
      } else {
        const result = await response.json();
        toast.update(loadingToast, {
          render: result.error || 'Failed to delete brand',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      toast.update(loadingToast, {
        render: 'Network error. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Brand Management</h1>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Brand
          </button>
        </div>

        {loading && !isModalOpen ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Number</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No brands found. Create your first brand!
                    </td>
                  </tr>
                ) : (
                  brands.map((brand: Brand) => (
                    <tr key={brand.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{brand.brand_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {brand.provider_name} {brand.provider_last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{brand.provider_phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{brand.provider_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{brand.provider_card_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.uuid as string)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditing ? 'Edit Brand' : 'Create New Brand'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      name="brand_name"
                      value={formData.brand_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider First Name *
                      </label>
                      <input
                        type="text"
                        name="provider_name"
                        value={formData.provider_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider Last Name *
                      </label>
                      <input
                        type="text"
                        name="provider_last_name"
                        value={formData.provider_last_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Phone *
                    </label>
                    <input
                      type="tel"
                      name="provider_phone"
                      value={formData.provider_phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Email *
                    </label>
                    <input
                      type="email"
                      name="provider_email"
                      value={formData.provider_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Card Number
                    </label>
                    <input
                      type="text"
                      name="provider_card_number"
                      value={formData.provider_card_number}
                      onChange={handleInputChange}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e: any) => isEditing ? handleUpdate(e) : handleCreate(e)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update Brand' : 'Create Brand'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandCRUD;