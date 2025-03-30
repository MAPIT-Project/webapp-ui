import pandas as pd
from sqlalchemy import create_engine, Integer, String, Boolean, Date, Numeric, Text, TIMESTAMP, MetaData, Table, Column, PrimaryKeyConstraint, inspect, text
from sqlalchemy.dialects.postgresql import insert
from decimal import Decimal
from dotenv import load_dotenv
import os
import sys
import logging
import traceback
from datetime import datetime

# Configure logging
LOG_FILE = "csv_extractor.log"
log_format = '%(asctime)s - %(levelname)s - %(message)s'
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

logger.info("Starting CSV data extraction process")
logger.info(f"Log file: {os.path.abspath(LOG_FILE)}")

load_dotenv()

# DB setup
DATABASE_URL = "postgresql://postgres:postgres@localhost:54322/postgres" #os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
metadata = MetaData()
logger.info(f"Database connection established: {DATABASE_URL}")

# small
# PROJECTS_CSV = "project_small.csv"
# ORGANIZATIONS_CSV = "organization_small.csv"

PROJECTS_CSV = "project.csv"
ORGANIZATIONS_CSV = "organization.csv"

logger.info(f"Using project file: {PROJECTS_CSV}")
logger.info(f"Using organization file: {ORGANIZATIONS_CSV}")

# Define tables (matches schema.ts)
projects = Table("projects", metadata,
    Column("id", Integer, primary_key=True),
    Column("acronym", String),
    Column("status", String),
    Column("title", Text),
    Column("startDate", Date),
    Column("endDate", Date),
    Column("totalCost", Numeric),
    Column("ecMaxContribution", Numeric),
    Column("legalBasis", String),
    Column("topics", Text),
    Column("ecSignatureDate", Date),
    Column("frameworkProgramme", String),
    Column("masterCall", String),
    Column("subCall", String),
    Column("fundingScheme", String),
    Column("nature", String),
    Column("objective", Text),
    Column("contentUpdateDate", TIMESTAMP),
    Column("rcn", Integer),
    Column("grantDoi", String),
)

# Define organizations table with composite primary key from the start
organizations = Table("organizations", metadata,
    Column("projectID", Integer),
    Column("projectAcronym", String),
    Column("organisationID", String),
    Column("vatNumber", String),
    Column("name", Text),
    Column("shortName", String),
    Column("SME", Boolean),
    Column("activityType", String),
    Column("street", String),
    Column("postCode", String),
    Column("city", String),
    Column("country", String),
    Column("nutsCode", String),
    Column("geolocation", String),
    Column("organizationURL", String),
    Column("contactForm", String),
    Column("contentUpdateDate", TIMESTAMP),
    Column("rcn", Integer),
    Column("order", Integer),
    Column("role", String),
    Column("ecContribution", Numeric),
    Column("netEcContribution", Numeric),
    Column("totalCost", Numeric),
    Column("endOfParticipation", Boolean),
    Column("active", Boolean),
    # Composite primary key: organization ID + project ID
    PrimaryKeyConstraint("organisationID", "projectID", name="organizations_pkey")
)

# Create tables if they don't exist
metadata.create_all(engine)

# Helper: parse decimal safely
def parse_decimal(val):
    try:
        if isinstance(val, str):
            val = val.replace(",", ".")
        return Decimal(val)
    except:
        logger.debug(f"Failed to parse decimal from value: {val}")
        return None

# Helper: Convert NaN values to None for SQL compatibility
def clean_dataframe(df):
    """Replace NaN values with None for proper SQL NULL values"""
    # This approach ensures all NaN values are properly converted to None (SQL NULL)
    cleaned_df = df.copy()
    for column in cleaned_df.columns:
        # For every column, replace NaN values with None
        cleaned_df[column] = cleaned_df[column].where(~pd.isna(cleaned_df[column]), None)
    return cleaned_df

