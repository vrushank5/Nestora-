import { apiRequest } from './api.js'

export const propertyService = {
  // GET /api/properties  (public — no token required)
  getAllProperties: async () => {
    const response = await apiRequest('/properties', { token: null })
    return response.data || []
  },

  // GET /api/properties/owner/my
  getOwnerProperties: async () => {
    const response = await apiRequest('/properties/owner/my')
    return response.data || []
  },


  // GET /api/properties/:id
  getPropertyById: async (id) => {
    const response = await apiRequest(`/properties/${id}`)
    return response.data
  },

  // POST /api/properties
  // Accepts either a JSON object or FormData
  createProperty: async (propertyData) => {
    const isFormData = propertyData instanceof FormData
    const response = await apiRequest('/properties', {
      method: 'POST',
      body: isFormData ? propertyData : JSON.stringify(propertyData),
    })
    return response.data
  },

  // PUT /api/properties/:id
  // Accepts either a JSON object or FormData
  updateProperty: async (id, propertyData) => {
    const isFormData = propertyData instanceof FormData
    const response = await apiRequest(`/properties/${id}`, {
      method: 'PUT',
      body: isFormData ? propertyData : JSON.stringify(propertyData),
    })
    return response.data
  },

  // DELETE /api/properties/:id
  deleteProperty: async (id) => {
    const response = await apiRequest(`/properties/${id}`, {
      method: 'DELETE',
    })
    return response
  },
}
