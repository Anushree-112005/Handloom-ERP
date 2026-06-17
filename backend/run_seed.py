import sqlite3
import traceback

with open("seed_log.txt", "w") as f:
    try:
        conn = sqlite3.connect('textile_erp.db')
        c = conn.cursor()
        c.execute("SELECT count(*) FROM loom_master")
        count = c.fetchone()[0]

        if count < 20:
            for i in range(1, 21):
                loom_name = f"LM-{i:03d}"
                loom_type = "Air Jet" if i % 2 == 0 else "Rapier"
                manufacturer = "Tsudakoma" if i % 2 == 0 else "Picanol"
                model_number = "ZA103" if i % 2 == 0 else "OMNIplus"
                capacity = 300.0
                speed = 800.0 if i % 2 == 0 else 600.0
                eff = 85.0 + (i % 10)
                ends = 10000 + (i * 100)
                status = "Running" if i % 3 != 0 else "Idle"
                loc = "Shed A" if i <= 10 else "Shed B"
                
                try:
                    c.execute("""
                        INSERT INTO loom_master (loom_name, loom_type, manufacturer, model_number, capacity_per_day, running_speed_per_hr, efficiency_pct, reed_width, total_ends, status, location)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (loom_name, loom_type, manufacturer, model_number, capacity, speed, eff, 190.0, ends, status, loc))
                except sqlite3.IntegrityError:
                    pass # Already exists
            
            conn.commit()
            f.write("Seeded 20 looms!\n")
        else:
            f.write(f"Already have {count} looms in DB\n")
        conn.close()
    except Exception as e:
        f.write(f"Error: {e}\n{traceback.format_exc()}\n")
