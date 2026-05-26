import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, Truck, Palette, Layers, Factory, 
  CheckSquare, Scissors, Box, ClipboardList, Receipt, MapPin, 
  ArrowRight, Activity
} from 'lucide-react';

const flowPhases = [
  {
    phase: "1. Order & Procurement",
    color: "#0ea5e9", // light blue
    steps: [
      { id: 'buyer-order', label: 'Buyer Order', icon: ShoppingCart, path: '/buyer-order' },
      { id: 'yarn-po', label: 'Yarn Purchase Order', icon: Package, path: '/yarn/purchase-order' },
    ]
  },
  {
    phase: "2. Yarn Management",
    color: "#f59e0b", // amber
    steps: [
      { id: 'yarn-inward', label: 'Yarn Inward', icon: ArrowRight, path: '/yarn/inward' },
      { id: 'grey-delivery', label: 'Grey Delivery', icon: Truck, path: '/yarn/grey-delivery' },
      { id: 'dyed-received', label: 'Dyed Yarn Received', icon: Palette, path: '/dyed-yarn/received' },
      { id: 'dyed-delivery', label: 'Dyed Delivery', icon: Truck, path: '/dyed-yarn/delivery' },
    ]
  },
  {
    phase: "3. Warping & Weaving",
    color: "#8b5cf6", // purple
    steps: [
      { id: 'warp-receipt', label: 'Warp Beam Receipt', icon: Layers, path: '/warp/beam-receipt' },
      { id: 'warp-delivery', label: 'Warp Delivery', icon: Truck, path: '/warp/delivery' },
    ]
  },
  {
    phase: "4. Processing & Finishing",
    color: "#10b981", // emerald
    steps: [
      { id: 'cloth-inward', label: 'Cloth Vendor Inward', icon: Factory, path: '/cloth/inward' },
      { id: 'checking', label: 'ON Table Checking', icon: CheckSquare, path: '/cloth/checking' },
      { id: 'cloth-delivery', label: 'Cloth Delivery', icon: Truck, path: '/cloth/delivery' },
      { id: 'finished-fabric', label: 'Finished Fabric Inward', icon: Scissors, path: '/finished-fabric' },
    ]
  },
  {
    phase: "5. Logistics & Sales",
    color: "#f97316", // orange
    steps: [
      { id: 'packing', label: 'Packing / Bale Entry', icon: Box, path: '/packing' },
      { id: 'gra', label: 'Goods Release Advice', icon: ClipboardList, path: '/goods-release' },
      { id: 'sales', label: 'Sales Invoice', icon: Receipt, path: '/sales-invoice' },
      { id: 'despatch', label: 'Despatch Planning', icon: MapPin, path: '/despatch' },
    ]
  }
];

export default function Overview() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Factory Process Flow Overview</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>A complete visualization of the Dinesh Textile manufacturing pipeline. Click any step to open the module.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {flowPhases.map((phase, index) => (
          <div key={index} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${phase.color}` }}>
            <div style={{ padding: '16px 24px', background: `${phase.color}10`, borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: phase.color, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} />
                {phase.phase}
              </h3>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              {phase.steps.map((step, stepIdx) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    onClick={() => navigate(step.path)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                      width: 160,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = phase.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '50%', 
                      background: `${phase.color}15`, color: phase.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <step.icon size={24} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', color: 'var(--text-primary)' }}>
                      {step.label}
                    </span>
                  </div>

                  {/* Arrow to next step within the same phase */}
                  {stepIdx < phase.steps.length - 1 && (
                    <div style={{ margin: '0 12px', color: 'var(--border-light)' }}>
                      <ArrowRight size={24} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
