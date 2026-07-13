================================================================================
DINESH EXPORTS TEXTILE ERP — STEP-BY-STEP WORKFLOW PROCESS EXPLANATION
================================================================================
This document provides a comprehensive, data-free explanation of the 26-step 
end-to-end production workflow inside the Dinesh Exports Textile ERP. It outlines
how data moves, which fields link across pages, and the business logic applied at
each stage.

---

# SECTION 1: MASTER LIST OF THE 26-STEP PRODUCTION LIFECYCLE

  STEP 1  : Party Master          → Register all suppliers, buyers, job workers
  STEP 2  : Buyer Order Form      → Receive purchase order from buyer
  STEP 3  : Design Entry          → Create fabric design technical sheet
  STEP 4  : Grey/Color Yarn PO    → Purchase raw yarn from supplier
  STEP 5  : Yarn Inward           → Receive yarn into godown (warehouse)
  STEP 6  : Yarn Stock            → Check available yarn inventory
  STEP 7  : Yarn Dyeing PO        → Send yarn for dyeing (outsource)
  STEP 8  : Yarn Dyeing Delivery  → Dispatch grey yarn to dyeing unit
  STEP 9  : Dyed Yarn Receipt     → Receive dyed yarn back
  STEP 10 : Twisting/Doubling PO  → (Optional) Send yarn for twisting
  STEP 11 : Warping/Sizing PO     → Contract warping & sizing work
  STEP 12 : Warping Delivery      → Send dyed warp yarn to warping unit
  STEP 13 : Warping Receipt       → Receive warped beams back
  STEP 14 : Sizing Delivery       → Send warped beams for sizing
  STEP 15 : Sizing Receipt        → Receive sized loom-ready beams
  STEP 16 : Weaving PO            → Contract fabric weaving work (Vendor Order)
  STEP 17 : Weaving Delivery      → Send beam + weft yarn to loom
  STEP 18 : Grey Fabric Receipt   → Receive woven grey fabric rolls
  STEP 19 : Grey Inspection       → Quality check grey fabric
  STEP 20 : Fabric Dyeing PO      → Contract fabric dyeing/finishing
  STEP 21 : Fabric Dyeing Delivery→ Send grey fabric for dyeing
  STEP 22 : Dyed Fabric Receipt   → Receive finished dyed fabric
  STEP 23 : Processing PO         → (Optional) Printing/finishing contract
  STEP 24 : Final Inspection      → Final quality audit
  STEP 25 : Packing Slip          → Pack fabric into bales
  STEP 26 : Goods Release (GRA)   → Warehouse release authorization
  STEP 27 : Sales Invoice         → Bill the buyer
  STEP 28 : E-Way Bill            → Register transportation transit permit
  STEP 29 : Despatch Planning     → Schedule deliveries and transit route
  STEP 30 : Gate Inward Register  → Log vehicles and materials entering the factory
  STEP 31 : Gate Outward Register → Log vehicles and materials exiting the factory
  STEP 32 : Gate Pass Creation    → Authorize vehicle/material gate pass release
  STEP 33 : Gate Reports          → Monitor yard visits and vehicle traffic log

---

# SECTION 2: STEP-BY-STEP PROCESS & TRANSITION EXPLANATION

### STEP 1: Party Master
* **Menu Path**: MASTERS → Party Master
* **Purpose**: Register all external entities before initiating transactions.
* **Explanation**: Defines company details, GST/PAN information, address, and type/group (e.g., Yarn Supplier, Job Worker, Dyeing Processor, Buyer).
* **Next Step Link**: Every future document (PO, DC, Receipt, Invoice) references these registered party names, ensuring consistent address and tax configurations.

### STEP 2: Buyer Order Form
* **Menu Path**: ORDER MANAGEMENT → Buyer Order Form
* **Purpose**: Record purchase orders received from clients.
* **Explanation**: Tracks order type (Bulk/Sample), target ship dates, and fabric quantities ordered.
* **Next Step Link**: The generated Internal Buyer Purchase Order (IBPO) number becomes the primary reference key driving design creation and yarn purchasing.

### STEP 3: Design Entry
* **Menu Path**: DESIGN MANAGEMENT → Design Entry
* **Purpose**: Establish the technical fabric blueprint.
* **Explanation**: Input of construction parameters: warp/weft counts, reed, pick, total ends, warp/weft meters, finished width, and weight calculations. It calculates the exact amount of yarn (in Kgs) required for warp and weft.
* **Next Step Link**: All subsequent production orders pull counts, widths, colors, and raw material needs from this sheet.

