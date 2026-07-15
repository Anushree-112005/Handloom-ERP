# Let's calculate req_kg for:
# Navy: ends=352, group_ends=3865, count=20
# Red: ends=60, group_ends=659, count=20
# White: ends=12, group_ends=132, count=20
#
# We know the total weft ends calculated is 4656.
# Let's check different possible formulas for Req kg:

group_ends_list = [3865, 659, 132]
color_picks = [352, 60, 12]
count = 20
dyeing_loss_pct = 5.0
weft_pro_mtr = 714.16  # assumed from warp math
total_mtr = 700.0

# Let's check a few different weft_pro_mtr:
# 1. weft_pro_mtr = 700 (total_mtr directly)
# 2. weft_pro_mtr = 714.16 (total_mtr * 1.02)
# 3. weft_pro_mtr = 763.7 (if it was same as warp_mtr or similar)
# 4. weft_pro_mtr = 715.0

print("Checking with different Weft Prod Mtr values:")
for wpm in [700.0, 714.16, 715.0, 763.7]:
    print(f"\n--- Weft Prod Mtr = {wpm} ---")
    for cp, ge in zip(color_picks, group_ends_list):
        # Current formula:
        req_raw = (ge * 1.094 * wpm) / (1848 * count)
        req_with_loss = req_raw / (1 - dyeing_loss_pct/100)
        req_ceil = int(req_with_loss + 0.999) # ceil
        print(f"Picks={cp}, GroupEnds={ge}: req_raw={req_raw:.2f}, with_loss={req_with_loss:.2f}, rounded={req_ceil}")
