import sys
import os
import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Ensure backend path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.sub_master import SubMaster

RICH_SUB_MASTERS = {
    # 1. Party & KYC
    "party_type": [
        "Customer", "Buyer", "Sales Party", "Export Buyer", "Domestic Wholesaler",
        "Supplier", "Yarn Supplier", "Purchase Vendor", "Mill Trader",
        "Job Worker", "Processor", "Weaver", "Master Weaver", "Handloom Society",
        "Dyeing Master", "Warping Unit", "Sizing Works", "Twister", "Finisher", "Printer",
        "Transporter", "Logistics Company", "Courier Partner", "Fleet Operator",
        "Commission Agent", "Buying House Representative", "Broker",
        "Spares Vendor", "Consumables Vendor", "Dyes & Chemicals Supplier", "Sub-Contractor"
    ],
    "party_type_group": [
        "Sundry Debtors (Customers)", "Sundry Creditors (Suppliers)", "Job Workers & Processors",
        "Transporters & Logistics", "Commission Agents & Brokers", "Yarn Spinning Mills",
        "Dyes & Chemical Vendors", "Machine Spares & Stores", "Export Corporate Clients",
        "Domestic Garment Houses", "Handloom Weaver Clusters", "Statutory & Government Bodies"
    ],
    "customer_grade": [
        "A+ (Prime / Top Credit)", "A (Excellent Tier-1)", "B+ (Good / Regular)",
        "B (Standard Commercial)", "C (Strict Advance Only)", "Export Platinum",
        "Domestic Wholesale Grade", "Corporate VIP"
    ],
    "sales_region_master": [
        "South Zone (Tamil Nadu, Kerala, Karnataka, AP, Telangana)",
        "North Zone (Delhi NCR, Punjab, Haryana, UP, Rajasthan)",
        "West Zone (Maharashtra, Gujarat, Goa, MP)",
        "East Zone (West Bengal, Odisha, Bihar, Assam)",
        "Export - North America (USA, Canada)",
        "Export - Europe (UK, Germany, France, Italy, Spain)",
        "Export - Middle East (UAE, Saudi Arabia, Qatar)",
        "Export - Asia Pacific (Japan, Australia, Singapore)",
        "Local Cluster (Salem, Erode, Tiruppur, Coimbatore, Karur)"
    ],
    "currency_master": [
        "INR (₹ - Indian Rupee)", "USD ($ - US Dollar)", "EUR (€ - Euro)",
        "GBP (£ - British Pound)", "AED (د.إ - UAE Dirham)", "JPY (¥ - Japanese Yen)",
        "SGD (S$ - Singapore Dollar)", "CAD (C$ - Canadian Dollar)", "AUD (A$ - Australian Dollar)"
    ],
    "payment_terms_master": [
        "100% Advance Payment", "20% Advance, Balance on Delivery", "30% Advance, 70% Against BL Copy",
        "15 Days Net", "30 Days Net", "45 Days Net", "60 Days Net", "90 Days Net",
        "Letter of Credit (LC at Sight)", "Letter of Credit (LC 60 Days)", "Letter of Credit (LC 90 Days)",
        "Cash Against Documents (CAD)", "Documents Against Acceptance (DA 30 Days)", "Cash on Delivery (COD)"
    ],
    "party_terms_master": [
        "Ex-Mill / Ex-Factory (Buyer Picks Up)",
        "FOB Chennai Port (Free On Board)",
        "FOB Tuticorin Port",
        "FOB Nhava Sheva Port, Mumbai",
        "CIF European Port (Cost, Insurance, Freight)",
        "CIF New York / Savannah Port",
        "CIF Jebel Ali Port, Dubai",
        "Door Delivery Freight Prepaid",
        "Door Delivery Freight To-Pay (Consignee Bears)"
    ],

    # 2. Merchandising & Buyer Orders
    "order_type_master": [
        "Regular Bulk Production", "Direct Export Order", "Merchant Export Order",
        "Deemed Export (EOU / SEZ)", "Domestic Wholesale Order", "Corporate Institutional Supply",
        "Fast-Track Urgent Workorder", "Sample Development Workorder", "Repeat Continuity Order",
        "Job Work Conversion Order"
    ],
    "certified_type": [
        "GOTS (Global Organic Textile Standard)", "OEKO-TEX Standard 100 Class I",
        "OEKO-TEX Standard 100 Class II", "BCI (Better Cotton Initiative)",
        "Fair Trade Certified", "GRS (Global Recycled Standard)", "Cradle to Cradle Certified",
        "Handloom Mark (Government of India)", "Silk Mark Certified", "Craftmark India Certified",
        "ISO 9001:2015 Quality Assured", "Standard Commercial (Non-Certified)"
    ],
    "commission_type_master": [
        "Direct (Zero Commission)", "1.0% Buying Agent Commission", "1.5% Liaison Commission",
        "2.0% Buying House Agency", "3.0% Export Brokerage", "5.0% Retail Representative",
        "Fixed ₹2.00 per Meter", "Fixed ₹5.00 per Meter"
    ],
    "regular_special_master": [
        "Regular Running Quality", "Special Custom Development", "Exclusive Proprietary Design",
        "Fast-Track Express Batch", "Seasonal Capsule Line", "Archive Reproduction"
    ],
    "status_master": [
        "Draft", "Pending Merchandiser Approval", "Approved by Management",
        "Released for PPC Planning", "Yarn Sourcing In-Progress", "On Loom Weaving Active",
        "Fabric Wet Processing", "Under 4-Point Quality Inspection", "Inspection Cleared (Grade-A)",
        "Packed in Master Cartons", "Goods Release Advice (GRA) Signed", "Ready for Dispatch",
        "Dispatched with E-Way Bill", "Partially Dispatched", "Commercial Invoiced",
        "Payment Realized / Closed", "On Hold / Awaiting Buyer Swatch Approval", "Order Cancelled"
    ],

    # 3. Fabrics, Weaves, Patterns & Colors
    "fabric_type_master": [
        "Pure Cotton", "Cotton Cambric", "Cotton Voile", "Cotton Poplin", "Cotton Slub",
        "Cotton Twill (2/1, 2/2)", "Cotton Satin / Sateen", "Organic Certified Cotton",
        "Khadi / Handspun Cotton", "Pure Linen (European Flax)", "Linen Cotton Blend (55/45)",
        "Mulberry Silk", "Tussar Wild Silk", "Eri Silk (Ahimsa Silk)", "Cotton Silk Chanderi",
        "Viscose Rayon", "Modal Spun Fabric", "Bamboo Sustainable Fiber", "Denim Chambray (6 oz)",
        "Oxford Weave Cotton", "Herringbone Weave", "Dobby Structure Fabric", "Jacquard Brocade",
        "Fine Muslin Cotton", "Heavy Canvas Duck (10 oz)"
    ],
    "weaving_type_master": [
        "Plain Weave (1/1)", "Twill Weave (2/1)", "Twill Weave (2/2)", "Twill Weave (3/1)",
        "Satin Weave (4/1)", "Sateen Weave (Weft-Faced)", "Dobby Textured Weave",
        "Jacquard Figured Weave", "Oxford Pinpoint Weave", "Herringbone / Broken Twill",
        "Chevron Zig-Zag Weave", "Matty / Basket Weave (2/2)", "Ripstop Cross-Grid Weave",
        "Waffle / Honeycomb Weave", "Crepe Pebble Texture", "Corduroy Ribbed Weave", "Leno / Gauze Open Weave"
    ],
    "pattern_master": [
        "Solid Plain Dyed", "Yarn Dyed (YD)", "Fine Pinstripes", "Bengal Stripes",
        "Candy Stripes", "Gingham Classic Checks", "Madras Handloom Checks", "Micro Graph Checks",
        "Windowpane Checks", "Tartan Plaid Checks", "Traditional Hand Block Print",
        "Rotary Screen Pigment Print", "Digital Reactive Botanical Print", "Geometric Dobby Motifs",
        "Traditional Ikat / Patola", "Tie & Dye Shibori", "Ombre Two-Tone Gradient",
        "Self Embossed Textured Jacquard", "Heather Melange Effect"
    ],
    "color_master": [
        "Navy Blue", "Royal Blue", "Sky Blue", "Indigo Blue (Natural Vat)", "Teal Ocean Blue",
        "Bleached Optical White", "Natural Raw Off-White", "Cream / Ecru / Ivory", "Jet Black",
        "Charcoal Gray", "Silver Slate Gray", "Crimson Red", "Deep Maroon / Wine", "Scarlet Coral",
        "Mustard Yellow", "Golden Ochre", "Pale Lemon Yellow", "Emerald Gem Green", "Deep Forest Green",
        "Olive Drab Green", "Sage Herbal Green", "Mint Pastel Green", "Warm Beige / Camel",
        "Khaki Desert Tan", "Rich Chocolate Brown", "Pastel Blush Pink", "Peach Sorbet",
        "Lavender Blossom", "Royal Purple / Plum", "Terracotta / Burnt Orange", "Turquoise Blue"
    ],

    # 4. Yarn Counts & Specifications
    "yarn_count_master": [
        "2/40s Combed Cotton (Standard Warp)", "40s Single Combed Cotton (Standard Weft)",
        "2/60s Gassed & Mercerized Cotton", "60s Single Super Combed Cotton",
        "2/80s Super Combed Giza Cotton", "80s Single Fine Weft Cotton",
        "2/100s Extra Long Staple Cotton", "100s Single Superfine Cotton",
        "2/20s Coarse Handloom Cotton", "20s Single Carded Cotton",
        "30s Single Carded Cotton", "2/30s Combed Warp Cotton",
        "60s Pure Wet Spun European Linen", "40s Pure Linen Yarn", "25s Heavy Natural Linen",
        "20/22 Denier Mulberry Filament Silk", "40/44 Denier Organzine Silk",
        "30s Viscose Rayon Spun", "40s Modal Micro Yarn", "10s Open End (OE) Heavy Cotton",
        "16s Slub Fancy Cotton", "2/20s Melange Charcoal Cotton"
    ],
    "yarn_type_master": [
        "Grey Raw Cotton Yarn", "Cone Dyed Yarn (Vat Dyed)", "Cone Dyed Yarn (Reactive)",
        "Hank Dyed Artisan Yarn", "Bleached Optical White Yarn", "Gassed Mercerized High Lustre",
        "Melange Heather Yarn", "Slub / Thick & Thin Fancy Yarn", "Organic GOTS Certified Cotton",
        "BCI Sustainable Cotton Yarn", "Combed Compact Low Hairiness Yarn", "Carded Ring Spun Yarn",
        "Open End (OE) Rotor Yarn", "Two-Ply Twisted (Doubled) Yarn", "Pure Filament Silk Yarn",
        "Wet Spun Long Staple Linen Yarn"
    ],
    "cone_type_master": [
        "Paper Cone (Standard 4°20' Traverse)", "Paper Cone (5°57' Big Package)",
        "Plastic Perforated Dyeing Cone", "Stainless Steel Flexible Dyeing Spring",
        "Dyeing Cheese / Cylindrical Tube", "Hank / Skein Bundle (1 Kg Hanks)",
        "Wooden Handloom Bobbin / Pirn", "Plastic Flanged Bobbin",
        "Sectional Warp Beam (Warping)", "Direct Sizing Beam (Sized)"
    ],
    "yarn_spec_type_master": [
        "Warp Yarn (Lengthwise)", "Weft Yarn (Crosswise / Pick)", "Selvage Reinforcement Yarn", "Extra Weft / Buta Yarn"
    ],

    # 5. Manufacturing, Machinery & Processing
    "loom_type_master": [
        "Traditional Handloom (Pit Loom)", "Handloom (Frame Loom with Fly Shuttle)",
        "Handloom with Jacquard & Dobby Attachment", "Automatic Flexible Rapier (60 Inch)",
        "Automatic Rapier (72 Inch Wide Width)", "Automatic Rapier with Electronic Jacquard (2688 Hooks)",
        "Air Jet Loom (Super High Speed 800 PPM)", "Water Jet Loom",
        "Projectile Loom (Sulzer Wide Width)", "Semi-Automatic Powerloom (Drop Box 4x1)"
    ],
    "process_sequence_master": [
        "Yarn Cone Dyeing -> Warping & Sizing -> Weaving -> Inspection -> Roll Barcoding",
        "Grey Yarn Weaving -> Fabric Scouring -> Bleaching -> Fabric Dyeing -> Stenter Finishing",
        "Hank Dyeing -> Bobbin Winding -> Handloom Weaving -> Manual Mending -> Packing",
        "Direct Warping -> Rapier Weaving -> Rotary Screen Print -> Loop Ager -> Calendering",
        "Yarn Mercerizing -> Yarn Dyeing -> Jacquard Weaving -> Bio-Polishing -> Packing",
        "Greige Cloth Weaving -> Table Inspection -> Direct Zero-Finish Bale Packing"
    ],
    "mill_name_master": [
        "Lakshmi Spinning Mills Ltd (Coimbatore)", "Vardhman Textiles Ltd (Baddi)",
        "Arvind Limited (Ahmedabad)", "Premier Mills Ltd (Coimbatore)",
        "Precot Meridian Ltd (Kanjikode)", "Super Spinning Mills Ltd (Hindupur)",
        "Nahar Spinning Mills Ltd (Ludhiana)", "KPR Mill Limited (Tiruppur)",
        "Alok Industries Ltd (Silvassa)", "Banswara Syntex Ltd (Banswara)",
        "Raymond Cotton Division (Yavatmal)", "Sutlej Textiles and Industries"
    ],

    # 6. Quality, Logistics & Dispatch
    "end_use_master": [
        "Men's Premium Formal & Casual Shirting", "Women's Ethnic Kurtis & Tunic Material",
        "Traditional Sarees & Zari Drapes", "Infant & Kids Softwear",
        "Luxury Bed Linen, Duvet Covers & Sheeting", "Decorative Cushion Covers & Throws",
        "Table Runners, Mats & Napkins", "Living Room Curtains & Blackout Drapes",
        "Sofa Upholstery & Furniture Tapestry", "Fashion Scarves, Stoles & Bandanas",
        "Five-Star Hotel Hospitality Linens", "Medical Hospital Antimicrobial Sheeting",
        "Export Apparel Garment Manufacturing"
    ],
    "season_master": [
        "Spring / Summer 2026 (SS26)", "Autumn / Winter 2026 (AW26)",
        "Spring / Summer 2027 (SS27)", "Pre-Fall 2026 Capsule",
        "Resort & Cruise Holiday 2026", "Festive / Diwali 2026 Collection",
        "Bridal & Wedding 2026-27 Line", "Core Basics / Continuity (All Season)"
    ],
    "packing_type_master": [
        "Heavy Duty Export Corrugated Carton (5-Ply)", "Heavy Duty Export Carton (7-Ply Palletized)",
        "Traditional Hessian / Jute Baled Roll with Hoop Iron", "Individual Poly-Wrapped Roll on Core Tube",
        "Palletized & Stretch-Wrapped Skid", "Reinforced Wooden Crate (High-Value Silk)",
        "Double Gunny Bag Wrapped Greige Bale", "Hanging Garment Container Packing"
    ],
    "transport_mode_master": [
        "Surface Road Dedicated Truck (Full Truck Load - FTL)",
        "Surface Road Part Truck Load (PTL / Parcel)",
        "Express Air Freight (Door-to-Door Courier)",
        "Air Cargo (Direct International Flight)",
        "Ocean Container (FCL 20ft Standard)",
        "Ocean Container (FCL 40ft High Cube)",
        "Ocean Freight (LCL Consolidation)",
        "Indian Railways Parcel Van (VPU / Express)",
        "Dedicated Local Light Commercial Vehicle (LCV / Tempo)",
        "Ex-Factory Customer Self Pick-up"
    ],
    "transport_name_master": [
        "Blue Dart Express Ltd", "VRL Logistics Ltd", "TCI Freight (Transport Corp of India)",
        "Safexpress Pvt Ltd", "Gati-KWE Allcargo Logistics", "Spoton Logistics Pvt Ltd",
        "The Professional Couriers (TPC)", "DTDC Express Ltd", "Associated Road Carriers (ARC)",
        "Kallada Road Transport", "ABT Parcel Service", "KPN Parcel Service",
        "Maersk Line (Ocean Shipping)", "MSC Mediterranean Shipping Company",
        "Factory Dedicated Delivery Truck"
    ],
    "delivery_at_master": [
        "Customer Factory & Cutting Facility", "Customer Central Distribution Godown",
        "Port of Chennai (CFS - Container Freight Station)", "Port of Tuticorin (VOC Port CFS)",
        "Port of Kochi (Vallarpadam Terminal)", "JNPT Port, Mumbai (Nhava Sheva)",
        "Bangalore Inland Container Depot (ICD Whitefield)", "Karur Home Textile Export Hub",
        "Coimbatore Sizing & Weaving Cluster", "Tiruppur Knitwear & Garment Hub",
        "Erode Central Cloth Market Godown", "Salem Handloom Society Central Depot"
    ],
    "lr_type_master": [
        "Consignee Copy (Original LR / Waybill)", "Consignor Copy (Shipper Record)",
        "Driver / Transporter Delivery Copy", "Bank Delivery Order Copy", "Electronic GST E-Way Bill Attached"
    ],
    "lr_terms": [
        "Door Delivery Authorized by Consignor", "Godown Delivery (Consignee Self Collection)",
        "Demurrage Applicable after 48 Hours Stoppage", "Freight Prepaid / Charged in Invoice",
        "Freight To-Pay at Destination by Consignee"
    ],
    "bale_type_master": [
        "Standard Export Bale (1,000 Meters / ~240 Kg)", "Half Export Bale (500 Meters / ~120 Kg)",
        "Domestic Commercial Roll (100 - 250 Meters)", "Sample Swatch Card Master Bundle",
        "Wooden Pallet Base Compressed Bale"
    ],

    # 7. Taxation, Finance & Warehousing
    "hsn_code_master": [
        "5208 - Woven Cotton Fabric (>= 85% Cotton, Light/Medium Weight)",
        "5209 - Woven Cotton Fabric (> 200 GSM Heavy Duck/Denim)",
        "5205 - Single & Double Cotton Yarn (>= 85% Cotton)",
        "5206 - Blended Cotton Yarn (< 85% Cotton)",
        "5007 - Woven Pure Silk & Silk Waste Fabric",
        "5309 - Woven Pure Linen (Flax) Fabric",
        "5407 - Woven Synthetic Filament Fabric (Polyester / Nylon)",
        "5513 - Woven Synthetic Staple Fabric Blend (< 85% Poly)",
        "6302 - Bed Linen, Table Linen, Kitchen & Bath Linen",
        "6304 - Furnishing Articles (Curtains, Cushion Covers)",
        "9988 - Manufacturing Services / Job Work on Textile Inputs"
    ],
    "invoice_type_master": [
        "Tax Invoice (B2B Domestic - CGST 2.5% + SGST 2.5%)",
        "Tax Invoice (B2B Inter-State - IGST 5.0%)",
        "Export Invoice with Payment of IGST (Refund Claim)",
        "Export Invoice under Letter of Undertaking / LUT (Zero Rated)",
        "SEZ Unit Supply without IGST Payment",
        "Deemed Export Tax Invoice",
        "Credit Note (Sales Return / Quality Rebate)",
        "Debit Note (Price Escalation / Freight Supplementary)",
        "Bill of Supply (Exempt Khadi Handloom Fabric)",
        "Delivery Challan (Job Work Material Movement u/s 143)"
    ],
    "payment_mode_master": [
        "NEFT / RTGS Online Bank Transfer", "IMPS Instant Electronic Transfer",
        "Cheque / Demand Draft", "Letter of Credit (LC at Sight / Usance)",
        "UPI / QR Digital Corporate Payment", "International SWIFT Wire Transfer",
        "Direct Cash Receipt (within statutory limits)"
    ],
    "against_reference_master": [
        "Against Internal Buyer Purchase Order (IBPO)", "Against Formal Proforma Invoice (PI)",
        "Against Yarn Purchase Order (YPO)", "Against Job Work Delivery Challan (DC)",
        "Against Commercial Sales Invoice", "Against Sample Development Request (SDR)",
        "Against Warehouse Stock Replenishment Indent"
    ],
    "freight_type_master": [
        "Freight Paid by Mill (Prepaid in Invoice)", "Freight To-Pay by Customer on Delivery",
        "FOB - Freight Free on Board Port", "CIF - Freight & Marine Insurance Fully Covered",
        "Shared Freight (50% Consignor : 50% Consignee)"
    ],
    "freight_mode_master": [
        "By Road Surface Truck", "By Express Air Flight", "By Ocean Container Vessel", "By Indian Railways Parcel Van"
    ],
    "godown_master": [
        "Main Yarn Godown #1 (Raw Cones)", "Dyed Yarn Godown #2 (Conditioned Cones)",
        "Sizing & Warping Staging Shed #3", "Weaving Shed A - WIP Handloom Floor",
        "Weaving Shed B - Automatic Rapier Floor", "Greige Cloth Mending & Perching Godown",
        "Finished Fabric Warehouse #1 (Export Packing Dock)", "Finished Fabric Warehouse #2 (Domestic Stock)",
        "Chemicals, Sizing Starch & Dyes Store", "Machine Spares, Heald Wires & Shuttles Store"
    ],
    "uom_master": [
        "Meters (MTR)", "Yards (YD)", "Kilograms (KG)", "Grams (GM)",
        "Rolls (ROL)", "Pieces (PCS)", "Bales (BAL)", "Cones (CNE)",
        "Bags (BAG)", "Cartons (BOX)", "Sets (SET)", "Loom Hours (HRS)"
    ]
}

async def seed_rich_sub_masters():
    async with AsyncSessionLocal() as session:
        print("Seeding rich industry-grade sub-master options across all modules...")
        total_added = 0
        total_existing = 0

        for entity, values in RICH_SUB_MASTERS.items():
            # Get existing names for this entity
            res = await session.execute(
                select(SubMaster.name).where(SubMaster.entity == entity)
            )
            existing_names = set(res.scalars().all())

            for val in values:
                # Extract code if present or generate short code
                clean_name = val.strip()
                code = None
                if " - " in clean_name:
                    parts = clean_name.split(" - ", 1)
                    if len(parts[0]) <= 10:
                        code = parts[0].strip()

                if clean_name not in existing_names:
                    session.add(SubMaster(
                        entity=entity,
                        name=clean_name,
                        code=code,
                        is_active=True
                    ))
                    existing_names.add(clean_name)
                    total_added += 1
                else:
                    total_existing += 1

        await session.commit()
        print(f"Rich sub-masters seeding complete! Added: {total_added} new options | Kept: {total_existing} existing options.")

if __name__ == "__main__":
    asyncio.run(seed_rich_sub_masters())
