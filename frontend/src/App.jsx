import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLoader from './components/AppLoader.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
// Admin Pages
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUsers from './pages/admin/Users.jsx'
import AdminUserDetail from './pages/admin/UserDetail.jsx'
import AdminResidents from './pages/admin/Residents.jsx'
import AdminOwners from './pages/admin/Owners.jsx'
import AdminOwnerDetail from './pages/admin/OwnerDetail.jsx'
import AdminProperties from './pages/admin/Properties.jsx'
import AdminPropertyDetail from './pages/admin/PropertyDetail.jsx'
import AdminPropertyVerification from './pages/admin/PropertyVerification.jsx'
import AdminRooms from './pages/admin/Rooms.jsx'
import AdminBookings from './pages/admin/Bookings.jsx'
import AdminBookingDetail from './pages/admin/BookingDetail.jsx'
import AdminPayments from './pages/admin/Payments.jsx'
import AdminVisits from './pages/admin/Visits.jsx'
import AdminComplaints from './pages/admin/Complaints.jsx'
import AdminReviews from './pages/admin/Reviews.jsx'
import AdminNotifications from './pages/admin/Notifications.jsx'
import AdminReports from './pages/admin/Reports.jsx'
import AdminAnalytics from './pages/admin/Analytics.jsx'
import AdminBlogs from './pages/admin/Blogs.jsx'
import AdminBlogEditor from './pages/admin/BlogEditor.jsx'
import AdminFaqs from './pages/admin/Faqs.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import AdminProfile from './pages/admin/Profile.jsx'

// Resident Pages
import ResidentLayout from './pages/resident/ResidentLayout.jsx'
import ResidentDashboard from './pages/resident/Dashboard.jsx'
import ResidentExplore from './pages/resident/Explore.jsx'
import ResidentPropertyDetail from './pages/resident/PropertyDetail.jsx'
import ResidentCompare from './pages/resident/Compare.jsx'
import ResidentSaved from './pages/resident/Saved.jsx'
import ResidentBookings from './pages/resident/Bookings.jsx'
import ResidentBookingDetail from './pages/resident/BookingDetail.jsx'
import ResidentPayments from './pages/resident/Payments.jsx'
import ResidentVisits from './pages/resident/Visits.jsx'
import ResidentComplaints from './pages/resident/Complaints.jsx'
import ResidentReviews from './pages/resident/Reviews.jsx'
import ResidentMessages from './pages/resident/Messages.jsx'
import ResidentNotifications from './pages/resident/Notifications.jsx'
import ResidentProfile from './pages/resident/Profile.jsx'
import ResidentSettings from './pages/resident/Settings.jsx'
import ResidentHelp from './pages/resident/Help.jsx'

// Owner Pages
import OwnerLayout from './pages/owner/OwnerLayout.jsx'
import OwnerDashboard from './pages/owner/Dashboard.jsx'
import OwnerProperties from './pages/owner/properties/Properties.jsx'
import OwnerPropertyAdd from './pages/owner/properties/PropertyAdd.jsx'
import OwnerPropertyEdit from './pages/owner/properties/PropertyEdit.jsx'
import OwnerPropertyDetail from './pages/owner/properties/PropertyDetail.jsx'
import OwnerRooms from './pages/owner/Rooms.jsx'
import OwnerResidents from './pages/owner/Residents.jsx'
import OwnerBookings from './pages/owner/Bookings.jsx'
import OwnerPayments from './pages/owner/Payments.jsx'
import OwnerVisits from './pages/owner/Visits.jsx'
import OwnerComplaints from './pages/owner/Complaints.jsx'
import OwnerReviews from './pages/owner/Reviews.jsx'
import OwnerFood from './pages/owner/Food.jsx'
import OwnerAmenities from './pages/owner/Amenities.jsx'
import OwnerAnalytics from './pages/owner/Analytics.jsx'
import OwnerNotifications from './pages/owner/Notifications.jsx'
import OwnerProfile from './pages/owner/Profile.jsx'
import OwnerSettings from './pages/owner/Settings.jsx'

