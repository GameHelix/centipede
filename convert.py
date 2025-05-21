import pdfplumber
import pandas as pd
import re
import warnings
warnings.filterwarnings("ignore")

# File path to your uploaded PDF
pdf_path = "data/data.pdf"

# Column names (translated to English, one-word format)
columns = [
    "timestamp",         # TARİX
    "density",           # XÜSUSİ ÇƏKİ (kg/m3)
    "pressure_diff",     # TƏZYİQLƏR FƏRQİ (kPa)
    "pressure",          # TƏZYİQ (kPa)
    "temperature",       # TEMPERATUR (°C)
    "hourly_volume",     # SAATLIQ SƏRF (min m3)
    "daily_volume"       # SƏRF (min m3)
]

# Storage for extracted rows
data_rows = []

# Regex pattern: 1 timestamp + 6 numerical fields
row_pattern = re.compile(
    r"(\d{2}-\d{2}-\d{4} \d{2}:\d{2})\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([-+]?\d*\.\d+|\d+)\s+([\d.]+)\s+([\d.]+)"
)

# Extract from PDF
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            lines = text.split("\n")
            for line in lines:
                match = row_pattern.match(line.strip())
                if match:
                    data_rows.append(match.groups())

# Create DataFrame
df = pd.DataFrame(data_rows, columns=columns)

# Save as CSV
csv_path = "data/data.csv"
df.to_csv(csv_path, index=False)

print(f"Extracted data has been saved to '{csv_path}'")
