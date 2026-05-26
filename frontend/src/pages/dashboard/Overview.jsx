import { useNavigate } from 'react-router-dom';
import {
  Users, Monitor, Layers, Factory, ClipboardCheck, Warehouse, Truck, Receipt, ArrowRight
} from 'lucide-react';

const workflowSteps = [
  {
    num: 1,
    title: "Customer & Party Management",
    color: "#1e3a8a", // Dark Blue
    icon: Users,
    path: "/party-master",
    bullets: ["Add Customer Details", "Manage Parties"]
  },
  {
    num: 2,
    title: "Design Entry",
    color: "#ea580c", // Orange
    icon: Monitor,
    path: "/design-entry",
    bullets: ["Create Design", "Design Details", "Design Approval", "Design Library"]
  },
  {
    num: 3,
    title: "Yarn & Material Procurement",
    color: "#16a34a", // Green
    icon: Layers,
    path: "/yarn/purchase-order",
    bullets: ["Purchase Yarn & Fabrics", "Inventory Control"]
  },
  {
    num: 4,
    title: "Job Work & Production",
    color: "#0284c7", // Light Blue
    icon: Factory,
    path: "/yarn/grey-delivery",
    bullets: ["Dyeing & Weaving", "Process Tracking"]
  },
  {
    num: 5,
    title: "Quality Control & Inspection",
    color: "#7c3aed", // Purple
    icon: ClipboardCheck,
    path: "/cloth/checking",
    bullets: ["Inspect Finished Goods", "Approve Material"]
  },
  {
    num: 6,
    title: "Inventory & Warehousing",
    color: "#0d9488", // Teal
    icon: Warehouse,
    path: "/packing",
    bullets: ["Stock Management", "Finished Goods Storage"]
  },
  {
    num: 7,
    title: "Logistics & Shipping",
    color: "#dc2626", // Red
    icon: Truck,
    path: "/despatch",
    bullets: ["Order Fulfillment", "Global Shipping"]
  },
  {
    num: 8,
    title: "Billing & Accounting",
    color: "#2563eb", // Blue
    icon: Receipt,
    path: "/sales-invoice",
    bullets: ["Generate Invoices", "Track Payments"]
  }
];

export default function Overview() {
  const navigate = useNavigate();

  const renderRow = (steps) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%' }}>
        {steps.map((step, idx) => (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Step Card */}
            <div
              onClick={() => navigate(step.path)}
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: `1.5px solid ${step.color}40`,
                borderRadius: '16px',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '280px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = step.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 10px 25px -5px ${step.color}25`;
                const iconBox = e.currentTarget.querySelector('.icon-box');
                if (iconBox) {
                  iconBox.style.transform = 'scale(1.08) rotate(3deg)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${step.color}40`;
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                const iconBox = e.currentTarget.querySelector('.icon-box');
                if (iconBox) {
                  iconBox.style.transform = 'none';
                }
              }}
            >
              {/* Step Number Badge */}
              <div style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                lineHeight: 1
              }}>
                {step.num}
              </div>

              {/* Title */}
              <h4 style={{
                margin: '12px 0 16px 0',
                fontSize: '15px',
                fontWeight: '700',
                color: step.color,
                textAlign: 'center',
                lineHeight: '1.3',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {step.title}
              </h4>

              {/* Illustration / Icon Box */}
              <div
                className="icon-box"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: `${step.color}10`,
                  color: step.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  transition: 'all 0.25s ease'
                }}
              >
                <step.icon size={32} />
              </div>

              {/* Bullet Points */}
              <ul style={{
                margin: 0,
                padding: 0,
                listStyleType: 'none',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {step.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    lineHeight: '1.2'
                  }}>
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: step.color,
                      marginTop: '5px',
                      flexShrink: 0
                    }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connection Arrow */}
            {idx < steps.length - 1 && (
              <div style={{ margin: '0 8px', color: 'var(--border-light)', display: 'flex', alignItems: 'center' }}>
                <ArrowRight size={20} style={{ color: step.color, opacity: 0.6 }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '24px' }}>
      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '12px 0' }}>
        {/* Row 1 (Steps 1 - 4) */}
        {renderRow(workflowSteps.slice(0, 4))}

        {/* Row 2 (Steps 5 - 8) */}
        {renderRow(workflowSteps.slice(4, 8))}
      </div>
    </div>
  );
}
