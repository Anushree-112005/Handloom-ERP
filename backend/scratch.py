# Let's write a scratch script to test the exact formulas and match them with the docx example.
# From the document:
# CREAM: Weft Ends = 70, REQ KGS = 4.69, With Dyeing Loss = 4.93, Count = 20s
# L.GREY: Weft Ends = 14, REQ KGS = 0.94, With Dyeing Loss = 0.99, Count = 20s
# D.GREY: Weft Ends = 48, REQ KGS = 3.22, With Dyeing Loss = 3.38, Count = 20s
# BLACK: Weft Ends = 30, REQ KGS = 2.01, With Dyeing Loss = 2.11, Count = 20s
#
# Total Picks in repeat = 70 + 14 + 48 + 30 = 162
# Onloom Pick = 68
# Reed Space = 63.33
# Selvage = 3
# Total Weft Ends = Onloom Pick * (Reed Space + 3) = 68 * 66.33 = 4510.44
# Weft Prod Mtr = 90
# Dyeing Loss = 5%

total_weft_ends = 68 * 66.33 # 4510.44
total_picks = 162
weft_prod_mtr = 90

print("Test 1: (Colour Ends / Total Weft Ends) * total_weft_ends * 1.094 * weft_prod_mtr / (1848 * count)")
# Wait, (Colour Ends / Total Weft Ends) - in the doc, CREAM Colour Ends is 70, and Total Weft Ends is 162 (the sum of picks)
# Let's calculate for CREAM (Ends = 70, Count = 20):
ratio = 70 / 162
group_ends = total_weft_ends * ratio
req_kgs_1 = (group_ends * 1.094 * weft_prod_mtr) / (1848 * 20)
print(f"CREAM Req KGS: {req_kgs_1:.4f}")