### STEP 4: Grey / Color Yarn PO
* **Menu Path**: PURCHASE MANAGEMENT → Grey / Color Yarn PO
* **Purpose**: Buy raw yarn materials.
* **Explanation**: Generate a purchase order to yarn spinners, specifying yarn count, lot request, delivery schedule, and pricing.
* **Next Step Link**: Authorizes the supplier to ship yarn, which will be checked against this PO upon arrival.

### STEP 5: Yarn Inward
* **Menu Path**: YARN MANAGEMENT → Yarn Inward
* **Purpose**: Receive purchased yarn.
* **Explanation**: Record incoming delivery details, supplier bill numbers, bags, and Kgs. System verifies this against the corresponding Yarn PO.
* **Next Step Link**: Converts the ordered PO quantities into physical inventory in the godown.

### STEP 6: Yarn Stock
* **Menu Path**: YARN MANAGEMENT → Yarn Stock
* **Purpose**: View real-time yarn inventory.
* **Explanation**: Shows live levels of yarn sorted by count, lot number, color, and location. Automatically updates on inward (+) and outward (-) transactions.
* **Next Step Link**: Used to allocate grey yarn for dyeing or dyed yarn for warping.

### STEP 7: Yarn Dyeing PO
* **Menu Path**: PURCHASE MANAGEMENT → Yarn Dyeing PO
* **Purpose**: Outsource yarn dyeing work.
* **Explanation**: A job-work contract to dye grey yarn in design-specific colors. Specifies color processes, fastness criteria, and processing rates per Kg.
* **Next Step Link**: Establishes the contract; physical yarn is shipped next.

### STEP 8: Yarn Dyeing Delivery
* **Menu Path**: JOB WORK MANAGEMENT → Yarn Dyeing Delivery
* **Purpose**: Dispatch grey yarn to the dyehouse.
* **Explanation**: Generate a Delivery Challan (DC) to transfer yarn bags/Kgs from stock to the job worker, referencing the Yarn Dyeing PO.
* **Next Step Link**: Yarn is deducted from stock and marked as "At Yarn Dyeing".

### STEP 9: Dyed Yarn Receipt
* **Menu Path**: JOB WORK MANAGEMENT → Dyed Yarn Receipt
* **Purpose**: Receive dyed yarn back into the warehouse.
* **Explanation**: Record received weights. Calculates process waste/moisture weight loss (typical dyeing loss is 1-2%).
* **Next Step Link**: Puts the colored yarn into stock under new color-specific lots, ready for warping.

### STEP 10: Twisting / Doubling PO (Optional)
* **Menu Path**: PURCHASE MANAGEMENT → Twisting / Doubling PO
* **Purpose**: Multi-ply yarn preparation.
* **Explanation**: Optional step to twist multiple yarn threads together for specific textured designs. If plain weave is used, this step is skipped.
* **Next Step Link**: Feeds twisted yarn into beam preparation.

### STEP 11: Warping / Sizing PO
* **Menu Path**: PURCHASE MANAGEMENT → Warping / Sizing PO
* **Purpose**: Contract beam preparation.
* **Explanation**: Combined or sequential PO to arrange parallel warp threads on a beam (Warping) and coat them with protective starch (Sizing).
* **Next Step Link**: Directs the warehouse to ship dyed warp yarn.

### STEP 12: Warping Delivery
* **Menu Path**: JOB WORK MANAGEMENT → Warping Delivery
* **Purpose**: Deliver dyed warp yarn to the warping unit.
* **Explanation**: DC detailing the specific color lots, bags, and Kgs dispatched to prepare the warper beams.
* **Next Step Link**: Yarn is deducted from stock; unit begins warping process.

### STEP 13: Warping Receipt
* **Menu Path**: JOB WORK MANAGEMENT → Warping Receipt
* **Purpose**: Receive warper beams back.
* **Explanation**: Records beam count, length in meters, ends, and weight. Tracks warping waste (ends cut, breakages).
* **Next Step Link**: Un-sized beams must now go to sizing.

### STEP 14: Sizing Delivery
* **Menu Path**: JOB WORK MANAGEMENT → Sizing Delivery
* **Purpose**: Send warper beams for sizing.
* **Explanation**: Dispatches un-sized beams to the sizing unit to be coated with a starch mixture.
* **Next Step Link**: Sizing unit processes the beams to add strength.

