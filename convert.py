import pdfplumber
import pandas as pd
import re
import warnings

warnings.filterwarnings("ignore")

# File path to your uploaded PDF
pdf_path = "data/data.pdf"

# Column names (translated to English, one-word format)
columns = [
    "timestamp",       # TARİX
    "density",         # XÜSUSİ ÇƏKİ (kg/m3)
    "pressure_diff",   # TƏZYİQLƏR FƏRQİ (kPa)
    "pressure",        # TƏZYİQ (kPa)
    "temperature",     # TEMPERATUR (°C)
    "hourly_volume",   # SAATLIQ SƏRF (min m3)
    "daily_volume",    # SƏRF (min m3)
    "D_mm",            # Outer diameter of pipe (mm)
    "d_mm"             # Inner diameter of pipe (mm)
]

# Storage for extracted rows
data_rows = []

# Regex patterns
row_pattern = re.compile(
    r"(\d{2}-\d{2}-\d{4} \d{2}:\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([-+]?\d*\.\d+|\d+)\s+([\d.]+)\s+([\d.]+)"
)
diam_pattern = re.compile(r"D\s*=\s*([\d.]+)\s*mm\s+d\s*=\s*([\d.]+)\s*mm", re.IGNORECASE)

# Extract from PDF
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text() or ""
        # --- 1) Find diameter line on this page ---
        current_D, current_d = None, None
        diam_match = diam_pattern.search(text)
        if diam_match:
            current_D, current_d = diam_match.groups()
        else:
            # If not found, you may choose to carry over previous page's values,
            # or leave as None/NaN.
            current_D, current_d = None, None

        # --- 2) Parse each data line and append D/d ---
        for line in text.split("\n"):
            line = line.strip()
            match = row_pattern.match(line)
            if not match:
                continue
            # Standard fields
            ts, dens, p_diff, press, temp, vol_h, vol_d = match.groups()
            data_rows.append([
                ts,
                dens,
                p_diff,
                press,
                temp,
                vol_h,
                vol_d,
                current_D,
                current_d
            ])

# Create DataFrame
df = pd.DataFrame(data_rows, columns=columns)

# Convert numeric columns
numeric_cols = ["density", "pressure_diff", "pressure", "temperature",
                "hourly_volume", "daily_volume", "D_mm", "d_mm"]
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Parse timestamp
df["timestamp"] = pd.to_datetime(df["timestamp"], format="%d-%m-%Y %H:%M")

# Save as CSV
csv_path = "data/data_with_diameters.csv"
df.to_csv(csv_path, index=False)

print(f"Extracted data (with D and d) has been saved to '{csv_path}'")
