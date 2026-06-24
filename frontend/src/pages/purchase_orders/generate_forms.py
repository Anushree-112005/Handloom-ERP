import os
import re

source_file = "/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/purchase_orders/GenericPurchaseOrder.jsx"

with open(source_file, "r") as f:
    content = f.read()

forms = [
    ("TwistingDoublingPO", "twisting-doubling", "Twisting / Doubling PO", "Manage twisting and doubling orders", "Layers"),
    ("YarnDyeingPO", "yarn-dyeing", "Yarn Dyeing PO", "Manage yarn dyeing purchase orders", "Palette"),
    ("FabricDyeingPO", "fabric-dyeing", "Fabric Dyeing PO", "Manage fabric dyeing purchase orders", "Palette"),
    ("WarpingSizingPO", "warping-sizing", "Warping / Sizing PO", "Manage warping and sizing purchase orders", "Factory"),
    ("WeavingPO", "weaving", "Weaving PO", "Manage weaving purchase orders", "Layers"),
    ("ProcessingPO", "processing", "Processing PO", "Manage processing purchase orders", "Scissors"),
    ("ClothPurchasePO", "cloth-purchase", "Cloth Purchase", "Manage cloth purchase orders", "Package")
]

for class_name, module_type, title, desc, icon in forms:
    new_content = content
    # Replace the component signature
    new_content = re.sub(
        r"export default function GenericPurchaseOrder\(\{ title, description, icon: Icon = Package, moduleType \}\) \{",
        f"export default function {class_name}() {{\n  const title = '{title}';\n  const description = '{desc}';\n  const Icon = {icon};\n  const moduleType = '{module_type}';",
        new_content
    )
    
    # Save the new file
    dest = f"/home/cubeai/Desktop/Dinesh/dinesh-tex/frontend/src/pages/purchase_orders/{class_name}.jsx"
    with open(dest, "w") as f:
        f.write(new_content)
    print(f"Created {dest}")