# Wait! Let's check another formula:
# What if CREAM Weft Ends = 70 is NOT the ratio, but the actual Weft Ends?
# What if CREAM Weft Ends is 70? No, 70 / 162 is the pick ratio.
# What if CREAM Weft Ends is 70, and they calculated REQ KGS as:
# REQ KGS = CREAM Weft Ends * 1.094 * Weft Prod Mtr / (1848 * Count) * something?
# If CREAM Weft Ends = 70:
# (70 * 1.094 * 90) / (1848 * 20) = 0.186
# How does 0.186 become 4.69?
# 4.69 / 0.186 = 25.215
# Where does 25.215 come from?
# Could it be the ratio of Total Weft Ends?
# Wait! 162 / 68 = 2.38?
# Let's see: 4510.44 / 162 = 27.8422
# Wait! Let's print out what ratio of 4.69 / (70 * 1.094 * 90 / (1848 * 20)) is:
factor = 4.69 / ((70 * 1.094 * 90) / (1848 * 20))
print(f"Factor: {factor:.4f}")
# Factor is 25.18
# What if Weft Prod Mtr is NOT 90?
# What if Weft Prod Mtr is total_mtr * (1 + skg_pct/100)?
# If Total Order Mtr is 60, shrinkage is 8.82%? Or 50%?
# Wait, let's solve:
# If CREAM REQ KGS = 4.69, and CREAM Weft Ends = 70 (which is the pick count in repeat):
# Let's print: CREAM = 70, req = 4.69
# L.GREY = 14, req = 0.94
# D.GREY = 48, req = 3.22
# BLACK = 30, req = 2.01
# Let's check:
# req / Ends:
# 4.69 / 70 = 0.067
# 0.94 / 14 = 0.06714
# 3.22 / 48 = 0.06708
# 2.01 / 30 = 0.067
# So req_kgs is exactly 0.067 * Ends.
# If req_kgs = 0.067 * Ends, then for CREAM with 70 ends:
# req = 70 * 0.067 = 4.69
# With loss = 4.69 / 0.95 = 4.937 (which rounds to 5)
# This matches perfectly!
# Now, let's see how 0.067 is derived from the other parameters:
# We know Onloom Pick = 68, Reed Space = 63.33, Selvage = 3, Weft Prod Mtr = 90 (or something else?), Count = 20.
# If the formula is:
# req_kgs = (ends * 1.094 * Weft Prod Mtr) / (1848 * Count) * (something)
# Or:
# req_kgs = (ratio * Onloom Pick * (Reed Space + selvage) * 1.094 * Weft Prod Mtr) / (1848 * Count)
# Let's calculate:
# ratio = CREAM ends / Total Weft Threads = 70 / 162
# req_kgs = ( (70 / 162) * 68 * (63.33 + 3) * 1.094 * 90 ) / (1848 * 20)
# = ( 0.432098 * 68 * 66.33 * 1.094 * 90 ) / 36960
# = ( 1948.937 * 1.094 * 90 ) / 36960
# = 191890.3 / 36960 = 5.19 KGS
# Wait! 5.19 KGS is not 4.69!
# Why is it 4.69?
# Wait! Let's check what Weft Prod Mtr is in the docx:
# Is it 90 mtr? No, Weft Prod Mtr = 90 is for WEFT.
# Wait! In section 2, the table says:
# "Prod Mtr (Weft) | Production metres for weft calculation | 90 mtr"
# Wait! Let's check:
# If Weft Prod Mtr is 81.3?
# Let's solve: ( (70/162) * 68 * 66.33 * 1.094 * Weft_Prod_Mtr ) / (1848 * 20) = 4.69
# Weft_Prod_Mtr = 4.69 * 36960 / ( 0.432098 * 68 * 66.33 * 1.094 )
# = 173342.4 / ( 1948.937 * 1.094 )
# = 173342.4 / 2132.13 = 81.3 mtr!
# Why would Weft Prod Mtr be 81.3?
# Wait! Let's look at the other entries in the table of Section 2:
# Total Order Mtr = 60 mtr.
# Warp Mtr = 120 mtr.
# Prod Mtr (Weft) = 90 mtr? Or is Weft Prod Mtr = 81.3?
# Wait! Let's check if Weft Prod Mtr is 90, but maybe there is no 1.094 conversion?
# If we do NOT use 1.094 conversion:
# ( (70 / 162) * 68 * 66.33 * 90 ) / (1848 * 20) = 1948.937 * 90 / 36960 = 4.74 KGS
# Still not 4.69!
# What if:
# ( (70 / 162) * 68 * 66.33 * 89.04 ) / (1848 * 20) = 4.69
# Wait! What if Reed Space is NOT 63.33?
# In Section 4:
# Reed Space = Total Ends / Onloom Reed = 4104 / 72 = 57 inches!
# Ah! In section 4, Reed Space is 57 inches!
# Let's calculate with Reed Space = 57 inches!
# ( (70/162) * 68 * (57 + 3) * 1.094 * 90 ) / (1848 * 20)
# = ( 0.432098 * 68 * 60 * 1.094 * 90 ) / 36960
# = ( 1762.96 * 1.094 * 90 ) / 36960
# = 173582 / 36960 = 4.696 KGS!
# Oh my god! It is EXACTLY 4.696 KGS! Which rounds to 4.70, or if truncated / formatted is 4.69!
# Yes! The example calculation indeed used Reed Space = 57!
#
# But wait, why did the user say our weft calculation is showing wrong?
# Let's look at the user's screenshot and the calculated values again:
# - Navy: Ends: 352, Total End: 3865, Req kg: 86
# - Red: Ends: 60, Total End: 659, Req kg: 15
# - White: Ends: 12, Total End: 132, Req kg: 3
# Wait! Let's calculate:
# For Navy: req_kg_raw = (3865 * 1.094 * weftProMtrVal) / (1848 * 20)
# Wait, is Count 20? Yes, we see "20S CTN" in the screenshot.
# What is the count for Navy? "20S CTN".
# What is the count for Red? "20S CTN".
# What is the count for White? "20S CTN".
# Wait, why are they all 20S CTN?
# Yes! The count for all of them is 20.
# So the calculation is:
# req_kg_raw = (groupEnds * 1.094 * weftProMtrVal) / (1848 * 20)
# Let's print out the values of req_kg for each row in the screenshot using the current code logic:
# weftProMtrVal = 714.16
# dyeingPct = 5
