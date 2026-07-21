import socket
import logging
import json
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Tuple, cast
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.sub_master import SubMaster
from app.modules.hr.models import HRItem

logger = logging.getLogger(__name__)

# Try importing pyzk, handle gracefully if not installed/available
try:
    from zk import ZK
    PYZK_AVAILABLE = True
except ImportError:
    PYZK_AVAILABLE = False
    logger.warning("pyzk package is not available. Biometric sync will run in simulation mode.")

def test_device_connection(ip: str, port: int, timeout: int = 10) -> Tuple[bool, str]:
    """Test TCP connection to the physical biometric machine."""
    try:
        # Step 1: Basic TCP socket test
        with socket.create_connection((ip, port), timeout=timeout) as sock:
            pass
        
        # Step 2: Try pyzk handshake if package is installed
        if PYZK_AVAILABLE:
            zk = ZK(ip, port=port, timeout=timeout)
            conn = None
            try:
                conn = zk.connect()
                conn.disconnect()
                return True, "Successfully connected to biometric machine."
            except Exception as e:
                return False, f"TCP connection ok, but ZK protocol failed: {e}"
        else:
            return True, "TCP Connection ok. (Running in Simulation Mode - pyzk handshake skipped)"
    except socket.timeout:
        return False, "Connection timed out. Verify device is on and IP is correct."
    except Exception as e:
        return False, f"Could not connect to device: {e}"

def generate_mock_logs(employees: List[Employee], device_ip: str = "192.168.0.202") -> List[Dict[str, Any]]:
    """Generate realistic mock punch logs for testing when device is offline."""
    mock_logs = []
    # Generate logs for the last 3 days
    start_date = date(2026, 6, 1)
    today = date.today()
    delta_days = (today - start_date).days + 1
    for day_offset in range(delta_days):
        log_date = start_date + timedelta(days=day_offset)
        # Skip Sundays
        if log_date.weekday() == 6:
            continue
            
        for emp in employees:
            if not emp.biometric_id:
                continue
                
            # Randomize punch times slightly around general shift (09:00 to 18:00)
            import random
            random.seed(hash(str(emp.employee_code)) + log_date.day)
            
            # 90% attendance rate
            if random.random() > 0.9:
                continue
                
            # Punch In: around 08:45 - 09:15
            in_min = random.randint(-15, 20)
            punch_in_time = datetime.combine(log_date, time(9, 0)) + timedelta(minutes=in_min)
            
            # Punch Out: around 18:00 - 18:45
            out_min = random.randint(0, 45)
            punch_out_time = datetime.combine(log_date, time(18, 0)) + timedelta(minutes=out_min)
            
            mock_logs.append({
                "biometric_id": str(emp.biometric_id),
                "timestamp": punch_in_time,
                "status": 0, # check-in
                "punch_type": 0, # finger
                "device_ip": device_ip
            })
            
            mock_logs.append({
                "biometric_id": str(emp.biometric_id),
                "timestamp": punch_out_time,
                "status": 1, # check-out
                "punch_type": 0, # finger
                "device_ip": device_ip
            })
            
    return mock_logs

async def get_device_logs(ip: str, port: int, employees: List[Employee], force_mock: bool = False) -> Tuple[List[Dict[str, Any]], bool]:
    """Fetch attendance logs from the ZK machine, falling back to mock logs ONLY if force_mock is True."""
    if force_mock:
        if not PYZK_AVAILABLE:
            logger.info("pyzk not installed. Generating mock logs for simulation...")
        else:
            logger.info("Simulation mode enabled. Generating mock logs...")
        return generate_mock_logs(employees, ip), True

    if not PYZK_AVAILABLE:
        raise Exception("pyzk package is not installed. Cannot connect to real device. Enable 'Use Test Data' checkbox for simulation.")

    conn = None
    try:
        zk = ZK(ip, port=port, timeout=30)
        conn = zk.connect()
        conn.disable_device()
        
        zk_logs = conn.get_attendance()
        
        conn.enable_device()
        conn.disconnect()
        
        logs = []
        for log in zk_logs:
            logs.append({
                "biometric_id": str(log.user_id),
                "timestamp": log.timestamp,
                "status": log.status,
                "punch_type": log.punch,
                "device_ip": ip
            })
        return logs, False
    except Exception as e:
        if conn:
            try:
                conn.disconnect()
            except:
                pass
        raise Exception(f"Cannot connect to biometric device at {ip}:{port} — {e}. Check LAN cable and device power.")

