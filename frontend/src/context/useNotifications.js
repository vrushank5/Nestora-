import { useContext } from 'react'
import { NotificationContext } from './notificationContext.js'

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}
