import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  CircleDollarSign,
  Headphones,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UsersRound,
  Wifi,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import { categories, homeImages, testimonials } from '../data/homeData.js'
import { useAuth } from '../context/useAuth.js'
import heroImage from '../assets/hero.png'
import { apiRequest } from '../services/api.js'

const cities = ['Ahmedabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad']
const propertyFallbackImages = [homeImages.residenceA, homeImages.residenceB, homeImages.residenceC, homeImages.residenceD]

const benefits = [
  [ShieldCheck, 'Verified before discovery', 'Every visible home is presented as a screened listing with essential stay details up front.'],
  [CircleDollarSign, 'Clear monthly comparison', 'Rent, room type, inclusions, and availability cues are easy to compare before you commit.'],
  [Headphones, 'Support after login', 'Residents can keep saved homes, booking records, and host conversations in one workspace.'],
  [BedDouble, 'Move-in practical', 'Furnished rooms, core amenities, and neighborhood context are designed for fast decisions.'],
]

function Reveal({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [budget, setBudget] = useState('Any budget')
  const [roomType, setRoomType] = useState('Any room')
  const [residences, setResidences] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const PropertySkeleton = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
      gap: '24px',
      width: '100%',
    }}>
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          style={{
            height: '420px',
            borderRadius: '20px',
            background: 'linear-gradient(90deg, #ece7df 25%, #f7f3ee 50%, #ece7df 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            boxShadow: '0 10px 24px rgba(0,0,0,0.04)',
          }}
        />
      ))}
    </div>
  )

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true)
      try {
        const data = await apiRequest('/properties', { token: null })
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
        setResidences(items.map((property, index) => ({
          id: property.propertyId ?? property.id,
          slug: property.slug ?? property.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: property.name,
          city: property.city,
          area: property.area,
          location: property.location,
          rating: property.rating ?? '4.5',
          reviews: property.reviews ?? 'New',
          price: property.price ? String(property.price).replace(/₹|Rs\.?/g, '$') : `$${Number(property.priceValue || 0).toLocaleString('en-US')}/month`,
          priceValue: Number(property.priceValue ?? 0),
          amenities: Array.isArray(property.amenities) ? property.amenities : ['Wi-Fi'],
          roomTypes: Array.isArray(property.roomTypes) ? property.roomTypes : ['Single'],
          gender: property.gender ?? 'Unisex',
          occupancy: property.occupancy ?? 'Available',
          description: property.description ?? 'Managed stay with essential amenities.',
          image: property.image || propertyFallbackImages[index % propertyFallbackImages.length],
        })))
      } catch (error) {
        console.warn('Property load failed:', error.message)
        setResidences([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProperties()
  }, [])

  const goToExplorer = (extraState = {}) => {
    if (isAuthenticated) {
      navigate('/resident', { state: { tab: 'explore', filterLocation: searchQuery, filterBudget: budget, filterRoom: roomType, ...extraState } })
      return
    }

    navigate('/login')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    goToExplorer()
  }

  const handleResidenceDetails = (residence) => {
    if (!residence) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (Number(user?.roleId) === 2) {
      navigate('/owner/dashboard')
      return
    }

    if (residence.id) {
      navigate(`/resident/property/${residence.id}`)
      return
    }

    goToExplorer({ filterLocation: residence.area })
  }

  return (
    <main className="app-page">
      <Navbar />

      <section className="home-hero" style={{ '--hero-image': `url(${heroImage})` }}>
        <div className="section-shell hero-inner">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="section-kicker"><Sparkles size={14} /> Managed PG and co-living</span>
            <h1>NESTORA</h1>
            <p className="hero-lede">
              Find a comfortable, trustworthy place to live with verified listings,
              clear pricing, and a resident workspace that keeps the whole stay organized.
            </p>

            <form className="home-search" onSubmit={handleSearchSubmit}>
              <label className="search-main">
                <span>Where</span>
                <div>
                  <Search size={18} />
                  <input
                    placeholder="City, area, or college"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>Budget</span>
                <select aria-label="Monthly budget" value={budget} onChange={(event) => setBudget(event.target.value)}>
                  <option value="Any budget">Any budget</option>
                  <option value="Under Rs.8,000">Under Rs.8,000</option>
                  <option value="Rs.8,000 - Rs.12,000">Rs.8,000 - Rs.12,000</option>
                  <option value="Rs.12,000+">Rs.12,000+</option>
                </select>
              </label>
              <label>
                <span>Room</span>
                <select aria-label="Room type" value={roomType} onChange={(event) => setRoomType(event.target.value)}>
                  <option value="Any room">Any room</option>
                  <option value="Single">Single</option>
                  <option value="Twin Sharing">Twin Sharing</option>
                  <option value="Studio">Studio</option>
                </select>
              </label>
              <button className="primary-button" type="submit">
                Search <ArrowRight size={17} />
              </button>
            </form>

            <div className="hero-proof">
              <span><BadgeCheck size={18} /> Verified listings</span>
              <span><Star size={18} fill="currentColor" /> Resident rated</span>
              <span><Wifi size={18} /> Amenity clarity</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-availability"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span>Live shortlist</span>
            <strong>{residences.length} curated homes</strong>
            <p>Ahmedabad inventory shown from the current frontend data source.</p>
          </motion.div>
        </div>
      </section>

      <section className="location-strip section-shell" id="locations">
        {cities.map((city, index) => (
          <button key={city} type="button" onClick={() => goToExplorer({ filterLocation: city })}>
            <MapPin size={16} />
            <span>{city}</span>
            <small>{index + 6} areas</small>
          </button>
        ))}
      </section>

      <section className="content-section section-shell">
        <Reveal className="split-heading">
          <div>
            <span className="section-kicker">Why Nestora</span>
            <h2>Search with the confidence of a managed housing product.</h2>
          </div>
          <p>
            Nestora is designed around the real decisions residents make: trust, monthly cost,
            room layout, everyday services, and how quickly they can act.
          </p>
        </Reveal>

        <div className="feature-grid">
          {benefits.map(([Icon, title, text]) => (
            <Reveal className="feature-card" key={title}>
              <span className="feature-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="content-section section-shell" id="residences">
        <Reveal className="section-heading">
          <span className="section-kicker">Featured residences</span>
          <h2>Homes that are easy to compare, not just easy to browse.</h2>
          <p>Each residence card highlights the essentials: price, location, trust signals, and available living formats.</p>
        </Reveal>
        {isLoading ? (
          <PropertySkeleton />
        ) : residences.length === 0 ? (
          <div className="empty-state-box">
            <h3>No dynamic listings yet</h3>
            <p>There are no property records in the database yet. Add a property from the owner dashboard or save one from the backend to see it here.</p>
          </div>
        ) : (
          <div className="property-grid">
            {residences.map((residence) => (
              <Reveal key={residence.id}>
                <PropertyCard
                  residence={residence}
                  onView={() => handleResidenceDetails(residence)}
                  onSave={() => goToExplorer({ filterLocation: residence.area })}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="content-section section-shell" id="experience">
        <Reveal className="split-heading">
          <div>
            <span className="section-kicker">Living modes</span>
            <h2>A product experience for different city rhythms.</h2>
          </div>
          <p>Students, professionals, and community-first residents need different signals. Nestora keeps the browsing experience direct.</p>
        </Reveal>
        <div className="category-grid">
          {categories.map((item) => (
            <Reveal className="category-card" key={item.title}>
              <img src={item.image} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <button type="button" onClick={() => goToExplorer()}>
                  Explore <ArrowRight size={16} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="content-section section-shell" id="how-it-works">
        <Reveal className="section-heading">
          <span className="section-kicker"><SlidersHorizontal size={14} /> How it works</span>
          <h2>From shortlist to stay dashboard in three steps.</h2>
        </Reveal>
        <div className="steps-row">
          {[
            ['01', 'Search the fit', 'Filter by area, budget, room type, and amenities using the available listing data.'],
            ['02', 'Inspect the details', 'Review photos, inclusions, rent, location, and occupancy notes before taking action.'],
            ['03', 'Continue securely', 'Log in or register to save homes, manage booking records, and access your role dashboard.'],
          ].map(([number, title, text]) => (
            <Reveal className="step-card" key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="content-section section-shell">
        <div className="story-band">
          <img src={homeImages.commonArea} alt="Shared co-living lounge" />
          <div>
            <span className="section-kicker"><UsersRound size={14} /> Trust signals</span>
            <h2>Clear housing decisions, fewer unknowns.</h2>
            <p>
              The interface favors exact information over decoration: verified labels, direct prices,
              useful amenities, and dashboards that show what has actually happened in the account.
            </p>
            <div className="mini-metrics">
              <strong>4.9 avg rating</strong>
              <strong>0 hidden fees</strong>
              <strong>24/7 support intent</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section section-shell">
        <Reveal className="section-heading">
          <span className="section-kicker">Resident voices</span>
          <h2>Calm, clear, and built for moving decisions.</h2>
        </Reveal>
        <div className="testimonial-grid">
          {testimonials.map(([name, area, text]) => (
            <Reveal className="testimonial-card" key={name}>
              <div className="stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star size={16} fill="currentColor" key={index} />
                ))}
              </div>
              <p>{text}</p>
              <div>
                <strong>{name}</strong>
                <span>{area}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="final-cta section-shell">
        <div>
          <span className="section-kicker"><Building2 size={14} /> Start with the real app</span>
          <h2>Ready to find a verified place to live?</h2>
          <p>Create an account or sign in to continue into your role-based Nestora workspace.</p>
        </div>
        <div className="cta-actions">
          <button className="primary-button" type="button" onClick={() => navigate(isAuthenticated ? '/resident' : '/register')}>
            {isAuthenticated ? 'Open dashboard' : 'Create account'} <ArrowRight size={17} />
          </button>
          {!isAuthenticated ? (
            <button className="ghost-button" type="button" onClick={() => navigate('/login')}>Login</button>
          ) : null}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default Home