### STEP 15: Sizing Receipt
* **Menu Path**: JOB WORK MANAGEMENT → Sizing Receipt
* **Purpose**: Receive sized loom-ready beams.
* **Explanation**: Record the received beam. Note the weight gain from the starch add-on (typically +8% to +12%).
* **Next Step Link**: The sized warp beam is ready to be loaded onto the weaving looms.

### STEP 16: Weaving PO (Vendor Order)
* **Menu Path**: PURCHASE MANAGEMENT → Weaving PO
* **Purpose**: Contract fabric weaving.
* **Explanation**: Contract placed with a weaver. Maps the design specifications (reed, pick, loom type, width, warp ends) and calculates weaving labor charges (Cooly/Mtr or Cooly/Pick).
* **Next Step Link**: Allocates sized beams and weft yarn for delivery.

### STEP 17: Weaving Delivery
* **Menu Path**: JOB WORK MANAGEMENT → Weaving Delivery
* **Purpose**: Hand over warp beam + weft yarn.
* **Explanation**: DC capturing the handover of the sized warp beam and dyed weft yarn cones to the weaver's loom room.
* **Next Step Link**: Weaver runs the loom to produce fabric.

### STEP 18: Grey Fabric Receipt / Cloth Inward
* **Menu Path**: JOB WORK MANAGEMENT → Grey Fabric Receipt
* **Purpose**: Receive woven grey rolls (thaans) from the weaver.
* **Explanation**: Recording roll numbers, individual roll meters, and weights. Calculates weaving waste by comparing input yarn weights against fabric weights.
* **Next Step Link**: Rolls are moved to inspection.

### STEP 19: Grey Inspection / On-Table Checking
* **Menu Path**: QUALITY CONTROL → Grey Inspection
* **Purpose**: Quality check grey fabric rolls.
* **Explanation**: Inspector checks fabric on a light table, registers defects (uneven weave, stains, holes), and assigns quality grades (A, B, C).
* **Next Step Link**: Approved fabric meters are cleared for finishing.

### STEP 20: Fabric Dyeing / Finishing PO
* **Menu Path**: PURCHASE MANAGEMENT → Fabric Dyeing PO
* **Purpose**: Contract fabric finishing (or piece-dyeing).
* **Explanation**: Outsource to a finishing mill. For yarn-dyed stripes/checks, this is a finishing only (sanforizing/calendering) contract. For plain grey fabrics, this is a dyeing + finishing contract.
* **Next Step Link**: Establishes finishing rates.

### STEP 21: Fabric Dyeing / Finishing Delivery
* **Menu Path**: JOB WORK MANAGEMENT → Fabric Dyeing Delivery
* **Purpose**: Deliver grey fabric to the finishing mill.
* **Explanation**: DC detailing individual roll numbers and meters sent for processing.
* **Next Step Link**: Processing mill carries out finishing.

### STEP 22: Dyed / Finished Fabric Receipt
* **Menu Path**: JOB WORK MANAGEMENT → Dyed Fabric Receipt
* **Purpose**: Receive finished fabric rolls back.
* **Explanation**: Record finished meters and weights. Shrinkage occurs due to heat/moisture (typical finishing shrinkage is 2-4%).
* **Next Step Link**: Finished rolls proceed to final quality verification.

### STEP 23: Processing PO (Optional)
* **Menu Path**: PURCHASE MANAGEMENT → Processing PO
* **Purpose**: Print or treat fabric.
* **Explanation**: Optional contract for printing, coating, or specialized treatments. Skipped if fabric requires standard finishing.
* **Next Step Link**: Feeds into final inspection.

### STEP 24: Final Inspection
* **Menu Path**: QUALITY CONTROL → Final Inspection
* **Purpose**: Final quality audit before packing.
* **Explanation**: Verification of finished width, shade matching, GSM, and hand-feel. Checks for defects introduced during finishing.
* **Next Step Link**: Approved rolls are cleared for shipping.

### STEP 25: Packing Slip
* **Menu Path**: ORDER MANAGEMENT → Packing Slip
* **Purpose**: Pack fabric rolls.
* **Explanation**: Group rolls into bales, recording net weight, gross weight (with packing material), bale numbers, and total meters per bale.
* **Next Step Link**: Packed bales are ready for warehouse release. Feeds into Goods Release Advice (GRA).

