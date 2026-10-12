import React from 'react'

/**
 * NestoraLogo - Official application logo component
 * 
 * Supports responsive, context-tailored variants that fit every page:
 * - 'sidebar': Sleek horizontal lockup for dark green sidebars (emblem + brand typography)
 * - 'header': Compact navbar lockup
 * - 'auth-icon': Refined, elegant brand icon for authentication forms
 * - 'auth-visual': Standalone brand lockup for visual aside panels
 * - 'loader': High-resolution centerpiece for application splash screen
 * - 'footer': Elegant brand lockup for footer
 */
export default function NestoraLogo({
  variant = 'default',
  className = '',
  width,
  style = {},
  alt = 'Nestora - PG & Co-Living',
  subtitle,
  showText = false,
  ...props
}) {
  const logoSrc = '/nestora-logo.png'

  if (variant === 'sidebar') {
    return (
      <div className={`nestora-logo-sidebar ${className}`} style={style} {...props}>
        <img
          src={logoSrc}
          alt={alt}
          className="nestora-sidebar-icon"
          loading="eager"
        />
        <div className="nestora-sidebar-text">
          <strong>NESTORA</strong>
          <small>{subtitle || 'PG & CO-LIVING'}</small>
        </div>
      </div>
    )
  }

  if (variant === 'header' || variant === 'footer') {
    return (
      <div className={`nestora-logo-header ${className}`} style={style} {...props}>
        <img
          src={logoSrc}
          alt={alt}
          className="nestora-header-img"
          loading="eager"
          style={{
            width: width || '40px',
            height: width || '40px',
          }}
        />
        {(showText || subtitle) && (
          <span className="nestora-header-text">
            <strong>NESTORA</strong>
            <small>{subtitle || 'PG & CO-LIVING'}</small>
          </span>
        )}
      </div>
    )
  }

  if (variant === 'auth-icon') {
    return (
      <div className={`nestora-auth-icon-wrap ${className}`} style={style} {...props}>
        <img
          src={logoSrc}
          alt={alt}
          className="nestora-auth-icon-img"
          loading="eager"
          style={{
            width: width || '52px',
            height: width || '52px',
          }}
        />
      </div>
    )
  }

  if (variant === 'loader') {
    return (
      <div
        className={`nestora-logo-loader-pod ${className}`}
        style={{
          width: width || '160px',
          ...style,
        }}
        {...props}
      >
        <img
          src={logoSrc}
          alt={alt}
          className="nestora-logo-img"
          loading="eager"
        />
      </div>
    )
  }

  // Raw fallback
  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`nestora-logo-img ${className}`}
      style={{
        width: width || '120px',
        height: 'auto',
        aspectRatio: 'auto',
        objectFit: 'contain',
        ...style,
      }}
      loading="eager"
      {...props}
    />
  )
}