function App() {
  const location = useLocation()
  const shouldShowLoader =
    location.pathname === '/' && window.sessionStorage.getItem('nestora-loader-seen') !== 'true'
  const [isLoading, setIsLoading] = useState(shouldShowLoader)

  useEffect(() => {
    if (!isLoading) return undefined
    const timer = window.setTimeout(() => setIsLoading(false), 1700)
    window.sessionStorage.setItem('nestora-loader-seen', 'true')
    return () => window.clearTimeout(timer)
  }, [isLoading])

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <AppLoader key="app-loader" />
      ) : (
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={{ opacity: 0, filter: 'blur(8px)', y: -8 }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Resident Route (Role Id 3) */}
            <Route
              path="/resident/*"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <ResidentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ResidentDashboard />} />
              <Route path="explore" element={<ResidentExplore />} />
              <Route path="property/:id" element={<ResidentPropertyDetail />} />
              <Route path="compare" element={<ResidentCompare />} />
              <Route path="saved" element={<ResidentSaved />} />
              <Route path="bookings" element={<ResidentBookings />} />
              <Route path="bookings/:id" element={<ResidentBookingDetail />} />
              <Route path="payments" element={<ResidentPayments />} />
              <Route path="payments/:id" element={<ResidentPayments />} />
              <Route path="visits" element={<ResidentVisits />} />
              <Route path="complaints" element={<ResidentComplaints />} />
              <Route path="reviews" element={<ResidentReviews />} />
              <Route path="messages" element={<ResidentMessages />} />
              <Route path="notifications" element={<ResidentNotifications />} />
              <Route path="profile" element={<ResidentProfile />} />
              <Route path="settings" element={<ResidentSettings />} />
              <Route path="help" element={<ResidentHelp />} />
            </Route>

            {/* Owner Route (Role Id 2) */}
            <Route
              path="/owner/*"
              element={
                <ProtectedRoute allowedRoles={[2]}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="properties" element={<OwnerProperties />} />
              <Route path="properties/add" element={<OwnerPropertyAdd />} />
              <Route path="properties/:id" element={<OwnerPropertyDetail />} />
              <Route path="properties/:id/edit" element={<OwnerPropertyEdit />} />
              <Route path="rooms" element={<OwnerRooms />} />
              <Route path="residents" element={<OwnerResidents />} />
              <Route path="bookings" element={<OwnerBookings />} />
              <Route path="payments" element={<OwnerPayments />} />
              <Route path="visits" element={<OwnerVisits />} />
              <Route path="complaints" element={<OwnerComplaints />} />
              <Route path="reviews" element={<OwnerReviews />} />
              <Route path="food" element={<OwnerFood />} />
              <Route path="amenities" element={<OwnerAmenities />} />
              <Route path="analytics" element={<OwnerAnalytics />} />
              <Route path="notifications" element={<OwnerNotifications />} />
              <Route path="profile" element={<OwnerProfile />} />
              <Route path="settings" element={<OwnerSettings />} />
            </Route>

            {/* Admin Route (Role Id 1) */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
              <Route path="residents" element={<AdminResidents />} />
              <Route path="owners" element={<AdminOwners />} />
              <Route path="owners/:id" element={<AdminOwnerDetail />} />
              <Route path="properties" element={<AdminProperties />} />
              <Route path="properties/:id" element={<AdminPropertyDetail />} />
              <Route path="properties/pending" element={<AdminPropertyVerification />} />
              <Route path="properties/verification" element={<AdminPropertyVerification />} />
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="bookings/:id" element={<AdminBookingDetail />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="visits" element={<AdminVisits />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="blogs/create" element={<AdminBlogEditor />} />
              <Route path="blogs/:id/edit" element={<AdminBlogEditor />} />
              <Route path="faqs" element={<AdminFaqs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
