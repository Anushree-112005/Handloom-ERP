# Let's find the exact combination of parameters that yields:
# CREAM: 4.69, L.GREY: 0.94, D.GREY: 3.22, BLACK: 2.01

color_picks = [70, 14, 48, 30]
target_kgs = [4.69, 0.94, 3.22, 2.01]

# Known values from the example:
count = 20
total_picks = 162
pick_ol = 68
reed_space_opts = [57.0, 63.33]
selvage = 3
weft_prod_mtr_opts = [90.0, 60.0]

import itertools

for rs, wpm in itertools.product(reed_space_opts, weft_prod_mtr_opts):
    weft_ends_calculated = pick_ol * (rs + selvage)
    
    # We want to find a formula:
    # req_kg = color_pick * factor
    # Let's check the ratio of target_kgs / color_picks:
    ratios = [t / cp for t, cp in zip(target_kgs, color_picks)]
    # All ratios are very close to 0.067
    
    # Let's search for an expression of the form:
    # factor = (expression of other vars)
    # Let's try different divisors:
    divisors = [1848, 1690, 840, 560, 36, 1760]
    conversion_factors = [1.0, 1.094, 39.37 / 36, 39.37, 36, 1.093611]
    
    for div, conv in itertools.product(divisors, conversion_factors):
        # We can try:
        # Option A: using pick_ol * (rs + selvage)
        # req_kg_raw = (color_picks / total_picks) * weft_ends_calculated * conv * wpm / (div * count)
        # Let's calculate cream_req:
        cream_ratio = 70 / 162
        cream_ends = weft_ends_calculated * cream_ratio
        val_a = (cream_ends * conv * wpm) / (div * count)
        
        # Option B: directly using color_picks as the "Weft Ends" column in 8.3:
        # wait! What if CREAM "Weft Ends" is 70, and that 70 is used directly instead of the ratio?
        # req_kg_raw = (color_picks * conv * wpm) / (div * count)
        val_b = (70 * conv * wpm) / (div * count)
        
        if abs(val_a - 4.69) < 0.01:
            print(f"Option A match! rs={rs}, wpm={wpm}, conv={conv}, div={div} -> {val_a:.4f}")
        if abs(val_b - 4.69) < 0.01:
            print(f"Option B match! rs={rs}, wpm={wpm}, conv={conv}, div={div} -> {val_b:.4f}")