# Function to safely read CSV files with multiple fallback options
def read_csv_safely(file_path):
    logger.info(f"Attempting to read file: {file_path}")
    
    # First, check if the file exists
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise FileNotFoundError(f"File not found: {file_path}")
        
    # Check file size
    file_size = os.path.getsize(file_path)
    logger.info(f"File size: {file_size} bytes")
    
    # First, check if the file starts with a comment line
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            logger.debug(f"First line of file: {first_line[:100]}...")
            
        # Check if the file starts with a comment line
        if (first_line.startswith('//')):
            logger.info(f"Detected comment line at the beginning of {file_path}, skipping the first line")
            # Read the CSV with skiprows=1 to skip the comment line
            df = pd.read_csv(file_path, skiprows=1)
            logger.info(f"Successfully read {len(df)} rows with {len(df.columns)} columns")
            return df
            
        # Check if file might use semicolons as separators
        if ';' in first_line and ',' not in first_line:
            logger.info(f"Detected semicolon-separated values in {file_path}")
            df = pd.read_csv(file_path, sep=';')
            logger.info(f"Successfully read {len(df)} rows with {len(df.columns)} columns using semicolon separator")
            return df
    except Exception as e:
        logger.error(f"Error checking first line: {str(e)}")
        logger.debug(traceback.format_exc())
    
    # If the above didn't work, try different strategies
    strategies = [
        # Strategy 1: Default pandas settings
        {"params": {}},
        # Strategy 2: Try with semicolon separator
        {"params": {"sep": ";"}},
        # Strategy 3: Skip potential comment lines
        {"params": {"skiprows": 1}},
        # Strategy 4: Skip first line and use semicolon separator
        {"params": {"skiprows": 1, "sep": ";"}},
        # Strategy 5: Python engine with more lenient options
        {"params": {"engine": "python", "on_bad_lines": "warn"}},
        # Strategy 6: Python engine with semicolon separator
        {"params": {"engine": "python", "sep": ";", "on_bad_lines": "warn"}},
        # Strategy 7: C engine with explicit quoting
        {"params": {"quoting": 0, "escapechar": "\\"}},  # quoting=0 means QUOTE_MINIMAL
        # Strategy 8: C engine with semicolon separator
        {"params": {"sep": ";", "quoting": 0, "escapechar": "\\"}},
        # Strategy 9: Python engine with no quoting
        {"params": {"engine": "python", "quoting": 3}},  # quoting=3 means QUOTE_NONE
        # Strategy 10: Python engine with semicolon separator and no quoting
        {"params": {"engine": "python", "sep": ";", "quoting": 3}},
        # Strategy 11: Python engine with different delimiter and very lenient
        {"params": {"engine": "python", "sep": ",", "quotechar": '"', "escapechar": "\\", "quoting": 3, "on_bad_lines": "skip"}},
        # Strategy 12: Python engine with semicolon separator and very lenient
        {"params": {"engine": "python", "sep": ";", "quotechar": '"', "escapechar": "\\", "quoting": 3, "on_bad_lines": "skip"}},
        # Strategy 13: Last resort - read line by line
        {"manual": True}
    ]
    
    last_error = None
    
    for i, strategy in enumerate(strategies):
        try:
            if "manual" in strategy and strategy["manual"]:
                logger.info(f"Attempting manual line-by-line parsing of {file_path}")
                
                # Skip comment line if it exists
                skiplines = 0
                with open(file_path, 'r', encoding='utf-8') as f:
                    first_line = f.readline().strip()
                    if first_line.startswith('//'):
                        skiplines = 1
                
                # Read the header and detect separator (comma or semicolon)
                with open(file_path, 'r', encoding='utf-8') as f:
                    for _ in range(skiplines):
                        next(f)  # Skip comment lines
                    header_line = next(f).strip()
                    
                    # Determine separator
                    separator = ',' if ',' in header_line else ';'
                    logger.info(f"Using separator '{separator}' for manual parsing")
                    header = header_line.split(separator)
                    logger.debug(f"Detected header: {header}")
                
                # Initialize empty list for data
                data = []
                
                # Read and parse each line
                with open(file_path, 'r', encoding='utf-8') as f:
                    for _ in range(skiplines + 1):  # Skip header and comment lines
                        next(f)
                    for i, line in enumerate(f, 2 + skiplines):
                        try:
                            # Simple CSV parsing that handles basic quoted fields
                            fields = []
                            field = ""
                            in_quotes = False
                            
                            for char in line:
                                if char == '"':
                                    in_quotes = not in_quotes
                                elif char == separator and not in_quotes:
                                    fields.append(field)
                                    field = ""
                                else:
                                    field += char
                            
                            # Add the last field
                            fields.append(field)
                            
                            # Ensure we have the right number of fields
                            if len(fields) < len(header):
                                fields.extend([''] * (len(header) - len(fields)))
                                logger.warning(f"Line {i}: Had to pad fields to match header length")
                            elif len(fields) > len(header):
                                fields = fields[:len(header)]
                                logger.warning(f"Line {i}: Had to truncate fields to match header length")
                                
                            # Create a dict for this row
                            row = dict(zip(header, fields))
                            data.append(row)
                        except Exception as e:
                            logger.warning(f"Could not parse line {i}: {str(e)}")
                
                # Create DataFrame from manually parsed data
                df = pd.DataFrame(data)
                logger.info(f"Manual parsing completed with {len(df)} rows and {len(df.columns)} columns")
                return df
            else:
                logger.info(f"Strategy {i+1}/{len(strategies)}: Reading with params: {strategy['params']}")
                df = pd.read_csv(file_path, **strategy["params"])
                
                # Simple validation - check if we got any data and reasonable columns
                if len(df) > 0:
                    if len(df.columns) == 1 and any(';' in col for col in df.columns):
                        logger.warning(f"Detected semicolon-separated values in a single column, retrying with sep=';'")
                        continue  # This didn't work, it read everything as one column
                    else:
                        logger.info(f"Successfully read {len(df)} rows with {len(df.columns)} columns")
                        logger.debug(f"Column names: {df.columns.tolist()}")
                        return df
                else:
                    logger.warning("DataFrame is empty")
                    raise ValueError("DataFrame is empty")
                    
        except Exception as e:
            last_error = e
            logger.warning(f"Strategy {i+1} failed: {str(e)}")
    
    # If all strategies fail, raise the last error
    logger.error(f"All strategies failed to read {file_path}")
    if last_error:
        logger.error(f"Last error: {str(last_error)}")
    raise last_error or ValueError(f"Could not read {file_path} with any strategy")

