const fs = require('fs');
const sourceFile = '/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/purchase_orders/GenericPurchaseOrder.jsx';

const content = fs.readFileSync(sourceFile, 'utf8');

const forms = [
  { className: 'TwistingDoublingPO', moduleType: 'twisting-doubling', title: 'Twisting / Doubling PO', desc: 'Manage twisting and doubling orders', icon: 'Layers' },
  { className: 'YarnDyeingPO', moduleType: 'yarn-dyeing', title: 'Yarn Dyeing PO', desc: 'Manage yarn dyeing purchase orders', icon: 'Palette' },
  { className: 'FabricDyeingPO', moduleType: 'fabric-dyeing', title: 'Fabric Dyeing PO', desc: 'Manage fabric dyeing purchase orders', icon: 'Palette' },
  { className: 'WarpingSizingPO', moduleType: 'warping-sizing', title: 'Warping / Sizing PO', desc: 'Manage warping and sizing purchase orders', icon: 'Factory' },
  { className: 'WeavingPO', moduleType: 'weaving', title: 'Weaving PO', desc: 'Manage weaving purchase orders', icon: 'Layers' },
  { className: 'ProcessingPO', moduleType: 'processing', title: 'Processing PO', desc: 'Manage processing purchase orders', icon: 'Scissors' },
  { className: 'ClothPurchasePO', moduleType: 'cloth-purchase', title: 'Cloth Purchase', desc: 'Manage cloth purchase orders', icon: 'Package' }
];

forms.forEach(({ className, moduleType, title, desc, icon }) => {
  let newContent = content;
  newContent = newContent.replace(
    /export default function GenericPurchaseOrder\(\{ title, description, icon: Icon = Package, moduleType \}\) \{/,
    `export default function ${className}() {\n  const title = '${title}';\n  const description = '${desc}';\n  const Icon = ${icon};\n  const moduleType = '${moduleType}';`
  );
  
  const dest = `/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/purchase_orders/${className}.jsx`;
  fs.writeFileSync(dest, newContent, 'utf8');
  console.log(`Created ${dest}`);
});
