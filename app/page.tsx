// Default page for application.

'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="home-page-container">
      {/* HEADER SECTION */}
      <header className="home-header">
        <h1 className="home-title">
          Sunglasses Management Terminal
        </h1>
        <p className="home-subtitle">
          FEEL FREE TO MESS AROUND AND EXPLORE THE TABLES!
        </p>
      </header>
      
      {/* CORE SYSTEMS */}
      <section className="core-systems-grid">
        {[
          { label: 'Inventory Management', route: '/sunglasses', desc: 'Track items, update stock, and link Supabase cloud image paths.' },
          { label: 'Monitor Invoices', route: '/invoices', desc: 'Generate customer invoices and audit transactional logs.' },
          { label: 'Employee List', route: '/employees', desc: 'Manage store staff directory and monitor individual records.' }
        ].map((stat, i) => (
          <div key={i} className="system-card">
            <div>
              <h3 className="system-card-title">{stat.label}</h3>
              <p className="system-card-desc">{stat.desc}</p>
            </div>
            {stat.route !== '#' && (
              <Link href={stat.route} className="system-card-link">
                Open Table →
              </Link>
            )}
          </div>
        ))}
      </section>

      {/* ARCHITECTURE - TECH STACK */}
      <section className="border-t border-gray-200 py-8 mb-10 text-center">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">
          System Architecture
        </h3>
        
        {/* The responsive container grid wrapper */}
        <div className="tech-stack-container max-w-4xl mx-auto">
          {[
            { label: 'Frontend', name: 'Next.js Components' },
            { label: 'Style', name: 'Tailwind CSS' },
            { label: 'Backend', name: 'Next.js Server Actions' },
            { label: 'Database', name: 'Neon PostgreSQL' },
            { label: 'Object Mapper', name: 'Prisma ORM' },
            { label: 'Image Storage', name: 'Supabase Storage' },
            { label: 'Host', name: 'Vercel Cloud' }
          ].map((tech, idx) => (
            <div key={idx} className="tech-card">
              <span className="tech-label">{tech.label}</span>
              <span className="tech-name">{tech.name}</span>
            </div>
          ))}
        </div>
      </section>

      { /* FOOTER */}
      <footer className="home-footer">
        <p className="footer-author">Developed by Kevin Lin</p>
        <p className="footer-subtitle">&copy; 2026 Database Management Portfolio</p>
      </footer>
    </div>
  )
}