# Load and insert project data
try:
    logger.info("\n--- Processing Project Data ---")
    # Use the project csv file you provided
    project_df = read_csv_safely(PROJECTS_CSV)
    logger.info(f"Project CSV columns: {project_df.columns.tolist()}")
    logger.info(f"First few rows sample: \n{project_df.head(2)}")
    
    # Process only the columns we need
    required_columns = ["id", "acronym", "status", "title", "startDate", "endDate", 
                       "totalCost", "ecMaxContribution", "legalBasis", "topics", 
                       "ecSignatureDate", "frameworkProgramme", "masterCall", 
                       "subCall", "fundingScheme", "nature", "objective", 
                       "contentUpdateDate", "rcn", "grantDoi"]
    
    # Check if all required columns exist
    missing_columns = [col for col in required_columns if col not in project_df.columns]
    if missing_columns:
        logger.warning(f"Warning: Missing columns in project.csv: {missing_columns}")
        for col in missing_columns:
            project_df[col] = None
    
    # Convert and clean data
    project_df["totalCost"] = project_df["totalCost"].apply(parse_decimal)
    project_df["ecMaxContribution"] = project_df["ecMaxContribution"].apply(parse_decimal)
    project_df["startDate"] = pd.to_datetime(project_df["startDate"], errors='coerce').dt.date
    project_df["endDate"] = pd.to_datetime(project_df["endDate"], errors='coerce').dt.date
    project_df["ecSignatureDate"] = pd.to_datetime(project_df["ecSignatureDate"], errors='coerce').dt.date
    project_df["contentUpdateDate"] = pd.to_datetime(project_df["contentUpdateDate"], errors='coerce')
    
    # Replace NaN values with None for proper SQL NULL values
    project_df = clean_dataframe(project_df)
    logger.info("Cleaned NaN values in project data")
    
    # Check for empty strings and convert to None
    for column in project_df.columns:
        # For string columns, convert empty strings to None
        if project_df[column].dtype == object:
            project_df[column] = project_df[column].replace('', None)
    logger.info("Converted empty strings to None in project data")
    
    # Explicitly handle the nature column to ensure NaN becomes NULL
    logger.info(f"Before explicit fix - Nature has NaN values: {pd.isna(project_df['nature']).sum()} out of {len(project_df)}")
    project_df.loc[pd.isna(project_df['nature']), 'nature'] = None
    logger.info(f"After explicit fix - Nature has NaN values: {pd.isna(project_df['nature']).sum()} out of {len(project_df)}")
    
    # Debug: Print nature column and its type to verify it's clean
    logger.info(f"Nature column unique values: {project_df['nature'].unique()}")
    for i, val in enumerate(project_df['nature']):
        logger.info(f"Row {i}: nature = {val}, type = {type(val)}")
    
    # Convert DataFrame to dictionary explicitly handling NaN values
    records = []
    for _, row in project_df.iterrows():
        record = {}
        for column in row.index:
            value = row[column]
            if pd.isna(value):  # Explicitly check for NaN
                record[column] = None
            else:
                record[column] = value
        records.append(record)
    
    # Insert with update on conflict
    with engine.begin() as conn:
        stmt = insert(projects).values(records)  # Use our manually created records
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                c.name: c for c in stmt.excluded if c.name != 'id'
            }
        )
        logger.info(f"Executing insert statement for {len(records)} projects")
        conn.execute(stmt)
    
    # Verify that nature is NULL in the database
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM projects WHERE nature IS NULL"))
        null_count = result.scalar()
        result = conn.execute(text("SELECT COUNT(*) FROM projects WHERE nature = 'NaN'"))
        nan_string_count = result.scalar()
        logger.info(f"Projects with NULL nature in DB: {null_count}")
        logger.info(f"Projects with 'NaN' string nature in DB: {nan_string_count}")
    
    logger.info("✅ Project data loaded successfully!")
