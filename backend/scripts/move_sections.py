import re

with open('frontend/src/pages/purchase_orders/FabricDyeingPO.jsx', 'r') as f:
    content = f.read()

# 1. Update the tabs array
tabs_pattern = r"\{\s*id:\s*'items',\s*label:\s*'Fabric Details',\s*icon:\s*Package\s*\},\s*\{\s*id:\s*'tax',\s*label:\s*'Tax & Logistics',\s*icon:\s*IndianRupee\s*\}"
tabs_replacement = "{ id: 'tax', label: 'Tax & Logistics', icon: IndianRupee },\n              { id: 'items', label: 'Fabric Details', icon: Package }"
content = re.sub(tabs_pattern, tabs_replacement, content)

# 2. Extract section-items
items_pattern = r"(            \{/\* Section: Fabric Details \*/\}.*?)(?=\n            \{/\* Section: Tax Details & Delivery \*/\})"
items_match = re.search(items_pattern, content, re.DOTALL)
if items_match:
    items_block = items_match.group(1)
    
    # 3. Extract section-tax
    tax_pattern = r"(            \{/\* Section: Tax Details & Delivery \*/\}.*?)(?=\n          </form>)"
    tax_match = re.search(tax_pattern, content, re.DOTALL)
    
    if tax_match:
        tax_block = tax_match.group(1)
        
        # Replace the combined area with swapped order
        combined_pattern = items_pattern + r"\n" + tax_pattern
        swapped = tax_block + "\n\n" + items_block
        content = re.sub(combined_pattern, lambda m: swapped, content, flags=re.DOTALL)
        
        with open('frontend/src/pages/purchase_orders/FabricDyeingPO.jsx', 'w') as f:
            f.write(content)
        print("Successfully swapped sections in FabricDyeingPO.jsx")
    else:
        print("Could not find section-tax")
else:
    print("Could not find section-items")
