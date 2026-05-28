with open("ClothDelivery.jsx", "r") as f:
    content = f.read()

import re
content = re.sub(r'style=\n\s+padding: \'16px 24px\'', r'style={{\n                  padding: \'16px 24px\'', content)
content = re.sub(r'gap: 8\n\s+\}', r'gap: 8\n                }}', content)

with open("ClothDelivery.jsx", "w") as f:
    f.write(content)