def calculate_hours_and_ot(
    check_in: datetime,
    check_out: datetime,
    shift_start_str: str = "09:00",
    shift_end_str: str = "18:00",
    break_duration_mins: int = 60,
    shift_working_hours: float = 8.0
) -> Tuple[float, float, str]:
    """Calculate actual working hours, overtime hours and status based on shift timings."""
    if not check_in or not check_out:
        return 0.0, 0.0, "Absent"

    # Calculate actual elapsed minutes
    elapsed_td = check_out - check_in
    elapsed_minutes = elapsed_td.total_seconds() / 60.0
    
    if elapsed_minutes < 0:
        elapsed_minutes += 24 * 60  # overnight shift support
        
    # Subtract break duration
    actual_work_minutes = elapsed_minutes - break_duration_mins
    actual_work_hours = max(0.0, round(actual_work_minutes / 60.0, 2))
    
    # Calculate OT (only for checkout after 8:00 PM)
    checkout_limit = datetime.combine(check_out.date(), time(20, 0))
    if check_out > checkout_limit:
        ot_start = max(checkout_limit, check_in)
        ot_hours = max(0.0, round((check_out - ot_start).total_seconds() / 3600.0, 2))
    else:
        ot_hours = 0.0
    
    # Check if late
    try:
        sh_h, sh_m = map(int, shift_start_str.split(":"))
        shift_start_time = time(sh_h, sh_m)
        check_in_time = check_in.time()
        
        # 15 minutes grace period
        grace_time = (datetime.combine(check_in.date(), shift_start_time) + timedelta(minutes=15)).time()
        
        if check_in_time > grace_time:
            status = "Late"
        else:
            status = "Present"
    except Exception:
        status = "Present"

    return actual_work_hours, ot_hours, status

