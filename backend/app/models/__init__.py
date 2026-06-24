# Models package - imports all models for Alembic discovery
from app.models.employee import Employee
from app.models.party_master import PartyMaster, PartyAddress
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from app.models.yarn_purchase import YarnPurchaseOrder, YarnPurchaseCountDetail, YarnPurchaseIndentDetail
from app.models.yarn_inward import YarnInward, YarnInwardItem
from app.models.grey_yarn_delivery import GreyYarnDelivery, GreyYarnDeliveryItem
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem, DyedYarnDelivery, DyedYarnDeliveryItem
from app.models.warp import WarpBeamReceipt, WarpBeamDetail, WarpDelivery, WarpDeliveryItem
from app.models.cloth import ClothInward, ClothInwardItem, ClothDelivery, ClothDeliveryItem, OnTableChecking, OnTableCheckingItem
from app.models.finished_fabric import FinishedFabricInward, FinishedFabricItem
from app.models.packing_slip import PackingSlip, PackingSlipItem
from app.models.goods_release import GoodsRelease, GoodsReleaseItem
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem
from app.models.despatch_planning import DespatchPlanning
from app.models.eway_bill import EwayBill, EwayBillItem
from app.models.log_report import LogReport
from app.models.design_entry import DesignEntry
from app.models.general_master import GeneralMaster
from app.models.company_setting import CompanySetting
from app.models.sub_master import SubMaster
from app.models.work_order import WorkOrderTransaction
from app.models.textile_design import TextileDesign, WarpDesignItem, WeftDesignItem
from app.models.chat_message import ChatMessage
from app.models.report_job import ReportJob
from app.models.generic_po import GenericPurchaseOrder, GenericPurchaseOrderItem
from app.models.twisting_doubling_po import TwistingDoublingPO, TwistingDoublingPOItem
from app.models.yarn_dyeing_po import YarnDyeingPO, YarnDyeingPOItem
from app.models.fabric_dyeing_po import FabricDyeingPO, FabricDyeingPOItem
from app.models.warping_sizing_po import WarpingSizingPO, WarpingSizingPOItem
from app.models.weaving_po import WeavingPO, WeavingPOItem
from app.models.processing_po import ProcessingPO, ProcessingPOItem
from app.models.cloth_purchase_po import ClothPurchasePO, ClothPurchasePOItem
from app.modules.hr.models import HRItem
from app.modules.vehicle_management.models import FleetItem
from app.modules.stationary.models import StationaryItem, SwatchCard, FabricInspectionRoll, ReturnableDC

from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.service_schedule import ServiceSchedule
from app.models.maintenance_log import MaintenanceLog
from app.models.breakdown_entry import BreakdownEntry
from app.models.fuel_entry import FuelEntry
from app.models.fleet_document import FleetDocument
from app.models.route_trip import Route, Trip