except Exception as e:
    logger.error(f"❌ Error processing project data: {str(e)}")
    logger.error(traceback.format_exc())

# Load and insert organization data
try:
    logger.info("\n--- Processing Organization Data ---")
    # Use the organizations csv file
    logger.info(f"Reading organization data from {ORGANIZATIONS_CSV}")
    org_df = read_csv_safely(ORGANIZATIONS_CSV)
    logger.info(f"Organization CSV columns: {org_df.columns.tolist()}")
    logger.info(f"First few rows sample: \n{org_df.head(2)}")
    logger.info(f"Total organization rows: {len(org_df)}")
    
    # Process only the columns we need
    required_columns = ["projectID", "projectAcronym", "organisationID", "vatNumber", 
                        "name", "shortName", "SME", "activityType", "street", "postCode", 
                        "city", "country", "nutsCode", "geolocation", "organizationURL", 
                        "contactForm", "contentUpdateDate", "rcn", "order", "role", 
                        "ecContribution", "netEcContribution", "totalCost", 
                        "endOfParticipation", "active"]
    
    # Check if all required columns exist
    missing_columns = [col for col in required_columns if col not in org_df.columns]
    if missing_columns:
        logger.warning(f"Missing columns in organization.csv: {missing_columns}")
        for col in missing_columns:
            org_df[col] = None
    
    # Log data types before conversion
    logger.debug(f"Organization data types before conversion: {org_df.dtypes}")
    
    # Convert and clean data
    logger.info("Converting organization data types...")
    org_df["SME"] = org_df["SME"].astype("boolean", errors='ignore')
    org_df["endOfParticipation"] = org_df["endOfParticipation"].astype("boolean", errors='ignore')
    org_df["active"] = org_df["active"].astype("boolean", errors='ignore')
    org_df["contentUpdateDate"] = pd.to_datetime(org_df["contentUpdateDate"], errors='coerce')
    org_df["ecContribution"] = org_df["ecContribution"].apply(parse_decimal)
    org_df["netEcContribution"] = org_df["netEcContribution"].apply(parse_decimal)
    org_df["totalCost"] = org_df["totalCost"].apply(parse_decimal)
    
    # Make sure projectID is an integer
    logger.info("Converting projectID to numeric...")
    org_df["projectID"] = pd.to_numeric(org_df["projectID"], errors='coerce')
    
    # Replace NaN values with None for proper SQL NULL values
    org_df = clean_dataframe(org_df)
    logger.info("Cleaned NaN values in organization data")
    
    # Check for empty strings and convert to None
    for column in org_df.columns:
        # For string columns, convert empty strings to None
        if org_df[column].dtype == object:
            org_df[column] = org_df[column].replace('', None)
    logger.info("Converted empty strings to None")
    
    # Log data types after conversion
    logger.debug(f"Organization data types after conversion: {org_df.dtypes}")
    
    # Use a simpler approach - drop and recreate the table to avoid PK issues
    logger.info("Dropping and recreating organizations table...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS organizations"))
        
    # Recreate the table
    metadata.create_all(engine, tables=[organizations])
    logger.info("Organizations table recreated with composite primary key")

    # Convert dataframe to list of dictionaries for insertion
    data = org_df.to_dict(orient="records")
    logger.info(f"Prepared {len(data)} organization records for insertion")
    
    # Use a much smaller batch size to avoid parameter limits
    batch_size = 25  # Significantly reduced from 100
    success_count = 0
    error_count = 0
    logger.info(f"Will process data in batches of {batch_size} records")
    
    # Insert data in batches, each with its own transaction
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        batch_num = i // batch_size + 1
        batch_end = min(i + batch_size, len(data))
        logger.info(f"Processing batch {batch_num}/{(len(data) + batch_size - 1) // batch_size}: records {i+1}-{batch_end}")
        
        try:
            # Create a new connection for each batch to ensure clean transaction state
            with engine.connect() as batch_conn:
                # Start a new transaction
                with batch_conn.begin():
                    # Create insert statement for this batch
                    stmt = insert(organizations).values(batch)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["organisationID", "projectID"],
                        set_={
                            c.name: c for c in stmt.excluded if c.name not in ["organisationID", "projectID"]
                        }
                    )
                    batch_conn.execute(stmt)
                    # Transaction is committed when the context manager exits
            
            success_count += len(batch)
            logger.info(f"✅ Batch {batch_num} successfully inserted ({len(batch)} records)")
            
        except Exception as batch_e:
            error_count += len(batch)
            logger.error(f"❌ Failed to insert batch {batch_num}: {str(batch_e)}")
            
            # Log details of the first few problematic records
            logger.debug(f"Detailed examination of problematic batch {batch_num}:")
            for idx, record in enumerate(batch[:3]):  # Only show first 3 records for brevity
                logger.debug(f"Record {idx} in batch {batch_num}:")
                for key, value in record.items():
                    if value is not None:
                        logger.debug(f"  {key}: {value} ({type(value)})")
    
    logger.info(f"Organization data loading stats: {success_count} records inserted, {error_count} records failed")
    
    if success_count > 0:
        logger.info("✅ Organization data loaded (at least partially successfully)")
    else:
        logger.error("❌ No organization records were loaded successfully")
        
except Exception as e:
    logger.error(f"❌ Error in overall organization data processing: {str(e)}")
    logger.error(traceback.format_exc())

# Create a simple report of data loaded
try:
    with engine.connect() as conn:
        result_projects = conn.execute(text("SELECT COUNT(*) FROM projects"))
        project_count = result_projects.scalar()
        
        result_orgs = conn.execute(text("SELECT COUNT(*) FROM organizations"))
        org_count = result_orgs.scalar()
        
        logger.info("\n--- Data Loading Summary ---")
        logger.info(f"Projects loaded: {project_count}")
        logger.info(f"Organizations loaded: {org_count}")
except Exception as e:
    logger.error(f"Could not generate summary: {str(e)}")
    logger.error(traceback.format_exc())

logger.info("Data loading process completed!")
