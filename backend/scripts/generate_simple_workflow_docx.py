"""
Script to generate:
'Handloom_ERP_Simple_Understandable_Workflow_Guide.docx'
A simple, plain-English, highly structured Word document explaining how the Handloom ERP is working now,
written specifically for HR, management, and operational clarity.
"""
import os
import sys
from datetime import datetime
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def build_simple_workflow_document(output_path):
    print(f"Generating simple workflow document: {output_path}")
    doc = docx.Document()

    # Configure Margins (0.85 inch for clean professional reading)
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Cohesive Color Palette
    C_PRIMARY = RGBColor(30, 58, 138)       # Deep Classic Navy #1E3A8A
    C_SECONDARY = RGBColor(13, 148, 136)    # Warm Teal #0D9488
    C_ACCENT = RGBColor(67, 56, 202)        # Indigo #4338CA
    C_DARK = RGBColor(31, 41, 55)           # Off-Black Slate #1F2937
    C_MUTED = RGBColor(100, 116, 139)       # Slate Gray #64748B
    C_SUCCESS = RGBColor(22, 101, 52)       # Forest Green #166534

    HEX_PRIMARY = "1E3A8A"
    HEX_SECONDARY = "0D9488"
    HEX_ALT_ROW = "F8FAFC"
    HEX_BORDER = "CBD5E1"

    # XML Helper Functions
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=90, bottom=90, left=130, right=130):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m_name, m_val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m_name}')
            node.set(qn('w:w'), str(m_val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:left w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'  <w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def format_table_header(row, col_widths, titles):
        for idx, cell in enumerate(row.cells):
            cell.width = col_widths[idx]
            set_cell_background(cell, HEX_PRIMARY)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(titles[idx])
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)

    def format_table_row(row, col_widths, values, is_even=False):
        fill_color = HEX_ALT_ROW if is_even else "FFFFFF"
        for idx, cell in enumerate(row.cells):
            cell.width = col_widths[idx]
            set_cell_background(cell, fill_color)
            set_cell_margins(cell, top=75, bottom=75, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(str(values[idx]))
            run.font.name = "Arial"
            run.font.size = Pt(9)
            run.font.color.rgb = C_DARK

    def add_heading_1(text):
        h = doc.add_heading(level=1)
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(15)
        run.bold = True
        run.font.color.rgb = C_PRIMARY
        return h

    def add_heading_2(text):
        h = doc.add_heading(level=2)
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(12)
        run.bold = True
        run.font.color.rgb = C_SECONDARY
        return h

    def add_heading_3(text):
        h = doc.add_heading(level=3)
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        run = h.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10.5)
        run.bold = True
        run.font.color.rgb = C_ACCENT
        return h

    def add_paragraph(text, bold_prefix=None, italic=False, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.bold = True
            r_pre.font.color.rgb = C_DARK
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.italic = italic
        r.font.color.rgb = C_DARK
        return p

    def add_bullet_point(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(9.5)
            r_pre.bold = True
            r_pre.font.color.rgb = C_DARK
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.color.rgb = C_DARK
        return p

    def add_callout(text, title="KEY BENEFIT", fill_hex="F0FDF4", border_color="16A34A"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, fill_hex)
        set_cell_margins(cell, top=110, bottom=110, left=150, right=130)
        
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="20" w:space="0" w:color="{border_color}"/>'
            f'  <w:top w:val="none"/>'
            f'  <w:right w:val="none"/>'
            f'  <w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.15
        
        r_title = p.add_run(f"[{title}]  ")
        r_title.bold = True
        r_title.font.name = "Arial"
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = RGBColor(22, 101, 52) if border_color == "16A34A" else RGBColor(30, 58, 138)
        
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = C_DARK
        
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    def add_code_block(text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        
        tcPr = cell._tc.get_or_add_tcPr()
        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'  <w:left w:val="single" w:sz="16" w:space="0" w:color="0284C7"/>'
            f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(text)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(15, 23, 42)
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    # -------------------------------------------------------------
    # 1. TITLE / COVER SECTION
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(35)
    p_title.paragraph_format.space_after = Pt(6)
    r_t1 = p_title.add_run("HANDLOOM ENTERPRISE RESOURCE PLANNING")
    r_t1.font.name = "Arial"
    r_t1.font.size = Pt(22)
    r_t1.bold = True
    r_t1.font.color.rgb = C_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r_t2 = p_sub.add_run("How the System Works: Complete End-to-End Workflow in Simple Terms")
    r_t2.font.name = "Arial"
    r_t2.font.size = Pt(13)
    r_t2.font.color.rgb = C_SECONDARY

    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(0)
    p_div.paragraph_format.space_after = Pt(20)
    r_div = p_div.add_run("―" * 45)
    r_div.font.color.rgb = C_SECONDARY
    r_div.bold = True

    # Overview Box
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.LEFT
    set_table_borders(meta_table, color="CBD5E1", sz="4")
    m_widths = [Inches(2.2), Inches(4.6)]
    m_data = [
        ("Purpose of this Guide", "Explaining how Handloom ERP works in simple, clear, layman terms for HR & Management"),
        ("Live Connected Stack", "PostgreSQL Database (Port 5432) + FastAPI Backend (Port 8000) + React Vite (Port 5173)"),
        ("Current Data Load", "890+ Dropdown Options, 50 Master Categories, 23 Companies/Mills, 17 Active Staff Members"),
        ("Scenario Walkthrough", "A new buyer orders 5,000 meters of pure cotton fabric -> From first inquiry to bank payment"),
        ("Target Audience", "HR Managers, Department Heads, System Evaluators, and Factory Supervisors")
    ]
    for idx, (k, v) in enumerate(m_data):
        row = meta_table.rows[idx]
        for c_idx, cell in enumerate(row.cells):
            cell.width = m_widths[c_idx]
            set_cell_background(cell, "F8FAFC" if c_idx == 0 else "FFFFFF")
            set_cell_margins(cell, top=65, bottom=65, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(k if c_idx == 0 else v)
            run.font.name = "Arial"
            run.font.size = Pt(9)
            if c_idx == 0:
                run.bold = True
                run.font.color.rgb = C_PRIMARY
            else:
                run.font.color.rgb = C_DARK

    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. SYSTEM ARCHITECTURE IN PLAIN ENGLISH
    # -------------------------------------------------------------
    add_heading_1("1. How the System is Set Up and Working Right Now")
    
    add_paragraph(
        "Think of the Handloom ERP as a modern digital factory office with three essential parts working together in real time:",
        bold_prefix="The 3-Part Architecture: "
    )
    
    add_bullet_point(
        "This is the website you open on your screen at http://localhost:5173. It is what users see and touch: clean forms, clickable buttons, live colorful dashboards, and printable invoices.",
        bold_prefix="1. The Visual Screen (React Frontend): "
    )
    add_bullet_point(
        "This is the engine running quietly behind the scenes at http://localhost:8000. It checks passwords, calculates yarn weights, verifies taxes (GST), and makes sure no unauthorized actions occur.",
        bold_prefix="2. The Calculation Engine (FastAPI Backend): "
    )
    add_bullet_point(
        "This is the ultra-secure digital vault (PostgreSQL 18) that remembers every customer name, design pattern, roll of cloth, and rupee spent. It never loses data, even if power is switched off.",
        bold_prefix="3. The Digital Vault (PostgreSQL Database): "
    )

    add_callout(
        "What is Working Now: All three layers are actively connected and communicating. When you select a dropdown or click save on your screen, "
        "the backend processes it in milliseconds and stores it securely in PostgreSQL. When invoices are made, double-entry financial entries are automatically posted in CubeBook.",
        title="LIVE STATUS VERIFIED",
        fill_hex="F0FDF4",
        border_color="16A34A"
    )

    # -------------------------------------------------------------
    # 3. THE BIG PICTURE: THE CUSTOMER JOURNEY
    # -------------------------------------------------------------
    add_heading_1("2. The Story: Taking a Customer from 'Hello' to 'Delivered & Paid'")
    
    add_paragraph(
        "To easily explain the system to HR, follow this simple real-life story:"
    )
    add_paragraph(
        "A premier customer named 'Heritage Handloom Creations Pvt Ltd' comes to our enterprise. They want 5,000 meters of high-grade pure cotton "
        "cambric fabric. Here is the journey of how Handloom ERP handles this request effortlessly:"
    )

    add_code_block(
        "+---------------------------------------------------------------------------------------------------+\n"
        "|                             THE 11 SIMPLE STEPS OF THE CUSTOMER JOURNEY                           |\n"
        "+---------------------------------------------------------------------------------------------------+\n"
        "  Step 1:  Add Customer         -> Register customer with address, GST, and safety credit limit\n"
        "  Step 2:  Design Fabric        -> Enter fabric specs (threads, width); computer calculates yarn needs\n"
        "  Step 3:  Calculate Cost       -> Add up raw yarn, dyeing, weaving, and profit; fix sales price\n"
        "  Step 4:  Book Order           -> Book official Buyer Order; issue Proforma Invoice; get manager approval\n"
        "  Step 5:  Plan Looms (PPC)     -> Assign order to a loom & master weaver; system predicts finish date\n"
        "  Step 6:  Buy Raw Yarn         -> Order cotton yarn from spinning mill; check weight at factory gate\n"
        "  Step 7:  Produce Fabric       -> Send yarn for Dyeing, Sizing, and Weaving; receive raw woven cloth\n"
        "  Step 8:  Inspect Quality      -> Mount cloth on lighted table; count defects; stick barcodes on rolls\n"
        "  Step 9:  Pack & Clear         -> Box rolls into cartons; Accounts & QA sign off release advice (GRA)\n"
        "  Step 10: Invoice & Dispatch   -> Print GST Tax Invoice; generate govt E-Way bill; truck leaves factory\n"
        "  Step 11: Collect Payment      -> Receive bank transfer; customer balance automatically becomes Zero!\n"
        "+---------------------------------------------------------------------------------------------------+"
    )

    # -------------------------------------------------------------
    # 4. STEP-BY-STEP EXPLANATION IN SIMPLE TERMS
    # -------------------------------------------------------------
    add_heading_1("3. Detailed Step-by-Step Workflow (Simple & Clear)")

    # STEP 1
    add_heading_2("Step 1: Adding the New Customer (Party Master)")
    add_paragraph(
        "Before doing business with anyone, we must know who they are. In the old days, companies wrote customer details on paper cards. "
        "In Handloom ERP, we register them once in the Party Master.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Textile Operations -> Party Master (URL: /party-master), click '+ Add Party'.", bold_prefix="Where to click: ")
    add_bullet_point("Enter the company name ('Heritage Handloom Creations Pvt Ltd'), address in Chennai, GST number, and contact person.", bold_prefix="What you enter: ")
    add_bullet_point("We set a Credit Limit of ₹15 Lakhs and 30 Days Credit. This protects our company: the computer will automatically block any orders that exceed this safety limit!", bold_prefix="Safety feature: ")
    add_bullet_point("The customer is saved, and the system automatically creates their ledger in the finance module so accountants don't have to re-type it later.", bold_prefix="What happens behind the scenes: ")

    # STEP 2
    add_heading_2("Step 2: Designing the Fabric & Calculating Yarn (Design Entry)")
    add_paragraph(
        "The customer gives us a swatch (small fabric sample). We need to know: 'How is this cloth constructed, and how much yarn do we need to buy?'",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Design Management -> Design Entry (URL: /design-entry), click '+ New Design'.", bold_prefix="Where to click: ")
    add_bullet_point("Enter Design No 'DSG-HERITAGE-401', select 'Pure Cotton', 54 inches wide, 72 Reed (horizontal threads) and 68 Picks (vertical threads).", bold_prefix="What you enter: ")
    add_bullet_point("You can upload a photo of the swatch. The built-in AI computer vision automatically analyzes the dominant colors (e.g., Navy Blue 65%, White 35%).", bold_prefix="AI feature: ")
    add_bullet_point("The Weaving Calculator does the math instantly. For 5,000 meters, it calculates that we need exactly 620.5 Kg of lengthwise yarn (warp) and 548.2 Kg of crosswise yarn (weft). Total yarn needed = 1,200 Kg.", bold_prefix="The magic calculation: ")

    # STEP 3
    add_heading_2("Step 3: Calculating Costs & Price (Costing Sheet)")
    add_paragraph(
        "A manufacturer must know their exact production costs before giving a quotation to the buyer so they never make a loss.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Pre-Production -> Costing Sheet (URL: /costing-sheet).", bold_prefix="Where to click: ")
    add_bullet_point("The system adds up every single penny:", bold_prefix="The Cost Breakdown: ")

    c_table = doc.add_table(rows=1, cols=3)
    c_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(c_table)
    c_widths = [Inches(2.2), Inches(1.8), Inches(2.8)]
    format_table_header(c_table.rows[0], c_widths, ["Cost Item", "Cost per Meter", "What it covers"])
    
    cost_rows = [
        ("Raw Cotton Yarn", "₹115.00", "Buying 1,200 Kg of raw combed yarn from spinning mills"),
        ("Yarn Dyeing Charges", "₹22.00", "Sending yarn cones to be dyed in navy blue color"),
        ("Warping & Sizing", "₹14.00", "Winding yarn onto large beams and coating with starch"),
        ("Weaving Charges", "₹38.00", "Paying the weaver and loom running costs"),
        ("Finishing & Washing", "₹18.00", "Washing, heat-setting width on stenter, and smoothing"),
        ("Cartons & Packing", "₹5.00", "Poly-wrapping and heavy corrugated export boxes"),
        ("Factory Profit & Overheads", "₹28.00", "Electricity, factory rent, staff salaries, and 15% net profit"),
        ("FINAL SALES PRICE", "₹240.00 / Mtr", "Total agreed selling rate quoted to the customer")
    ]
    for idx, r_data in enumerate(cost_rows):
        row = c_table.add_row()
        format_table_row(row, c_widths, r_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(3)

    # STEP 4
    add_heading_2("Step 4: Booking the Order & Getting Approval (Buyer Order)")
    add_paragraph(
        "Once the customer agrees to the price of ₹240/meter, we book the official contract.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Merchandising -> Buyer Order (URL: /buyer-order), click '+ New Buyer Order'.", bold_prefix="Where to click: ")
    add_bullet_point("Select customer 'Heritage Handloom Creations Pvt Ltd'. The system auto-fills their address, GST, and terms. The system auto-generates order number 'IBPO-00105'.", bold_prefix="What you enter: ")
    add_bullet_point("In the item table, select 5,000 meters at ₹240/meter. Total = ₹12,00,000 + 5% GST (₹60,000) = ₹12,60,000.", bold_prefix="Order values: ")
    add_bullet_point("Strict Management Approval: Work cannot begin yet! The order sits in 'Draft' until the General Manager reviews it in the Approval Desk (/work-order/approval/buyer-order) and clicks 'Approve'. This prevents unauthorized production.", bold_prefix="Control Gate: ")

    # STEP 5
    add_heading_2("Step 5: Planning the Machine & Loom (PPC Tracker)")
    add_paragraph(
        "PPC stands for 'Production Planning & Control'. It answers: 'Which machine will weave this cloth, who will operate it, and when will it finish?'",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to PPC -> Live Dashboard (URL: /ppc/tracking/live-dashboard).", bold_prefix="Where to click: ")
    add_bullet_point("Find order IBPO-00105 and click 'Allocate Loom'. We assign Loom #L-08 (Shed A) and Master Weaver Ramanathan.", bold_prefix="What you do: ")
    add_bullet_point("Smart ETA Engine: The machine runs at 160 picks per minute. The computer calculates that 5,000 meters will take exactly 18 working days. It gives an exact delivery forecast date so we never disappoint the customer.", bold_prefix="Smart feature: ")

    # STEP 6
    add_heading_2("Step 6: Buying Raw Yarn & Checking It at the Gate (Procurement)")
    add_paragraph(
        "We cannot weave cloth without raw yarn. We order the yarn from a trusted spinning mill and verify it when it arrives.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Create Yarn Purchase Order (/yarn/purchase-order): Order 1,200 Kg from Lakshmi Spinning Mills Ltd.", bold_prefix="Step 6A (Purchase): ")
    add_bullet_point("Gate Inward (/gate/inward): When the delivery truck arrives at the factory gate, security weighs the truck (Gross Weight: 4,500 Kg, Tare: 3,300 Kg, Net Yarn: 1,200 Kg) and issues a digital Gate Pass.", bold_prefix="Step 6B (Security): ")
    add_bullet_point("Stores GRN (/yarn/inward): The warehouse team counts the 24 bags, checks yarn quality, creates a Goods Receipt Note (GRN), and places the yarn in 'Rack Y-02, Bin 4'.", bold_prefix="Step 6C (Warehouse): ")

    # STEP 7
    add_heading_2("Step 7: Manufacturing the Cloth (Multi-Stage Job Work)")
    add_paragraph(
        "Textile manufacturing happens in sequential steps, often across specialized partner units. Handloom ERP tracks every single gram of yarn so none is stolen or wasted:",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Send 1,200 Kg raw yarn to Rainbow Dyeing Mills. They dye it navy blue and return 1,188 Kg of dyed cones (12 Kg allowable 1% process loss accounted for).", bold_prefix="1. Yarn Dyeing: ")
    add_bullet_point("Send 650 Kg dyed warp yarn to Sri Krishna Sizing Works. They wind it onto 2 large warp beams (Beams #B-101 and B-102) with starch sizing.", bold_prefix="2. Warping & Sizing: ")
    add_bullet_point("Deliver the warp beams and remaining 538 Kg weft yarn to Loom Shed A. Master Weaver Ramanathan weaves it on Loom L-08.", bold_prefix="3. Weaving: ")
    add_bullet_point("The factory receives 5,050 meters of raw woven cloth rolls into the cloth store (/cloth/inward).", bold_prefix="4. Greige Cloth Inward: ")

    # STEP 8
    add_heading_2("Step 8: Checking Quality & Sticking Barcodes (Inspection)")
    add_paragraph(
        "Before shipping to a buyer, we must guarantee the fabric is defect-free so they don't reject it or deduct penalties.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Cloth Management -> On-Table Checking (URL: /cloth/checking).", bold_prefix="Where to click: ")
    add_bullet_point("The cloth roll passes over an illuminated glass table under bright lights. The inspector looks for tiny flaws (slubs, broken threads, holes).", bold_prefix="How it works: ")
    add_bullet_point("International 4-Point System: Each defect gets 1 to 4 penalty points based on size. The computer adds them up. Our roll scores 8.5 points (well below the allowable limit of 20 points).", bold_prefix="Scoring: ")
    add_bullet_point("The system automatically awards it 'Fresh (Grade-A Export Quality)'. It generates 10 unique barcode roll stickers (Roll #R-HER-001 to R-HER-010, 500 meters each).", bold_prefix="Barcode output: ")

    # STEP 9
    add_heading_2("Step 9: Packaging & Double Approval (Packing & GRA)")
    add_paragraph(
        "The approved fabric is packed safely for long-distance transport and checked one last time before release.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Warehouse Put-Away (/warehouse/putaway-entry): Rolls are stored safely in Finished Goods Godown #1.", bold_prefix="Storage: ")
    add_bullet_point("Packing Slip (/packing): We create Packing Slip #PS-2026-065. The 10 rolls are wrapped in moisture-proof plastic and packed into 5 sturdy master boxes (Box #C1 to C5, Net Weight: 1,180 Kg).", bold_prefix="Packing: ")
    add_bullet_point("Goods Release Advice (GRA) (/goods-release): The final checkpoint! Both the Quality Head and the Accounts Manager must sign digitally. Quality certifies the fabric is Grade-A, and Accounts confirms the customer hasn't exceeded their credit limit. Only then can goods leave!", bold_prefix="Safety Gate: ")

    # STEP 10
    add_heading_2("Step 10: Printing the GST Tax Invoice & Dispatching (Billing & Fleet)")
    add_paragraph(
        "Goods are ready to leave the premises accompanied by legal tax and transportation documents.",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Commercial Billing -> Sales Invoice (URL: /sales-invoice), click '+ Create Invoice'.", bold_prefix="Where to click: ")
    add_bullet_point("Select Order IBPO-00105 and Packing Slip PS-2026-065. The system generates official Tax Invoice #INV-2026-0018 for ₹12,00,000 + CGST (₹30,000) + SGST (₹30,000) = Total ₹12,60,000.", bold_prefix="Invoice generation: ")
    add_bullet_point("Government E-Way Bill (/eway-bill): The system generates E-Way Bill #EWB-8921-3310-9941 with transporter details (Blue Dart Logistics, Truck #TN-38-BZ-4412) and official QR code.", bold_prefix="Govt Compliance: ")
    add_bullet_point("Outward Gate Pass (/gate/outward): Security inspects the truck, scans the 5 boxes, and opens the factory gate.", bold_prefix="Departure: ")

    # STEP 11
    add_heading_2("Step 11: Automatic Accounting in CubeBook (Payment & Zero Balance)")
    add_paragraph(
        "Here is the crowning achievement of Handloom ERP: factory floor actions talk directly to financial ledgers without human intervention!",
        bold_prefix="What this step does: "
    )
    add_bullet_point("Go to Finance -> CubeBook Dashboard (URL: /cubebook/dashboard).", bold_prefix="Where to click: ")
    add_bullet_point("Automatic Double-Entry Posting: The exact second Sales Invoice #INV-2026-0018 was saved, CubeBook automatically posted the balanced accounting entry:", bold_prefix="Magic Bookkeeping: ")

    add_code_block(
        "AUTOMATIC SALES VOUCHER (No Accountant Entry Required!)\n"
        "---------------------------------------------------------------------------------\n"
        "DEBIT  : Sundry Debtors - Heritage Handloom Creations Pvt Ltd : Rs. 12,60,000.00\n"
        "CREDIT : Sales Revenue Account (Finished Cotton Fabric)       : Rs. 12,00,000.00\n"
        "CREDIT : Output CGST 2.5% Tax Payable                         : Rs.     30,000.00\n"
        "CREDIT : Output SGST 2.5% Tax Payable                         : Rs.     30,000.00\n"
        "TOTAL DEBITS = TOTAL CREDITS (Perfect Balance)\n"
        "---------------------------------------------------------------------------------"
    )

    add_bullet_point(
        "Collecting Payment: 15 days later, the customer pays ₹12,60,000 via NEFT to our HDFC bank account. "
        "We log a Receipt Voucher (/accounts/voucher-entry). Customer ledger drops from ₹12,60,000 to Rs. 0.00 (Fully Paid).",
        bold_prefix="Payment Closure: "
    )
    add_bullet_point(
        "Financial Statements: The enterprise Balance Sheet and Profit & Loss statement immediately update, showing ₹12 Lakhs in sales revenue and healthy factory profits.",
        bold_prefix="Final Result: "
    )

    # -------------------------------------------------------------
    # 5. WHY HR & MANAGEMENT LOVE THIS SYSTEM
    # -------------------------------------------------------------
    add_heading_1("4. The 5 Major Business Benefits to Tell Your HR")
    
    add_paragraph("When your HR or executive team asks: 'Why is this project so valuable to our enterprise?', give them these 5 clear points:")

    add_bullet_point(
        "In manual mills, an order is written on paper, then re-typed by production, re-typed by stores, and re-typed by accounts. "
        "In Handloom ERP, data entered once at the start flows automatically across all 11 stages. Zero wasted time.",
        bold_prefix="1. Zero Duplicate Work: "
    )
    add_bullet_point(
        "In handloom production, 5% to 8% of profits disappear because yarn sent to outside dyers or sizers is unaccounted for. "
        "Handloom ERP tracks every single gram issued, received, and allowable loss.",
        bold_prefix="2. Zero Yarn Leakage: "
    )
    add_bullet_point(
        "The system has built-in digital locks. Production cannot start without a signed Proforma Invoice, and goods cannot leave the gate "
        "without a signed Goods Release Advice (GRA) confirming the customer's credit limit is safe.",
        bold_prefix="3. Total Financial Safety: "
    )
    add_bullet_point(
        "Instead of guessing fabric weight or delivery dates, our AI vision analyzes swatches and our weaving calculator uses mathematical formulas "
        "to predict yarn consumption and exact machine completion dates.",
        bold_prefix="4. AI & Mathematical Precision: "
    )
    add_bullet_point(
        "Every single action (who clicked what, at what time, from which computer) is saved in an un-editable audit log. "
        "The company is 100% audit-ready for GST authorities, external chartered accountants, and ISO quality auditors.",
        bold_prefix="5. 100% Audit Readiness: "
    )

    # -------------------------------------------------------------
    # 6. QUICK DEMONSTRATION CHEAT-SHEET
    # -------------------------------------------------------------
    add_heading_1("5. Quick Demonstration Cheat-Sheet (Your Screen-by-Screen Script)")
    add_paragraph("Keep this table in front of you while presenting to your HR:")

    cheat_table = doc.add_table(rows=1, cols=4)
    cheat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(cheat_table)
    ch_widths = [Inches(1.2), Inches(1.8), Inches(1.8), Inches(2.0)]
    format_table_header(cheat_table.rows[0], ch_widths, ["Step", "Screen to Open", "What to Show", "What to Say to HR"])

    demo_steps = [
        ("Step 1", "Party Master (/party-master)", "Customer 'Heritage Handlooms' with 32 party types and credit limits", "'Here we register the buyer with complete tax and credit safety controls.'"),
        ("Step 2", "Design Entry (/design-entry)", "Design 'DSG-HERITAGE-401' with AI swatch & yarn calculator", "'Our AI analyzes colors and calculates exact yarn needed before we spend money.'"),
        ("Step 3", "Costing Sheet (/costing-sheet)", "Itemized cost breakdown: ₹115 yarn + ₹92 jobwork + margin = ₹240", "'We calculate costs down to the penny so the company never sells at a loss.'"),
        ("Step 4", "Buyer Order (/buyer-order)", "Order IBPO-00105 for 5,000 Mtr with Approved status", "'Merchandisers book the order, but production is locked until management approves.'"),
        ("Step 5", "PPC Live (/ppc/tracking/live-dashboard)", "Loom #L-08 allocation and 18-day ETA forecast", "'Our live board tracks machine efficiency and predicts exact completion dates.'"),
        ("Step 6", "Yarn Management (/yarn/purchase-order)", "YPO for 1,200 Kg and Gate GRN with rack allocation", "'Raw materials are weighed at the gate and tracked to exact warehouse bins.'"),
        ("Step 7", "Job Work & Cloth (/cloth/inward)", "Yarn dyeing, warping, and 5,050 meters cloth receipt", "'We track every gram sent to outside dye houses to eliminate yarn theft.'"),
        ("Step 8", "Quality (/cloth/checking)", "4-Point defect scoring and 10 barcode roll stickers", "'We inspect under bright lights; only Grade-A cloth gets customer barcodes.'"),
        ("Step 9", "Packing & Release (/packing, /goods-release)", "5 master cartons and dual Quality/Credit GRA sign-off", "'Goods cannot leave the dock without both QA and Accounts digital sign-off.'"),
        ("Step 10", "Invoicing (/sales-invoice)", "Tax Invoice for ₹12.6 Lakhs with HSN 5208 and E-Way bill", "'The system auto-calculates GST and issues official transport documents.'"),
        ("Step 11", "Finance (/cubebook/dashboard)", "Auto-posted double entry voucher and zero customer balance", "'Invoices post directly to ledgers in real time without manual accountant entry.'")
    ]
    for idx, d_data in enumerate(demo_steps):
        row = cheat_table.add_row()
        format_table_row(row, ch_widths, d_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # 7. CONCLUSION
    # -------------------------------------------------------------
    add_heading_1("6. Conclusion")
    add_paragraph(
        "Handloom ERP bridges the traditional world of artisan handloom weaving with state-of-the-art enterprise software. "
        "By connecting every department on a single live platform, it protects company profits, eliminates material wastage, and gives management "
        "100% real-time control over their business.",
        bold_prefix="Summary: "
    )

    doc.save(output_path)
    print(f"Simple workflow document successfully created at: {output_path}")
    print(f"File size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    out_dir = r"c:\Users\user\Documents\Cube Ai Solutions Project\Handloom_ERP"
    out_file = os.path.join(out_dir, "Handloom_ERP_Simple_Understandable_Workflow_Guide.docx")
    build_simple_workflow_document(out_file)
