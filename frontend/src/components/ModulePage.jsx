import { Package } from 'lucide-react';

/**
 * Generic module overview placeholder.
 * Used for modules that have not yet been fully implemented.
 */
export default function ModulePage({ title, description, fields = [], icon: Icon = Package, color = '#6366f1' }) {
  return (
    <div className="animate-fade">
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-md)',
            background: `${color}18`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-primary">+ New Entry</button>
          <button className="btn btn-secondary">View All</button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Module Fields</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Field Name</th><th>Type</th><th>Description</th></tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{f.name}</td>
                    <td><span className="badge badge-active">{f.type}</span></td>
                    <td>{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Icon size={48} style={{ color: 'var(--text-muted)' }} />
            <h3>No Records Yet</h3>
            <p>Click "New Entry" to create the first {title.toLowerCase()} record.</p>
          </div>
        </div>
      )}
    </div>
  );
}
