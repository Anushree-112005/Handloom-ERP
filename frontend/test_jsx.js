const fs = require('fs');
const content = fs.readFileSync('/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/buyer_order/WorkOrderDesk.jsx', 'utf8');
console.log(content.includes('{options.fabric_type_master?.map(s => <option key={s} value={s}>{s}</option>)}'));