### STEP 26: Goods Release (GRA)
* **Menu Path**: SALES & DISPATCH → Goods Release (GRA)
* **Purpose**: Warehouse release authorization.
* **Explanation**: Internal authorization for the warehouse to release packed bales to the truck driver, capturing transporter and vehicle/LR details.
* **Next Step Link**: Once the goods are physically released, feeds into Sales Invoice.

### STEP 27: Sales Invoice
* **Menu Path**: SALES & DISPATCH → Sales Invoice
* **Purpose**: Bill the buyer.
* **Explanation**: Final commercial document listing fabric meters, unit rate, applicable tax rates, and shipping details.
* **Next Step Link**: If invoice amount exceeds ₹50,000, feeds into E-Way Bill registration.

### STEP 28: E-Way Bill
* **Menu Path**: SALES & DISPATCH → E-Way Bill
* **Purpose**: Register transportation transit permit.
* **Explanation**: Statutory government document required for the movement of goods, generated from Sales Invoice and GRA details.
* **Next Step Link**: Feeds into Despatch Planning.

### STEP 29: Despatch Planning
* **Menu Path**: SALES & DISPATCH → Despatch
* **Purpose**: Schedule deliveries and transit route.
* **Explanation**: Plan delivery schedules for the packed meters and track tolerance margins.
* **Next Step Link**: Connects with physical gate security logs (Gate Outward / Gate Pass).

### STEP 30: Gate Inward Register
* **Menu Path**: GATE & SECURITY → Gate Inward
* **Purpose**: Log incoming vehicles and materials.
* **Explanation**: Security register capturing driver info, vehicle number, party name, challan details, quantity, and weight of incoming yarn, fabric, chemicals, or spares.
* **Next Step Link**: Cross-referenced during GRN/Receipt entry in warehouse.

### STEP 31: Gate Outward Register
* **Menu Path**: GATE & SECURITY → Gate Outward
* **Purpose**: Log outgoing vehicles and materials.
* **Explanation**: Security register logging vehicle, driver, invoice/DC details, quantity, and authorized Gate Pass number for materials leaving the mill.
* **Next Step Link**: Closes the outbound transit loop.

### STEP 32: Gate Pass Creation
* **Menu Path**: GATE & SECURITY → Gate Pass Creation
* **Purpose**: Authorize material/vehicle clearance.
* **Explanation**: Supervisors generate returnable (job work) or non-returnable (sales dispatch) passes specifying material details, authorized vehicle, and driver.
* **Next Step Link**: Verified at the security gate to create a Gate Outward entry.

### STEP 33: Gate Reports
* **Menu Path**: GATE & SECURITY → Gate Reports
* **Purpose**: Analytics and yard traffic log.
* **Explanation**: Provides yard occupancy dashboard, average turnaround time (TAT) per vehicle, and consolidated gate traffic audit registers.
* **Next Step Link**: Provides operational visibility to plant management.

---

# SECTION 3: KEY PROCESS RULES & DATA FLOW CALCULATIONS

### 1. Weaving Wage Calculation (Weaving PO)
Weaving wages are calculated using one of two methods:
* **Option A (Per Meter / Cooly/Mtr)**:
  $$\text{Weaving Charge} = \text{Order Meters} \times \text{Rate per Meter}$$
* **Option B (Per Pick / Cooly/Pick)**:
  $$\text{Weaving Charge} = \text{Order Meters} \times \text{Picks per Inch (PPI)} \times \text{Rate per Pick}$$

### 2. Sizing Weight Gain & Warping Weight Loss
* **Warping**: Involves mechanical sorting. Yarn wastage (snapping, ends) results in a small weight loss ($1\% - 2\%$).
* **Sizing**: Starch and moisture are absorbed by the yarn. Sizing results in a weight gain ($8\% - 12\%$).
  $$\text{Sized Weight} = \text{Un-sized Weight} \times (1 + \text{Starch Add-on \%})$$

### 3. Fabric Finishing Shrinkage
* During finishing and sanforizing, fabric undergoes physical shrinkage.
  $$\text{Shrinkage \%} = \frac{\text{Grey Meters Sent} - \text{Finished Meters Received}}{\text{Grey Meters Sent}} \times 100$$
* A shrinkage loss of $2\% - 4\%$ is standard.

### 4. Yield Reconciliation Formula
$$\text{Total Material Weight Issued} = \text{Fabric Weight Received} + \text{Waste Weight} + \text{Returned Yarn Weight}$$
* Reconciles yarn weight (warp beam + weft yarn) issued against finished goods.

================================================================================
