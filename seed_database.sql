--
-- PostgreSQL database dump
--

\restrict xSvR3W8GqVJeJ8a94WFiJVhctKm6odJChvUV5YqAU0CoIrD4lDf3tql72NYXk7T

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.yarn_purchase_indent_details DROP CONSTRAINT IF EXISTS yarn_purchase_indent_details_po_id_fkey;
ALTER TABLE IF EXISTS ONLY public.yarn_purchase_count_details DROP CONSTRAINT IF EXISTS yarn_purchase_count_details_po_id_fkey;
ALTER TABLE IF EXISTS ONLY public.yarn_inward_items DROP CONSTRAINT IF EXISTS yarn_inward_items_inward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.warp_delivery_items DROP CONSTRAINT IF EXISTS warp_delivery_items_delivery_id_fkey;
ALTER TABLE IF EXISTS ONLY public.warp_beam_details DROP CONSTRAINT IF EXISTS warp_beam_details_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_related_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_related_inquiry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_party_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoice_items DROP CONSTRAINT IF EXISTS sales_invoice_items_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_lead_id_fkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_inquiry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.packing_slip_items DROP CONSTRAINT IF EXISTS packing_slip_items_slip_id_fkey;
ALTER TABLE IF EXISTS ONLY public.on_table_checking_items DROP CONSTRAINT IF EXISTS on_table_checking_items_checking_id_fkey;
ALTER TABLE IF EXISTS ONLY public.leads DROP CONSTRAINT IF EXISTS leads_assigned_to_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS inquiries_lead_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS inquiries_assigned_to_id_fkey;
ALTER TABLE IF EXISTS ONLY public.grey_yarn_delivery_items DROP CONSTRAINT IF EXISTS grey_yarn_delivery_items_delivery_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_release_items DROP CONSTRAINT IF EXISTS goods_release_items_release_id_fkey;
ALTER TABLE IF EXISTS ONLY public.finished_fabric_items DROP CONSTRAINT IF EXISTS finished_fabric_items_inward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.eway_bill_items DROP CONSTRAINT IF EXISTS eway_bill_items_bill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_received_items DROP CONSTRAINT IF EXISTS dyed_yarn_received_items_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_delivery_items DROP CONSTRAINT IF EXISTS dyed_yarn_delivery_items_delivery_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cloth_inward_items DROP CONSTRAINT IF EXISTS cloth_inward_items_inward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cloth_delivery_items DROP CONSTRAINT IF EXISTS cloth_delivery_items_delivery_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buyer_orders DROP CONSTRAINT IF EXISTS buyer_orders_party_id_fkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_items DROP CONSTRAINT IF EXISTS buyer_order_items_order_id_fkey;
DROP INDEX IF EXISTS public.ix_yarn_purchase_orders_po_number;
DROP INDEX IF EXISTS public.ix_yarn_purchase_orders_id;
DROP INDEX IF EXISTS public.ix_yarn_purchase_indent_details_id;
DROP INDEX IF EXISTS public.ix_yarn_purchase_count_details_id;
DROP INDEX IF EXISTS public.ix_yarn_inwards_ref_no;
DROP INDEX IF EXISTS public.ix_yarn_inwards_id;
DROP INDEX IF EXISTS public.ix_yarn_inward_items_id;
DROP INDEX IF EXISTS public.ix_work_order_transactions_transaction_no;
DROP INDEX IF EXISTS public.ix_work_order_transactions_module_type;
DROP INDEX IF EXISTS public.ix_work_order_transactions_id;
DROP INDEX IF EXISTS public.ix_warp_delivery_items_id;
DROP INDEX IF EXISTS public.ix_warp_deliveries_id;
DROP INDEX IF EXISTS public.ix_warp_deliveries_dc_no;
DROP INDEX IF EXISTS public.ix_warp_beam_receipts_ref_no;
DROP INDEX IF EXISTS public.ix_warp_beam_receipts_id;
DROP INDEX IF EXISTS public.ix_warp_beam_details_id;
DROP INDEX IF EXISTS public.ix_tasks_id;
DROP INDEX IF EXISTS public.ix_sub_masters_id;
DROP INDEX IF EXISTS public.ix_sub_masters_entity_name;
DROP INDEX IF EXISTS public.ix_sub_masters_entity;
DROP INDEX IF EXISTS public.ix_sales_invoices_invoice_no;
DROP INDEX IF EXISTS public.ix_sales_invoices_id;
DROP INDEX IF EXISTS public.ix_sales_invoice_items_id;
DROP INDEX IF EXISTS public.ix_quotations_quotation_no;
DROP INDEX IF EXISTS public.ix_quotations_id;
DROP INDEX IF EXISTS public.ix_party_master_id;
DROP INDEX IF EXISTS public.ix_party_master_customer_code;
DROP INDEX IF EXISTS public.ix_packing_slips_slip_no;
DROP INDEX IF EXISTS public.ix_packing_slips_id;
DROP INDEX IF EXISTS public.ix_packing_slip_items_id;
DROP INDEX IF EXISTS public.ix_on_table_checking_ref_no;
DROP INDEX IF EXISTS public.ix_on_table_checking_items_id;
DROP INDEX IF EXISTS public.ix_on_table_checking_id;
DROP INDEX IF EXISTS public.ix_log_reports_id;
DROP INDEX IF EXISTS public.ix_leads_id;
DROP INDEX IF EXISTS public.ix_leads_email;
DROP INDEX IF EXISTS public.ix_inquiries_inquiry_no;
DROP INDEX IF EXISTS public.ix_inquiries_id;
DROP INDEX IF EXISTS public.ix_grey_yarn_delivery_items_id;
DROP INDEX IF EXISTS public.ix_grey_yarn_deliveries_id;
DROP INDEX IF EXISTS public.ix_grey_yarn_deliveries_dc_no;
DROP INDEX IF EXISTS public.ix_goods_releases_id;
DROP INDEX IF EXISTS public.ix_goods_releases_gra_no;
DROP INDEX IF EXISTS public.ix_goods_release_items_id;
DROP INDEX IF EXISTS public.ix_general_master_id;
DROP INDEX IF EXISTS public.ix_general_master_category;
DROP INDEX IF EXISTS public.ix_finished_fabric_items_id;
DROP INDEX IF EXISTS public.ix_finished_fabric_inwards_ref_no;
DROP INDEX IF EXISTS public.ix_finished_fabric_inwards_id;
DROP INDEX IF EXISTS public.ix_eway_bills_id;
DROP INDEX IF EXISTS public.ix_eway_bills_eway_bill_no;
DROP INDEX IF EXISTS public.ix_eway_bill_items_id;
DROP INDEX IF EXISTS public.ix_employees_id;
DROP INDEX IF EXISTS public.ix_employees_employee_code;
DROP INDEX IF EXISTS public.ix_dyed_yarn_received_items_id;
DROP INDEX IF EXISTS public.ix_dyed_yarn_received_inv_no;
DROP INDEX IF EXISTS public.ix_dyed_yarn_received_id;
DROP INDEX IF EXISTS public.ix_dyed_yarn_delivery_items_id;
DROP INDEX IF EXISTS public.ix_dyed_yarn_deliveries_id;
DROP INDEX IF EXISTS public.ix_dyed_yarn_deliveries_dc_no;
DROP INDEX IF EXISTS public.ix_despatch_planning_ref_no;
DROP INDEX IF EXISTS public.ix_despatch_planning_id;
DROP INDEX IF EXISTS public.ix_despatch_planning_ibpo;
DROP INDEX IF EXISTS public.ix_design_entry_id;
DROP INDEX IF EXISTS public.ix_design_entry_ds_ref_no;
DROP INDEX IF EXISTS public.ix_company_settings_id;
DROP INDEX IF EXISTS public.ix_company_setting_id;
DROP INDEX IF EXISTS public.ix_cloth_inwards_ref_no;
DROP INDEX IF EXISTS public.ix_cloth_inwards_id;
DROP INDEX IF EXISTS public.ix_cloth_inward_items_id;
DROP INDEX IF EXISTS public.ix_cloth_delivery_items_id;
DROP INDEX IF EXISTS public.ix_cloth_deliveries_id;
DROP INDEX IF EXISTS public.ix_cloth_deliveries_dc_no;
DROP INDEX IF EXISTS public.ix_buyer_orders_id;
DROP INDEX IF EXISTS public.ix_buyer_orders_ibpo_number;
DROP INDEX IF EXISTS public.ix_buyer_order_sequences_sequence_id;
DROP INDEX IF EXISTS public.ix_buyer_order_sequences_id;
DROP INDEX IF EXISTS public.ix_buyer_order_schedules_schedule_id;
DROP INDEX IF EXISTS public.ix_buyer_order_schedules_id;
DROP INDEX IF EXISTS public.ix_buyer_order_items_id;
DROP INDEX IF EXISTS public.ix_buyer_order_expenses_id;
DROP INDEX IF EXISTS public.ix_buyer_order_expenses_expense_id;
DROP INDEX IF EXISTS public.ix_buyer_order_dispatches_indent_id;
DROP INDEX IF EXISTS public.ix_buyer_order_dispatches_id;
DROP INDEX IF EXISTS public.ix_buyer_order_completions_id;
DROP INDEX IF EXISTS public.ix_buyer_order_completions_cmp_id;
DROP INDEX IF EXISTS public.ix_buyer_order_amendments_id;
DROP INDEX IF EXISTS public.ix_buyer_order_amendments_amendment_id;
ALTER TABLE IF EXISTS ONLY public.yarn_purchase_orders DROP CONSTRAINT IF EXISTS yarn_purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.yarn_purchase_indent_details DROP CONSTRAINT IF EXISTS yarn_purchase_indent_details_pkey;
ALTER TABLE IF EXISTS ONLY public.yarn_purchase_count_details DROP CONSTRAINT IF EXISTS yarn_purchase_count_details_pkey;
ALTER TABLE IF EXISTS ONLY public.yarn_inwards DROP CONSTRAINT IF EXISTS yarn_inwards_pkey;
ALTER TABLE IF EXISTS ONLY public.yarn_inward_items DROP CONSTRAINT IF EXISTS yarn_inward_items_pkey;
ALTER TABLE IF EXISTS ONLY public.work_order_transactions DROP CONSTRAINT IF EXISTS work_order_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.warp_delivery_items DROP CONSTRAINT IF EXISTS warp_delivery_items_pkey;
ALTER TABLE IF EXISTS ONLY public.warp_deliveries DROP CONSTRAINT IF EXISTS warp_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.warp_beam_receipts DROP CONSTRAINT IF EXISTS warp_beam_receipts_pkey;
ALTER TABLE IF EXISTS ONLY public.warp_beam_details DROP CONSTRAINT IF EXISTS warp_beam_details_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.sub_masters DROP CONSTRAINT IF EXISTS sub_masters_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_invoice_items DROP CONSTRAINT IF EXISTS sales_invoice_items_pkey;
ALTER TABLE IF EXISTS ONLY public.quotations DROP CONSTRAINT IF EXISTS quotations_pkey;
ALTER TABLE IF EXISTS ONLY public.party_master DROP CONSTRAINT IF EXISTS party_master_pkey;
ALTER TABLE IF EXISTS ONLY public.packing_slips DROP CONSTRAINT IF EXISTS packing_slips_pkey;
ALTER TABLE IF EXISTS ONLY public.packing_slip_items DROP CONSTRAINT IF EXISTS packing_slip_items_pkey;
ALTER TABLE IF EXISTS ONLY public.on_table_checking DROP CONSTRAINT IF EXISTS on_table_checking_pkey;
ALTER TABLE IF EXISTS ONLY public.on_table_checking_items DROP CONSTRAINT IF EXISTS on_table_checking_items_pkey;
ALTER TABLE IF EXISTS ONLY public.log_reports DROP CONSTRAINT IF EXISTS log_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.leads DROP CONSTRAINT IF EXISTS leads_pkey;
ALTER TABLE IF EXISTS ONLY public.inquiries DROP CONSTRAINT IF EXISTS inquiries_pkey;
ALTER TABLE IF EXISTS ONLY public.grey_yarn_delivery_items DROP CONSTRAINT IF EXISTS grey_yarn_delivery_items_pkey;
ALTER TABLE IF EXISTS ONLY public.grey_yarn_deliveries DROP CONSTRAINT IF EXISTS grey_yarn_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.goods_releases DROP CONSTRAINT IF EXISTS goods_releases_pkey;
ALTER TABLE IF EXISTS ONLY public.goods_release_items DROP CONSTRAINT IF EXISTS goods_release_items_pkey;
ALTER TABLE IF EXISTS ONLY public.general_master DROP CONSTRAINT IF EXISTS general_master_pkey;
ALTER TABLE IF EXISTS ONLY public.finished_fabric_items DROP CONSTRAINT IF EXISTS finished_fabric_items_pkey;
ALTER TABLE IF EXISTS ONLY public.finished_fabric_inwards DROP CONSTRAINT IF EXISTS finished_fabric_inwards_pkey;
ALTER TABLE IF EXISTS ONLY public.eway_bills DROP CONSTRAINT IF EXISTS eway_bills_pkey;
ALTER TABLE IF EXISTS ONLY public.eway_bill_items DROP CONSTRAINT IF EXISTS eway_bill_items_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_email_key;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_received DROP CONSTRAINT IF EXISTS dyed_yarn_received_pkey;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_received_items DROP CONSTRAINT IF EXISTS dyed_yarn_received_items_pkey;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_delivery_items DROP CONSTRAINT IF EXISTS dyed_yarn_delivery_items_pkey;
ALTER TABLE IF EXISTS ONLY public.dyed_yarn_deliveries DROP CONSTRAINT IF EXISTS dyed_yarn_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.despatch_planning DROP CONSTRAINT IF EXISTS despatch_planning_pkey;
ALTER TABLE IF EXISTS ONLY public.design_entry DROP CONSTRAINT IF EXISTS design_entry_pkey;
ALTER TABLE IF EXISTS ONLY public.company_settings DROP CONSTRAINT IF EXISTS company_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.company_setting DROP CONSTRAINT IF EXISTS company_setting_pkey;
ALTER TABLE IF EXISTS ONLY public.cloth_inwards DROP CONSTRAINT IF EXISTS cloth_inwards_pkey;
ALTER TABLE IF EXISTS ONLY public.cloth_inward_items DROP CONSTRAINT IF EXISTS cloth_inward_items_pkey;
ALTER TABLE IF EXISTS ONLY public.cloth_delivery_items DROP CONSTRAINT IF EXISTS cloth_delivery_items_pkey;
ALTER TABLE IF EXISTS ONLY public.cloth_deliveries DROP CONSTRAINT IF EXISTS cloth_deliveries_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_orders DROP CONSTRAINT IF EXISTS buyer_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_sequences DROP CONSTRAINT IF EXISTS buyer_order_sequences_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_schedules DROP CONSTRAINT IF EXISTS buyer_order_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_items DROP CONSTRAINT IF EXISTS buyer_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_expenses DROP CONSTRAINT IF EXISTS buyer_order_expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_dispatches DROP CONSTRAINT IF EXISTS buyer_order_dispatches_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_completions DROP CONSTRAINT IF EXISTS buyer_order_completions_pkey;
ALTER TABLE IF EXISTS ONLY public.buyer_order_amendments DROP CONSTRAINT IF EXISTS buyer_order_amendments_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
ALTER TABLE IF EXISTS public.yarn_purchase_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.yarn_purchase_indent_details ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.yarn_purchase_count_details ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.yarn_inwards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.yarn_inward_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.work_order_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.warp_delivery_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.warp_deliveries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.warp_beam_receipts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.warp_beam_details ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sub_masters ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_invoice_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quotations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.party_master ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.packing_slips ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.packing_slip_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.on_table_checking_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.on_table_checking ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.log_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.leads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inquiries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.grey_yarn_delivery_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.grey_yarn_deliveries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.goods_releases ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.goods_release_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.general_master ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.finished_fabric_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.finished_fabric_inwards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.eway_bills ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.eway_bill_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employees ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dyed_yarn_received_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dyed_yarn_received ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dyed_yarn_delivery_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dyed_yarn_deliveries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.despatch_planning ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.design_entry ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_setting ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cloth_inwards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cloth_inward_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cloth_delivery_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cloth_deliveries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_sequences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_schedules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_expenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_dispatches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_completions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.buyer_order_amendments ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.yarn_purchase_orders_id_seq;
DROP TABLE IF EXISTS public.yarn_purchase_orders;
DROP SEQUENCE IF EXISTS public.yarn_purchase_indent_details_id_seq;
DROP TABLE IF EXISTS public.yarn_purchase_indent_details;
DROP SEQUENCE IF EXISTS public.yarn_purchase_count_details_id_seq;
DROP TABLE IF EXISTS public.yarn_purchase_count_details;
DROP SEQUENCE IF EXISTS public.yarn_inwards_id_seq;
DROP TABLE IF EXISTS public.yarn_inwards;
DROP SEQUENCE IF EXISTS public.yarn_inward_items_id_seq;
DROP TABLE IF EXISTS public.yarn_inward_items;
DROP SEQUENCE IF EXISTS public.work_order_transactions_id_seq;
DROP TABLE IF EXISTS public.work_order_transactions;
DROP SEQUENCE IF EXISTS public.warp_delivery_items_id_seq;
DROP TABLE IF EXISTS public.warp_delivery_items;
DROP SEQUENCE IF EXISTS public.warp_deliveries_id_seq;
DROP TABLE IF EXISTS public.warp_deliveries;
DROP SEQUENCE IF EXISTS public.warp_beam_receipts_id_seq;
DROP TABLE IF EXISTS public.warp_beam_receipts;
DROP SEQUENCE IF EXISTS public.warp_beam_details_id_seq;
DROP TABLE IF EXISTS public.warp_beam_details;
DROP SEQUENCE IF EXISTS public.tasks_id_seq;
DROP TABLE IF EXISTS public.tasks;
DROP SEQUENCE IF EXISTS public.sub_masters_id_seq;
DROP TABLE IF EXISTS public.sub_masters;
DROP SEQUENCE IF EXISTS public.sales_invoices_id_seq;
DROP TABLE IF EXISTS public.sales_invoices;
DROP SEQUENCE IF EXISTS public.sales_invoice_items_id_seq;
DROP TABLE IF EXISTS public.sales_invoice_items;
DROP SEQUENCE IF EXISTS public.quotations_id_seq;
DROP TABLE IF EXISTS public.quotations;
DROP SEQUENCE IF EXISTS public.party_master_id_seq;
DROP TABLE IF EXISTS public.party_master;
DROP SEQUENCE IF EXISTS public.packing_slips_id_seq;
DROP TABLE IF EXISTS public.packing_slips;
DROP SEQUENCE IF EXISTS public.packing_slip_items_id_seq;
DROP TABLE IF EXISTS public.packing_slip_items;
DROP SEQUENCE IF EXISTS public.on_table_checking_items_id_seq;
DROP TABLE IF EXISTS public.on_table_checking_items;
DROP SEQUENCE IF EXISTS public.on_table_checking_id_seq;
DROP TABLE IF EXISTS public.on_table_checking;
DROP SEQUENCE IF EXISTS public.log_reports_id_seq;
DROP TABLE IF EXISTS public.log_reports;
DROP SEQUENCE IF EXISTS public.leads_id_seq;
DROP TABLE IF EXISTS public.leads;
DROP SEQUENCE IF EXISTS public.inquiries_id_seq;
DROP TABLE IF EXISTS public.inquiries;
DROP SEQUENCE IF EXISTS public.grey_yarn_delivery_items_id_seq;
DROP TABLE IF EXISTS public.grey_yarn_delivery_items;
DROP SEQUENCE IF EXISTS public.grey_yarn_deliveries_id_seq;
DROP TABLE IF EXISTS public.grey_yarn_deliveries;
DROP SEQUENCE IF EXISTS public.goods_releases_id_seq;
DROP TABLE IF EXISTS public.goods_releases;
DROP SEQUENCE IF EXISTS public.goods_release_items_id_seq;
DROP TABLE IF EXISTS public.goods_release_items;
DROP SEQUENCE IF EXISTS public.general_master_id_seq;
DROP TABLE IF EXISTS public.general_master;
DROP SEQUENCE IF EXISTS public.finished_fabric_items_id_seq;
DROP TABLE IF EXISTS public.finished_fabric_items;
DROP SEQUENCE IF EXISTS public.finished_fabric_inwards_id_seq;
DROP TABLE IF EXISTS public.finished_fabric_inwards;
DROP SEQUENCE IF EXISTS public.eway_bills_id_seq;
DROP TABLE IF EXISTS public.eway_bills;
DROP SEQUENCE IF EXISTS public.eway_bill_items_id_seq;
DROP TABLE IF EXISTS public.eway_bill_items;
DROP SEQUENCE IF EXISTS public.employees_id_seq;
DROP TABLE IF EXISTS public.employees;
DROP SEQUENCE IF EXISTS public.dyed_yarn_received_items_id_seq;
DROP TABLE IF EXISTS public.dyed_yarn_received_items;
DROP SEQUENCE IF EXISTS public.dyed_yarn_received_id_seq;
DROP TABLE IF EXISTS public.dyed_yarn_received;
DROP SEQUENCE IF EXISTS public.dyed_yarn_delivery_items_id_seq;
DROP TABLE IF EXISTS public.dyed_yarn_delivery_items;
DROP SEQUENCE IF EXISTS public.dyed_yarn_deliveries_id_seq;
DROP TABLE IF EXISTS public.dyed_yarn_deliveries;
DROP SEQUENCE IF EXISTS public.despatch_planning_id_seq;
DROP TABLE IF EXISTS public.despatch_planning;
DROP SEQUENCE IF EXISTS public.design_entry_id_seq;
DROP TABLE IF EXISTS public.design_entry;
DROP SEQUENCE IF EXISTS public.company_settings_id_seq;
DROP TABLE IF EXISTS public.company_settings;
DROP SEQUENCE IF EXISTS public.company_setting_id_seq;
DROP TABLE IF EXISTS public.company_setting;
DROP SEQUENCE IF EXISTS public.cloth_inwards_id_seq;
DROP TABLE IF EXISTS public.cloth_inwards;
DROP SEQUENCE IF EXISTS public.cloth_inward_items_id_seq;
DROP TABLE IF EXISTS public.cloth_inward_items;
DROP SEQUENCE IF EXISTS public.cloth_delivery_items_id_seq;
DROP TABLE IF EXISTS public.cloth_delivery_items;
DROP SEQUENCE IF EXISTS public.cloth_deliveries_id_seq;
DROP TABLE IF EXISTS public.cloth_deliveries;
DROP SEQUENCE IF EXISTS public.buyer_orders_id_seq;
DROP TABLE IF EXISTS public.buyer_orders;
DROP SEQUENCE IF EXISTS public.buyer_order_sequences_id_seq;
DROP TABLE IF EXISTS public.buyer_order_sequences;
DROP SEQUENCE IF EXISTS public.buyer_order_schedules_id_seq;
DROP TABLE IF EXISTS public.buyer_order_schedules;
DROP SEQUENCE IF EXISTS public.buyer_order_items_id_seq;
DROP TABLE IF EXISTS public.buyer_order_items;
DROP SEQUENCE IF EXISTS public.buyer_order_expenses_id_seq;
DROP TABLE IF EXISTS public.buyer_order_expenses;
DROP SEQUENCE IF EXISTS public.buyer_order_dispatches_id_seq;
DROP TABLE IF EXISTS public.buyer_order_dispatches;
DROP SEQUENCE IF EXISTS public.buyer_order_completions_id_seq;
DROP TABLE IF EXISTS public.buyer_order_completions;
DROP SEQUENCE IF EXISTS public.buyer_order_amendments_id_seq;
DROP TABLE IF EXISTS public.buyer_order_amendments;
DROP TABLE IF EXISTS public.alembic_version;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: buyer_order_amendments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_amendments (
    id integer NOT NULL,
    amendment_id character varying(50),
    order_id_ref character varying(50),
    amd_date date,
    field_changed character varying(100),
    old_value character varying(200),
    new_value character varying(200),
    remarks text,
    approved_by character varying(100),
    effective_date date,
    buyer_ref character varying(100),
    fabric_details text,
    shade character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.buyer_order_amendments OWNER TO postgres;

--
-- Name: buyer_order_amendments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_amendments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_amendments_id_seq OWNER TO postgres;

--
-- Name: buyer_order_amendments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_amendments_id_seq OWNED BY public.buyer_order_amendments.id;


--
-- Name: buyer_order_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_completions (
    id integer NOT NULL,
    cmp_id character varying(50),
    order_id_ref character varying(50),
    completion_date date,
    status character varying(50),
    final_dispatch_qty character varying(100),
    balance_qty character varying(100),
    fabric_type character varying(100),
    shade character varying(100),
    lot_no character varying(100),
    packing_type character varying(100),
    delivery_place character varying(150),
    transporter_name character varying(150),
    buyer_ref character varying(100),
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.buyer_order_completions OWNER TO postgres;

--
-- Name: buyer_order_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_completions_id_seq OWNER TO postgres;

--
-- Name: buyer_order_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_completions_id_seq OWNED BY public.buyer_order_completions.id;


--
-- Name: buyer_order_dispatches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_dispatches (
    id integer NOT NULL,
    indent_id character varying(50),
    order_id_ref character varying(50),
    transporter_name character varying(150),
    lr_no character varying(100),
    vehicle_no character varying(100),
    delivery_place character varying(150),
    packing_type character varying(100),
    dispatch_date date,
    shade character varying(100),
    lot_no character varying(100),
    quantity character varying(100),
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.buyer_order_dispatches OWNER TO postgres;

--
-- Name: buyer_order_dispatches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_dispatches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_dispatches_id_seq OWNER TO postgres;

--
-- Name: buyer_order_dispatches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_dispatches_id_seq OWNED BY public.buyer_order_dispatches.id;


--
-- Name: buyer_order_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_expenses (
    id integer NOT NULL,
    expense_id character varying(50),
    order_id_ref character varying(50),
    expense_type character varying(100),
    amount numeric(10,2),
    currency character varying(20),
    payment_mode character varying(50),
    vendor_name character varying(150),
    invoice_ref character varying(100),
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.buyer_order_expenses OWNER TO postgres;

--
-- Name: buyer_order_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_expenses_id_seq OWNER TO postgres;

--
-- Name: buyer_order_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_expenses_id_seq OWNED BY public.buyer_order_expenses.id;


--
-- Name: buyer_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    party_po_no character varying(50),
    po_date date,
    design_no character varying(50),
    fabric_type character varying(100),
    color character varying(50),
    order_mtrs numeric(12,2),
    tolerance_pct numeric(5,2),
    uom character varying(20),
    hsn_code character varying(20),
    rate numeric(12,2),
    amount numeric(14,2),
    buyer_style character varying(100),
    party_terms character varying(100),
    point_of_contact character varying(150),
    total_mtr_yard numeric(12,2),
    sample_mtr numeric(12,2),
    short_no character varying(50),
    gry_construction character varying(150),
    construction character varying(150),
    weaving_type character varying(50),
    pick_on_table integer,
    print_name character varying(100),
    finish_reed integer,
    finish_pick integer,
    finish_width numeric(10,2),
    cuttable_width numeric(10,2),
    pattern character varying(50),
    packing_type character varying(50),
    loom_type character varying(50),
    insurance character varying(10),
    packing_charge numeric(10,2),
    end_use character varying(100),
    season character varying(50),
    party_comment text,
    fabric_content character varying(150),
    development_id character varying(50),
    country character varying(50),
    combo character varying(50),
    currency character varying(10),
    pc_type character varying(50),
    gsm numeric(10,2),
    price numeric(12,2),
    gst_pct numeric(5,2),
    gst_rate numeric(12,2),
    image_design_path character varying(255),
    yarn_count character varying(50),
    certifications character varying(150)
);


ALTER TABLE public.buyer_order_items OWNER TO postgres;

--
-- Name: buyer_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_items_id_seq OWNER TO postgres;

--
-- Name: buyer_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_items_id_seq OWNED BY public.buyer_order_items.id;


--
-- Name: buyer_order_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_schedules (
    id integer NOT NULL,
    schedule_id character varying(50),
    order_id_ref character varying(50),
    buyer_ref character varying(100),
    shipment_date date,
    delivery_place character varying(150),
    delivery_terms character varying(100),
    qty character varying(50),
    fabric_type character varying(100),
    shade character varying(100),
    lot_no character varying(100),
    packing_type character varying(50),
    transporter_name character varying(150),
    transport_mode character varying(50),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.buyer_order_schedules OWNER TO postgres;

--
-- Name: buyer_order_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_schedules_id_seq OWNER TO postgres;

--
-- Name: buyer_order_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_schedules_id_seq OWNED BY public.buyer_order_schedules.id;


--
-- Name: buyer_order_sequences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_order_sequences (
    id integer NOT NULL,
    sequence_id character varying(50),
    prefix character varying(50),
    fin_year character varying(20),
    running_no integer,
    buyer_name character varying(150),
    party_name character varying(150),
    order_type character varying(50),
    category character varying(50),
    buyer_ref character varying(100),
    generated_order_no character varying(100),
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    order_id_ref character varying(50)
);


ALTER TABLE public.buyer_order_sequences OWNER TO postgres;

--
-- Name: buyer_order_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_order_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_order_sequences_id_seq OWNER TO postgres;

--
-- Name: buyer_order_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_order_sequences_id_seq OWNED BY public.buyer_order_sequences.id;


--
-- Name: buyer_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_orders (
    id integer NOT NULL,
    ibpo_number character varying(50),
    order_date date NOT NULL,
    party_name character varying(255),
    party_id integer,
    agent_name character varying(255),
    order_type character varying(50),
    certified_type character varying(50),
    billing_address text,
    delivery_address text,
    state character varying(100),
    state_code character varying(10),
    gst_no character varying(20),
    pan_no character varying(15),
    nomination_type character varying(50),
    payment_terms character varying(100),
    outstanding numeric(12,2),
    overdue numeric(12,2),
    transport_mode character varying(50),
    transport_name character varying(150),
    delivery_place character varying(150),
    lr_type character varying(50),
    lr_terms character varying(100),
    commission_pct numeric(5,2),
    status character varying(30),
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    buyer_name character varying(255),
    commission_type character varying(50),
    order_taken_by character varying(150),
    regular_special character varying(50),
    due_30_days numeric(12,2),
    status_remark text,
    max_crd_days integer,
    po_credit integer,
    po_max_crd integer,
    bill_credit integer,
    payment_detail text,
    payment_file_path character varying(255),
    party_terms character varying(100),
    party_comp_date date,
    exfactory_date date,
    delivery_starting date,
    delivery_at character varying(150),
    desp_mtr_min numeric(12,2),
    desp_mtr_max numeric(12,2),
    process_sequence text,
    process_instruction text,
    email_to text,
    email_cc text,
    yarn_instruction text,
    prod_instruction text,
    delivery_instruction text,
    export_order_no character varying(100),
    proforma_invoice_no character varying(100),
    lc_no character varying(100),
    lc_expiry_date date,
    container_no character varying(100),
    seal_no character varying(100),
    shipping_bill_no character varying(100),
    shipping_bill_date date,
    bill_of_lading_no character varying(100),
    bill_of_lading_date date,
    freight_amount numeric(12,2),
    insurance_amount numeric(12,2),
    packing_amount numeric(12,2),
    amendments json
);


ALTER TABLE public.buyer_orders OWNER TO postgres;

--
-- Name: buyer_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.buyer_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.buyer_orders_id_seq OWNER TO postgres;

--
-- Name: buyer_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.buyer_orders_id_seq OWNED BY public.buyer_orders.id;


--
-- Name: cloth_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloth_deliveries (
    id integer NOT NULL,
    dc_no character varying(50),
    dc_date date,
    delivery_type character varying(50),
    delivery_mode character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    transport character varying(150),
    total_meters numeric(10,2),
    total_pieces integer,
    gross_amount numeric(14,2),
    sgst numeric(10,2),
    igst numeric(10,2),
    net_amount numeric(14,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    po_no character varying(100),
    process_type character varying(100),
    ibpo character varying(100),
    fabric_detail text,
    pc_type character varying(100),
    ibpo_order_mtr numeric(10,2),
    delivery_mtr numeric(10,2),
    balance numeric(10,2),
    fresh_width numeric(10,2),
    finish_fold character varying(100),
    process_comm text,
    bpo_no character varying(100),
    design_no_bottom character varying(100),
    buyer_name character varying(255),
    lot_no character varying(100),
    griege_rate numeric(10,2),
    return_type character varying(100),
    oba character varying(255),
    finish_pick numeric(10,2),
    glm numeric(10,2),
    voucher_no character varying(100),
    voucher_date date,
    rate_mtr numeric(10,2),
    debited_amount numeric(14,2),
    detailed_remarks text,
    transport_name character varying(255),
    vehicle_no character varying(100),
    driver_name character varying(255),
    mobile_no character varying(50)
);


ALTER TABLE public.cloth_deliveries OWNER TO postgres;

--
-- Name: cloth_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloth_deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloth_deliveries_id_seq OWNER TO postgres;

--
-- Name: cloth_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloth_deliveries_id_seq OWNED BY public.cloth_deliveries.id;


--
-- Name: cloth_delivery_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloth_delivery_items (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    design_no character varying(50),
    color character varying(50),
    lot_no character varying(50),
    meters numeric(10,2),
    pieces integer,
    rate numeric(10,2),
    amount numeric(12,2),
    piece_no character varying(100),
    ok_mtr numeric(10,2),
    fold_mtr numeric(10,2)
);


ALTER TABLE public.cloth_delivery_items OWNER TO postgres;

--
-- Name: cloth_delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloth_delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloth_delivery_items_id_seq OWNER TO postgres;

--
-- Name: cloth_delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloth_delivery_items_id_seq OWNED BY public.cloth_delivery_items.id;


--
-- Name: cloth_inward_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloth_inward_items (
    id integer NOT NULL,
    inward_id integer NOT NULL,
    design_no character varying(50),
    color character varying(50),
    lot_no character varying(50),
    meters numeric(10,2),
    pieces integer,
    rate numeric(10,2),
    amount numeric(12,2),
    piece_no character varying(100),
    weight numeric(10,2),
    vloom character varying(100),
    vpc_no character varying(100)
);


ALTER TABLE public.cloth_inward_items OWNER TO postgres;

--
-- Name: cloth_inward_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloth_inward_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloth_inward_items_id_seq OWNER TO postgres;

--
-- Name: cloth_inward_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloth_inward_items_id_seq OWNED BY public.cloth_inward_items.id;


--
-- Name: cloth_inwards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cloth_inwards (
    id integer NOT NULL,
    ref_no character varying(50),
    inv_no character varying(50),
    inv_date date,
    received_type character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    dc_no character varying(50),
    dc_date date,
    total_meters numeric(10,2),
    total_pieces integer,
    gross_amount numeric(14,2),
    net_amount numeric(14,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    inward_type character varying(100),
    inw_date date,
    vendor_order character varying(100),
    vendor_order_mtr numeric(10,2),
    order_mtr_plus_10 numeric(10,2),
    received_mtr numeric(10,2),
    balance_mtr numeric(10,2),
    ibpo character varying(100),
    const_fabric_type character varying(255),
    reed character varying(100),
    pick character varying(100),
    width character varying(100),
    order_mtr numeric(10,2),
    warp_mtr numeric(10,2),
    inward_mtr numeric(10,2),
    shed_no character varying(100),
    loom_no character varying(100),
    attn_no character varying(100),
    beam_no character varying(100),
    szt_no character varying(100),
    inspection_type character varying(100),
    inv_pin character varying(100),
    process_type character varying(100),
    process_remarks text
);


ALTER TABLE public.cloth_inwards OWNER TO postgres;

--
-- Name: cloth_inwards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cloth_inwards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cloth_inwards_id_seq OWNER TO postgres;

--
-- Name: cloth_inwards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cloth_inwards_id_seq OWNED BY public.cloth_inwards.id;


--
-- Name: company_setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_setting (
    id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    logo character varying,
    address character varying,
    email character varying(100),
    phone character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description character varying
);


ALTER TABLE public.company_setting OWNER TO postgres;

--
-- Name: company_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_setting_id_seq OWNER TO postgres;

--
-- Name: company_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_setting_id_seq OWNED BY public.company_setting.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    company_name character varying(150) NOT NULL,
    address text,
    gstin character varying(50),
    phone character varying(50),
    email character varying(100),
    website character varying(100),
    pan_number character varying(50),
    state character varying(100),
    state_code character varying(10),
    pin_code character varying(20),
    bank_name character varying(100),
    account_number character varying(50),
    ifsc_code character varying(50),
    updated_at timestamp with time zone
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_settings_id_seq OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: design_entry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.design_entry (
    id integer NOT NULL,
    ds_ref_no character varying(50) NOT NULL,
    ds_date date NOT NULL,
    design_no character varying(100) NOT NULL,
    color character varying(100),
    created_by character varying(100),
    gry_const character varying(200),
    count_rxpxw character varying(100),
    buyer_name character varying(150),
    ibpo_no character varying(100),
    order_mtr double precision,
    ex_mtr double precision,
    total_mtr double precision,
    crimp_pct double precision,
    skg_pct double precision,
    warp_mtr double precision,
    weft_pro_mtr double precision,
    gray_width double precision,
    finish_width double precision,
    reed_ol double precision,
    pick_ot double precision,
    reed double precision,
    fabric character varying(100),
    total_ends double precision,
    warp_width double precision,
    qlm double precision,
    toie_pct double precision,
    selvage_waste double precision,
    weaving character varying(100),
    design_type character varying(100),
    packing_less double precision,
    weight_grm double precision,
    dyeing_loss_pct double precision,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.design_entry OWNER TO postgres;

--
-- Name: design_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.design_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.design_entry_id_seq OWNER TO postgres;

--
-- Name: design_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.design_entry_id_seq OWNED BY public.design_entry.id;


--
-- Name: despatch_planning; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.despatch_planning (
    id integer NOT NULL,
    ibpo character varying(50),
    po_date date,
    ref_no character varying(50),
    planning_date date,
    billing_party character varying(255),
    delivery_party character varying(255),
    billing_address text,
    delivery_address text,
    state_code character varying(10),
    design_no character varying(50),
    pino character varying(50),
    order_qty numeric(10,2),
    amd_foc_mtr numeric(10,2),
    total_qty numeric(10,2),
    uom character varying(20),
    delivery_start date,
    party_comp_date date,
    comp_date date,
    lc_no character varying(50),
    lc_date date,
    ibpo_rate numeric(10,2),
    currency character varying(10),
    certificate_type character varying(50),
    fabric_type character varying(100),
    planned_mtrs numeric(10,2),
    tolerance_pct numeric(5,2),
    max_dispatch_qty numeric(10,2),
    stock numeric(10,2),
    tot_desp_mtrs numeric(10,2),
    balance_mtrs numeric(10,2),
    last_desp_date date,
    hsn_code character varying(20),
    merchant character varying(150),
    city character varying(100),
    point_of_contact character varying(150),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    freight_forwarder character varying(150),
    cha_name character varying(150),
    vessel_flight_name character varying(150),
    etd date,
    eta date,
    incoterm character varying(50)
);


ALTER TABLE public.despatch_planning OWNER TO postgres;

--
-- Name: despatch_planning_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.despatch_planning_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.despatch_planning_id_seq OWNER TO postgres;

--
-- Name: despatch_planning_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.despatch_planning_id_seq OWNED BY public.despatch_planning.id;


--
-- Name: dyed_yarn_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyed_yarn_deliveries (
    id integer NOT NULL,
    dc_no character varying(50),
    dc_no_alt character varying(80),
    dc_date date NOT NULL,
    delivery_type character varying(50),
    delivery_mode character varying(50),
    party_name character varying(255),
    delivery_address text,
    design_no character varying(50),
    order_no character varying(50),
    design_type character varying(50),
    transport character varying(150),
    certificate_type character varying(50),
    driver_name character varying(100),
    total_delv_kgs numeric(10,2),
    total_rin_kgs numeric(10,2),
    balance_kgs numeric(10,2),
    gross_amount numeric(14,2),
    sgst numeric(10,2),
    igst numeric(10,2),
    net_amount numeric(14,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    add_date date,
    delivery_time character varying(50),
    cost numeric(14,2),
    insurance numeric(14,2),
    other_charges numeric(14,2),
    tax_value numeric(14,2),
    total_gst numeric(14,2),
    round_off numeric(10,2)
);


ALTER TABLE public.dyed_yarn_deliveries OWNER TO postgres;

--
-- Name: dyed_yarn_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyed_yarn_deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyed_yarn_deliveries_id_seq OWNER TO postgres;

--
-- Name: dyed_yarn_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyed_yarn_deliveries_id_seq OWNED BY public.dyed_yarn_deliveries.id;


--
-- Name: dyed_yarn_delivery_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyed_yarn_delivery_items (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    yarn_type character varying(100),
    count character varying(50),
    color character varying(50),
    lot_no character varying(50),
    stock character varying(100),
    bags integer,
    cones integer,
    total_kgs numeric(10,2),
    rate numeric(10,2),
    amount numeric(12,2)
);


ALTER TABLE public.dyed_yarn_delivery_items OWNER TO postgres;

--
-- Name: dyed_yarn_delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyed_yarn_delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyed_yarn_delivery_items_id_seq OWNER TO postgres;

--
-- Name: dyed_yarn_delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyed_yarn_delivery_items_id_seq OWNED BY public.dyed_yarn_delivery_items.id;


--
-- Name: dyed_yarn_received; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyed_yarn_received (
    id integer NOT NULL,
    inv_no character varying(50),
    inv_date date,
    received_type character varying(50),
    receive_mode character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    design_count character varying(50),
    order_no character varying(50),
    our_dc_no character varying(50),
    party_dc_no character varying(50),
    dc_date date,
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.dyed_yarn_received OWNER TO postgres;

--
-- Name: dyed_yarn_received_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyed_yarn_received_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyed_yarn_received_id_seq OWNER TO postgres;

--
-- Name: dyed_yarn_received_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyed_yarn_received_id_seq OWNED BY public.dyed_yarn_received.id;


--
-- Name: dyed_yarn_received_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dyed_yarn_received_items (
    id integer NOT NULL,
    receipt_id integer NOT NULL,
    cone_type character varying(20),
    delivery_count integer,
    received_count integer,
    our_lot_no character varying(50),
    color character varying(50),
    taken_kgs numeric(10,2),
    dyed_lot_no character varying(50),
    bags integer,
    cones integer,
    rcvd_kgs numeric(10,2),
    short_kgs numeric(10,2),
    short_pct numeric(5,2)
);


ALTER TABLE public.dyed_yarn_received_items OWNER TO postgres;

--
-- Name: dyed_yarn_received_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dyed_yarn_received_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dyed_yarn_received_items_id_seq OWNER TO postgres;

--
-- Name: dyed_yarn_received_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dyed_yarn_received_items_id_seq OWNED BY public.dyed_yarn_received_items.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    password_hash character varying(255),
    name character varying(150) NOT NULL,
    dob character varying(50),
    gender character varying(20),
    blood_group character varying(10),
    mobile character varying(50),
    address character varying(500),
    family_details character varying(500),
    department character varying(100),
    designation character varying(100),
    category character varying(50),
    unit character varying(100),
    production_line character varying(100),
    shift character varying(50),
    skill_level character varying(50),
    aadhaar_no character varying(50),
    pan_no character varying(50),
    pf_account character varying(50),
    esi_no character varying(50),
    uan character varying(50),
    biometric_id character varying(50),
    medical_fitness character varying(100),
    wage_type character varying(50),
    basic_salary double precision,
    hra double precision,
    da double precision,
    allowances double precision,
    pf_esi_percent double precision,
    qualification character varying(100),
    iti_trade character varying(100),
    machine_knowledge character varying(255),
    training_records character varying(255),
    bank_name character varying(100),
    ifsc_code character varying(50),
    account_number character varying(100),
    payment_mode character varying(50),
    emergency_contact character varying(100),
    pf_nominee character varying(100),
    gratuity_nominee character varying(100),
    status character varying(50),
    biometric_link boolean,
    canteen boolean,
    transport boolean,
    accommodation boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email character varying(255),
    user_type character varying(30),
    web_access character varying(20),
    company_depl boolean,
    company_mtm boolean,
    module_permissions json,
    menu_permissions json,
    last_login timestamp with time zone,
    created_by character varying(50),
    modified_by character varying(50),
    access_expiry_date timestamp with time zone
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: eway_bill_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eway_bill_items (
    id integer NOT NULL,
    bill_id integer NOT NULL,
    product_name character varying(255),
    hsn_code character varying(20),
    unit character varying(20),
    qty numeric(10,2),
    taxable_value numeric(12,2),
    tax_rate numeric(5,2)
);


ALTER TABLE public.eway_bill_items OWNER TO postgres;

--
-- Name: eway_bill_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eway_bill_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eway_bill_items_id_seq OWNER TO postgres;

--
-- Name: eway_bill_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eway_bill_items_id_seq OWNED BY public.eway_bill_items.id;


--
-- Name: eway_bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eway_bills (
    id integer NOT NULL,
    eway_bill_no character varying(50),
    eway_date date,
    supply_type character varying(50),
    sub_type character varying(50),
    document_type character varying(50),
    document_no character varying(50),
    document_date date,
    invoice_type character varying(50),
    bill_from_name character varying(255),
    bill_from_gstin character varying(20),
    bill_from_state character varying(100),
    bill_from_state_code character varying(10),
    dispatch_from_state character varying(100),
    dispatch_from_state_code character varying(10),
    bill_to_name character varying(255),
    bill_to_gstin character varying(20),
    bill_to_state character varying(100),
    bill_to_state_code character varying(10),
    dispatch_to_state character varying(100),
    dispatch_to_state_code character varying(10),
    total_value numeric(14,2),
    sgst numeric(10,2),
    cgst numeric(10,2),
    igst numeric(10,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    token_ex_date character varying(50),
    org_name character varying(100),
    dc_no_date character varying(100),
    token_no text,
    result text,
    error text,
    bill_from_address text,
    bill_from_pin character varying(10),
    dispatch_from_name character varying(255),
    dispatch_from_address text,
    dispatch_from_pin character varying(10),
    dispatch_from_place character varying(150),
    bill_to_address text,
    bill_to_pin character varying(10),
    dispatch_to_name character varying(255),
    dispatch_to_address text,
    dispatch_to_pin character varying(10),
    dispatch_to_place character varying(150),
    distance numeric(10,2)
);


ALTER TABLE public.eway_bills OWNER TO postgres;

--
-- Name: eway_bills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eway_bills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eway_bills_id_seq OWNER TO postgres;

--
-- Name: eway_bills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eway_bills_id_seq OWNED BY public.eway_bills.id;


--
-- Name: finished_fabric_inwards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finished_fabric_inwards (
    id integer NOT NULL,
    ref_no character varying(50),
    inv_no character varying(50),
    inv_date date,
    received_type character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    dc_no character varying(50),
    dc_date date,
    process_type character varying(100),
    total_meters numeric(10,2),
    total_pieces integer,
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.finished_fabric_inwards OWNER TO postgres;

--
-- Name: finished_fabric_inwards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.finished_fabric_inwards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finished_fabric_inwards_id_seq OWNER TO postgres;

--
-- Name: finished_fabric_inwards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.finished_fabric_inwards_id_seq OWNED BY public.finished_fabric_inwards.id;


--
-- Name: finished_fabric_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finished_fabric_items (
    id integer NOT NULL,
    inward_id integer NOT NULL,
    design_no character varying(50),
    color character varying(50),
    lot_no character varying(50),
    meters numeric(10,2),
    pieces integer,
    width numeric(6,2),
    weight numeric(10,2),
    grade character varying(10),
    v_loom character varying(50),
    v_pc_no character varying(50),
    piece_no character varying(50)
);


ALTER TABLE public.finished_fabric_items OWNER TO postgres;

--
-- Name: finished_fabric_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.finished_fabric_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finished_fabric_items_id_seq OWNER TO postgres;

--
-- Name: finished_fabric_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.finished_fabric_items_id_seq OWNED BY public.finished_fabric_items.id;


--
-- Name: general_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.general_master (
    id integer NOT NULL,
    category character varying(50) NOT NULL,
    value character varying(100) NOT NULL
);


ALTER TABLE public.general_master OWNER TO postgres;

--
-- Name: general_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.general_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.general_master_id_seq OWNER TO postgres;

--
-- Name: general_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.general_master_id_seq OWNED BY public.general_master.id;


--
-- Name: goods_release_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_release_items (
    id integer NOT NULL,
    release_id integer NOT NULL,
    packing_slip_no character varying(50),
    bale_no character varying(50),
    design_no character varying(50),
    color character varying(50),
    meters numeric(10,2),
    pieces integer,
    weight numeric(10,2),
    rate numeric(10,2),
    amount numeric(12,2)
);


ALTER TABLE public.goods_release_items OWNER TO postgres;

--
-- Name: goods_release_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goods_release_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_release_items_id_seq OWNER TO postgres;

--
-- Name: goods_release_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goods_release_items_id_seq OWNED BY public.goods_release_items.id;


--
-- Name: goods_releases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goods_releases (
    id integer NOT NULL,
    gra_no character varying(50),
    gra_date date NOT NULL,
    party_name character varying(255),
    ibpo character varying(50),
    design_no character varying(50),
    order_no character varying(50),
    transport_mode character varying(50),
    transport_name character varying(150),
    vehicle_no character varying(50),
    lr_no character varying(50),
    lr_date date,
    delivery_address text,
    total_meters numeric(10,2),
    total_bales integer,
    gross_weight numeric(10,2),
    net_weight numeric(10,2),
    approval_status character varying(30),
    approved_by character varying(100),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.goods_releases OWNER TO postgres;

--
-- Name: goods_releases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goods_releases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_releases_id_seq OWNER TO postgres;

--
-- Name: goods_releases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goods_releases_id_seq OWNED BY public.goods_releases.id;


--
-- Name: grey_yarn_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grey_yarn_deliveries (
    id integer NOT NULL,
    dc_no character varying(50),
    dc_date date NOT NULL,
    delivery_type character varying(100),
    delivery_mode character varying(100),
    party_name character varying(255),
    design_no character varying(100),
    order_no character varying(100),
    transport character varying(255),
    certificate_type character varying(100),
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    ref_date date,
    stock_godown character varying(255),
    delivery_address text,
    vehicle_no character varying(100),
    delivery_name character varying(255),
    delivery_time character varying(20),
    design_count character varying(100),
    order_kgs double precision,
    total_dely_kgs double precision,
    total_rtn_kgs double precision,
    balance_kgs double precision
);


ALTER TABLE public.grey_yarn_deliveries OWNER TO postgres;

--
-- Name: grey_yarn_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grey_yarn_deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grey_yarn_deliveries_id_seq OWNER TO postgres;

--
-- Name: grey_yarn_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grey_yarn_deliveries_id_seq OWNED BY public.grey_yarn_deliveries.id;


--
-- Name: grey_yarn_delivery_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grey_yarn_delivery_items (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    count character varying(100),
    color character varying(100),
    stock double precision,
    bags integer,
    cones integer,
    total_kgs double precision,
    rate double precision,
    amount double precision,
    cone_type character varying(50),
    our_lot_no character varying(100)
);


ALTER TABLE public.grey_yarn_delivery_items OWNER TO postgres;

--
-- Name: grey_yarn_delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grey_yarn_delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grey_yarn_delivery_items_id_seq OWNER TO postgres;

--
-- Name: grey_yarn_delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grey_yarn_delivery_items_id_seq OWNED BY public.grey_yarn_delivery_items.id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    inquiry_no character varying(50),
    lead_id integer NOT NULL,
    date date NOT NULL,
    required_product character varying(100),
    specifications text,
    quantity numeric(12,2),
    uom character varying(20),
    expected_delivery_date date,
    status character varying(50),
    assigned_to_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inquiries OWNER TO postgres;

--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inquiries_id_seq OWNER TO postgres;

--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255),
    phone character varying(50),
    company_name character varying(255),
    country character varying(100),
    region character varying(100),
    source character varying(100),
    status character varying(50),
    assigned_to_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: log_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_reports (
    id integer NOT NULL,
    log_date timestamp with time zone DEFAULT now(),
    user_name character varying(150),
    user_id character varying(50),
    mode character varying(30),
    module character varying(100),
    remarks text
);


ALTER TABLE public.log_reports OWNER TO postgres;

--
-- Name: log_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_reports_id_seq OWNER TO postgres;

--
-- Name: log_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_reports_id_seq OWNED BY public.log_reports.id;


--
-- Name: on_table_checking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.on_table_checking (
    id integer NOT NULL,
    ref_no character varying(50),
    checking_date date,
    design_no character varying(50),
    order_no character varying(50),
    party_name character varying(255),
    lot_no character varying(50),
    total_meters numeric(10,2),
    total_pieces integer,
    pass_meters numeric(10,2),
    reject_meters numeric(10,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    table_no character varying(100)
);


ALTER TABLE public.on_table_checking OWNER TO postgres;

--
-- Name: on_table_checking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.on_table_checking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.on_table_checking_id_seq OWNER TO postgres;

--
-- Name: on_table_checking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.on_table_checking_id_seq OWNED BY public.on_table_checking.id;


--
-- Name: on_table_checking_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.on_table_checking_items (
    id integer NOT NULL,
    checking_id integer NOT NULL,
    piece_no character varying(50),
    meters numeric(10,2),
    defect_type character varying(100),
    grade character varying(10),
    remarks text,
    vpc_no character varying(100),
    inv_pin character varying(100),
    checking_pin character varying(100),
    pc_type character varying(100),
    pc_1 text,
    pc_2 text,
    pc_3 text,
    pc_4 text,
    pc_5 text,
    pc_6 text,
    pc_7 text,
    swex text
);


ALTER TABLE public.on_table_checking_items OWNER TO postgres;

--
-- Name: on_table_checking_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.on_table_checking_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.on_table_checking_items_id_seq OWNER TO postgres;

--
-- Name: on_table_checking_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.on_table_checking_items_id_seq OWNED BY public.on_table_checking_items.id;


--
-- Name: packing_slip_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_slip_items (
    id integer NOT NULL,
    slip_id integer NOT NULL,
    bale_no character varying(50),
    piece_no character varying(50),
    design_no character varying(50),
    color character varying(50),
    meters numeric(10,2),
    weight numeric(10,2),
    grade character varying(10),
    lot_no character varying(50),
    loom_no character varying(50),
    pass_mtr numeric(10,2)
);


ALTER TABLE public.packing_slip_items OWNER TO postgres;

--
-- Name: packing_slip_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_slip_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_slip_items_id_seq OWNER TO postgres;

--
-- Name: packing_slip_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_slip_items_id_seq OWNED BY public.packing_slip_items.id;


--
-- Name: packing_slips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packing_slips (
    id integer NOT NULL,
    slip_no character varying(50),
    slip_date date,
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    ibpo character varying(50),
    godown character varying(100),
    total_meters numeric(10,2),
    total_pieces integer,
    total_bales integer,
    gross_weight numeric(10,2),
    net_weight numeric(10,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.packing_slips OWNER TO postgres;

--
-- Name: packing_slips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packing_slips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packing_slips_id_seq OWNER TO postgres;

--
-- Name: packing_slips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packing_slips_id_seq OWNED BY public.packing_slips.id;


--
-- Name: party_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.party_master (
    id integer NOT NULL,
    party_type character varying(50) NOT NULL,
    customer_code character varying(50),
    customer_grade character varying(10),
    status character varying(20),
    party_group character varying(100),
    address text,
    state_code character varying(10),
    city character varying(100),
    phone character varying(50),
    sales_region character varying(100),
    country character varying(100),
    currency character varying(20),
    contact_person character varying(150),
    email character varying(255),
    tally_no character varying(100),
    address_sno character varying(50),
    tcs_applicable character varying(10),
    tin_no character varying(50),
    cst_no character varying(50),
    gst_type character varying(50),
    pan_no character varying(20),
    tds character varying(50),
    tds_percent double precision,
    pc_id character varying(50),
    merchandiser character varying(100),
    manager character varying(100),
    credit_limit double precision,
    account_incharge character varying(100),
    deliver_party_name character varying(150),
    payment_terms character varying(100),
    transport_name character varying(150),
    delivery_address text,
    agent_name character varying(150),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    company_name character varying(255) DEFAULT 'Unknown'::character varying NOT NULL,
    state character varying(100),
    pin_code character varying(20),
    mobile character varying(20),
    gst_no character varying(50),
    bank_name character varying(150),
    bank_account character varying(50),
    ifsc_code character varying(15),
    credit_days integer,
    buyer_country_region character varying(100),
    currency_preference character varying(20),
    preferred_payment_terms character varying(100),
    preferred_port character varying(150),
    product_interest character varying(255),
    district character varying(100),
    buyer_name character varying(150)
);


ALTER TABLE public.party_master OWNER TO postgres;

--
-- Name: party_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.party_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.party_master_id_seq OWNER TO postgres;

--
-- Name: party_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.party_master_id_seq OWNED BY public.party_master.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    quotation_no character varying(50),
    inquiry_id integer,
    lead_id integer NOT NULL,
    date date NOT NULL,
    valid_until date,
    total_amount numeric(14,2),
    currency character varying(10),
    shipping_term character varying(50),
    remarks text,
    status character varying(50),
    pdf_path character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotations_id_seq OWNER TO postgres;

--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: sales_invoice_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_invoice_items (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    design_no character varying(50),
    color character varying(50),
    uom character varying(20),
    qty numeric(10,2),
    rate numeric(10,2),
    amount numeric(12,2),
    description character varying(255),
    total_bale integer
);


ALTER TABLE public.sales_invoice_items OWNER TO postgres;

--
-- Name: sales_invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_invoice_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_invoice_items_id_seq OWNER TO postgres;

--
-- Name: sales_invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_invoice_items_id_seq OWNED BY public.sales_invoice_items.id;


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    invoice_no character varying(50),
    invoice_date date NOT NULL,
    party_name character varying(255),
    party_id integer,
    ibpo character varying(50),
    design_no character varying(50),
    billing_address text,
    delivery_address text,
    state character varying(100),
    state_code character varying(10),
    gst_no character varying(20),
    hsn_code character varying(20),
    total_qty numeric(10,2),
    gross_weight numeric(10,2),
    gross_amount numeric(14,2),
    discount_pct numeric(5,2),
    discount_amount numeric(12,2),
    taxable_amount numeric(14,2),
    sgst numeric(10,2),
    cgst numeric(10,2),
    igst numeric(10,2),
    other_charges numeric(10,2),
    round_off numeric(6,2),
    net_amount numeric(14,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    invoice_type character varying(50),
    currency character varying(10),
    exchange_rate numeric(10,4),
    rodtep_amount numeric(12,2),
    drawback_amount numeric(12,2),
    ad_code character varying(50),
    iec_number character varying(50),
    firc_reference character varying(100),
    buyer_po_no character varying(50),
    country character varying(100),
    port_of_loading character varying(100),
    port_of_discharge character varying(100),
    incoterms character varying(50),
    dispatch_date character varying(50),
    transporter_name character varying(150),
    lr_no character varying(100),
    vehicle_no character varying(50),
    payment_terms character varying(255),
    delivery_terms character varying(255),
    insurance_charges numeric(10,2) DEFAULT 0
);


ALTER TABLE public.sales_invoices OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_invoices_id_seq OWNER TO postgres;

--
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- Name: sub_masters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_masters (
    id integer NOT NULL,
    entity character varying(80) NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50),
    description text,
    extra_field_1 character varying(200),
    extra_field_2 character varying(200),
    extra_field_3 character varying(200),
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sub_masters OWNER TO postgres;

--
-- Name: sub_masters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sub_masters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sub_masters_id_seq OWNER TO postgres;

--
-- Name: sub_masters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sub_masters_id_seq OWNED BY public.sub_masters.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    assigned_to_id integer,
    related_order_id integer,
    related_inquiry_id integer,
    due_date date,
    priority character varying(20),
    status character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: warp_beam_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warp_beam_details (
    id integer NOT NULL,
    receipt_id integer NOT NULL,
    beam_no character varying(50),
    warp_mtrs numeric(10,2),
    beam_type character varying(50),
    delivery_to_weaver character varying(150),
    order_no character varying(50),
    dc_no character varying(50),
    dc_date date,
    loom_no character varying(50),
    loading_date date,
    total_meters numeric(10,2)
);


ALTER TABLE public.warp_beam_details OWNER TO postgres;

--
-- Name: warp_beam_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warp_beam_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warp_beam_details_id_seq OWNER TO postgres;

--
-- Name: warp_beam_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warp_beam_details_id_seq OWNED BY public.warp_beam_details.id;


--
-- Name: warp_beam_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warp_beam_receipts (
    id integer NOT NULL,
    ref_no character varying(50),
    rcvd_date date,
    rcvd_type character varying(50),
    beam_type character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    color character varying(50),
    warp_count character varying(50),
    warp_ends integer,
    warp_meters numeric(10,2),
    set_no character varying(50),
    siz_dc_no character varying(50),
    siz_dc_date date,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.warp_beam_receipts OWNER TO postgres;

--
-- Name: warp_beam_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warp_beam_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warp_beam_receipts_id_seq OWNER TO postgres;

--
-- Name: warp_beam_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warp_beam_receipts_id_seq OWNED BY public.warp_beam_receipts.id;


--
-- Name: warp_deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warp_deliveries (
    id integer NOT NULL,
    dc_no character varying(50),
    dc_date date,
    delivery_type character varying(50),
    party_name character varying(255),
    design_no character varying(50),
    order_no character varying(50),
    transport character varying(150),
    vehicle_no character varying(50),
    total_meters numeric(10,2),
    balance_meters numeric(10,2),
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    ref_no character varying(50),
    sizing_name character varying(255),
    entry_type character varying(50),
    bpo_no character varying(50),
    address text,
    set_id character varying(50),
    warp_ends integer,
    yarn_count character varying(50),
    vendor_po_no character varying(50),
    po_date date,
    order_mtrs numeric(10,2),
    with_crimp character varying(50),
    delivered_mtrs numeric(10,2),
    total_beams integer,
    total_exptd_mtrs numeric(10,2)
);


ALTER TABLE public.warp_deliveries OWNER TO postgres;

--
-- Name: warp_deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warp_deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warp_deliveries_id_seq OWNER TO postgres;

--
-- Name: warp_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warp_deliveries_id_seq OWNED BY public.warp_deliveries.id;


--
-- Name: warp_delivery_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warp_delivery_items (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    beam_no character varying(50),
    warp_mtrs numeric(10,2),
    beam_type character varying(50),
    loom_no character varying(50)
);


ALTER TABLE public.warp_delivery_items OWNER TO postgres;

--
-- Name: warp_delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warp_delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warp_delivery_items_id_seq OWNER TO postgres;

--
-- Name: warp_delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warp_delivery_items_id_seq OWNED BY public.warp_delivery_items.id;


--
-- Name: work_order_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_order_transactions (
    id integer NOT NULL,
    transaction_no character varying NOT NULL,
    module_type character varying NOT NULL,
    date date NOT NULL,
    buyer_name character varying,
    status character varying,
    details json
);


ALTER TABLE public.work_order_transactions OWNER TO postgres;

--
-- Name: work_order_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_order_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_order_transactions_id_seq OWNER TO postgres;

--
-- Name: work_order_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_order_transactions_id_seq OWNED BY public.work_order_transactions.id;


--
-- Name: yarn_inward_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yarn_inward_items (
    id integer NOT NULL,
    inward_id integer NOT NULL,
    lot_no character varying(100),
    bags integer,
    rate double precision,
    amount double precision,
    yarn_count character varying(100),
    mill_name character varying(255),
    colour character varying(100),
    color_code character varying(100),
    our_id character varying(100),
    kgs double precision
);


ALTER TABLE public.yarn_inward_items OWNER TO postgres;

--
-- Name: yarn_inward_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.yarn_inward_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yarn_inward_items_id_seq OWNER TO postgres;

--
-- Name: yarn_inward_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.yarn_inward_items_id_seq OWNED BY public.yarn_inward_items.id;


--
-- Name: yarn_inwards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yarn_inwards (
    id integer NOT NULL,
    ref_no character varying(50),
    received_type character varying(50),
    gross_amount double precision,
    net_amount double precision,
    remarks text,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    entry_date date,
    inward_date date,
    received_from character varying(255),
    po_no_dt character varying(100),
    agent_name character varying(255),
    stock_godown character varying(255),
    godown_id integer,
    cone_type character varying(50),
    order_kgs double precision,
    received_kgs double precision,
    balance_kgs double precision,
    pc_id character varying(100),
    tolerance_pct double precision,
    bill_no character varying(100),
    bill_amount double precision,
    gross_kgs double precision,
    net_kgs double precision,
    chipnam character varying(100),
    due_days integer,
    transport character varying(255),
    veh_no character varying(100),
    total_bags integer,
    eway_bill character varying(100),
    org_grn_no character varying(100),
    gate_no character varying(100),
    wbridge_no character varying(100),
    w_weight double precision,
    other_remarks text,
    packing character varying(100),
    freight double precision,
    tax_type character varying(100),
    cgst_pct double precision,
    sgst_pct double precision,
    igst_pct double precision,
    tax_value double precision,
    tcs_value double precision,
    tds_pct double precision,
    total_tax double precision,
    round_off double precision
);


ALTER TABLE public.yarn_inwards OWNER TO postgres;

--
-- Name: yarn_inwards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.yarn_inwards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yarn_inwards_id_seq OWNER TO postgres;

--
-- Name: yarn_inwards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.yarn_inwards_id_seq OWNED BY public.yarn_inwards.id;


--
-- Name: yarn_purchase_count_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yarn_purchase_count_details (
    id integer NOT NULL,
    po_id integer NOT NULL,
    supplier_name character varying(255),
    fibre_group character varying(100),
    yarn_count character varying(100),
    yarn_csp double precision,
    min_cone_wgt double precision,
    order_kgs double precision,
    mill_name character varying(255),
    print_name character varying(255),
    tolerance_pct double precision
);


ALTER TABLE public.yarn_purchase_count_details OWNER TO postgres;

--
-- Name: yarn_purchase_count_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.yarn_purchase_count_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yarn_purchase_count_details_id_seq OWNER TO postgres;

--
-- Name: yarn_purchase_count_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.yarn_purchase_count_details_id_seq OWNED BY public.yarn_purchase_count_details.id;


--
-- Name: yarn_purchase_indent_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yarn_purchase_indent_details (
    id integer NOT NULL,
    po_id integer NOT NULL,
    req_ind_no character varying(100),
    design_no character varying(100),
    ibpo_no character varying(100),
    party_name character varying(255),
    fabric_name character varying(255),
    yarn_count character varying(100),
    order_mtrs double precision,
    warp_qty double precision,
    weft_qty double precision,
    tot_reqd_qty double precision,
    appd_qty double precision,
    order_qty double precision
);


ALTER TABLE public.yarn_purchase_indent_details OWNER TO postgres;

--
-- Name: yarn_purchase_indent_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.yarn_purchase_indent_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yarn_purchase_indent_details_id_seq OWNER TO postgres;

--
-- Name: yarn_purchase_indent_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.yarn_purchase_indent_details_id_seq OWNED BY public.yarn_purchase_indent_details.id;


--
-- Name: yarn_purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.yarn_purchase_orders (
    id integer NOT NULL,
    po_number character varying(50),
    po_date date NOT NULL,
    remarks text,
    net_amount double precision,
    status character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    org_name character varying(255),
    internal_po_no character varying(100),
    used_for character varying(100),
    against_ref character varying(100),
    agent_name character varying(255),
    supplier_name character varying(255),
    delivery_at character varying(255),
    freight_type character varying(100),
    freight_chg double precision,
    insurance_chg double precision,
    total_order_kgs double precision,
    transport character varying(255),
    tax_type character varying(100),
    taxable_amount double precision,
    dispatch_date date,
    packing_type character varying(100),
    sgst_pct double precision,
    cgst_pct double precision,
    igst_pct double precision,
    labeling character varying(255),
    colour character varying(100),
    due_days integer
);


ALTER TABLE public.yarn_purchase_orders OWNER TO postgres;

--
-- Name: yarn_purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.yarn_purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yarn_purchase_orders_id_seq OWNER TO postgres;

--
-- Name: yarn_purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.yarn_purchase_orders_id_seq OWNED BY public.yarn_purchase_orders.id;


--
-- Name: buyer_order_amendments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_amendments ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_amendments_id_seq'::regclass);


--
-- Name: buyer_order_completions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_completions ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_completions_id_seq'::regclass);


--
-- Name: buyer_order_dispatches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_dispatches ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_dispatches_id_seq'::regclass);


--
-- Name: buyer_order_expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_expenses ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_expenses_id_seq'::regclass);


--
-- Name: buyer_order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_items ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_items_id_seq'::regclass);


--
-- Name: buyer_order_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_schedules ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_schedules_id_seq'::regclass);


--
-- Name: buyer_order_sequences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_sequences ALTER COLUMN id SET DEFAULT nextval('public.buyer_order_sequences_id_seq'::regclass);


--
-- Name: buyer_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_orders ALTER COLUMN id SET DEFAULT nextval('public.buyer_orders_id_seq'::regclass);


--
-- Name: cloth_deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_deliveries ALTER COLUMN id SET DEFAULT nextval('public.cloth_deliveries_id_seq'::regclass);


--
-- Name: cloth_delivery_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_delivery_items ALTER COLUMN id SET DEFAULT nextval('public.cloth_delivery_items_id_seq'::regclass);


--
-- Name: cloth_inward_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_inward_items ALTER COLUMN id SET DEFAULT nextval('public.cloth_inward_items_id_seq'::regclass);


--
-- Name: cloth_inwards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_inwards ALTER COLUMN id SET DEFAULT nextval('public.cloth_inwards_id_seq'::regclass);


--
-- Name: company_setting id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_setting ALTER COLUMN id SET DEFAULT nextval('public.company_setting_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: design_entry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.design_entry ALTER COLUMN id SET DEFAULT nextval('public.design_entry_id_seq'::regclass);


--
-- Name: despatch_planning id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despatch_planning ALTER COLUMN id SET DEFAULT nextval('public.despatch_planning_id_seq'::regclass);


--
-- Name: dyed_yarn_deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_deliveries ALTER COLUMN id SET DEFAULT nextval('public.dyed_yarn_deliveries_id_seq'::regclass);


--
-- Name: dyed_yarn_delivery_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_delivery_items ALTER COLUMN id SET DEFAULT nextval('public.dyed_yarn_delivery_items_id_seq'::regclass);


--
-- Name: dyed_yarn_received id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_received ALTER COLUMN id SET DEFAULT nextval('public.dyed_yarn_received_id_seq'::regclass);


--
-- Name: dyed_yarn_received_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_received_items ALTER COLUMN id SET DEFAULT nextval('public.dyed_yarn_received_items_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: eway_bill_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eway_bill_items ALTER COLUMN id SET DEFAULT nextval('public.eway_bill_items_id_seq'::regclass);


--
-- Name: eway_bills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eway_bills ALTER COLUMN id SET DEFAULT nextval('public.eway_bills_id_seq'::regclass);


--
-- Name: finished_fabric_inwards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_fabric_inwards ALTER COLUMN id SET DEFAULT nextval('public.finished_fabric_inwards_id_seq'::regclass);


--
-- Name: finished_fabric_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_fabric_items ALTER COLUMN id SET DEFAULT nextval('public.finished_fabric_items_id_seq'::regclass);


--
-- Name: general_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_master ALTER COLUMN id SET DEFAULT nextval('public.general_master_id_seq'::regclass);


--
-- Name: goods_release_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_release_items ALTER COLUMN id SET DEFAULT nextval('public.goods_release_items_id_seq'::regclass);


--
-- Name: goods_releases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_releases ALTER COLUMN id SET DEFAULT nextval('public.goods_releases_id_seq'::regclass);


--
-- Name: grey_yarn_deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grey_yarn_deliveries ALTER COLUMN id SET DEFAULT nextval('public.grey_yarn_deliveries_id_seq'::regclass);


--
-- Name: grey_yarn_delivery_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grey_yarn_delivery_items ALTER COLUMN id SET DEFAULT nextval('public.grey_yarn_delivery_items_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: log_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_reports ALTER COLUMN id SET DEFAULT nextval('public.log_reports_id_seq'::regclass);


--
-- Name: on_table_checking id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.on_table_checking ALTER COLUMN id SET DEFAULT nextval('public.on_table_checking_id_seq'::regclass);


--
-- Name: on_table_checking_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.on_table_checking_items ALTER COLUMN id SET DEFAULT nextval('public.on_table_checking_items_id_seq'::regclass);


--
-- Name: packing_slip_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_slip_items ALTER COLUMN id SET DEFAULT nextval('public.packing_slip_items_id_seq'::regclass);


--
-- Name: packing_slips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_slips ALTER COLUMN id SET DEFAULT nextval('public.packing_slips_id_seq'::regclass);


--
-- Name: party_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.party_master ALTER COLUMN id SET DEFAULT nextval('public.party_master_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: sales_invoice_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoice_items ALTER COLUMN id SET DEFAULT nextval('public.sales_invoice_items_id_seq'::regclass);


--
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- Name: sub_masters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_masters ALTER COLUMN id SET DEFAULT nextval('public.sub_masters_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: warp_beam_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_beam_details ALTER COLUMN id SET DEFAULT nextval('public.warp_beam_details_id_seq'::regclass);


--
-- Name: warp_beam_receipts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_beam_receipts ALTER COLUMN id SET DEFAULT nextval('public.warp_beam_receipts_id_seq'::regclass);


--
-- Name: warp_deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_deliveries ALTER COLUMN id SET DEFAULT nextval('public.warp_deliveries_id_seq'::regclass);


--
-- Name: warp_delivery_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_delivery_items ALTER COLUMN id SET DEFAULT nextval('public.warp_delivery_items_id_seq'::regclass);


--
-- Name: work_order_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_transactions ALTER COLUMN id SET DEFAULT nextval('public.work_order_transactions_id_seq'::regclass);


--
-- Name: yarn_inward_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_inward_items ALTER COLUMN id SET DEFAULT nextval('public.yarn_inward_items_id_seq'::regclass);


--
-- Name: yarn_inwards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_inwards ALTER COLUMN id SET DEFAULT nextval('public.yarn_inwards_id_seq'::regclass);


--
-- Name: yarn_purchase_count_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_count_details ALTER COLUMN id SET DEFAULT nextval('public.yarn_purchase_count_details_id_seq'::regclass);


--
-- Name: yarn_purchase_indent_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_indent_details ALTER COLUMN id SET DEFAULT nextval('public.yarn_purchase_indent_details_id_seq'::regclass);


--
-- Name: yarn_purchase_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.yarn_purchase_orders_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
0cfc0af9f126
\.


--
-- Data for Name: buyer_order_amendments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_amendments (id, amendment_id, order_id_ref, amd_date, field_changed, old_value, new_value, remarks, approved_by, effective_date, buyer_ref, fabric_details, shade, created_at) FROM stdin;
3	AMD-0001	IBPO-00007	2026-06-06	Quantity	5000	3000	no	kavya	2026-06-22	PO-2026-1001	Poplin 40x40	Royal Blue	2026-06-04 10:32:40.83148+05:30
\.


--
-- Data for Name: buyer_order_completions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_completions (id, cmp_id, order_id_ref, completion_date, status, final_dispatch_qty, balance_qty, fabric_type, shade, lot_no, packing_type, delivery_place, transporter_name, buyer_ref, remarks, created_at) FROM stdin;
3	CMP-001	IBPO-00007	2026-06-24	Closed	4000	500	Poplin 40x40	Royal Blue	lot -001	Roll Packing	Tiruppur	Blue Dart Express	PO-2026-1001	order closed	2026-06-04 10:33:21.270641+05:30
\.


--
-- Data for Name: buyer_order_dispatches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_dispatches (id, indent_id, order_id_ref, transporter_name, lr_no, vehicle_no, delivery_place, packing_type, dispatch_date, shade, lot_no, quantity, remarks, created_at) FROM stdin;
3	IND-0001	IBPO-00007	Blue Dart Express	To Pay	TN-40-M-8456	Tiruppur	Roll Packing	2026-06-06	Royal Blue	LOT-001	5000	NO	2026-06-04 10:52:26.312597+05:30
\.


--
-- Data for Name: buyer_order_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_expenses (id, expense_id, order_id_ref, expense_type, amount, currency, payment_mode, vendor_name, invoice_ref, remarks, created_at) FROM stdin;
3	EXP-0001	IBPO-00001	Freight	9000.00	INR	Cash	Maersk Logistics	INV-FRT-2026-001	Freight charges for transporting goods from warehouse to buyer location.	2026-06-04 11:24:27.309684+05:30
\.


--
-- Data for Name: buyer_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_items (id, order_id, party_po_no, po_date, design_no, fabric_type, color, order_mtrs, tolerance_pct, uom, hsn_code, rate, amount, buyer_style, party_terms, point_of_contact, total_mtr_yard, sample_mtr, short_no, gry_construction, construction, weaving_type, pick_on_table, print_name, finish_reed, finish_pick, finish_width, cuttable_width, pattern, packing_type, loom_type, insurance, packing_charge, end_use, season, party_comment, fabric_content, development_id, country, combo, currency, pc_type, gsm, price, gst_pct, gst_rate, image_design_path, yarn_count, certifications) FROM stdin;
20	6	JFI/PO/2026/001	2026-06-03	DSN-1001	Poplin 40x40	Navy Blue	1000.00	5.00	Kilograms	52081100	180.00	180000.00	Men's Casual Shirt		John Smith	0.00	50.00	SH1001	60x60 / 92x88		Plain Weave	88		0	0	58.00	0.00	Check	Roll Packing		No	0.00	Trousers & Bottom Wear	SUMMER				India		INR		0.00	0.00	0.00	0.00		\N	\N
21	7	PO-2026-1001	2026-06-06	DSN-101	Poplin 40x40	Royal Blue	5000.00	5.00	METERS	52083900	120.00	600000.00	Men's Casual Shirt		Prakash	0.00	50.00	SH001	40x40/133x72		Plain Weave	60		0	0	58.00	0.00	Solid	Roll Packing		No	0.00	GARMENTS	SUMMER				India		INR		0.00	0.00	0.00	0.00		\N	\N
\.


--
-- Data for Name: buyer_order_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_schedules (id, schedule_id, order_id_ref, buyer_ref, shipment_date, delivery_place, delivery_terms, qty, fabric_type, shade, lot_no, packing_type, transporter_name, transport_mode, remarks, status, created_at) FROM stdin;
3	SCH-001	IBPO-00007	PO-2026-1001	2026-06-09	Tiruppur	Net 7 Days	5000	Poplin 40x40	Royal Blue	LOT-001	Roll Packing	Blue Dart Express	Road	Priority export order. Maintain quality and delivery commitments as per buyer requirements.	Scheduled	2026-06-04 10:20:11.336627+05:30
\.


--
-- Data for Name: buyer_order_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_order_sequences (id, sequence_id, prefix, fin_year, running_no, buyer_name, party_name, order_type, category, buyer_ref, generated_order_no, created_by, created_at, order_id_ref) FROM stdin;
3	SEQ-0001	IBPO	2026-27	1	H&M Buying Office	Suntex Garments Pvt Ltd	Export Order	Garments	PO-2026-1001	IBPO-2026-001	Administrator	2026-06-04 10:27:39.938199+05:30	IBPO-00007
\.


--
-- Data for Name: buyer_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_orders (id, ibpo_number, order_date, party_name, party_id, agent_name, order_type, certified_type, billing_address, delivery_address, state, state_code, gst_no, pan_no, nomination_type, payment_terms, outstanding, overdue, transport_mode, transport_name, delivery_place, lr_type, lr_terms, commission_pct, status, remarks, created_at, updated_at, buyer_name, commission_type, order_taken_by, regular_special, due_30_days, status_remark, max_crd_days, po_credit, po_max_crd, bill_credit, payment_detail, payment_file_path, party_terms, party_comp_date, exfactory_date, delivery_starting, delivery_at, desp_mtr_min, desp_mtr_max, process_sequence, process_instruction, email_to, email_cc, yarn_instruction, prod_instruction, delivery_instruction, export_order_no, proforma_invoice_no, lc_no, lc_expiry_date, container_no, seal_no, shipping_bill_no, shipping_bill_date, bill_of_lading_no, bill_of_lading_date, freight_amount, insurance_amount, packing_amount, amendments) FROM stdin;
6	IBPO-00001	2026-06-03	ABC Textiles Pvt Ltd	16	Rajesh Kumar (AGT001)	Export Order	Global Organic Textile Standard	No. 25, SIPCOT Industrial Estate, Tiruppur Main Road, Tiruppur, Tamil Nadu - 641604, Tiruppur, Tiruppur, Tamil Nadu, India - 641604	New York Distribution Center, USA	Tamil Nadu		33ABCDE1234F1Z5	ABCDE1234F	Buyer Nomination	Net 7 Days	10.00	10.00	SEA FREIGHT	Maersk Logistics	New York	Paid	Freight Collect	2.50	CONFIRMED	Priority order for Summer Collection 20	2026-06-03 15:57:00.715959+05:30	2026-06-03 21:10:50.98587+05:30	John Fashion Imports LLC	PERCENTAGE	Priya Sharma	REGULAR	10.00	APPROVED	60	45	1000000	45	Payment through Bank Transfer after shipment		FOB	2026-07-25	2026-07-20	2026-07-22	New York Port	9500.00	10500.00	Weaving → Dyeing → Finishing → Packing → Dispatch	Ensure fabric quality as per buyer specification	buyer@johnfashion.com	merchandiser@abctextiles.com	Use 100% Combed Cotton Yarn 40s Count	Maintain shade variation within approved toleranc	Ship according to agreed delivery schedule	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7	IBPO-00007	2026-06-04	Suntex Garments Pvt Ltd	18	Rajkumar	Export Order	Global Organic Textile Standard	45, SIPCOT Industrial Park, Tiruppur, Tiruppur, Tiruppur, Tamil Nadu, India - 641605	45, Industrial Estate, Tiruppur, Tamil Nadu	Tamil Nadu		3ABCDE1234F1Z5	ABCDE1234F	Buyer Nomination	Net 7 Days	50000.00	10000.00	Road	Blue Dart Express	Tiruppur	To Pay	Freight Collect	2.50	APPROVED	Priority export order. Maintain quality and delivery commitments as per buyer requirements.	2026-06-04 09:43:45.958888+05:30	2026-06-04 09:43:45.958888+05:30	H&M Buying Office	PERCENTAGE	Priya Sharma	REGULAR	5000.00	Customer credit approved.	60	45	200000	149997	Payment to be released within agreed credit period.		FOB	2026-10-07	2026-07-15	2026-07-18	Tiruppur Warehouse	4500.00	5000.00	Weaving->dyeing->finishing->packing	Ensure all production stages meet quality standards.	buyer@abcgarments.com	merchandiser@abcgarments.com	Use 100% combed cotton yarn as approved by buyer.	Complete production as per delivery schedule.	Notify buyer 2 days before dispatch.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: cloth_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloth_deliveries (id, dc_no, dc_date, delivery_type, delivery_mode, party_name, design_no, order_no, transport, total_meters, total_pieces, gross_amount, sgst, igst, net_amount, remarks, status, created_at, po_no, process_type, ibpo, fabric_detail, pc_type, ibpo_order_mtr, delivery_mtr, balance, fresh_width, finish_fold, process_comm, bpo_no, design_no_bottom, buyer_name, lot_no, griege_rate, return_type, oba, finish_pick, glm, voucher_no, voucher_date, rate_mtr, debited_amount, detailed_remarks, transport_name, vehicle_no, driver_name, mobile_no) FROM stdin;
\.


--
-- Data for Name: cloth_delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloth_delivery_items (id, delivery_id, design_no, color, lot_no, meters, pieces, rate, amount, piece_no, ok_mtr, fold_mtr) FROM stdin;
\.


--
-- Data for Name: cloth_inward_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloth_inward_items (id, inward_id, design_no, color, lot_no, meters, pieces, rate, amount, piece_no, weight, vloom, vpc_no) FROM stdin;
\.


--
-- Data for Name: cloth_inwards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cloth_inwards (id, ref_no, inv_no, inv_date, received_type, party_name, design_no, order_no, dc_no, dc_date, total_meters, total_pieces, gross_amount, net_amount, remarks, status, created_at, inward_type, inw_date, vendor_order, vendor_order_mtr, order_mtr_plus_10, received_mtr, balance_mtr, ibpo, const_fabric_type, reed, pick, width, order_mtr, warp_mtr, inward_mtr, shed_no, loom_no, attn_no, beam_no, szt_no, inspection_type, inv_pin, process_type, process_remarks) FROM stdin;
\.


--
-- Data for Name: company_setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_setting (id, company_name, logo, address, email, phone, created_at, updated_at, description) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_settings (id, company_name, address, gstin, phone, email, website, pan_number, state, state_code, pin_code, bank_name, account_number, ifsc_code, updated_at) FROM stdin;
\.


--
-- Data for Name: design_entry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.design_entry (id, ds_ref_no, ds_date, design_no, color, created_by, gry_const, count_rxpxw, buyer_name, ibpo_no, order_mtr, ex_mtr, total_mtr, crimp_pct, skg_pct, warp_mtr, weft_pro_mtr, gray_width, finish_width, reed_ol, pick_ot, reed, fabric, total_ends, warp_width, qlm, toie_pct, selvage_waste, weaving, design_type, packing_less, weight_grm, dyeing_loss_pct, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: despatch_planning; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.despatch_planning (id, ibpo, po_date, ref_no, planning_date, billing_party, delivery_party, billing_address, delivery_address, state_code, design_no, pino, order_qty, amd_foc_mtr, total_qty, uom, delivery_start, party_comp_date, comp_date, lc_no, lc_date, ibpo_rate, currency, certificate_type, fabric_type, planned_mtrs, tolerance_pct, max_dispatch_qty, stock, tot_desp_mtrs, balance_mtrs, last_desp_date, hsn_code, merchant, city, point_of_contact, remarks, status, created_at, freight_forwarder, cha_name, vessel_flight_name, etd, eta, incoterm) FROM stdin;
\.


--
-- Data for Name: dyed_yarn_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dyed_yarn_deliveries (id, dc_no, dc_no_alt, dc_date, delivery_type, delivery_mode, party_name, delivery_address, design_no, order_no, design_type, transport, certificate_type, driver_name, total_delv_kgs, total_rin_kgs, balance_kgs, gross_amount, sgst, igst, net_amount, remarks, status, created_at, add_date, delivery_time, cost, insurance, other_charges, tax_value, total_gst, round_off) FROM stdin;
\.


--
-- Data for Name: dyed_yarn_delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dyed_yarn_delivery_items (id, delivery_id, yarn_type, count, color, lot_no, stock, bags, cones, total_kgs, rate, amount) FROM stdin;
\.


--
-- Data for Name: dyed_yarn_received; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dyed_yarn_received (id, inv_no, inv_date, received_type, receive_mode, party_name, design_no, design_count, order_no, our_dc_no, party_dc_no, dc_date, remarks, status, created_at) FROM stdin;
\.


--
-- Data for Name: dyed_yarn_received_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dyed_yarn_received_items (id, receipt_id, cone_type, delivery_count, received_count, our_lot_no, color, taken_kgs, dyed_lot_no, bags, cones, rcvd_kgs, short_kgs, short_pct) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_code, password_hash, name, dob, gender, blood_group, mobile, address, family_details, department, designation, category, unit, production_line, shift, skill_level, aadhaar_no, pan_no, pf_account, esi_no, uan, biometric_id, medical_fitness, wage_type, basic_salary, hra, da, allowances, pf_esi_percent, qualification, iti_trade, machine_knowledge, training_records, bank_name, ifsc_code, account_number, payment_mode, emergency_contact, pf_nominee, gratuity_nominee, status, biometric_link, canteen, transport, accommodation, created_at, updated_at, email, user_type, web_access, company_depl, company_mtm, module_permissions, menu_permissions, last_login, created_by, modified_by, access_expiry_date) FROM stdin;
8	admin	$2b$12$QDi.zraLhApj5uOz7VFJy.d8djSld0YYWfZ9mbymsy9KyYNw9ac.y	Administrator	\N	\N	\N	\N	\N	\N	IT	System Admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Active	f	f	f	f	2026-06-03 10:02:28.745299+05:30	2026-06-03 10:02:28.745299+05:30	admin@dinesh-textile.com	Admin	Allow	f	f	{"master": true, "buyer_order": true, "work_order": true, "warping_sizing": true, "production": true, "processing": true, "fabric": true, "yarn": true, "account": true, "report": true}	{}	\N	\N	\N	\N
11	MGR001	\N	Karthik Kumar	1998-11-20	Male	A+	9876543230	No. 18, Green Park Avenue, Tiruppur Main Road, Tiruppur, Tamil Nadu – 641604	Father – Kumaravel (Businessman) Mother – Shanthi Kumaravel (Homemaker) Wife – Priya Karthik (Teacher) Son – Arjun Karthik (Student)	Manager	General Manager	Management	Corporate Office	Administration & Operations	General	Expert	678901234567	KLMNO9876P	PF2026001003	ESI20260003	100123456791	BIO003	Fit	Monthly Salary	85000	17000	8500	10000	12	MBA	N/A	ERP Management Systems, Production Planning Tools	Leadership Training, Lean Manufacturing Workshop, ERP Administration Training	HDFC Bank	HDFC0005678	123456789456	Bank Transfer	Priya Karthik – 9876543231	Priya Karthik (Wife)	Arjun Karthik (Son)	Active	t	t	t	t	2026-06-03 12:59:42.073264+05:30	2026-06-03 12:59:42.073264+05:30	\N	Staff	Allow	f	f	{}	{}	\N	\N	\N	\N
10	ACC001	$2b$12$wnQcYlUfnZvpMyPYV0dFUuMFmzISWuDJzH0xu.DFxeDYoPfrVaKve	Lakshmi Devi	1992-05-12	Female	O+	9876543220	No. 45, Anna Nagar, Erode Main Road, Erode, Tamil Nadu – 638001	Father – S. Rajendran (Retired Teacher) Mother – Meena Rajendran (Homemaker) Husband – Arun Kumar (Bank Officer) Daughter – Diya Arun (Student)	Accounts	Accounts Incharge	Staff	Finance Division	Accounts & Finance	General	Expert	567890123456	FGHIJ5678K	PF2026001002	ESI20260002	100123456790	BIO002	Fit	Monthly Salary	45000	9000	4500	3500	12	M.Com	N/A	Tally ERP, GST Filing, Excel Advanced	GST Compliance Training, ERP Finance Module Training	ICICI Bank	ICIC0001234	123456789123	Bank Transfer	Arun Kumar – 9876543221	Arun Kumar (Husband)	Diya Arun (Daughter)	Active	t	t	f	f	2026-06-03 12:28:41.708894+05:30	2026-06-03 12:28:41.708894+05:30	\N	Staff	Allow	f	f	{}	{}	\N	\N	\N	\N
9	MER001	$2b$12$QX6U5Gqf79OOeFx6.nlMku93cBeOpmid02Hsl5w09HQtd1V.gbheO	Priya Sharma	1998-10-15	Female	B+	9876543210	No. 12, Lakshmi Nagar, Gandhi Road, Near New Bus Stand, Salem, Tamil Nadu – 636007, India.	Family Details: Father – Ramesh Sharma (Businessman) Mother – Sunitha Sharma (Homemaker) Brother – Rahul Sharma (Software Engineer) Sister – Ananya Sharma (College Student)	Merchandising	Senior Merchandiser	Staff	Export Division	Merchandising & Order Coordination	General	Advance	456789123456	ABCDE1234F	PF2026001001	ESI20260001	100123456789	BIO001	Fit	Monthly Salary	40000	8000	4000	3000	12	MBA (Textile Management)	N/A	ERP Systems, Fabric Inspection Process, Order Tracking	Export Documentation, Buyer Communication, ERP Training (2025)	HDFC Bank	HDFC0001234	123456789012	Bank Transfer	Ramesh Sharma – 9876501234	Ramesh Sharma (Father)	Sunitha Sharma (Mother)	Active	t	t	t	f	2026-06-03 12:14:21.293038+05:30	2026-06-03 12:55:14.906763+05:30	\N	Staff	Allow	f	f	{}	{}	\N	\N	\N	\N
\.


--
-- Data for Name: eway_bill_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eway_bill_items (id, bill_id, product_name, hsn_code, unit, qty, taxable_value, tax_rate) FROM stdin;
\.


--
-- Data for Name: eway_bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eway_bills (id, eway_bill_no, eway_date, supply_type, sub_type, document_type, document_no, document_date, invoice_type, bill_from_name, bill_from_gstin, bill_from_state, bill_from_state_code, dispatch_from_state, dispatch_from_state_code, bill_to_name, bill_to_gstin, bill_to_state, bill_to_state_code, dispatch_to_state, dispatch_to_state_code, total_value, sgst, cgst, igst, remarks, status, created_at, token_ex_date, org_name, dc_no_date, token_no, result, error, bill_from_address, bill_from_pin, dispatch_from_name, dispatch_from_address, dispatch_from_pin, dispatch_from_place, bill_to_address, bill_to_pin, dispatch_to_name, dispatch_to_address, dispatch_to_pin, dispatch_to_place, distance) FROM stdin;
\.


--
-- Data for Name: finished_fabric_inwards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finished_fabric_inwards (id, ref_no, inv_no, inv_date, received_type, party_name, design_no, order_no, dc_no, dc_date, process_type, total_meters, total_pieces, remarks, status, created_at) FROM stdin;
\.


--
-- Data for Name: finished_fabric_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finished_fabric_items (id, inward_id, design_no, color, lot_no, meters, pieces, width, weight, grade, v_loom, v_pc_no, piece_no) FROM stdin;
\.


--
-- Data for Name: general_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.general_master (id, category, value) FROM stdin;
39	party_group	Textile Suppliers
40	party_group	Buyers
41	party_group	Processors
42	party_group	Transporters
43	party_group	Agents
44	customer_grade	A
45	customer_grade	B
46	customer_grade	C
47	state_code	TN / 33
48	state_code	MH / 27
49	state_code	KA / 29
50	state_code	GJ / 24
51	city	Tiruchengodu
52	city	Erode
53	city	Coimbatore
54	city	Mumbai
55	city	Surat
56	city	Ahmedabad
57	sales_region	South Zone
58	sales_region	North Zone
59	sales_region	Export
60	sales_region	Local
61	country	India
62	country	Bangladesh
63	country	USA
64	country	UAE
65	currency	INR
66	currency	USD
67	currency	EUR
68	gst_type	With GST
69	gst_type	Without GST
70	tds	None
71	tds	194C
72	tds	194Q
73	payment_terms	Net 30
74	payment_terms	Advance
75	payment_terms	COD
76	payment_terms	Against BL
\.


--
-- Data for Name: goods_release_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goods_release_items (id, release_id, packing_slip_no, bale_no, design_no, color, meters, pieces, weight, rate, amount) FROM stdin;
\.


--
-- Data for Name: goods_releases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goods_releases (id, gra_no, gra_date, party_name, ibpo, design_no, order_no, transport_mode, transport_name, vehicle_no, lr_no, lr_date, delivery_address, total_meters, total_bales, gross_weight, net_weight, approval_status, approved_by, remarks, status, created_at) FROM stdin;
\.


--
-- Data for Name: grey_yarn_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grey_yarn_deliveries (id, dc_no, dc_date, delivery_type, delivery_mode, party_name, design_no, order_no, transport, certificate_type, status, created_at, ref_date, stock_godown, delivery_address, vehicle_no, delivery_name, delivery_time, design_count, order_kgs, total_dely_kgs, total_rtn_kgs, balance_kgs) FROM stdin;
\.


--
-- Data for Name: grey_yarn_delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grey_yarn_delivery_items (id, delivery_id, count, color, stock, bags, cones, total_kgs, rate, amount, cone_type, our_lot_no) FROM stdin;
\.


--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inquiries (id, inquiry_no, lead_id, date, required_product, specifications, quantity, uom, expected_delivery_date, status, assigned_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, first_name, last_name, email, phone, company_name, country, region, source, status, assigned_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: log_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_reports (id, log_date, user_name, user_id, mode, module, remarks) FROM stdin;
\.


--
-- Data for Name: on_table_checking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.on_table_checking (id, ref_no, checking_date, design_no, order_no, party_name, lot_no, total_meters, total_pieces, pass_meters, reject_meters, remarks, status, created_at, table_no) FROM stdin;
\.


--
-- Data for Name: on_table_checking_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.on_table_checking_items (id, checking_id, piece_no, meters, defect_type, grade, remarks, vpc_no, inv_pin, checking_pin, pc_type, pc_1, pc_2, pc_3, pc_4, pc_5, pc_6, pc_7, swex) FROM stdin;
\.


--
-- Data for Name: packing_slip_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packing_slip_items (id, slip_id, bale_no, piece_no, design_no, color, meters, weight, grade, lot_no, loom_no, pass_mtr) FROM stdin;
\.


--
-- Data for Name: packing_slips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packing_slips (id, slip_no, slip_date, party_name, design_no, order_no, ibpo, godown, total_meters, total_pieces, total_bales, gross_weight, net_weight, remarks, status, created_at) FROM stdin;
\.


--
-- Data for Name: party_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.party_master (id, party_type, customer_code, customer_grade, status, party_group, address, state_code, city, phone, sales_region, country, currency, contact_person, email, tally_no, address_sno, tcs_applicable, tin_no, cst_no, gst_type, pan_no, tds, tds_percent, pc_id, merchandiser, manager, credit_limit, account_incharge, deliver_party_name, payment_terms, transport_name, delivery_address, agent_name, created_at, updated_at, company_name, state, pin_code, mobile, gst_no, bank_name, bank_account, ifsc_code, credit_days, buyer_country_region, currency_preference, preferred_payment_terms, preferred_port, product_interest, district, buyer_name) FROM stdin;
16	Exporter	2416	A	Active	Sales Agent	No. 25, SIPCOT Industrial Estate, Tiruppur Main Road, Tiruppur, Tamil Nadu - 641604		Tiruppur	9876543210	South Zone	India	INR	Rajesh Kumar	rajesh.kumar@abctextiles.com	TAL001	1	No	TIN12345678	CST987654	Regular	ABCDE1234F	yes	5	PC001	Priya Sharma	Karthik Kumar	500000	Lakshmi Devi	ABC Textiles Pvt Ltd	Net 7 Days	VRL Logistics	No. 25, SIPCOT Industrial Estate, Tiruppur Main Road, Tiruppur, Tamil Nadu - 641604	Rajesh Kumar (AGT001)	2026-06-03 13:32:08.081179+05:30	2026-06-03 19:25:57.31636+05:30	ABC Textiles Pvt Ltd	Tamil Nadu	641604		33ABCDE1234F1Z5				30	\N	\N	\N	\N	\N	Tiruppur	Rahul Exports
18	Exporter	2417	A	Active	Trading	45, SIPCOT Industrial Park, Tiruppur		Tiruppur	9000012345	South Zone	India	INR	Arjun Kumar	hm.india@sourcing.com	TLY-88901	1	No	33789012345	CST9876543	Regular	ABCDE1234F	Applicable	1	PC-0015	Priya Sharma	Karthik Kumar	50000	Lakshmi Devi	Suntex Garments Pvt Ltd	Net 7 Days	Blue Dart Express	H&M Buying Office No 25, 5th Floor, Embassy Tower MG Road, Bengaluru Karnataka - 560001 India	Rajkumar	2026-06-03 19:40:08.52573+05:30	2026-06-03 19:54:34.386779+05:30	Suntex Garments Pvt Ltd	Tamil Nadu	641605		3ABCDE1234F1Z5				30	\N	\N	\N	\N	\N	Tiruppur	H&M Buying Office
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (id, quotation_no, inquiry_id, lead_id, date, valid_until, total_amount, currency, shipping_term, remarks, status, pdf_path, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_invoice_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_invoice_items (id, invoice_id, design_no, color, uom, qty, rate, amount, description, total_bale) FROM stdin;
11	21	DSN-101	Royal Blue	METERS	5000.00	120.00	600000.00	Poplin 40x40	\N
12	22	DSN-1001	Navy Blue	Kilograms	1000.00	180.00	180000.00	Poplin 40x40	\N
13	23	DSN-1001	Navy Blue	Kilograms	1000.00	180.00	180000.00	Poplin 40x40	\N
\.


--
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_invoices (id, invoice_no, invoice_date, party_name, party_id, ibpo, design_no, billing_address, delivery_address, state, state_code, gst_no, hsn_code, total_qty, gross_weight, gross_amount, discount_pct, discount_amount, taxable_amount, sgst, cgst, igst, other_charges, round_off, net_amount, remarks, status, created_at, invoice_type, currency, exchange_rate, rodtep_amount, drawback_amount, ad_code, iec_number, firc_reference, buyer_po_no, country, port_of_loading, port_of_discharge, incoterms, dispatch_date, transporter_name, lr_no, vehicle_no, payment_terms, delivery_terms, insurance_charges) FROM stdin;
21	PI-2026-7808	2026-06-04	Suntex Garments Pvt Ltd	18	IBPO-00007	\N	\N	\N	\N	\N	\N	\N	5000.00	0.00	600000.00	0.00	0.00	600000.00	0.00	0.00	0.00	0.00	0.00	600000.00	\N	Draft	2026-06-04 12:26:50.469829+05:30	Proforma Invoice	INR	1.0000	0.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00
22	PI-2026-1617	2026-06-04	ABC Textiles Pvt Ltd	16	IBPO-00001	\N	\N	\N	\N	\N	\N	\N	1000.00	0.00	180000.00	0.00	0.00	180000.00	0.00	0.00	0.00	0.00	0.00	180000.00	\N	Draft	2026-06-04 12:27:04.324131+05:30	Export Proforma Invoice	INR	1.0000	0.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00
23	PI-2026-4479	2026-06-04	ABC Textiles Pvt Ltd	16	IBPO-00001	\N	\N	\N	\N	\N	\N	\N	1000.00	0.00	180000.00	0.00	0.00	180000.00	0.00	0.00	0.00	0.00	0.00	180000.00	\N	Draft	2026-06-04 12:27:19.520998+05:30	Open Invoice	INR	1.0000	0.00	0.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00
\.


--
-- Data for Name: sub_masters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sub_masters (id, entity, name, code, description, extra_field_1, extra_field_2, extra_field_3, is_active, created_at, updated_at) FROM stdin;
1	district_city_master	Erode	ERD	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:06:09.751697+05:30	2026-06-03 10:06:09.751697+05:30
2	district_city_master	Salem	SLM	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:06:25.046541+05:30	2026-06-03 10:06:25.046541+05:30
3	district_city_master	Namakkal	NMK	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:06:39.839641+05:30	2026-06-03 10:06:39.839641+05:30
4	district_city_master	Coimbatore	CBE	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:06:55.379625+05:30	2026-06-03 10:06:55.379625+05:30
5	district_city_master	Tiruppur	TPR	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:07:10.951209+05:30	2026-06-03 10:07:10.951209+05:30
6	district_city_master	Karur	KRR	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:07:26.666245+05:30	2026-06-03 10:07:26.666245+05:30
7	district_city_master	Chennai	CHN	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:07:42.889897+05:30	2026-06-03 10:07:42.889897+05:30
8	district_city_master	Madurai	MDU	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:08:31.627747+05:30	2026-06-03 10:08:31.627747+05:30
9	district_city_master	Trichy	TRY	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:09:15.327505+05:30	2026-06-03 10:09:15.327505+05:30
10	district_city_master	Dharmapuri	DPM	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:09:51.654719+05:30	2026-06-03 10:09:51.654719+05:30
11	district_city_master	Krishnagiri	KGI	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:10:04.151258+05:30	2026-06-03 10:10:04.151258+05:30
12	district_city_master	Dindigul	DGL	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:10:26.325721+05:30	2026-06-03 10:10:26.325721+05:30
13	district_city_master	Thanjavur	TNJ	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:10:37.656586+05:30	2026-06-03 10:10:37.656586+05:30
15	district_city_master	Vellore	VLR	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:03.266633+05:30	2026-06-03 10:11:03.266633+05:30
16	district_city_master	Villupuram	VPM	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:13.646018+05:30	2026-06-03 10:11:13.646018+05:30
17	district_city_master	Kanchipuram	KPM	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:24.256285+05:30	2026-06-03 10:11:24.256285+05:30
18	district_city_master	Tirunelveli	TNL	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:33.434635+05:30	2026-06-03 10:11:33.434635+05:30
19	district_city_master	Thoothukudi	TTK	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:45.952479+05:30	2026-06-03 10:11:45.952479+05:30
20	district_city_master	Sivagangai	SVG	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:11:55.748095+05:30	2026-06-03 10:11:55.748095+05:30
14	district_city_master	Cuddalore	CUD	\N	Tamil Nadu	\N	\N	t	2026-06-03 10:10:47.963882+05:30	2026-06-03 10:12:04.23986+05:30
21	sales_region_master	North Zone	NZ	\N	\N	\N	\N	t	2026-06-03 10:21:33.222044+05:30	2026-06-03 10:21:33.222044+05:30
22	sales_region_master	South Zone	SZ	\N	\N	\N	\N	t	2026-06-03 10:21:40.938859+05:30	2026-06-03 10:21:40.938859+05:30
23	sales_region_master	East Zone	EZ	\N	\N	\N	\N	t	2026-06-03 10:21:50.239039+05:30	2026-06-03 10:21:50.239039+05:30
24	sales_region_master	West Zone	WZ	\N	\N	\N	\N	t	2026-06-03 10:21:57.487801+05:30	2026-06-03 10:21:57.487801+05:30
25	sales_region_master	Central Zone	CZ	\N	\N	\N	\N	t	2026-06-03 10:22:08.192502+05:30	2026-06-03 10:22:08.192502+05:30
26	sales_region_master	Export Region	EXP	\N	\N	\N	\N	t	2026-06-03 10:22:20.013802+05:30	2026-06-03 10:22:20.013802+05:30
27	sales_region_master	International Region	INT	\N	\N	\N	\N	t	2026-06-03 10:22:31.026384+05:30	2026-06-03 10:22:31.026384+05:30
28	sales_region_master	Domestic Region	DOM	\N	\N	\N	\N	t	2026-06-03 10:22:42.789894+05:30	2026-06-03 10:22:42.789894+05:30
29	currency_master	Indian Rupee	INR	\N	₹	\N	\N	t	2026-06-03 10:39:05.762508+05:30	2026-06-03 10:39:05.762508+05:30
30	currency_master	US Dollar	USD	\N	$	\N	\N	t	2026-06-03 10:39:19.761163+05:30	2026-06-03 10:39:19.761163+05:30
31	currency_master	Euro	EUR	\N	€	\N	\N	t	2026-06-03 10:39:34.110332+05:30	2026-06-03 10:39:34.110332+05:30
32	currency_master	British Pound	GBP	\N	£	\N	\N	t	2026-06-03 10:39:47.356471+05:30	2026-06-03 10:39:47.356471+05:30
33	currency_master	Japanese Yen	JPY	\N	¥	\N	\N	t	2026-06-03 10:40:29.782306+05:30	2026-06-03 10:40:29.782306+05:30
34	currency_master	Chinese Yuan	CNY	\N	¥	\N	\N	t	2026-06-03 10:40:44.606112+05:30	2026-06-03 10:40:44.606112+05:30
35	currency_master	UAE Dirham	AED	\N	د.إ	\N	\N	t	2026-06-03 10:40:59.657909+05:30	2026-06-03 10:40:59.657909+05:30
36	party_type_group	Export Customers	ERP	\N	\N	\N	\N	t	2026-06-03 11:03:09.864247+05:30	2026-06-03 11:03:09.864247+05:30
37	party_type_group	Domestic Customers	DOM	\N	\N	\N	\N	t	2026-06-03 11:03:20.396897+05:30	2026-06-03 11:03:20.396897+05:30
38	party_type_group	Wholesale Customers	WHL	\N	\N	\N	\N	t	2026-06-03 11:03:27.751892+05:30	2026-06-03 11:03:27.751892+05:30
39	party_type_group	Retail Customers	RET	\N	\N	\N	\N	t	2026-06-03 11:03:36.253717+05:30	2026-06-03 11:03:36.253717+05:30
40	party_type_group	Online Customers	ONL	\N	\N	\N	\N	t	2026-06-03 11:03:44.175786+05:30	2026-06-03 11:03:44.175786+05:30
41	party_type_group	Corporate Customers	COR	\N	\N	\N	\N	t	2026-06-03 11:03:53.352227+05:30	2026-06-03 11:03:53.352227+05:30
42	party_type_group	Yarn Suppliers	YARN	\N	\N	\N	\N	t	2026-06-03 11:04:06.044899+05:30	2026-06-03 11:04:06.044899+05:30
43	party_type_group	Fabric Suppliers	FAB	\N	\N	\N	\N	t	2026-06-03 11:04:18.264774+05:30	2026-06-03 11:04:18.264774+05:30
44	party_type_group	Cotton Suppliers	COT	\N	\N	\N	\N	t	2026-06-03 11:04:25.111708+05:30	2026-06-03 11:04:25.111708+05:30
45	party_type_group	Dyeing Units	DYE	\N	\N	\N	\N	t	2026-06-03 11:04:34.10862+05:30	2026-06-03 11:04:34.10862+05:30
46	party_type_group	Service provider	\N	\N	\N	\N	\N	t	2026-06-03 11:13:30.672935+05:30	2026-06-03 11:13:30.672935+05:30
48	customer_grade	D	\N	\N	\N	\N	\N	t	2026-06-03 11:21:25.87214+05:30	2026-06-03 11:21:25.87214+05:30
49	sales_region_master	Tamil Nadu West	\N	\N	\N	\N	\N	t	2026-06-03 11:23:55.896062+05:30	2026-06-03 11:23:55.896062+05:30
50	district_city_master	nakal	\N	\N	\N	\N	\N	t	2026-06-03 11:32:00.363802+05:30	2026-06-03 11:32:00.363802+05:30
51	country_master	india	\N	\N	\N	\N	\N	t	2026-06-03 11:32:49.05052+05:30	2026-06-03 11:32:49.05052+05:30
52	tds_master	1954	\N	\N	\N	\N	\N	t	2026-06-03 11:38:45.279929+05:30	2026-06-03 11:38:45.279929+05:30
53	gst_type_master	export	\N	\N	\N	\N	\N	t	2026-06-03 11:38:54.246649+05:30	2026-06-03 11:38:54.246649+05:30
54	address_sno_master	1	\N	\N	\N	\N	\N	t	2026-06-03 11:38:58.32175+05:30	2026-06-03 11:38:58.32175+05:30
56	payment_terms_master	Advance Payment	ADV	\N	0	\N	\N	t	2026-06-03 11:41:54.194524+05:30	2026-06-03 11:41:54.194524+05:30
57	payment_terms_master	Net 7 Days	NET7	\N	7	\N	\N	t	2026-06-03 11:42:10.481739+05:30	2026-06-03 11:42:10.481739+05:30
58	payment_terms_master	50% Advance + Balance Before Dispatch	ADV50	\N	0	\N	\N	t	2026-06-03 11:42:26.196038+05:30	2026-06-03 11:42:26.196038+05:30
59	payment_terms_master	Letter of Credit 60 Days	\N	\N	\N	\N	\N	t	2026-06-03 11:47:27.985169+05:30	2026-06-03 11:47:27.985169+05:30
60	blood_group_master	OO	\N	\N	\N	\N	\N	t	2026-06-03 11:50:50.765207+05:30	2026-06-03 11:50:50.765207+05:30
61	department_master	Manager	\N	\N	\N	\N	\N	t	2026-06-03 11:54:44.239812+05:30	2026-06-03 11:54:44.239812+05:30
62	employee_category_master	2 months	\N	\N	\N	\N	\N	t	2026-06-03 11:54:51.953027+05:30	2026-06-03 11:54:51.953027+05:30
63	shift_master	midshift	\N	\N	\N	\N	\N	t	2026-06-03 11:54:57.640727+05:30	2026-06-03 11:54:57.640727+05:30
64	employee_status_master	Inactive	\N	\N	\N	\N	\N	t	2026-06-03 11:59:08.397435+05:30	2026-06-03 11:59:08.397435+05:30
65	wage_type_master	Weekly	\N	\N	\N	\N	\N	t	2026-06-03 11:59:18.253082+05:30	2026-06-03 11:59:18.253082+05:30
66	skill_level_master	Full Skilled	\N	\N	\N	\N	\N	t	2026-06-03 11:59:30.810887+05:30	2026-06-03 11:59:30.810887+05:30
67	department_master	Merchandising	\N	\N	\N	\N	\N	t	2026-06-03 12:11:44.140537+05:30	2026-06-03 12:11:44.140537+05:30
68	employee_category_master	Staff	\N	\N	\N	\N	\N	t	2026-06-03 12:11:59.967327+05:30	2026-06-03 12:11:59.967327+05:30
69	skill_level_master	Advance	\N	\N	\N	\N	\N	t	2026-06-03 12:12:22.28451+05:30	2026-06-03 12:12:22.28451+05:30
70	employee_status_master	Active	\N	\N	\N	\N	\N	t	2026-06-03 12:14:19.331672+05:30	2026-06-03 12:14:19.331672+05:30
71	wage_type_master	Monthly Salary	\N	\N	\N	\N	\N	t	2026-06-03 12:16:10.557282+05:30	2026-06-03 12:16:10.557282+05:30
72	payment_mode_master	Bank Transfer	\N	\N	\N	\N	\N	t	2026-06-03 12:17:22.961979+05:30	2026-06-03 12:17:22.961979+05:30
73	department_master	Accounts	\N	\N	\N	\N	\N	t	2026-06-03 12:25:44.64469+05:30	2026-06-03 12:25:44.64469+05:30
74	shift_master	General	\N	\N	\N	\N	\N	t	2026-06-03 12:26:15.690268+05:30	2026-06-03 12:26:15.690268+05:30
75	skill_level_master	Expert	\N	\N	\N	\N	\N	t	2026-06-03 12:26:23.717887+05:30	2026-06-03 12:26:23.717887+05:30
76	employee_category_master	Management	\N	\N	\N	\N	\N	t	2026-06-03 12:56:47.929195+05:30	2026-06-03 12:56:47.929195+05:30
78	party_type_group	Sales Agent	\N	\N	\N	\N	\N	t	2026-06-03 13:28:49.363373+05:30	2026-06-03 13:28:49.363373+05:30
79	gst_type_master	Regular	\N	\N	\N	\N	\N	t	2026-06-03 13:30:11.837763+05:30	2026-06-03 13:30:11.837763+05:30
80	tds_master	yes	\N	\N	\N	\N	\N	t	2026-06-03 13:30:26.512296+05:30	2026-06-03 13:30:26.512296+05:30
81	order_type_master	Export Order	EXP	\N	\N	\N	\N	t	2026-06-03 14:03:56.673579+05:30	2026-06-03 14:03:56.673579+05:30
82	order_type_master	Domestic Order	DOM	\N	\N	\N	\N	t	2026-06-03 14:04:08.506612+05:30	2026-06-03 14:04:08.506612+05:30
83	order_type_master	Sample Order	SMP	\N	\N	\N	\N	t	2026-06-03 14:04:17.829482+05:30	2026-06-03 14:04:17.829482+05:30
84	order_type_master	Production Order	PRO	\N	\N	\N	\N	t	2026-06-03 14:04:33.452907+05:30	2026-06-03 14:04:33.452907+05:30
85	certified_type_master	ISO	\N	\N	\N	\N	\N	t	2026-06-03 14:18:08.432635+05:30	2026-06-03 14:18:08.432635+05:30
86	certified_type_master	GOTS CERTIFICATE	\N	\N	\N	\N	\N	t	2026-06-03 15:08:29.190441+05:30	2026-06-03 15:08:29.190441+05:30
87	commission_type_master	PERCENTAGE	\N	\N	\N	\N	\N	t	2026-06-03 15:08:42.15892+05:30	2026-06-03 15:08:42.15892+05:30
88	regular_special_master	REGULAR	\N	\N	\N	\N	\N	t	2026-06-03 15:09:01.217453+05:30	2026-06-03 15:09:01.217453+05:30
89	status_master	CONFIRMED	\N	\N	\N	\N	\N	t	2026-06-03 15:09:15.889236+05:30	2026-06-03 15:09:15.889236+05:30
92	color_master	Navy Blue	NVY-BLU	\N	#000080	\N	\N	t	2026-06-03 15:19:34.917064+05:30	2026-06-03 15:19:34.917064+05:30
93	color_master	Royal Blue	RYL-BLU	\N	#4169E1	\N	\N	t	2026-06-03 15:19:47.505062+05:30	2026-06-03 15:19:47.505062+05:30
94	color_master	Sky Blue	SKY-BLU	\N	#87CEEB	\N	\N	t	2026-06-03 15:20:47.679647+05:30	2026-06-03 15:20:47.679647+05:30
95	color_master	Black	BLK	\N	#000000	\N	\N	t	2026-06-03 15:21:06.5856+05:30	2026-06-03 15:21:06.5856+05:30
96	color_master	White	WHT	\N	#FFFFFF	\N	\N	t	2026-06-03 15:21:29.996637+05:30	2026-06-03 15:21:29.996637+05:30
97	color_master	Maroon	MRN	\N	#800000	\N	\N	t	2026-06-03 15:21:43.656935+05:30	2026-06-03 15:21:43.656935+05:30
98	hsn_code_master	Cotton fabrics, plain weave	52081100	\N	5	\N	\N	t	2026-06-03 15:25:31.263275+05:30	2026-06-03 15:25:31.263275+05:30
99	hsn_code_master	Cotton fabrics, dyed	52093200	\N	5	\N	\N	t	2026-06-03 15:25:44.348098+05:30	2026-06-03 15:25:44.348098+05:30
100	hsn_code_master	Woven fabrics of cotton	52083900	\N	5	\N	\N	t	2026-06-03 15:25:56.019168+05:30	2026-06-03 15:25:56.019168+05:30
101	hsn_code_master	Knitted cotton fabrics	60062200	\N	5	\N	\N	t	2026-06-03 15:26:21.554468+05:30	2026-06-03 15:26:21.554468+05:30
102	color_master	Turquoise	\N	\N	\N	\N	\N	t	2026-06-03 15:27:33.047103+05:30	2026-06-03 15:27:33.047103+05:30
107	end_use_master	GARMENTS	\N	\N	\N	\N	\N	t	2026-06-03 15:54:36.741471+05:30	2026-06-03 15:54:36.741471+05:30
108	season_master	SUMMER	\N	\N	\N	\N	\N	t	2026-06-03 15:54:43.100975+05:30	2026-06-03 15:54:43.100975+05:30
109	transport_mode_master	SEA FREIGHT	\N	\N	\N	\N	\N	t	2026-06-03 15:54:57.058897+05:30	2026-06-03 15:54:57.058897+05:30
110	process_sequence_master	Weaving → Dyeing → Finishing → Packing → Dispatch	\N	\N	\N	\N	\N	t	2026-06-03 15:56:22.298866+05:30	2026-06-03 15:56:22.298866+05:30
111	party_type	Exporter	\N	\N	\N	\N	\N	t	2026-06-03 16:18:30.783965+05:30	2026-06-03 16:18:30.783965+05:30
112	lr_terms	reight Paid	FP	Freight charges are paid by the sender before dispatch.	\N	\N	\N	t	2026-06-03 16:23:54.154514+05:30	2026-06-03 16:23:54.154514+05:30
113	lr_terms	Freight To Pay	FTP	Freight charges will be paid by the consignee at delivery.	\N	\N	\N	t	2026-06-03 16:24:15.521836+05:30	2026-06-03 16:24:15.521836+05:30
114	lr_terms	Freight Collect	FC	Freight amount is collected from the buyer upon receipt.	\N	\N	\N	t	2026-06-03 16:25:16.070172+05:30	2026-06-03 16:25:16.070172+05:30
115	party_type	Yarn Supplier	YRS	Supplies various types of yarn for production.	\N	\N	\N	t	2026-06-03 16:27:45.474128+05:30	2026-06-03 16:27:45.474128+05:30
116	certified_type	Global Organic Textile Standard	GOTS	Certifies textiles made from organic fibers and environmentally responsible processing.	\N	\N	\N	t	2026-06-03 16:37:47.483718+05:30	2026-06-03 16:37:47.483718+05:30
117	certified_type	OEKO-TEX Standard 100	OTS	Ensures textile products are free from harmful substances	\N	\N	\N	t	2026-06-03 16:38:01.316535+05:30	2026-06-03 16:38:01.316535+05:30
118	end_use_master	Trousers & Bottom Wear	TRSR	Fabric intended for pants, trousers, and bottom wear products.	\N	\N	\N	t	2026-06-03 17:04:07.624373+05:30	2026-06-03 17:04:07.624373+05:30
119	transport_name_master	Blue Dart Express	BDT	Domestic and international courier services for textile shipments.	\N	\N	\N	t	2026-06-03 17:36:40.500235+05:30	2026-06-03 17:36:40.500235+05:30
120	transport_name_master	VRL Logistics	\N	\N	\N	\N	\N	t	2026-06-03 17:37:10.1579+05:30	2026-06-03 17:37:10.1579+05:30
121	buyer	Rahul Exports	\N	\N	\N	\N	\N	t	2026-06-03 19:25:57.201042+05:30	2026-06-03 19:25:57.201042+05:30
122	party_type_group	Trading	\N	\N	\N	\N	\N	t	2026-06-03 19:39:18.845144+05:30	2026-06-03 19:39:18.845144+05:30
123	buyer	H&M Buying Office	\N	\N	\N	\N	\N	t	2026-06-03 19:40:08.445151+05:30	2026-06-03 19:40:08.445151+05:30
124	tds_master	Applicable	\N	\N	\N	\N	\N	t	2026-06-03 19:43:38.109932+05:30	2026-06-03 19:43:38.109932+05:30
125	lr_type_master	Paid	PD (Paid)	\N	\N	\N	\N	t	2026-06-03 20:18:39.922449+05:30	2026-06-03 20:18:39.922449+05:30
126	lr_type_master	To Pay	TP (To Pay)	\N	\N	\N	\N	t	2026-06-03 20:18:52.49971+05:30	2026-06-03 20:18:52.49971+05:30
127	lr_type_master	Billing	\N	\N	\N	\N	\N	t	2026-06-03 20:19:14.276362+05:30	2026-06-03 20:19:14.276362+05:30
128	status_master	APPROVED	\N	\N	\N	\N	\N	t	2026-06-03 20:23:04.741024+05:30	2026-06-03 20:23:04.741024+05:30
129	uom_master	Kilograms	KG	\N	\N	\N	\N	t	2026-06-03 20:39:09.13588+05:30	2026-06-03 20:39:09.13588+05:30
91	uom_master	METERS	MTR	\N	\N	\N	\N	t	2026-06-03 15:14:28.736804+05:30	2026-06-03 20:39:16.404541+05:30
130	uom_master	Pieces	PCS	\N	\N	\N	\N	t	2026-06-03 20:39:26.185443+05:30	2026-06-03 20:39:26.185443+05:30
90	fabric_type_master	Poplin 40x40	POP4040	\N	40x40/133x72	58	\N	t	2026-06-03 15:11:32.853163+05:30	2026-06-03 20:44:49.571529+05:30
131	fabric_type_master	Cotton Twill 2/1	CTW21	\N	30x30/76x68	60	\N	t	2026-06-03 20:45:09.917371+05:30	2026-06-03 20:45:09.917371+05:30
132	fabric_type_master	Denim 10 Oz	DEN10OZ	\N	10s x 10s/84x46	62	\N	t	2026-06-03 20:45:31.538502+05:30	2026-06-03 20:45:31.538502+05:30
133	fabric_type_master	Cambric 60x60	\N	\N	\N	\N	\N	t	2026-06-03 20:46:00.866392+05:30	2026-06-03 20:46:00.866392+05:30
149	payment_mode_master	Cash	CSH	Payment made directly in cash to the vendor or service provider.	\N	\N	\N	t	2026-06-04 11:22:47.766661+05:30	2026-06-04 11:22:47.766661+05:30
134	weaving_type_master	Satin Weave	SAT	Smooth and lustrous weave used for premium apparel and home	\N	\N	\N	t	2026-06-03 20:51:08.631886+05:30	2026-06-03 20:51:08.631886+05:30
104	weaving_type_master	Plain Weave	PLN	Basic over-under weaving pattern commonly used for cotton fabrics	\N	\N	\N	t	2026-06-03 15:53:58.726762+05:30	2026-06-03 20:51:32.106837+05:30
135	weaving_type_master	Basket Weave	\N	\N	\N	\N	\N	t	2026-06-03 20:51:46.452049+05:30	2026-06-03 20:51:46.452049+05:30
136	pattern_master	Stripe	STR	\N	\N	\N	\N	t	2026-06-03 20:56:21.132288+05:30	2026-06-03 20:56:21.132288+05:30
137	pattern_master	Check	CHK	\N	\N	\N	\N	t	2026-06-03 20:56:28.832461+05:30	2026-06-03 20:56:28.832461+05:30
105	pattern_master	Solid	SLD	\N	\N	\N	\N	t	2026-06-03 15:54:19.698235+05:30	2026-06-03 20:56:40.998565+05:30
138	pattern_master	Floral	\N	\N	\N	\N	\N	t	2026-06-03 20:57:02.21606+05:30	2026-06-03 20:57:02.21606+05:30
106	packing_type_master	Roll Packing	ROLL	\N	\N	\N	\N	t	2026-06-03 15:54:29.946124+05:30	2026-06-03 21:02:10.411164+05:30
139	packing_type_master	Bale Packing	BALE	\N	\N	\N	\N	t	2026-06-03 21:02:18.746254+05:30	2026-06-03 21:02:18.746254+05:30
140	packing_type_master	Bundle Packing	\N	\N	\N	\N	\N	t	2026-06-03 21:02:43.749502+05:30	2026-06-03 21:02:43.749502+05:30
141	process_sequence_master	dyeing	\N	\N	\N	\N	\N	t	2026-06-03 21:09:02.199083+05:30	2026-06-03 21:09:02.199083+05:30
142	transport_mode_master	Road	\N	\N	\N	\N	\N	t	2026-06-04 09:41:08.573847+05:30	2026-06-04 09:41:08.573847+05:30
143	process_sequence_master	Weaving->dyeing->finishing->packing	\N	\N	\N	\N	\N	t	2026-06-04 09:42:58.535969+05:30	2026-06-04 09:42:58.535969+05:30
144	category	Garments	\N	\N	\N	\N	\N	t	2026-06-04 10:27:36.026218+05:30	2026-06-04 10:27:36.026218+05:30
145	expense_type_master	Freight	FRT	Transportation charges incurred for shipping goods from the warehouse to the buyer's location.	\N	\N	\N	t	2026-06-04 11:09:30.324315+05:30	2026-06-04 11:09:30.324315+05:30
146	expense_type_master	Insurance	INS	Insurance charges paid to cover goods during transit.	\N	\N	\N	t	2026-06-04 11:09:56.655451+05:30	2026-06-04 11:09:56.655451+05:30
147	expense_type_master	Packing	PKG	Expenses related to packing materials and packing labor.	\N	\N	\N	t	2026-06-04 11:10:11.870478+05:30	2026-06-04 11:10:11.870478+05:30
148	expense_type_master	Commission	\N	\N	\N	\N	\N	t	2026-06-04 11:21:40.774405+05:30	2026-06-04 11:21:40.774405+05:30
150	payment_mode_master	UPI	\N	\N	\N	\N	\N	t	2026-06-04 11:23:02.183752+05:30	2026-06-04 11:23:02.183752+05:30
151	party_type	H	\N	\N	\N	\N	\N	t	2026-06-04 11:35:30.435627+05:30	2026-06-04 11:35:30.435627+05:30
152	fabric_type_master	Satin Cotton	\N	\N	\N	\N	\N	t	2026-06-04 12:46:09.449915+05:30	2026-06-04 12:46:09.449915+05:30
153	fabric_type_master	Poplin	\N	\N	\N	\N	\N	t	2026-06-04 12:46:09.449915+05:30	2026-06-04 12:46:09.449915+05:30
154	fabric_type_master	Twill	\N	\N	\N	\N	\N	t	2026-06-04 12:46:09.449915+05:30	2026-06-04 12:46:09.449915+05:30
155	fabric_type_master	Grey Satin	\N	\N	\N	\N	\N	t	2026-06-04 12:46:09.449915+05:30	2026-06-04 12:46:09.449915+05:30
156	season_master	Winter	\N	\N	\N	\N	\N	t	2026-06-04 12:53:16.665777+05:30	2026-06-04 12:53:16.665777+05:30
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, assigned_to_id, related_order_id, related_inquiry_id, due_date, priority, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: warp_beam_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warp_beam_details (id, receipt_id, beam_no, warp_mtrs, beam_type, delivery_to_weaver, order_no, dc_no, dc_date, loom_no, loading_date, total_meters) FROM stdin;
\.


--
-- Data for Name: warp_beam_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warp_beam_receipts (id, ref_no, rcvd_date, rcvd_type, beam_type, party_name, design_no, order_no, color, warp_count, warp_ends, warp_meters, set_no, siz_dc_no, siz_dc_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: warp_deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warp_deliveries (id, dc_no, dc_date, delivery_type, party_name, design_no, order_no, transport, vehicle_no, total_meters, balance_meters, remarks, status, created_at, ref_no, sizing_name, entry_type, bpo_no, address, set_id, warp_ends, yarn_count, vendor_po_no, po_date, order_mtrs, with_crimp, delivered_mtrs, total_beams, total_exptd_mtrs) FROM stdin;
\.


--
-- Data for Name: warp_delivery_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warp_delivery_items (id, delivery_id, beam_no, warp_mtrs, beam_type, loom_no) FROM stdin;
\.


--
-- Data for Name: work_order_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_order_transactions (id, transaction_no, module_type, date, buyer_name, status, details) FROM stdin;
1	DES-ORD-001	design_create	2026-06-04	ABC Textiles Pvt Ltd	Active	{"buyerOrderRef": "", "season": "Winter", "designNo": "", "designName": "Vibrant Satin Stripe", "category": "Satin", "fabricType": "Cotton Twill 2/1", "composition": "100% Cotton", "width": "60", "weight": 140, "weaveType": "Satin Weave", "color": "Midnight Navy", "targetRate": "500", "targetDelivery": "2026-06-04"}
\.


--
-- Data for Name: yarn_inward_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yarn_inward_items (id, inward_id, lot_no, bags, rate, amount, yarn_count, mill_name, colour, color_code, our_id, kgs) FROM stdin;
\.


--
-- Data for Name: yarn_inwards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yarn_inwards (id, ref_no, received_type, gross_amount, net_amount, remarks, status, created_at, entry_date, inward_date, received_from, po_no_dt, agent_name, stock_godown, godown_id, cone_type, order_kgs, received_kgs, balance_kgs, pc_id, tolerance_pct, bill_no, bill_amount, gross_kgs, net_kgs, chipnam, due_days, transport, veh_no, total_bags, eway_bill, org_grn_no, gate_no, wbridge_no, w_weight, other_remarks, packing, freight, tax_type, cgst_pct, sgst_pct, igst_pct, tax_value, tcs_value, tds_pct, total_tax, round_off) FROM stdin;
\.


--
-- Data for Name: yarn_purchase_count_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yarn_purchase_count_details (id, po_id, supplier_name, fibre_group, yarn_count, yarn_csp, min_cone_wgt, order_kgs, mill_name, print_name, tolerance_pct) FROM stdin;
\.


--
-- Data for Name: yarn_purchase_indent_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yarn_purchase_indent_details (id, po_id, req_ind_no, design_no, ibpo_no, party_name, fabric_name, yarn_count, order_mtrs, warp_qty, weft_qty, tot_reqd_qty, appd_qty, order_qty) FROM stdin;
\.


--
-- Data for Name: yarn_purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.yarn_purchase_orders (id, po_number, po_date, remarks, net_amount, status, created_at, updated_at, org_name, internal_po_no, used_for, against_ref, agent_name, supplier_name, delivery_at, freight_type, freight_chg, insurance_chg, total_order_kgs, transport, tax_type, taxable_amount, dispatch_date, packing_type, sgst_pct, cgst_pct, igst_pct, labeling, colour, due_days) FROM stdin;
\.


--
-- Name: buyer_order_amendments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_amendments_id_seq', 3, true);


--
-- Name: buyer_order_completions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_completions_id_seq', 3, true);


--
-- Name: buyer_order_dispatches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_dispatches_id_seq', 3, true);


--
-- Name: buyer_order_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_expenses_id_seq', 3, true);


--
-- Name: buyer_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_items_id_seq', 21, true);


--
-- Name: buyer_order_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_schedules_id_seq', 3, true);


--
-- Name: buyer_order_sequences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_order_sequences_id_seq', 3, true);


--
-- Name: buyer_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.buyer_orders_id_seq', 7, true);


--
-- Name: cloth_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloth_deliveries_id_seq', 1, true);


--
-- Name: cloth_delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloth_delivery_items_id_seq', 1, true);


--
-- Name: cloth_inward_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloth_inward_items_id_seq', 1, true);


--
-- Name: cloth_inwards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cloth_inwards_id_seq', 1, true);


--
-- Name: company_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_setting_id_seq', 1, false);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, false);


--
-- Name: design_entry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.design_entry_id_seq', 2, true);


--
-- Name: despatch_planning_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.despatch_planning_id_seq', 2, true);


--
-- Name: dyed_yarn_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dyed_yarn_deliveries_id_seq', 2, true);


--
-- Name: dyed_yarn_delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dyed_yarn_delivery_items_id_seq', 3, true);


--
-- Name: dyed_yarn_received_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dyed_yarn_received_id_seq', 2, true);


--
-- Name: dyed_yarn_received_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dyed_yarn_received_items_id_seq', 3, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 11, true);


--
-- Name: eway_bill_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eway_bill_items_id_seq', 1, true);


--
-- Name: eway_bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eway_bills_id_seq', 1, true);


--
-- Name: finished_fabric_inwards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.finished_fabric_inwards_id_seq', 2, true);


--
-- Name: finished_fabric_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.finished_fabric_items_id_seq', 1, true);


--
-- Name: general_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.general_master_id_seq', 76, true);


--
-- Name: goods_release_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goods_release_items_id_seq', 1, true);


--
-- Name: goods_releases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goods_releases_id_seq', 1, true);


--
-- Name: grey_yarn_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grey_yarn_deliveries_id_seq', 2, true);


--
-- Name: grey_yarn_delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grey_yarn_delivery_items_id_seq', 2, true);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 1, false);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- Name: log_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_reports_id_seq', 1, false);


--
-- Name: on_table_checking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.on_table_checking_id_seq', 1, true);


--
-- Name: on_table_checking_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.on_table_checking_items_id_seq', 1, true);


--
-- Name: packing_slip_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packing_slip_items_id_seq', 1, true);


--
-- Name: packing_slips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packing_slips_id_seq', 1, true);


--
-- Name: party_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.party_master_id_seq', 20, true);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quotations_id_seq', 1, false);


--
-- Name: sales_invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_invoice_items_id_seq', 13, true);


--
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 23, true);


--
-- Name: sub_masters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sub_masters_id_seq', 156, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: warp_beam_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warp_beam_details_id_seq', 2, true);


--
-- Name: warp_beam_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warp_beam_receipts_id_seq', 2, true);


--
-- Name: warp_deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warp_deliveries_id_seq', 2, true);


--
-- Name: warp_delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warp_delivery_items_id_seq', 2, true);


--
-- Name: work_order_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_order_transactions_id_seq', 1, true);


--
-- Name: yarn_inward_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.yarn_inward_items_id_seq', 6, true);


--
-- Name: yarn_inwards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.yarn_inwards_id_seq', 2, true);


--
-- Name: yarn_purchase_count_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.yarn_purchase_count_details_id_seq', 3, true);


--
-- Name: yarn_purchase_indent_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.yarn_purchase_indent_details_id_seq', 3, true);


--
-- Name: yarn_purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.yarn_purchase_orders_id_seq', 2, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: buyer_order_amendments buyer_order_amendments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_amendments
    ADD CONSTRAINT buyer_order_amendments_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_completions buyer_order_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_completions
    ADD CONSTRAINT buyer_order_completions_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_dispatches buyer_order_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_dispatches
    ADD CONSTRAINT buyer_order_dispatches_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_expenses buyer_order_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_expenses
    ADD CONSTRAINT buyer_order_expenses_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_items buyer_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_items
    ADD CONSTRAINT buyer_order_items_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_schedules buyer_order_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_schedules
    ADD CONSTRAINT buyer_order_schedules_pkey PRIMARY KEY (id);


--
-- Name: buyer_order_sequences buyer_order_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_sequences
    ADD CONSTRAINT buyer_order_sequences_pkey PRIMARY KEY (id);


--
-- Name: buyer_orders buyer_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_orders
    ADD CONSTRAINT buyer_orders_pkey PRIMARY KEY (id);


--
-- Name: cloth_deliveries cloth_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_deliveries
    ADD CONSTRAINT cloth_deliveries_pkey PRIMARY KEY (id);


--
-- Name: cloth_delivery_items cloth_delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_delivery_items
    ADD CONSTRAINT cloth_delivery_items_pkey PRIMARY KEY (id);


--
-- Name: cloth_inward_items cloth_inward_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_inward_items
    ADD CONSTRAINT cloth_inward_items_pkey PRIMARY KEY (id);


--
-- Name: cloth_inwards cloth_inwards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_inwards
    ADD CONSTRAINT cloth_inwards_pkey PRIMARY KEY (id);


--
-- Name: company_setting company_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_setting
    ADD CONSTRAINT company_setting_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: design_entry design_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.design_entry
    ADD CONSTRAINT design_entry_pkey PRIMARY KEY (id);


--
-- Name: despatch_planning despatch_planning_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.despatch_planning
    ADD CONSTRAINT despatch_planning_pkey PRIMARY KEY (id);


--
-- Name: dyed_yarn_deliveries dyed_yarn_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_deliveries
    ADD CONSTRAINT dyed_yarn_deliveries_pkey PRIMARY KEY (id);


--
-- Name: dyed_yarn_delivery_items dyed_yarn_delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_delivery_items
    ADD CONSTRAINT dyed_yarn_delivery_items_pkey PRIMARY KEY (id);


--
-- Name: dyed_yarn_received_items dyed_yarn_received_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_received_items
    ADD CONSTRAINT dyed_yarn_received_items_pkey PRIMARY KEY (id);


--
-- Name: dyed_yarn_received dyed_yarn_received_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_received
    ADD CONSTRAINT dyed_yarn_received_pkey PRIMARY KEY (id);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: eway_bill_items eway_bill_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eway_bill_items
    ADD CONSTRAINT eway_bill_items_pkey PRIMARY KEY (id);


--
-- Name: eway_bills eway_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eway_bills
    ADD CONSTRAINT eway_bills_pkey PRIMARY KEY (id);


--
-- Name: finished_fabric_inwards finished_fabric_inwards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_fabric_inwards
    ADD CONSTRAINT finished_fabric_inwards_pkey PRIMARY KEY (id);


--
-- Name: finished_fabric_items finished_fabric_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_fabric_items
    ADD CONSTRAINT finished_fabric_items_pkey PRIMARY KEY (id);


--
-- Name: general_master general_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_master
    ADD CONSTRAINT general_master_pkey PRIMARY KEY (id);


--
-- Name: goods_release_items goods_release_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_release_items
    ADD CONSTRAINT goods_release_items_pkey PRIMARY KEY (id);


--
-- Name: goods_releases goods_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_releases
    ADD CONSTRAINT goods_releases_pkey PRIMARY KEY (id);


--
-- Name: grey_yarn_deliveries grey_yarn_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grey_yarn_deliveries
    ADD CONSTRAINT grey_yarn_deliveries_pkey PRIMARY KEY (id);


--
-- Name: grey_yarn_delivery_items grey_yarn_delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grey_yarn_delivery_items
    ADD CONSTRAINT grey_yarn_delivery_items_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: log_reports log_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_reports
    ADD CONSTRAINT log_reports_pkey PRIMARY KEY (id);


--
-- Name: on_table_checking_items on_table_checking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.on_table_checking_items
    ADD CONSTRAINT on_table_checking_items_pkey PRIMARY KEY (id);


--
-- Name: on_table_checking on_table_checking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.on_table_checking
    ADD CONSTRAINT on_table_checking_pkey PRIMARY KEY (id);


--
-- Name: packing_slip_items packing_slip_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_slip_items
    ADD CONSTRAINT packing_slip_items_pkey PRIMARY KEY (id);


--
-- Name: packing_slips packing_slips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_slips
    ADD CONSTRAINT packing_slips_pkey PRIMARY KEY (id);


--
-- Name: party_master party_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.party_master
    ADD CONSTRAINT party_master_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: sales_invoice_items sales_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoice_items
    ADD CONSTRAINT sales_invoice_items_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: sub_masters sub_masters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_masters
    ADD CONSTRAINT sub_masters_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: warp_beam_details warp_beam_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_beam_details
    ADD CONSTRAINT warp_beam_details_pkey PRIMARY KEY (id);


--
-- Name: warp_beam_receipts warp_beam_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_beam_receipts
    ADD CONSTRAINT warp_beam_receipts_pkey PRIMARY KEY (id);


--
-- Name: warp_deliveries warp_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_deliveries
    ADD CONSTRAINT warp_deliveries_pkey PRIMARY KEY (id);


--
-- Name: warp_delivery_items warp_delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_delivery_items
    ADD CONSTRAINT warp_delivery_items_pkey PRIMARY KEY (id);


--
-- Name: work_order_transactions work_order_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order_transactions
    ADD CONSTRAINT work_order_transactions_pkey PRIMARY KEY (id);


--
-- Name: yarn_inward_items yarn_inward_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_inward_items
    ADD CONSTRAINT yarn_inward_items_pkey PRIMARY KEY (id);


--
-- Name: yarn_inwards yarn_inwards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_inwards
    ADD CONSTRAINT yarn_inwards_pkey PRIMARY KEY (id);


--
-- Name: yarn_purchase_count_details yarn_purchase_count_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_count_details
    ADD CONSTRAINT yarn_purchase_count_details_pkey PRIMARY KEY (id);


--
-- Name: yarn_purchase_indent_details yarn_purchase_indent_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_indent_details
    ADD CONSTRAINT yarn_purchase_indent_details_pkey PRIMARY KEY (id);


--
-- Name: yarn_purchase_orders yarn_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_orders
    ADD CONSTRAINT yarn_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: ix_buyer_order_amendments_amendment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_amendments_amendment_id ON public.buyer_order_amendments USING btree (amendment_id);


--
-- Name: ix_buyer_order_amendments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_amendments_id ON public.buyer_order_amendments USING btree (id);


--
-- Name: ix_buyer_order_completions_cmp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_completions_cmp_id ON public.buyer_order_completions USING btree (cmp_id);


--
-- Name: ix_buyer_order_completions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_completions_id ON public.buyer_order_completions USING btree (id);


--
-- Name: ix_buyer_order_dispatches_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_dispatches_id ON public.buyer_order_dispatches USING btree (id);


--
-- Name: ix_buyer_order_dispatches_indent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_dispatches_indent_id ON public.buyer_order_dispatches USING btree (indent_id);


--
-- Name: ix_buyer_order_expenses_expense_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_expenses_expense_id ON public.buyer_order_expenses USING btree (expense_id);


--
-- Name: ix_buyer_order_expenses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_expenses_id ON public.buyer_order_expenses USING btree (id);


--
-- Name: ix_buyer_order_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_items_id ON public.buyer_order_items USING btree (id);


--
-- Name: ix_buyer_order_schedules_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_schedules_id ON public.buyer_order_schedules USING btree (id);


--
-- Name: ix_buyer_order_schedules_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_schedules_schedule_id ON public.buyer_order_schedules USING btree (schedule_id);


--
-- Name: ix_buyer_order_sequences_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_order_sequences_id ON public.buyer_order_sequences USING btree (id);


--
-- Name: ix_buyer_order_sequences_sequence_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_order_sequences_sequence_id ON public.buyer_order_sequences USING btree (sequence_id);


--
-- Name: ix_buyer_orders_ibpo_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_buyer_orders_ibpo_number ON public.buyer_orders USING btree (ibpo_number);


--
-- Name: ix_buyer_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_buyer_orders_id ON public.buyer_orders USING btree (id);


--
-- Name: ix_cloth_deliveries_dc_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_cloth_deliveries_dc_no ON public.cloth_deliveries USING btree (dc_no);


--
-- Name: ix_cloth_deliveries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cloth_deliveries_id ON public.cloth_deliveries USING btree (id);


--
-- Name: ix_cloth_delivery_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cloth_delivery_items_id ON public.cloth_delivery_items USING btree (id);


--
-- Name: ix_cloth_inward_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cloth_inward_items_id ON public.cloth_inward_items USING btree (id);


--
-- Name: ix_cloth_inwards_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_cloth_inwards_id ON public.cloth_inwards USING btree (id);


--
-- Name: ix_cloth_inwards_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_cloth_inwards_ref_no ON public.cloth_inwards USING btree (ref_no);


--
-- Name: ix_company_setting_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_setting_id ON public.company_setting USING btree (id);


--
-- Name: ix_company_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_settings_id ON public.company_settings USING btree (id);


--
-- Name: ix_design_entry_ds_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_design_entry_ds_ref_no ON public.design_entry USING btree (ds_ref_no);


--
-- Name: ix_design_entry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_design_entry_id ON public.design_entry USING btree (id);


--
-- Name: ix_despatch_planning_ibpo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_despatch_planning_ibpo ON public.despatch_planning USING btree (ibpo);


--
-- Name: ix_despatch_planning_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_despatch_planning_id ON public.despatch_planning USING btree (id);


--
-- Name: ix_despatch_planning_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_despatch_planning_ref_no ON public.despatch_planning USING btree (ref_no);


--
-- Name: ix_dyed_yarn_deliveries_dc_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_dyed_yarn_deliveries_dc_no ON public.dyed_yarn_deliveries USING btree (dc_no);


--
-- Name: ix_dyed_yarn_deliveries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_dyed_yarn_deliveries_id ON public.dyed_yarn_deliveries USING btree (id);


--
-- Name: ix_dyed_yarn_delivery_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_dyed_yarn_delivery_items_id ON public.dyed_yarn_delivery_items USING btree (id);


--
-- Name: ix_dyed_yarn_received_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_dyed_yarn_received_id ON public.dyed_yarn_received USING btree (id);


--
-- Name: ix_dyed_yarn_received_inv_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_dyed_yarn_received_inv_no ON public.dyed_yarn_received USING btree (inv_no);


--
-- Name: ix_dyed_yarn_received_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_dyed_yarn_received_items_id ON public.dyed_yarn_received_items USING btree (id);


--
-- Name: ix_employees_employee_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_employees_employee_code ON public.employees USING btree (employee_code);


--
-- Name: ix_employees_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_id ON public.employees USING btree (id);


--
-- Name: ix_eway_bill_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_eway_bill_items_id ON public.eway_bill_items USING btree (id);


--
-- Name: ix_eway_bills_eway_bill_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_eway_bills_eway_bill_no ON public.eway_bills USING btree (eway_bill_no);


--
-- Name: ix_eway_bills_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_eway_bills_id ON public.eway_bills USING btree (id);


--
-- Name: ix_finished_fabric_inwards_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_finished_fabric_inwards_id ON public.finished_fabric_inwards USING btree (id);


--
-- Name: ix_finished_fabric_inwards_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_finished_fabric_inwards_ref_no ON public.finished_fabric_inwards USING btree (ref_no);


--
-- Name: ix_finished_fabric_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_finished_fabric_items_id ON public.finished_fabric_items USING btree (id);


--
-- Name: ix_general_master_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_general_master_category ON public.general_master USING btree (category);


--
-- Name: ix_general_master_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_general_master_id ON public.general_master USING btree (id);


--
-- Name: ix_goods_release_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goods_release_items_id ON public.goods_release_items USING btree (id);


--
-- Name: ix_goods_releases_gra_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_goods_releases_gra_no ON public.goods_releases USING btree (gra_no);


--
-- Name: ix_goods_releases_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_goods_releases_id ON public.goods_releases USING btree (id);


--
-- Name: ix_grey_yarn_deliveries_dc_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_grey_yarn_deliveries_dc_no ON public.grey_yarn_deliveries USING btree (dc_no);


--
-- Name: ix_grey_yarn_deliveries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grey_yarn_deliveries_id ON public.grey_yarn_deliveries USING btree (id);


--
-- Name: ix_grey_yarn_delivery_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grey_yarn_delivery_items_id ON public.grey_yarn_delivery_items USING btree (id);


--
-- Name: ix_inquiries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inquiries_id ON public.inquiries USING btree (id);


--
-- Name: ix_inquiries_inquiry_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_inquiries_inquiry_no ON public.inquiries USING btree (inquiry_no);


--
-- Name: ix_leads_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_leads_email ON public.leads USING btree (email);


--
-- Name: ix_leads_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leads_id ON public.leads USING btree (id);


--
-- Name: ix_log_reports_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_log_reports_id ON public.log_reports USING btree (id);


--
-- Name: ix_on_table_checking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_on_table_checking_id ON public.on_table_checking USING btree (id);


--
-- Name: ix_on_table_checking_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_on_table_checking_items_id ON public.on_table_checking_items USING btree (id);


--
-- Name: ix_on_table_checking_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_on_table_checking_ref_no ON public.on_table_checking USING btree (ref_no);


--
-- Name: ix_packing_slip_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_packing_slip_items_id ON public.packing_slip_items USING btree (id);


--
-- Name: ix_packing_slips_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_packing_slips_id ON public.packing_slips USING btree (id);


--
-- Name: ix_packing_slips_slip_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_packing_slips_slip_no ON public.packing_slips USING btree (slip_no);


--
-- Name: ix_party_master_customer_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_party_master_customer_code ON public.party_master USING btree (customer_code);


--
-- Name: ix_party_master_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_party_master_id ON public.party_master USING btree (id);


--
-- Name: ix_quotations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_quotations_id ON public.quotations USING btree (id);


--
-- Name: ix_quotations_quotation_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_quotations_quotation_no ON public.quotations USING btree (quotation_no);


--
-- Name: ix_sales_invoice_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sales_invoice_items_id ON public.sales_invoice_items USING btree (id);


--
-- Name: ix_sales_invoices_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sales_invoices_id ON public.sales_invoices USING btree (id);


--
-- Name: ix_sales_invoices_invoice_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_sales_invoices_invoice_no ON public.sales_invoices USING btree (invoice_no);


--
-- Name: ix_sub_masters_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sub_masters_entity ON public.sub_masters USING btree (entity);


--
-- Name: ix_sub_masters_entity_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sub_masters_entity_name ON public.sub_masters USING btree (entity, name);


--
-- Name: ix_sub_masters_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sub_masters_id ON public.sub_masters USING btree (id);


--
-- Name: ix_tasks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_id ON public.tasks USING btree (id);


--
-- Name: ix_warp_beam_details_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warp_beam_details_id ON public.warp_beam_details USING btree (id);


--
-- Name: ix_warp_beam_receipts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warp_beam_receipts_id ON public.warp_beam_receipts USING btree (id);


--
-- Name: ix_warp_beam_receipts_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_warp_beam_receipts_ref_no ON public.warp_beam_receipts USING btree (ref_no);


--
-- Name: ix_warp_deliveries_dc_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_warp_deliveries_dc_no ON public.warp_deliveries USING btree (dc_no);


--
-- Name: ix_warp_deliveries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warp_deliveries_id ON public.warp_deliveries USING btree (id);


--
-- Name: ix_warp_delivery_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warp_delivery_items_id ON public.warp_delivery_items USING btree (id);


--
-- Name: ix_work_order_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_work_order_transactions_id ON public.work_order_transactions USING btree (id);


--
-- Name: ix_work_order_transactions_module_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_work_order_transactions_module_type ON public.work_order_transactions USING btree (module_type);


--
-- Name: ix_work_order_transactions_transaction_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_work_order_transactions_transaction_no ON public.work_order_transactions USING btree (transaction_no);


--
-- Name: ix_yarn_inward_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_yarn_inward_items_id ON public.yarn_inward_items USING btree (id);


--
-- Name: ix_yarn_inwards_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_yarn_inwards_id ON public.yarn_inwards USING btree (id);


--
-- Name: ix_yarn_inwards_ref_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_yarn_inwards_ref_no ON public.yarn_inwards USING btree (ref_no);


--
-- Name: ix_yarn_purchase_count_details_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_yarn_purchase_count_details_id ON public.yarn_purchase_count_details USING btree (id);


--
-- Name: ix_yarn_purchase_indent_details_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_yarn_purchase_indent_details_id ON public.yarn_purchase_indent_details USING btree (id);


--
-- Name: ix_yarn_purchase_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_yarn_purchase_orders_id ON public.yarn_purchase_orders USING btree (id);


--
-- Name: ix_yarn_purchase_orders_po_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_yarn_purchase_orders_po_number ON public.yarn_purchase_orders USING btree (po_number);


--
-- Name: buyer_order_items buyer_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_order_items
    ADD CONSTRAINT buyer_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.buyer_orders(id);


--
-- Name: buyer_orders buyer_orders_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_orders
    ADD CONSTRAINT buyer_orders_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.party_master(id);


--
-- Name: cloth_delivery_items cloth_delivery_items_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_delivery_items
    ADD CONSTRAINT cloth_delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.cloth_deliveries(id);


--
-- Name: cloth_inward_items cloth_inward_items_inward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cloth_inward_items
    ADD CONSTRAINT cloth_inward_items_inward_id_fkey FOREIGN KEY (inward_id) REFERENCES public.cloth_inwards(id);


--
-- Name: dyed_yarn_delivery_items dyed_yarn_delivery_items_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_delivery_items
    ADD CONSTRAINT dyed_yarn_delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.dyed_yarn_deliveries(id);


--
-- Name: dyed_yarn_received_items dyed_yarn_received_items_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dyed_yarn_received_items
    ADD CONSTRAINT dyed_yarn_received_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.dyed_yarn_received(id);


--
-- Name: eway_bill_items eway_bill_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eway_bill_items
    ADD CONSTRAINT eway_bill_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.eway_bills(id);


--
-- Name: finished_fabric_items finished_fabric_items_inward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finished_fabric_items
    ADD CONSTRAINT finished_fabric_items_inward_id_fkey FOREIGN KEY (inward_id) REFERENCES public.finished_fabric_inwards(id);


--
-- Name: goods_release_items goods_release_items_release_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goods_release_items
    ADD CONSTRAINT goods_release_items_release_id_fkey FOREIGN KEY (release_id) REFERENCES public.goods_releases(id);


--
-- Name: grey_yarn_delivery_items grey_yarn_delivery_items_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grey_yarn_delivery_items
    ADD CONSTRAINT grey_yarn_delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.grey_yarn_deliveries(id);


--
-- Name: inquiries inquiries_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.employees(id);


--
-- Name: inquiries inquiries_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: leads leads_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.employees(id);


--
-- Name: on_table_checking_items on_table_checking_items_checking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.on_table_checking_items
    ADD CONSTRAINT on_table_checking_items_checking_id_fkey FOREIGN KEY (checking_id) REFERENCES public.on_table_checking(id);


--
-- Name: packing_slip_items packing_slip_items_slip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packing_slip_items
    ADD CONSTRAINT packing_slip_items_slip_id_fkey FOREIGN KEY (slip_id) REFERENCES public.packing_slips(id);


--
-- Name: quotations quotations_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: quotations quotations_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);


--
-- Name: sales_invoice_items sales_invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoice_items
    ADD CONSTRAINT sales_invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id);


--
-- Name: sales_invoices sales_invoices_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.party_master(id);


--
-- Name: tasks tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.employees(id);


--
-- Name: tasks tasks_related_inquiry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_related_inquiry_id_fkey FOREIGN KEY (related_inquiry_id) REFERENCES public.inquiries(id);


--
-- Name: tasks tasks_related_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.buyer_orders(id);


--
-- Name: warp_beam_details warp_beam_details_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_beam_details
    ADD CONSTRAINT warp_beam_details_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.warp_beam_receipts(id);


--
-- Name: warp_delivery_items warp_delivery_items_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warp_delivery_items
    ADD CONSTRAINT warp_delivery_items_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.warp_deliveries(id);


--
-- Name: yarn_inward_items yarn_inward_items_inward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_inward_items
    ADD CONSTRAINT yarn_inward_items_inward_id_fkey FOREIGN KEY (inward_id) REFERENCES public.yarn_inwards(id);


--
-- Name: yarn_purchase_count_details yarn_purchase_count_details_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_count_details
    ADD CONSTRAINT yarn_purchase_count_details_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.yarn_purchase_orders(id);


--
-- Name: yarn_purchase_indent_details yarn_purchase_indent_details_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.yarn_purchase_indent_details
    ADD CONSTRAINT yarn_purchase_indent_details_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.yarn_purchase_orders(id);


--
-- PostgreSQL database dump complete
--

\unrestrict xSvR3W8GqVJeJ8a94WFiJVhctKm6odJChvUV5YqAU0CoIrD4lDf3tql72NYXk7T

