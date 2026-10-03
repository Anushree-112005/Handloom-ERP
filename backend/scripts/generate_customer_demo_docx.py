"""
Script to generate the comprehensive, publication-grade Word document:
'Handloom_ERP_Customer_To_Delivery_Demonstration_Guide.docx'
Specifically designed for HR presentation and end-to-end customer workflow demonstration.
"""
import os
import sys
from datetime import datetime
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_customer_demo_document(output_path):
    print(f"Generating document: {output_path}")
    doc = docx.Document()

    # Configure A4 Page Layout
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Color Palette - Professional Corporate Textile Palette
    C_PRIMARY = RGBColor(30, 58, 138)       # Deep Navy #1E3A8A
    C_SECONDARY = RGBColor(13, 148, 136)    # Teal #0D9488
    C_ACCENT = RGBColor(67, 56, 202)        # Indigo #4338CA
    C_DARK = RGBColor(31, 41, 55)           # Charcoal #1F2937
    C_MUTED = RGBColor(107, 114, 128)       # Cool Gray #6B7280
    C_SUCCESS = RGBColor(22, 101, 52)       # Emerald #166534

    HEX_PRIMARY = "1E3A8A"
    HEX_SECONDARY = "0D9488"
    HEX_LIGHT_BG = "F3F4F6"
    HEX_ALT_ROW = "F9FAFB"
    HEX_CALLOUT_BG = "F0FDF4"
    HEX_CALLOUT_BORDER = "16A34A"
    HEX_STEP_BG = "EFF6FF"
    HEX_STEP_BORDER = "3B82F6"

    # Helper Functions
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

    def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
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
            set_cell_margins(cell, top=110, bottom=110, left=130, right=130)
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
            set_cell_margins(cell, top=75, bottom=75, left=130, right=130)
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

    def add_callout(text, title="OPERATIONAL HIGHLIGHT", fill_hex="F0FDF4", border_color="16A34A"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.7)
        set_cell_background(cell, fill_hex)
        set_cell_margins(cell, top=120, bottom=120, left=160, right=140)
        
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
        cell.width = Inches(6.7)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
        
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
    # 1. COVER / TITLE PAGE
    # -------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(40)
    p_title.paragraph_format.space_after = Pt(8)
    run_t1 = p_title.add_run("HANDLOOM ENTERPRISE RESOURCE PLANNING")
    run_t1.font.name = "Arial"
    run_t1.font.size = Pt(22)
    run_t1.bold = True
    run_t1.font.color.rgb = C_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    run_t2 = p_sub.add_run("Customer Onboarding to Final Delivery: End-to-End Operational Lifecycle & Demonstration Manual")
    run_t2.font.name = "Arial"
    run_t2.font.size = Pt(12.5)
    run_t2.font.color.rgb = C_SECONDARY

    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(0)
    p_div.paragraph_format.space_after = Pt(24)
    run_div = p_div.add_run("―" * 45)
    run_div.font.color.rgb = C_SECONDARY
    run_div.bold = True

    # Scenario Metadata Box
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.LEFT
    set_table_borders(meta_table, color="CBD5E1", sz="4")
    m_widths = [Inches(2.2), Inches(4.5)]
    m_data = [
        ("Demonstration Target", "End-to-End Execution for a New Customer Order"),
        ("Scenario Customer", "Heritage Handloom Creations Pvt Ltd (Chennai, TN)"),
        ("Ordered Product", "5,000 Meters Pure Cotton Cambric Fabric (54\" Width, 72x68 Reed/Pick)"),
        ("Order Commercials", "Total Value: ₹12,60,000 (Basic ₹12,00,000 + 5% GST ₹60,000)"),
        ("Lifecycle Span", "Customer Creation -> Design & Costing -> Buyer Order -> PPC -> Raw Yarn PO -> Job Work -> 4-Point QC -> Warehouse -> Invoice/E-Way -> CubeBook Finance"),
        ("Evaluation Focus", "HR Assessment, Workflow Integrity, Zero Material Leakage, Real-Time Accounting")
    ]
    for idx, (k, v) in enumerate(m_data):
        row = meta_table.rows[idx]
        for c_idx, cell in enumerate(row.cells):
            cell.width = m_widths[c_idx]
            set_cell_background(cell, "F8FAFC" if c_idx == 0 else "FFFFFF")
            set_cell_margins(cell, top=70, bottom=70, left=110, right=110)
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
    # 2. EXECUTIVE BRIEFING FOR HR
    # -------------------------------------------------------------
    add_heading_1("1. Executive Briefing for HR & Management Demonstration")
    
    add_paragraph(
        "This demonstration manual is structured specifically to present the Handloom ERP system to Human Resources (HR) and executive leadership. "
        "It proves the system's operational completeness by walking through the exact life cycle of an enterprise transaction: a brand-new buyer "
        "approaches the mill, requests a custom fabric development, books a bulk production order, triggers manufacturing across multiple specialized "
        "job work units, clears quality inspection, and receives goods accompanied by GST tax invoices, E-Way bills, and automated financial ledgers.",
        bold_prefix="Demonstration Purpose: "
    )

    add_paragraph(
        "Unlike generic ERP solutions that treat textiles as simple finished goods, Handloom ERP handles the intricate material transformations "
        "unique to textile production: fiber counts, yarn doubling, hank/cone dyeing shrinkage, beam warping/sizing length loss, loom reed picks, "
        "greige fabric on-table inspection, and wet-processing finishing. Every gram of material and rupee of expenditure is tracked and reconciled.",
        bold_prefix="Textile Domain Complexity: "
    )

    add_callout(
        "Core Assessment Value: This scenario demonstrates that Handloom ERP breaks departmental silos. An action performed by the Merchandiser "
        "automatically triggers requirements for the PPC Manager, the Purchase Officer, the Weaving Supervisor, the Quality Inspector, and the "
        "CubeBook Financial Accountant without redundant data entry.",
        title="EXECUTIVE TAKEAWAY",
        fill_hex="EFF6FF",
        border_color="2563EB"
    )

    # -------------------------------------------------------------
    # 3. HIGH-LEVEL LIFECYCLE MAP (SEPARATE WORKFLOW FOR HR)
    # -------------------------------------------------------------
    add_heading_1("2. High-Level Lifecycle Map (The HR Workflow Requirement)")
    
    add_paragraph(
        "Below is the complete 11-stage chronological value stream guiding the customer order from inception to balance sheet realization:"
    )

    add_code_block(
        "=========================================================================================\n"
        "                  HANDLOOM ERP: 11-STAGE ORDER-TO-DELIVERY VALUE STREAM\n"
        "=========================================================================================\n"
        "\n"
        "  [ STAGE 1: CUSTOMER CREATION ] ===> Party Master (GST, Credit Limits, Address, Terms)\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 2: DESIGN & CALCULATOR ] ==> Design Entry (EPI, PPI, Total Ends) + AI Vision Swatch\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 3: COMMERCIAL COSTING ] ===> Costing Sheet (Yarn + Jobwork + Overheads + Margin)\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 4: BUYER ORDER & PI ] =====> IBPO Booking -> Proforma Invoice (PI) -> Approval Desk\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 5: PPC LOOM ALLOCATION ] ==> Loom Master Allocation + ETA Calculation Engine\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 6: RAW YARN PROCUREMENT ] => Yarn Purchase Order (YPO) -> Gate Inward -> Stores GRN\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 7: JOB WORK PIPELINE ] ====> Yarn Dyeing -> Warping/Sizing -> Weaving -> Greige Inward\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 8: 4-POINT QC CHECKING ] ==> Illuminated Inspection Table -> Defect Scoring -> Barcoding\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 9: WAREHOUSE & PACKING ] ==> Godown Put-Away -> Master Packing Slip -> Goods Release (GRA)\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 10: INVOICE & DISPATCH ] ==> GST Sales Tax Invoice -> E-Way Bill -> Transporter Gate Pass\n"
        "                |\n"
        "                v\n"
        "  [ STAGE 11: CUBEBOOK FINANCE ] ====> Real-Time Auto Double Entry -> Payment Receipt -> Zero Balance\n"
        "========================================================================================="
    )

    # -------------------------------------------------------------
    # 4. STEP-BY-STEP OPERATIONAL GUIDE (WITH SAMPLE DATA & SCREENS)
    # -------------------------------------------------------------
    add_heading_1("3. Step-by-Step Operational Demonstration Guide")
    add_paragraph(
        "Follow these exact steps during your live presentation to demonstrate each module seamlessly."
    )

    # STAGE 1
    add_heading_2("Stage 1: Customer Onboarding in Party Master")
    add_paragraph(
        "Every relationship begins by registering the client. The Party Master maintains unified data for billing, shipping, credit control, "
        "and GST compliance."
    )
    add_bullet_point("Navigate to sidebar: Textile Operations -> Party Master (URL: /party-master).", bold_prefix="Navigation: ")
    add_bullet_point("Click the '+ Add Party' button at the top-right of the table.", bold_prefix="Action: ")

    stage1_table = doc.add_table(rows=1, cols=3)
    stage1_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(stage1_table)
    s1_widths = [Inches(1.8), Inches(2.2), Inches(2.7)]
    format_table_header(stage1_table.rows[0], s1_widths, ["Form Tab / Field", "Sample Demonstration Data", "Technical / Business Significance"])
    
    s1_data = [
        ("Party Type", "Customer", "Defines the party role as a sales debtor."),
        ("Party Group", "Buyer", "Categorizes party for financial grouping in CubeBook."),
        ("Company Name", "Heritage Handloom Creations Pvt Ltd", "Official legal registered entity name."),
        ("Contact Person & Phone", "Mr. Rajesh Varma | +91 98410 12345", "Direct operational coordinator."),
        ("Email Address", "orders@heritagehandlooms.com", "Auto-recipient for PIs, Invoices, and Dispatch alerts."),
        ("Billing Address", "No. 45, Weaver's Colony, Gandhi Road", "Standard registered billing location."),
        ("City, District & State", "Chennai, Chennai, Tamil Nadu", "Governs intra-state GST calculation (CGST + SGST)."),
        ("PIN Code & Country", "600028 | India", "Mandatory for E-Way bill distance computation."),
        ("GST No (GSTIN)", "33AABCH1234F1Z9", "Valid Tamil Nadu GST identification number."),
        ("PAN Card Number", "AABCH1234F", "Statutory tax identifier."),
        ("Credit Days & Limit", "30 Days | ₹15,00,000", "Credit control threshold preventing unauthorized orders."),
        ("Payment Terms", "30 Days Net", "Commercial agreement terms displayed on invoices.")
    ]
    for idx, row_data in enumerate(s1_data):
        row = stage1_table.add_row()
        format_table_row(row, s1_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_bullet_point("Click 'Save Party'. The system assigns an ID and auto-syncs the customer to the Sundry Debtors ledger in CubeBook.", bold_prefix="Result: ")

    # STAGE 2
    add_heading_2("Stage 2: Design Entry, AI Swatch Analysis & Weaving Calculator")
    add_paragraph(
        "Textile manufacturing requires exact engineering specifications before spinning or weaving can begin."
    )
    add_bullet_point("Navigate to sidebar: Design Management -> Design Entry (URL: /design-entry).", bold_prefix="Navigation: ")
    add_bullet_point("Click '+ New Design' to open the engineering specification form.", bold_prefix="Action: ")

    stage2_table = doc.add_table(rows=1, cols=3)
    stage2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(stage2_table)
    s2_widths = [Inches(1.8), Inches(2.2), Inches(2.7)]
    format_table_header(stage2_table.rows[0], s2_widths, ["Field Name", "Sample Demonstration Data", "Engineering Function"])
    
    s2_data = [
        ("Design Number", "DSG-HERITAGE-401", "Unique CAD identification code."),
        ("Fabric Type & Weave", "Cotton | Plain / Cambric", "Base fiber and structural weave pattern."),
        ("Reed Count & Width", "72s Reed | 54 Inches", "Determines loom warp spacing and fabric width."),
        ("Picks Per Inch (PPI)", "68 Picks", "Determines weft density and fabric compactness."),
        ("Total Ends", "3,888 Ends", "Calculated as Reed Count × Reed Space."),
        ("Warp Yarn Count", "2/40s Combed Cotton", "Yarn specification for lengthwise warp threads."),
        ("Weft Yarn Count", "40s Single Combed Cotton", "Yarn specification for crosswise weft threads.")
    ]
    for idx, row_data in enumerate(s2_data):
        row = stage2_table.add_row()
        format_table_row(row, s2_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_paragraph(
        "AI Vision Swatch Demonstration: Upload a sample fabric swatch image. The integrated OpenCV and K-Means clustering algorithm "
        "extracts dominant color percentages (e.g., 65% Navy Blue #1E3A8A, 35% Off-White #F8FAFC) and verifies weave symmetry.",
        bold_prefix="AI Feature: "
    )
    add_paragraph(
        "Weaving Calculator: Click 'Calculate Requirements'. For 5,000 meters, the calculator computes exact yarn consumption: "
        "Warp Yarn Needed = 620.5 Kg | Weft Yarn Needed = 548.2 Kg | Total Yarn Requirement = 1,168.7 Kg (plus 3% process allowance = 1,200 Kg).",
        bold_prefix="Formula Output: "
    )

    # STAGE 3
    add_heading_2("Stage 3: Pre-Production Costing Sheet & Rate Quotation")
    add_paragraph(
        "Before booking the order, the enterprise locks in the unit economics to protect manufacturing margins."
    )
    add_bullet_point("Navigate to sidebar: Pre-Production -> Costing Sheet (URL: /costing-sheet).", bold_prefix="Navigation: ")
    add_bullet_point("Select Design 'DSG-HERITAGE-401' and target quantity 5,000 Meters.", bold_prefix="Action: ")

    cost_table = doc.add_table(rows=1, cols=3)
    cost_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(cost_table)
    c_widths = [Inches(2.0), Inches(2.0), Inches(2.7)]
    format_table_header(cost_table.rows[0], c_widths, ["Cost Element", "Unit Cost (per Meter)", "Calculation Notes"])
    
    cost_data = [
        ("Raw Yarn Consumption", "₹115.00 / Mtr", "Calculated from 1,200 Kg yarn at ₹480/Kg across 5,000 meters."),
        ("Yarn Dyeing Charges", "₹22.00 / Mtr", "Cone dyeing and vat shade processing at ₹90/Kg."),
        ("Warping & Sizing", "₹14.00 / Mtr", "High-speed beam warping and starch sizing."),
        ("Weaving Charges", "₹38.00 / Mtr", "Loom pick rate based on 68 picks per inch."),
        ("Finishing & Processing", "₹18.00 / Mtr", "Scouring, bleaching, stenter width fixing, and calendering."),
        ("Packaging & Forwarding", "₹5.00 / Mtr", "Poly-wrapping, master corrugated boxes, and strapping."),
        ("Overhead & Margin (15%)", "₹28.00 / Mtr", "Factory administrative overheads + net operating profit."),
        ("Final Quoted Rate", "₹240.00 / Mtr", "Agreed selling price per meter (Total: ₹12,00,000).")
    ]
    for idx, row_data in enumerate(cost_data):
        row = cost_table.add_row()
        format_table_row(row, c_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # STAGE 4
    add_heading_2("Stage 4: Buyer Order Booking & Proforma Invoice (PI) Approval")
    add_paragraph(
        "With the costing confirmed, the commercial sales contract is officially booked."
    )
    add_bullet_point("Navigate to sidebar: Merchandising -> Buyer Order (URL: /buyer-order).", bold_prefix="Navigation: ")
    add_bullet_point("Click '+ New Buyer Order'. Notice the system automatically assigns the next sequential IBPO number: 'IBPO-00105'.", bold_prefix="Action: ")

    stage4_table = doc.add_table(rows=1, cols=3)
    stage4_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(stage4_table)
    s4_widths = [Inches(1.8), Inches(2.2), Inches(2.7)]
    format_table_header(stage4_table.rows[0], s4_widths, ["Field Name", "Sample Demonstration Data", "Operational Rule"])
    
    s4_data = [
        ("IBPO Number", "IBPO-00105", "Auto-generated unique Internal Buyer Purchase Order number."),
        ("Order Date", datetime.now().strftime("%Y-%m-%d"), "Current transaction date."),
        ("Party / Customer Name", "Heritage Handloom Creations Pvt Ltd", "Auto-fills billing address, GSTIN, PAN, and payment terms."),
        ("Party PO Number", "HHC-PO-2026-99", "The customer's original external purchase order reference."),
        ("Merchandiser", "Anita Krishnan", "Responsible merchandising executive."),
        ("Delivery Target Date", "30 Days from today", "Target dispatch milestone."),
        ("Item Line - Design No", "DSG-HERITAGE-401", "Links back to CAD design specifications."),
        ("Item Line - Order Meters", "5,000 MTR", "Total fabric meterage ordered."),
        ("Item Line - Rate / Mtr", "₹240.00", "Base price before GST."),
        ("Item Line - GST %", "5.00%", "Applicable textile GST rate."),
        ("Total Taxable Value", "₹12,00,000.00", "Net value before tax."),
        ("GST Amount & Total", "₹60,000 | Total: ₹12,60,000", "Includes CGST ₹30,000 + SGST ₹30,000.")
    ]
    for idx, row_data in enumerate(s4_data):
        row = stage4_table.add_row()
        format_table_row(row, s4_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_paragraph(
        "Proforma Invoice & Approval Desk: Navigate to 'IPO / Proforma Invoice' (/ipo-invoice). Generate PI #PI-2026-088 and click 'Send to Approval'. "
        "Switch to 'Work Order Approvals' (/work-order/approval/buyer-order). Management signs off on credit terms. The order status updates from 'Draft' to 'Approved / In-Production'.",
        bold_prefix="Approval Gate: "
    )

    # STAGE 5
    add_heading_2("Stage 5: Production Planning & Control (PPC) Loom Allocation & ETA")
    add_paragraph(
        "The PPC module routes the approved order onto the shop floor to prevent loom idle time and guarantee delivery dates."
    )
    add_bullet_point("Navigate to sidebar: PPC Tracking -> Live Dashboard & Allocation (URL: /ppc/tracking/live-dashboard).", bold_prefix="Navigation: ")
    add_bullet_point("Locate order 'IBPO-00105' in the unallocated orders queue and click 'Allocate Loom'.", bold_prefix="Action: ")
    add_bullet_point("Assign Machine: Loom #L-08 (Shed A - 60\" Rapier / Handloom). Master Weaver: Ramanathan K.", bold_prefix="Assignment: ")
    add_bullet_point("ETA Calculation Engine (/ppc/eta-engine): The system computes loom capacity (68 picks/inch at 160 PPM = ~3.5 meters/hour per shift). For 5,000 meters, total production time is calculated at 18 operational days. The system forecasts completion 5 days ahead of the delivery deadline.", bold_prefix="ETA Engine: ")

    # STAGE 6
    add_heading_2("Stage 6: Raw Material Yarn Procurement & Warehouse Inward")
    add_paragraph(
        "To produce the 5,000 meters, the required raw yarn must be procured and verified at the factory gates."
    )
    add_bullet_point("Navigate to: Yarn Management -> Yarn Purchase Order (URL: /yarn/purchase-order).", bold_prefix="Navigation: ")
    add_bullet_point("Create YPO #YPO-2026-042 for Supplier 'Lakshmi Spinning Mills Ltd'. Item: 2/40s Combed Cotton Yarn Cones, Quantity: 1,200 Kg at ₹480/Kg.", bold_prefix="Purchase Order: ")
    add_bullet_point("Gate Inward Pass (/gate/inward): When the yarn delivery truck arrives, the security gate logs Vehicle #TN-33-AX-8890, Gross Weight: 4,500 Kg, Tare: 3,300 Kg, Net: 1,200 Kg. Gate Inward #GIN-2026-112 issued.", bold_prefix="Gate Control: ")
    add_bullet_point("Stores GRN Inward (/yarn/inward): Stores team verifies 24 bags (50 Kg each), inspects yarn moisture and count strength, approves Goods Receipt Note #GRN-YARN-094, and assigns stock to Rack Master location 'Rack Y-02, Bin 4'.", bold_prefix="Store GRN: ")

    # STAGE 7
    add_heading_2("Stage 7: Multi-Stage Job Work & Manufacturing Pipeline")
    add_paragraph(
        "Textile manufacturing requires specialized sequential job work stages. Material delivery challans (DC) and receipts maintain zero yarn leakage:"
    )

    jw_table = doc.add_table(rows=1, cols=4)
    jw_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(jw_table)
    jw_widths = [Inches(1.2), Inches(1.8), Inches(1.8), Inches(1.9)]
    format_table_header(jw_table.rows[0], jw_widths, ["Manufacturing Stage", "Delivery Challan (DC Out)", "External Facility", "Inward Receipt & Reconciliation"])
    
    jw_data = [
        ("1. Yarn Dyeing", "DC #DC-YD-044: Issue 1,200 Kg raw cotton cones.", "Rainbow Dyeing Mills (Erode)", "Receipt #YDR-038: 1,188 Kg dyed yarn cones (1% process loss reconciled)."),
        ("2. Warping & Sizing", "DC #DC-WS-051: Issue 650 Kg dyed warp yarn.", "Sri Krishna Sizing Works", "Receipt #WBR-029: 2 Warp Beams received (Beam #B-101 & B-102, 5,300m tape length)."),
        ("3. Weaving Execution", "Issue Beams + 538 Kg weft yarn to Shed A.", "Internal Shed A (Loom L-08)", "Weaving Receipt #CR-089: 5,050 meters woven greige cloth rolls received.")
    ]
    for idx, row_data in enumerate(jw_data):
        row = jw_table.add_row()
        format_table_row(row, jw_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # STAGE 8
    add_heading_2("Stage 8: 4-Point Quality Inspection & Fabric Grading")
    add_paragraph(
        "To prevent buyer rejections, the woven fabric passes through rigorous international quality control."
    )
    add_bullet_point("Navigate to: Cloth Management -> On-Table Checking (URL: /cloth/checking).", bold_prefix="Navigation: ")
    add_bullet_point("Inspector Raman mounts the fabric roll on the illuminated inspection table.", bold_prefix="Action: ")
    add_bullet_point("ASTM D5430 4-Point Defect Scoring: The inspector logs defects per 100 sq. meters. A 2-inch slub receives 2 penalty points; a broken pick receives 1 point. Total roll points scored: 8.5 points (well below the maximum 20-point export threshold).", bold_prefix="Defect Scoring: ")
    add_bullet_point("Automated Classification: System classifies the batch as 'Fresh' (Grade-A Export Quality).", bold_prefix="Grading: ")
    add_bullet_point("Barcode Tag Generation (/finished-fabric): 10 individual 500-meter rolls are generated, each receiving a unique barcode identifier (Roll #R-HER-001 to R-HER-010) storing meterage, weight, inspector ID, and date.", bold_prefix="Barcoding: ")

    # STAGE 9
    add_heading_2("Stage 9: Warehouse Put-Away, Packing Slip & Goods Release Advice (GRA)")
    add_paragraph(
        "Approved rolls move into finished goods inventory and are packaged for commercial shipping."
    )
    add_bullet_point("Warehouse Put-Away (/warehouse/putaway-entry): The 10 rolls are transferred to Finished Goods Warehouse 1, Shelf FG-08.", bold_prefix="Put-Away: ")
    add_bullet_point("Packing Slip Creation (/packing): Merchandiser creates Packing Slip #PS-2026-065 linking to order IBPO-00105. The 10 rolls are poly-wrapped and packed into 5 heavy-duty master cartons (Carton #C1 to C5, 1,000m / 240 Kg per carton). Net Weight: 1,180 Kg, Gross Weight: 1,205 Kg.", bold_prefix="Packing: ")
    add_bullet_point("Goods Release Advice (GRA) (/goods-release): GRA #GRA-2026-052 is submitted. Quality Control signs off on fabric grade; Accounts verifies that the order value does not breach the ₹15,00,000 credit limit. GRA is officially APPROVED.", bold_prefix="Release Gate: ")

    # STAGE 10
    add_heading_2("Stage 10: Commercial Sales Invoicing, GST E-Way Bill & Dispatch")
    add_paragraph(
        "With GRA cleared, the commercial sales invoice and statutory tax documents are generated."
    )
    add_bullet_point("Navigate to sidebar: Commercial Billing -> Sales Invoice (URL: /sales-invoice).", bold_prefix="Navigation: ")
    add_bullet_point("Click '+ Create Invoice', select Buyer Order 'IBPO-00105' and Packing Slip #PS-2026-065.", bold_prefix="Action: ")

    inv_table = doc.add_table(rows=1, cols=3)
    inv_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(inv_table)
    i_widths = [Inches(2.0), Inches(2.0), Inches(2.7)]
    format_table_header(inv_table.rows[0], i_widths, ["Invoice Parameter", "Value Generated", "Tax / Compliance Details"])
    
    i_data = [
        ("Tax Invoice Number", "INV-2026-0018", "Official sequential sales tax invoice."),
        ("Invoice Date", datetime.now().strftime("%Y-%m-%d"), "Recognizes sales revenue on this date."),
        ("Customer GSTIN", "33AABCH1234F1Z9", "Buyer's tax identity."),
        ("HSN Code", "5208", "Woven fabrics of cotton containing >= 85% by weight."),
        ("Taxable Order Value", "₹12,00,000.00", "5,000 meters at ₹240/meter."),
        ("CGST (2.5%)", "₹30,000.00", "Intra-state central GST."),
        ("SGST (2.5%)", "₹30,000.00", "Intra-state state GST."),
        ("Total Invoice Amount", "₹12,60,000.00", "Grand total payable by customer.")
    ]
    for idx, row_data in enumerate(i_data):
        row = inv_table.add_row()
        format_table_row(row, i_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    add_paragraph(
        "E-Way Bill Generation (/eway-bill): E-Way Bill #EWB-8921-3310-9941 is generated, linking Vehicle #TN-38-BZ-4412 (Blue Dart Logistics), "
        "Transporter ID #33AABCT9988D1Z2, Distance: 340 Km. The A4 print preview includes QR code and barcoded Part A/Part B clearance.",
        bold_prefix="Statutory E-Way: "
    )
    add_paragraph(
        "Fleet Dispatch & Gate Pass (/fleet/trip-planning & /gate/outward): Outward Gate Pass #GOP-2026-081 authorizes the transporter truck to exit "
        "factory premises with 5 master cartons.",
        bold_prefix="Dispatch: "
    )

    # STAGE 11
    add_heading_2("Stage 11: Real-Time Financial Accounting in CubeBook")
    add_paragraph(
        "The standout capability of Handloom ERP is that factory actions trigger real-time double-entry bookkeeping without manual accountant intervention."
    )
    add_bullet_point("Navigate to sidebar: Finance -> CubeBook Dashboard (URL: /cubebook/dashboard).", bold_prefix="Navigation: ")
    add_bullet_point("Automated Sales Journal Voucher: Finalizing Sales Invoice #INV-2026-0018 automatically creates balanced Voucher #CB-SV-2026-018:", bold_prefix="Automated Voucher: ")

    add_code_block(
        "-----------------------------------------------------------------------------------------\n"
        "VOUCHER TYPE: SALES (Auto-Posted from Sales Invoice #INV-2026-0018)\n"
        "-----------------------------------------------------------------------------------------\n"
        "DR. Sundry Debtors - Heritage Handloom Creations Pvt Ltd : ₹12,60,000.00\n"
        "    CR. Sales Account (Finished Cotton Fabric)           : ₹12,00,000.00\n"
        "    CR. Output CGST 2.5% Payable                         :     ₹30,000.00\n"
        "    CR. Output SGST 2.5% Payable                         :     ₹30,000.00\n"
        "TOTAL DEBITS: ₹12,60,000.00  |  TOTAL CREDITS: ₹12,60,000.00  (BALANCED)\n"
        "-----------------------------------------------------------------------------------------"
    )

    add_paragraph(
        "Customer Payment Realization: Customer transfers ₹12,60,000 via NEFT to HDFC Bank Account. Navigate to 'Voucher Entry' (/accounts/voucher-entry) "
        "and record Receipt Voucher #CB-RV-2026-024:",
        bold_prefix="Payment Realization: "
    )

    add_code_block(
        "-----------------------------------------------------------------------------------------\n"
        "VOUCHER TYPE: RECEIPT (Cheque/NEFT Ref: UTR-HDFC-99481234)\n"
        "-----------------------------------------------------------------------------------------\n"
        "DR. HDFC Bank Main Current Account                       : ₹12,60,000.00\n"
        "    CR. Sundry Debtors - Heritage Handloom Creations     : ₹12,60,000.00\n"
        "-----------------------------------------------------------------------------------------"
    )

    add_bullet_point("Customer Ledger Statement: Heritage Handloom Creations Pvt Ltd balance returns to ₹0.00 (Fully Settled).", bold_prefix="Verification: ")
    add_bullet_point("Trial Balance & P&L: Shows ₹12,00,000 in Operating Revenue, ₹60,000 in GST Output Liability, and healthy profit margins realized.", bold_prefix="Financial State: ")

    # -------------------------------------------------------------
    # 5. DEMONSTRATION TALKING POINTS FOR HR
    # -------------------------------------------------------------
    add_heading_1("4. Recommended Demonstration Script & Talking Points for HR")
    add_paragraph(
        "When presenting to HR and executive evaluators, highlight the following business benefits at each screen:"
    )

    hr_table = doc.add_table(rows=1, cols=3)
    hr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(hr_table)
    h_widths = [Inches(1.8), Inches(2.2), Inches(2.7)]
    format_table_header(hr_table.rows[0], h_widths, ["Demonstration Screen", "What to Say to HR / Evaluator", "Enterprise Value Demonstrated"])
    
    hr_points = [
        ("Party Master Screen", 
         "'Notice how easy it is to register a new customer with full statutory GST, PAN, credit days, and credit limits. This single screen safeguards the company against credit defaults.'", 
         "Credit risk mitigation and KYC compliance."),
        ("Design Entry & AI Swatch", 
         "'Instead of manual guesswork, our AI computer vision analyzes the customer's fabric swatch, extracts exact color ratios, and the Weaving Calculator mathematically predicts yarn requirements.'", 
         "Technological innovation and pre-production accuracy."),
        ("Buyer Order & PI Approval", 
         "'The merchandiser books the order, but work cannot start until Management approves the Proforma Invoice through our digital approval desk. Zero unauthorized production.'", 
         "Strict governance and role-based authority."),
        ("PPC Live Dashboard", 
         "'Management gets live visibility into which loom is running, weaver pick efficiency, and our ETA engine calculates exact delivery dates days in advance.'", 
         "On-time delivery and machine utilization."),
        ("Job Work Challan Tracking", 
         "'In textiles, 8% of profits are lost to yarn leakage at external dye houses and sizing units. Handloom ERP tracks every single gram issued and received.'", 
         "Zero material leakage and cost control."),
        ("4-Point Quality Table", 
         "'We inspect on illuminated tables using international ASTM 4-point standards. Only Grade-A fabric receives barcodes for customer dispatch, eliminating costly buyer claims.'", 
         "Brand reputation and export quality assurance."),
        ("CubeBook Auto-Sync", 
         "'When the Sales Invoice is issued, the double-entry accounting entries are posted instantly in CubeBook. Our accounts team doesn't need to do double data entry.'", 
         "Audit readiness and seamless financial integrity.")
    ]
    for idx, row_data in enumerate(hr_points):
        row = hr_table.add_row()
        format_table_row(row, h_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # 6. OPERATIONAL RACI RESPONSIBILITY MATRIX
    # -------------------------------------------------------------
    add_heading_1("5. Operational RACI Matrix (Roles & Departmental Governance)")
    add_paragraph(
        "Demonstrate to HR how the ERP clarifies organizational responsibilities across all 7 departments:"
    )

    raci_table = doc.add_table(rows=1, cols=8)
    raci_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(raci_table)
    rc_widths = [Inches(1.7), Inches(0.7), Inches(0.7), Inches(0.7), Inches(0.7), Inches(0.7), Inches(0.7), Inches(0.8)]
    format_table_header(raci_table.rows[0], rc_widths, ["Workflow Milestone", "Merch", "Design", "PPC", "Stores", "Weaver", "QC", "Accounts"])
    
    raci_records = [
        ("Customer Onboarding", "R / A", "I", "I", "I", "I", "I", "C"),
        ("Design Entry & AI Analysis", "C", "R / A", "C", "I", "I", "C", "I"),
        ("Costing Sheet Quotation", "R / A", "C", "C", "I", "I", "I", "C"),
        ("Buyer Order & PI Approval", "R", "I", "C", "I", "I", "I", "A"),
        ("Loom Allocation & ETA", "I", "I", "R / A", "C", "R", "I", "I"),
        ("Raw Yarn PO & Store GRN", "C", "I", "I", "R / A", "I", "C", "C"),
        ("Job Work Issuance & Receipts", "I", "I", "R", "R / A", "R", "C", "C"),
        ("4-Point Quality Inspection", "I", "I", "C", "I", "I", "R / A", "I"),
        ("Packing Slip & GRA Release", "R", "I", "I", "R", "I", "A", "A"),
        ("Sales Invoice & E-Way Bill", "R", "I", "I", "C", "I", "I", "R / A"),
        ("CubeBook Ledger Accounting", "I", "I", "I", "I", "I", "I", "R / A")
    ]
    for idx, row_data in enumerate(raci_records):
        row = raci_table.add_row()
        format_table_row(row, rc_widths, row_data, is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # 7. SUMMARY & CONCLUSION
    # -------------------------------------------------------------
    add_heading_1("6. Conclusion & Demonstration Sign-Off")
    add_paragraph(
        "By walking through this comprehensive scenario, you demonstrate to HR and company leadership that Handloom ERP is a production-ready, "
        "enterprise-grade platform. It connects customer demand directly to factory machinery, protects operating margins through precise "
        "material reconciliation, and maintains pristine financial ledgers in real time.",
        bold_prefix="Final Summary: "
    )

    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")
    print(f"File size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    out_dir = r"c:\Users\user\Documents\Cube Ai Solutions Project\Handloom_ERP"
    out_file = os.path.join(out_dir, "Handloom_ERP_Customer_To_Delivery_Demonstration_Guide.docx")
    create_customer_demo_document(out_file)
