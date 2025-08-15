import time

last_timestamp = 0
sequence = 0
machine_id = 1

def generate_snowflake_uid():
    global last_timestamp, sequence
    
    timestamp = int(time.time() * 1000)  # milliseconds

    if timestamp == last_timestamp:
        sequence = (sequence + 1) & 0xfff  # 12 bits
        if sequence == 0:
            # Chờ sang milli tiếp theo
            while int(time.time() * 1000) <= last_timestamp:
                pass
    else:
        sequence = 0

    last_timestamp = timestamp

    # 41 bits timestamp | 10 bits machine_id | 12 bits sequence
    snowflake = ((timestamp << 22) | (machine_id << 12) | sequence)
    return str(snowflake)