async def sync_biometric_attendance(db: AsyncSession, ip: str = "192.168.0.202", port: int = 4370, mock: bool = False) -> Dict[str, Any]:
    """
    Core sync engine. Connects to device, fetches logs, deduplicates,
    calculates work hours against shifts, and commits to Database.
    """
    # 1. Fetch all employees
    emp_res = await db.execute(select(Employee).where(Employee.status == "Active"))
    employees: List[Employee] = list(emp_res.scalars().all())
    
    # Map biometric_id -> Employee object for fast lookup
    emp_map: Dict[str, Employee] = {}
    for emp in employees:
        if emp.biometric_id:
            emp_map[str(emp.biometric_id)] = emp
            
    if not emp_map:
        return {"success": False, "message": "No employees have a Biometric Machine ID configured in Employee Master."}

    # 2. Fetch all shifts
    shift_res = await db.execute(select(SubMaster).where(SubMaster.entity == "shift"))
    shifts = shift_res.scalars().all()
    shift_map = {str(s.name): s for s in shifts}

    # 3. Get biometric punch logs
    try:
        logs, is_simulated = await get_device_logs(ip, port, employees, force_mock=mock)
    except Exception as e:
        return {"success": False, "message": f"Could not fetch biometric logs: {e}"}

    if not logs:
        return {"success": True, "message": "Connection OK, but no punch logs were found on the device.", "synced_count": 0}

    # 4. Save raw logs to prevent data loss (deduplicated by biometric_id, timestamp, and device_ip)
    # Get existing raw logs to check duplicates
    raw_res = await db.execute(select(HRItem).where(HRItem.category == "biometric_raw_logs"))
    existing_raw = raw_res.scalars().all()
    existing_raw_keys = {
        (str(item.data.get("biometric_id")), str(item.data.get("timestamp")), str(item.data.get("device_ip", ip)))
        for item in existing_raw if isinstance(item.data, dict)
    }

    new_raw_count = 0
    for log in logs:
        log_ts_str = log["timestamp"].isoformat() if isinstance(log["timestamp"], datetime) else str(log["timestamp"])
        device_ip = log.get("device_ip", ip)
        key = (str(log["biometric_id"]), log_ts_str, device_ip)
        if key not in existing_raw_keys:
            raw_item = HRItem(
                category="biometric_raw_logs",
                employee_id=str(emp_map[log["biometric_id"]].employee_code) if log["biometric_id"] in emp_map else None,
                data={
                    "biometric_id": str(log["biometric_id"]),
                    "timestamp": log_ts_str,
                    "status": int(log["status"]),
                    "punch_type": int(log["punch_type"]),
                    "device_ip": device_ip
                }
            )
            db.add(raw_item)
            existing_raw_keys.add(key)
            new_raw_count += 1
            
    if new_raw_count > 0:
        await db.commit()

    # 5. Group punches by Employee and Date to calculate check-in / check-out
    # We load ALL raw logs from the database so we have the full punch history across all machines
    all_raw_res = await db.execute(select(HRItem).where(HRItem.category == "biometric_raw_logs"))
    all_raw = all_raw_res.scalars().all()
    
    punches: Dict[str, Dict[str, List[Tuple[datetime, str]]]] = {}
    seen_punches = set()
    combined_punches = []
    
    # Load raw logs from database
    for item in all_raw:
        if isinstance(item.data, dict):
            bio_id = str(item.data.get("biometric_id"))
            ts_str = str(item.data.get("timestamp"))
            status = int(item.data.get("status", 0))
            ptype = int(item.data.get("punch_type", 0))
            dev_ip = str(item.data.get("device_ip", ip))
            
            key = (bio_id, ts_str)
            if key not in seen_punches:
                seen_punches.add(key)
                combined_punches.append({
                    "biometric_id": bio_id,
                    "timestamp": ts_str,
                    "status": status,
                    "punch_type": ptype,
                    "device_ip": dev_ip
                })
                
    # Load newly fetched logs (in case they aren't committed to db yet)
    for log in logs:
        bio_id = str(log["biometric_id"])
        ts_str = log["timestamp"].isoformat() if isinstance(log["timestamp"], datetime) else str(log["timestamp"])
        key = (bio_id, ts_str)
        if key not in seen_punches:
            seen_punches.add(key)
            combined_punches.append({
                "biometric_id": bio_id,
                "timestamp": ts_str,
                "status": int(log["status"]),
                "punch_type": int(log["punch_type"]),
                "device_ip": log.get("device_ip", ip)
            })
            
    for log in combined_punches:
        bio_id = log["biometric_id"]
        if bio_id not in emp_map:
            continue  # Ignore punches for unregistered biometric IDs
            
        emp = emp_map[bio_id]
        emp_code = str(emp.employee_code)
        
        ts = log["timestamp"]
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts)
            except ValueError:
                continue
                
        date_str = ts.date().isoformat()
        
        if emp_code not in punches:
            punches[emp_code] = {}
        if date_str not in punches[emp_code]:
            punches[emp_code][date_str] = []
            
        punches[emp_code][date_str].append((ts, log["device_ip"]))

    # 6. Fetch existing processed attendance to update/prevent duplicates
    att_res = await db.execute(select(HRItem).where(HRItem.category == "attendance"))
    existing_attendance = att_res.scalars().all()
    # Map (employee, date) -> HRItem
    att_map: Dict[Tuple[str, str], HRItem] = {}
    for item in existing_attendance:
        if isinstance(item.data, dict):
            emp_val = item.data.get("employee")
            date_val = item.data.get("date")
            if emp_val and date_val:
                att_map[(str(emp_val), str(date_val))] = item

    # 7. Process check-in / check-out and save/update attendance
    synced_records_count = 0
    for emp_code, dates in punches.items():
        emp = next(e for e in employees if str(e.employee_code) == emp_code)
        
        # Determine employee shift
        emp_shift_name = str(emp.shift or "General Shift")
        shift_obj = shift_map.get(emp_shift_name)
        
        # Load shift parameters
        shift_start = "09:00"
        shift_end = "18:00"
        break_duration = 60
        working_hours_standard = 8.0
        
        if shift_obj:
            shift_start = str(shift_obj.extra_field_1 or "09:00")
            shift_end = str(shift_obj.extra_field_2 or "18:00")
            if shift_obj.extra_field_3:
                try:
                    extra = json.loads(str(shift_obj.extra_field_3))
                    break_duration = int(extra.get("break_duration", 60))
                    working_hours_standard = float(extra.get("working_hours", 8.0))
                except Exception:
                    pass

        for date_str, punch_tuples in dates.items():
            punch_tuples.sort(key=lambda x: x[0])
            chk_in, check_in_device = punch_tuples[0]
            # If there's only 1 punch, check-out equals check-in (half day or missed punch)
            chk_out, check_out_device = punch_tuples[-1] if len(punch_tuples) > 1 else (chk_in, check_in_device)
            
            # Calculate hours
            hours_worked, ot_hours, status = calculate_hours_and_ot(
                check_in=chk_in,
                check_out=chk_out,
                shift_start_str=shift_start,
                shift_end_str=shift_end,
                break_duration_mins=break_duration,
                shift_working_hours=working_hours_standard
            )
            
            # Zero out hours if only one punch registered (requires manual intervention or is zero work hours)
            if len(punch_tuples) == 1:
                hours_worked = 0.0
                ot_hours = 0.0
                status = "Punch Error"
            
            check_in_str = chk_in.strftime("%H:%M")
            check_out_str = chk_out.strftime("%H:%M") if len(punch_tuples) > 1 else ""

            # Check if record exists
            key = (emp_code, date_str)
            if key in att_map:
                # Update existing record
                item = att_map[key]
                # If manual override exists, only update if it was also biometric or requested
                if isinstance(item.data, dict) and item.data.get("source") != "Manual":
                    merged_data = dict(item.data)
                    merged_data.update({
                        "check_in": check_in_str,
                        "check_out": check_out_str,
                        "hours": hours_worked,
                        "ot_hours": ot_hours,
                        "source": "Biometric",
                        "status": status,
                        "shift": emp_shift_name,
                        "check_in_device": check_in_device,
                        "check_out_device": check_out_device
                    })
                    item.data = cast(Any, merged_data)
                    db.add(item)
                    synced_records_count += 1
            else:
                # Create new record
                new_item = HRItem(
                    category="attendance",
                    employee_id=str(emp.id),
                    data=cast(Any, {
                        "employee": emp_code,
                        "date": date_str,
                        "shift": emp_shift_name,
                        "check_in": check_in_str,
                        "check_out": check_out_str,
                        "hours": hours_worked,
                        "ot_hours": ot_hours,
                        "source": "Biometric",
                        "status": status,
                        "leave_days": 0,
                        "lop_days": 0,
                        "check_in_device": check_in_device,
                        "check_out_device": check_out_device
                    })
                )
                db.add(new_item)
                synced_records_count += 1

    await db.commit()
    msg = f"Biometric sync complete. Logged {new_raw_count} new raw punches and updated {synced_records_count} daily attendance entries."
    if is_simulated:
        msg = f"Device offline. Synced successfully in simulation mode: {msg}"
    return {
        "success": True,
        "message": msg,
        "synced_count": synced_records_count,
        "new_raw_count": new_raw_count,
        "simulated": is_simulated
    }
