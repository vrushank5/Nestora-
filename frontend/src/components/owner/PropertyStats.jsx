import { motion } from 'framer-motion'
import { Building2, CheckCircle2, XCircle, DoorOpen, Star } from 'lucide-react'

export default function PropertyStats({ properties = [] }) {
  const total = properties.length
  const active = properties.filter((p) => p.isActive !== false).length
  const inactive = properties.filter((p) => p.isActive === false).length

  // Available: Properties with occupancy 'Available' or 'New listing' or active
  const available = properties.filter(
    (p) =>
      p.isActive !== false &&
      (p.occupancy?.toLowerCase().includes('available') ||
        p.occupancy?.toLowerCase().includes('new listing') ||
        p.occupancy?.toLowerCase().includes('few'))
  ).length

  // Average rating calculation
  const ratedProps = properties.filter((p) => Number(p.rating || 0) > 0)
  const avgRating =
    ratedProps.length > 0
      ? (
          ratedProps.reduce((sum, p) => sum + Number(p.rating || 0), 0) /
          ratedProps.length
        ).toFixed(1)
      : '0.0'

  return (
    <div className="owner-stats-grid">
      <StatCard
        title="Total Properties"
        value={total}
        icon={Building2}
        sub="Backend listings"
      />
      <StatCard
        title="Active Properties"
        value={active}
        icon={CheckCircle2}
        color="jade"
        sub={`${active} visible on site`}
      />
      <StatCard
        title="Inactive Properties"
        value={inactive}
        icon={XCircle}
        color="terracotta"
        alert={inactive > 0}
        sub={`${inactive} hidden / disabled`}
      />
      <StatCard
        title="Available Properties"
        value={available}
        icon={DoorOpen}
        color="steel"
        sub="Ready for booking"
      />
      <StatCard
        title="Average Rating"
        value={avgRating}
        icon={Star}
        color="gold"
        sub={`From ${ratedProps.length} rated properties`}
      />
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, sub, alert }) {
  return (
    <motion.div
      className={`owner-stat-card 3d-tilt-card ${alert ? 'alert-state' : ''}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className={`stat-icon ${color ? `icon-${color}` : ''}`}>
        <Icon size={22} />
      </div>
      <div className="stat-details">
        <span className="stat-title">{title}</span>
        <div className="stat-value-row">
          <h3>{value}</h3>
        </div>
        {sub && <span className="stat-sub-copy">{sub}</span>}
      </div>
    </motion.div>
  )
}
