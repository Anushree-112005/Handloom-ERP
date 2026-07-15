export const generateMockEvents = (year, month) => {
  const events = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const categories = [
    { type: 'Buyer Order Created', category: 'Buyer Orders', color: '#3b82f6', bg: '#eff6ff' }, // Blue
    { type: 'Production Started', category: 'Production', color: '#10b981', bg: '#ecfdf5' }, // Green
    { type: 'Production Completed', category: 'Production', color: '#10b981', bg: '#ecfdf5' },
    { type: 'Dispatch Completed', category: 'Dispatch', color: '#f97316', bg: '#fff7ed' }, // Orange
    { type: 'Invoice Generated', category: 'Finance', color: '#8b5cf6', bg: '#f5f3ff' }, // Purple
    { type: 'Payment Received', category: 'Finance', color: '#8b5cf6', bg: '#f5f3ff' },
    { type: 'Machine Maintenance', category: 'Maintenance', color: '#eab308', bg: '#fefce8' }, // Yellow
    { type: 'Meeting', category: 'Reminder', color: '#64748b', bg: '#f8fafc' }, // Gray
    { type: 'QC Inspection', category: 'Critical Tasks', color: '#ef4444', bg: '#fef2f2' }, // Red
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    // Generate 0 to 4 events per day randomly
    const numEvents = Math.floor(Math.random() * 5);

    for (let i = 0; i < numEvents; i++) {
      const categoryObj = categories[Math.floor(Math.random() * categories.length)];
      
      const eventTimeHours = Math.floor(Math.random() * 9) + 9; // 9 AM to 5 PM
      const eventTimeMins = Math.random() > 0.5 ? '30' : '00';
      const ampm = eventTimeHours >= 12 ? 'PM' : 'AM';
      const formattedHour = eventTimeHours > 12 ? eventTimeHours - 12 : eventTimeHours;
      const timeString = `${formattedHour.toString().padStart(2, '0')}:${eventTimeMins} ${ampm}`;

      events.push({
        id: `evt-${year}-${month}-${day}-${i}`,
        date: new Date(year, month, day),
        time: timeString,
        timestamp: new Date(year, month, day, eventTimeHours, parseInt(eventTimeMins)).getTime(),
        type: categoryObj.type,
        category: categoryObj.category,
        color: categoryObj.color,
        bg: categoryObj.bg,
        details: generateEventDetails(categoryObj.type)
      });
    }
  }

  // Sort events by timestamp
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

function generateEventDetails(type) {
  const details = {};
  
  switch(type) {
    case 'Buyer Order Created':
      details['Order No'] = `BO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      details['Buyer'] = ['ABC Textiles', 'Global Fabrics', 'Trendy Garments'][Math.floor(Math.random() * 3)];
      details['Quantity'] = `${Math.floor(1000 + Math.random() * 5000)} Mtrs`;
      details['Created By'] = 'Dinesh';
      details['Status'] = 'Pending Approval';
      break;
    case 'Production Started':
      details['Production ID'] = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
      details['Machine'] = `Knitting Machine-${Math.floor(1 + Math.random() * 10).toString().padStart(2, '0')}`;
      details['Supervisor'] = ['Ramesh', 'Kumar', 'Suresh'][Math.floor(Math.random() * 3)];
      break;
    case 'Production Completed':
      details['Production ID'] = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
      details['Quantity Produced'] = `${Math.floor(1000 + Math.random() * 5000)} Mtrs`;
      details['Quality Passed'] = 'Yes';
      break;
    case 'Dispatch Completed':
      details['Vehicle'] = `TN09AB${Math.floor(1000 + Math.random() * 9000)}`;
      details['Driver'] = ['Murugan', 'Velu', 'Kannan'][Math.floor(Math.random() * 3)];
      details['Destination'] = ['Chennai', 'Tirupur', 'Coimbatore'][Math.floor(Math.random() * 3)];
      details['Status'] = 'Delivered';
      break;
    case 'Invoice Generated':
      details['Invoice No'] = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      details['Amount'] = `₹${(Math.random() * 100000).toFixed(2)}`;
      details['Party'] = 'Global Fabrics';
      break;
    case 'Payment Received':
      details['Receipt No'] = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      details['Amount'] = `₹${(Math.random() * 100000).toFixed(2)}`;
      details['Mode'] = 'NEFT/RTGS';
      break;
    case 'Machine Maintenance':
      details['Machine'] = `Dyeing Machine-${Math.floor(1 + Math.random() * 5).toString().padStart(2, '0')}`;
      details['Technician'] = 'Ravi';
      details['Status'] = 'In Progress';
      break;
    case 'Meeting':
      details['Topic'] = ['Production Planning', 'Sales Review', 'Quality Audit'][Math.floor(Math.random() * 3)];
      details['Location'] = 'Conference Room 1';
      break;
    case 'QC Inspection':
      details['Batch No'] = `BATCH-${Math.floor(100 + Math.random() * 900)}`;
      details['Inspector'] = 'Kumar';
      details['Status'] = 'Passed';
      break;
    default:
      details['Info'] = 'General Activity';
  }
  
  return details;
}
